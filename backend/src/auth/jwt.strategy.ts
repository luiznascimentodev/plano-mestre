import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { TokenBlacklistService } from './token-blacklist.service';
import type { User } from '@prisma/client';
import { Request } from 'express';

// Função para extrair token de cookies ou header
const extractTokenFromRequest = (req: Request): string | null => {
  // Primeiro tenta pegar do cookie (httpOnly)
  if (req.cookies && req.cookies.access_token) {
    return req.cookies.access_token;
  }
  // Fallback para header Authorization
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    
    if (!jwtSecret) {
      throw new Error(
        'JWT_SECRET não está configurado. Configure a variável de ambiente JWT_SECRET.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        extractTokenFromRequest,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  // Esta função é chamada pelo Passport após validar o token
  async validate(payload: { sub: number; email: string; iat?: number; exp?: number }): Promise<User> {
    // Verificar se o token está na blacklist
    // Precisamos reconstruir o token para verificar (isso é feito pelo Passport antes)
    // Mas podemos verificar pelo payload se necessário
    
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Usuário não encontrado ou token inválido.',
      );
    }

    // (Segurança) Não queremos o hash da senha trafegando no objeto 'request'
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    // O objeto 'user' retornado aqui será injetado no 'request' de qualquer rota protegida
    return userWithoutPassword as User;
  }
}
