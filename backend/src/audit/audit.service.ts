import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLogData {
  action: string;
  entityType?: string;
  entityId?: number;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
  userId?: number;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          success: data.success ?? true,
          errorMessage: data.errorMessage,
          userId: data.userId,
        },
      });
    } catch (error) {
      // Não falhar a requisição se o log falhar
      console.error('Erro ao registrar log de auditoria:', error);
    }
  }

  async getLogs(userId?: number, limit: number = 100) {
    return this.prisma.auditLog.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }
}

