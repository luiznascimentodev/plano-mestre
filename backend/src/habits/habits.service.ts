import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { CompleteHabitDto } from './dto/complete-habit.dto';

@Injectable()
export class HabitsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateHabitDto, userId: number) {
    // Verificar se topicId existe e pertence ao usuário (se fornecido)
    if (dto.topicId) {
      const topic = await this.prisma.topic.findUnique({
        where: { id: dto.topicId },
      });

      if (!topic) {
        throw new NotFoundException('Assunto não encontrado.');
      }

      if (topic.userId !== userId) {
        throw new ForbiddenException(
          'Você não tem permissão para criar hábito neste assunto.',
        );
      }
    }

    return this.prisma.habit.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type,
        frequency: dto.frequency,
        targetValue: dto.targetValue,
        color: dto.color,
        icon: dto.icon,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        customDays: dto.customDays,
        topicId: dto.topicId,
        userId: userId,
      },
      include: {
        topic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findAll(userId: number, includeInactive: boolean = false) {
    const where: any = {
      userId,
    };

    if (!includeInactive) {
      where.isActive = true;
    }

    return this.prisma.habit.findMany({
      where,
      include: {
        topic: {
          select: {
            id: true,
            name: true,
          },
        },
        completions: {
          orderBy: {
            completedAt: 'desc',
          },
          take: 30, // Últimas 30 conclusões
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number, userId: number) {
    const habit = await this.prisma.habit.findUnique({
      where: { id },
      include: {
        topic: {
          select: {
            id: true,
            name: true,
          },
        },
        completions: {
          orderBy: {
            completedAt: 'desc',
          },
        },
      },
    });

    if (!habit) {
      throw new NotFoundException('Hábito não encontrado.');
    }

    if (habit.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este hábito.',
      );
    }

    return habit;
  }

  async update(id: number, dto: UpdateHabitDto, userId: number) {
    const habit = await this.prisma.habit.findUnique({
      where: { id },
    });

    if (!habit) {
      throw new NotFoundException('Hábito não encontrado.');
    }

    if (habit.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para atualizar este hábito.',
      );
    }

    // Verificar topicId se fornecido
    if (dto.topicId !== undefined) {
      if (dto.topicId === null) {
        // Permitir remover relação
      } else {
        const topic = await this.prisma.topic.findUnique({
          where: { id: dto.topicId },
        });

        if (!topic) {
          throw new NotFoundException('Assunto não encontrado.');
        }

        if (topic.userId !== userId) {
          throw new ForbiddenException(
            'Você não tem permissão para usar este assunto.',
          );
        }
      }
    }

    const updateData: any = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.frequency !== undefined) updateData.frequency = dto.frequency;
    if (dto.targetValue !== undefined) updateData.targetValue = dto.targetValue;
    if (dto.color !== undefined) updateData.color = dto.color;
    if (dto.icon !== undefined) updateData.icon = dto.icon;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.startDate !== undefined)
      updateData.startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    if (dto.endDate !== undefined)
      updateData.endDate = dto.endDate ? new Date(dto.endDate) : dto.endDate === null ? null : undefined;
    if (dto.customDays !== undefined) updateData.customDays = dto.customDays;
    if (dto.topicId !== undefined) updateData.topicId = dto.topicId;

    return this.prisma.habit.update({
      where: { id },
      data: updateData,
      include: {
        topic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async remove(id: number, userId: number) {
    const habit = await this.prisma.habit.findUnique({
      where: { id },
    });

    if (!habit) {
      throw new NotFoundException('Hábito não encontrado.');
    }

    if (habit.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir este hábito.',
      );
    }

    return this.prisma.habit.delete({
      where: { id },
    });
  }

  async complete(id: number, dto: CompleteHabitDto, userId: number) {
    const habit = await this.prisma.habit.findUnique({
      where: { id },
    });

    if (!habit) {
      throw new NotFoundException('Hábito não encontrado.');
    }

    if (habit.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para completar este hábito.',
      );
    }

    if (!habit.isActive) {
      throw new BadRequestException('Este hábito está inativo.');
    }

    const completedAt = dto.completedAt
      ? new Date(dto.completedAt)
      : new Date();

    // Normalizar para início do dia para garantir unicidade
    completedAt.setHours(0, 0, 0, 0);

    // Verificar se já foi completado neste dia
    const existingCompletion = await this.prisma.habitCompletion.findFirst({
      where: {
        habitId: id,
        completedAt: {
          gte: completedAt,
          lt: new Date(completedAt.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (existingCompletion) {
      throw new BadRequestException(
        'Este hábito já foi completado nesta data.',
      );
    }

    return this.prisma.habitCompletion.create({
      data: {
        habitId: id,
        userId: userId,
        value: dto.value,
        notes: dto.notes,
        completedAt: completedAt,
      },
    });
  }

  async uncomplete(id: number, completionId: number, userId: number) {
    const habit = await this.prisma.habit.findUnique({
      where: { id },
    });

    if (!habit) {
      throw new NotFoundException('Hábito não encontrado.');
    }

    if (habit.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para gerenciar este hábito.',
      );
    }

    const completion = await this.prisma.habitCompletion.findUnique({
      where: { id: completionId },
    });

    if (!completion) {
      throw new NotFoundException('Conclusão não encontrada.');
    }

    if (completion.userId !== userId || completion.habitId !== id) {
      throw new ForbiddenException(
        'Você não tem permissão para remover esta conclusão.',
      );
    }

    return this.prisma.habitCompletion.delete({
      where: { id: completionId },
    });
  }

  async getStats(id: number, userId: number) {
    const habit = await this.findOne(id, userId);

    const completions = await this.prisma.habitCompletion.findMany({
      where: {
        habitId: id,
        userId: userId,
      },
      orderBy: {
        completedAt: 'asc',
      },
    });

    // Calcular streak atual
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Ordenar por data (mais recente primeiro)
    const sortedCompletions = [...completions].sort(
      (a, b) => b.completedAt.getTime() - a.completedAt.getTime(),
    );

    for (let i = 0; i < sortedCompletions.length; i++) {
      const completionDate = new Date(sortedCompletions[i].completedAt);
      completionDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);

      if (
        completionDate.getTime() === expectedDate.getTime() ||
        (i === 0 && completionDate.getTime() >= today.getTime() - 86400000)
      ) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calcular melhor streak
    let bestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    for (const completion of sortedCompletions.reverse()) {
      const completionDate = new Date(completion.completedAt);
      completionDate.setHours(0, 0, 0, 0);

      if (lastDate === null) {
        tempStreak = 1;
        lastDate = completionDate;
      } else {
        const diffDays =
          (lastDate.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays === 1) {
          tempStreak++;
        } else {
          bestStreak = Math.max(bestStreak, tempStreak);
          tempStreak = 1;
        }
        lastDate = completionDate;
      }
    }
    bestStreak = Math.max(bestStreak, tempStreak);

    // Calcular completude do mês atual
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthCompletions = completions.filter((c) => {
      const date = new Date(c.completedAt);
      return date >= firstDay && date <= lastDay;
    });

    const daysInMonth = lastDay.getDate();
    const completionRate = (monthCompletions.length / daysInMonth) * 100;

    return {
      totalCompletions: completions.length,
      currentStreak,
      bestStreak,
      monthCompletions: monthCompletions.length,
      completionRate: Math.round(completionRate),
      averageValue:
        completions.length > 0
          ? Math.round(
              completions.reduce((acc, c) => acc + (c.value || 0), 0) /
                completions.length,
            )
          : 0,
    };
  }
}

