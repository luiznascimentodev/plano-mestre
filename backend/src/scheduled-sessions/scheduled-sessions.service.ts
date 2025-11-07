import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduledSessionDto } from './dto/create-scheduled-session.dto';

@Injectable()
export class ScheduledSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateScheduledSessionDto, userId: number) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: dto.topicId },
    });

    if (!topic) {
      throw new NotFoundException('Assunto (Topic) não encontrado.');
    }

    if (topic.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para agendar sessões neste assunto.',
      );
    }

    return this.prisma.scheduledSession.create({
      data: {
        scheduledAt: new Date(dto.scheduledAt),
        duration: dto.duration,
        topicId: dto.topicId,
        userId: userId,
        notes: dto.notes,
      },
      include: {
        topic: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });
  }

  async findAll(userId: number, date?: Date, includeCompleted: boolean = false) {
    const where: any = { userId };

    if (!includeCompleted) {
      where.isCompleted = false;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.scheduledAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    return this.prisma.scheduledSession.findMany({
      where,
      include: {
        topic: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });
  }

  /**
   * Busca agendamentos por período (semana ou mês)
   */
  async findByPeriod(userId: number, startDate: Date, endDate: Date, includeCompleted: boolean = false) {
    const where: any = {
      userId,
      scheduledAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (!includeCompleted) {
      where.isCompleted = false;
    }

    return this.prisma.scheduledSession.findMany({
      where,
      include: {
        topic: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });
  }

  async update(id: number, dto: Partial<CreateScheduledSessionDto>, userId: number) {
    const scheduled = await this.prisma.scheduledSession.findUnique({
      where: { id },
    });

    if (!scheduled) {
      throw new NotFoundException('Sessão agendada não encontrada.');
    }

    if (scheduled.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para editar esta sessão.',
      );
    }

    return this.prisma.scheduledSession.update({
      where: { id },
      data: {
        ...(dto.scheduledAt && { scheduledAt: new Date(dto.scheduledAt) }),
        ...(dto.duration && { duration: dto.duration }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.topicId && { topicId: dto.topicId }),
      },
      include: {
        topic: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });
  }

  async markAsCompleted(id: number, userId: number) {
    const scheduled = await this.prisma.scheduledSession.findUnique({
      where: { id },
    });

    if (!scheduled) {
      throw new NotFoundException('Sessão agendada não encontrada.');
    }

    if (scheduled.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para completar esta sessão.',
      );
    }

    return this.prisma.scheduledSession.update({
      where: { id },
      data: { isCompleted: true },
    });
  }

  async remove(id: number, userId: number) {
    const scheduled = await this.prisma.scheduledSession.findUnique({
      where: { id },
    });

    if (!scheduled) {
      throw new NotFoundException('Sessão agendada não encontrada.');
    }

    if (scheduled.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para remover esta sessão.',
      );
    }

    return this.prisma.scheduledSession.delete({
      where: { id },
    });
  }
}

