import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  UsePipes,
  HttpCode,
  Get,
  UseGuards,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TokenBlacklistService } from './token-blacklist.service';
import { JwtService } from '@nestjs/jwt';

@ApiTags('1, Autenticação')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly jwtService: JwtService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 tentativas por minuto
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @Post('register')
  @ApiOperation({ summary: 'Registrar um novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso.' })
  @ApiResponse({ status: 409, description: 'E-mail já existe (Conflict).' })
  @ApiResponse({ status: 400, description: 'Dados inválidos (Bad Request).' })
  @ApiResponse({ status: 429, description: 'Muitas requisições. Tente novamente mais tarde.' })
  register(@Body() registerAuthDto: RegisterAuthDto) {
    return this.authService.register(registerAuthDto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 tentativas por minuto (proteção contra força bruta)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      skipMissingProperties: false,
    }),
  )
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Realizar login e obter token JWT' })
  @ApiResponse({
    status: 200,
    description: 'Login bem-sucedido, tokens definidos em cookies httpOnly.',
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 429, description: 'Muitas tentativas de login. Tente novamente mais tarde.' })
  async login(
    @Body() loginAuthDto: LoginAuthDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('user-agent');
    
    const result = await this.authService.login(loginAuthDto, ipAddress, userAgent);
    
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    
    // Em desenvolvimento, usar 'lax' para permitir cookies cross-origin
    // Em produção, usar 'strict' para maior segurança
    const sameSiteOption = isProduction ? 'strict' : 'lax';
    
    // Definir access token em cookie httpOnly
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: isProduction, // Apenas HTTPS em produção
      sameSite: sameSiteOption,
      maxAge: 15 * 60 * 1000, // 15 minutos
      path: '/',
    });

    // Definir refresh token em cookie httpOnly
    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: sameSiteOption,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      path: '/',
    });

    // Retornar apenas o usuário (tokens estão em cookies)
    return {
      user: result.user,
    };
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Renovar access token usando refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Token renovado com sucesso.',
  })
  @ApiResponse({ status: 401, description: 'Refresh token inválido.' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token não fornecido');
    }

    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('user-agent');
    
    const result = await this.authService.refreshAccessToken(refreshToken, ipAddress, userAgent);
    
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const sameSiteOption = isProduction ? 'strict' : 'lax';
    
    // Definir novo access token em cookie httpOnly
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: sameSiteOption,
      maxAge: 15 * 60 * 1000, // 15 minutos
      path: '/',
    });

    return { success: true };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @ApiOperation({ summary: 'Obter informações do usuário autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Informações do usuário.',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  getProfile(@Req() req: Request) {
    const user = (req as any).user;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Fazer logout e invalidar tokens' })
  @ApiResponse({
    status: 200,
    description: 'Logout realizado com sucesso.',
  })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.access_token || req.headers.authorization?.replace('Bearer ', '');
    const user = (req as any).user;
    
    // Tentar fazer logout completo se tiver token e usuário
    if (token) {
      try {
        // Se tiver usuário autenticado, fazer logout completo
        if (user && user.id) {
          const ipAddress = req.ip || req.socket.remoteAddress;
          const userAgent = req.get('user-agent');
          await this.authService.logout(token, user.id, ipAddress, userAgent);
        } else {
          // Se não tiver usuário mas tiver token, tentar adicionar à blacklist
          // (token pode estar expirado, mas ainda queremos invalidá-lo)
          try {
            const decoded = this.jwtService.decode(token) as any;
            if (decoded && decoded.exp) {
              const expiresAt = new Date(decoded.exp * 1000);
              await this.tokenBlacklistService.addToBlacklist(token, expiresAt);
            }
          } catch (error) {
            // Ignorar se não conseguir decodificar
          }
        }
      } catch (error) {
        // Ignorar erros no logout (pode já estar deslogado ou token inválido)
        console.error('Erro ao fazer logout completo:', error);
      }
    }

    // Sempre limpar cookies, mesmo se o logout completo falhar
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const sameSiteOption = isProduction ? 'strict' : 'lax';
    
    res.clearCookie('access_token', { 
      path: '/',
      httpOnly: true,
      secure: isProduction,
      sameSite: sameSiteOption,
    });
    res.clearCookie('refresh_token', { 
      path: '/',
      httpOnly: true,
      secure: isProduction,
      sameSite: sameSiteOption,
    });

    return { success: true };
  }

}
