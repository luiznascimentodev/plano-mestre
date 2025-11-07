import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TokenBlacklistService {
  constructor(private readonly prisma: PrismaService) {}

  async addToBlacklist(token: string, expiresAt: Date): Promise<void> {
    try {
      await this.prisma.tokenBlacklist.upsert({
        where: { token },
        update: { expiresAt },
        create: {
          token,
          expiresAt,
        },
      });
    } catch (error) {
      // Ignorar se já existe
    }
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const blacklisted = await this.prisma.tokenBlacklist.findUnique({
      where: { token },
    });

    if (!blacklisted) {
      return false;
    }

    // Se expirou, remover da blacklist
    if (blacklisted.expiresAt < new Date()) {
      await this.prisma.tokenBlacklist.delete({
        where: { token },
      });
      return false;
    }

    return true;
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.prisma.tokenBlacklist.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}

