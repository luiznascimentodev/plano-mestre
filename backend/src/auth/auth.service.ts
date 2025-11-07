import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import * as bcrypt from 'bcrypt';
import { LoginAuthDto } from './dto/login-auth.dto';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenService } from './refresh-token.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { AuditService } from '../audit/audit.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
  ) {}

  // REGISTRO
  async register(dto: RegisterAuthDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Este e-mail já está em uso.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  //LOGIN
  async login(dto: LoginAuthDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      await this.auditService.log({
        action: 'LOGIN_ATTEMPT',
        success: false,
        errorMessage: 'Usuário não encontrado',
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    // Se o usuário não tem senha (pode ser um problema de dados ou usuário antigo)
    if (!user.password) {
      await this.auditService.log({
        action: 'LOGIN_ATTEMPT',
        success: false,
        errorMessage: 'Usuário sem senha',
        userId: user.id,
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    // Comparar a senha fornecida com o hash armazenado
    try {
      const isPasswordMatch = await bcrypt.compare(dto.password, user.password);

      if (!isPasswordMatch) {
        await this.auditService.log({
          action: 'LOGIN_ATTEMPT',
          success: false,
          errorMessage: 'Senha incorreta',
          userId: user.id,
          ipAddress,
          userAgent,
        });
        throw new UnauthorizedException('Credenciais inválidas.');
      }
    } catch (error) {
      // Se houver erro na comparação (ex: hash inválido), tratar como credenciais inválidas
      await this.auditService.log({
        action: 'LOGIN_ATTEMPT',
        success: false,
        errorMessage: 'Erro na comparação de senha',
        userId: user.id,
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    // Gerar access token (curta duração - 15 minutos)
    const payload = { email: user.email, sub: user.id, name: user.name };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    // Gerar refresh token (longa duração - 7 dias)
    const refreshToken = await this.refreshTokenService.generateRefreshToken(user.id);

    // Log de sucesso
    await this.auditService.log({
      action: 'LOGIN_SUCCESS',
      success: true,
      userId: user.id,
      ipAddress,
      userAgent,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async refreshAccessToken(refreshToken: string, ipAddress?: string, userAgent?: string) {
    try {
      const userId = await this.refreshTokenService.validateRefreshToken(refreshToken);
      
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      // Gerar novo access token
      const payload = { email: user.email, sub: user.id, name: user.name };
      const accessToken = this.jwtService.sign(payload, {
        expiresIn: '15m',
      });

      await this.auditService.log({
        action: 'TOKEN_REFRESHED',
        success: true,
        userId: user.id,
        ipAddress,
        userAgent,
      });

      return {
        access_token: accessToken,
      };
    } catch (error) {
      await this.auditService.log({
        action: 'TOKEN_REFRESH_FAILED',
        success: false,
        errorMessage: error.message,
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  async logout(token: string, userId: number, ipAddress?: string, userAgent?: string) {
    // Adicionar token à blacklist
    try {
      const decoded = this.jwtService.decode(token) as any;
      if (decoded && decoded.exp) {
        const expiresAt = new Date(decoded.exp * 1000);
        await this.tokenBlacklistService.addToBlacklist(token, expiresAt);
      }
    } catch (error) {
      // Ignorar se não conseguir decodificar
    }

    // Revogar todos os refresh tokens do usuário
    await this.refreshTokenService.revokeAllUserTokens(userId);

    await this.auditService.log({
      action: 'LOGOUT',
      success: true,
      userId,
      ipAddress,
      userAgent,
    });
  }

  async validateToken(token: string): Promise<boolean> {
    // Verificar se está na blacklist
    if (await this.tokenBlacklistService.isBlacklisted(token)) {
      return false;
    }

    // Verificar se o token é válido
    try {
      this.jwtService.verify(token);
      return true;
    } catch (error) {
      return false;
    }
  }

}
