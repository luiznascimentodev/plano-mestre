import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';

@Injectable()
export class TopicsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTopicDto, userId: number) {
    return this.prisma.topic.create({
      data: {
        name: dto.name,
        userId: userId,
        category: dto.category,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        description: dto.description,
        tags: dto.tags,
        color: dto.color,
      },
    });
  }

  async findAll(userId: number) {
    return this.prisma.topic.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        status: 'asc',
      },
    });
  }

  async findOne(id: number, userId: number) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: id },
    });

    if (!topic) {
      throw new NotFoundException('Assuntos não encontrado.');
    }
    if (topic.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este recurso.',
      );
    }
    return topic;
  }

  async update(id: number, dto: UpdateTopicDto, userId: number) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: id },
    });

    if (!topic) {
      throw new NotFoundException('Assunto não encontrado.');
    }

    if (topic.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para atualizar este assunto.',
      );
    }

    const updateData: any = {};

    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.dueDate !== undefined) {
      updateData.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.tags !== undefined) updateData.tags = dto.tags;
    if (dto.color !== undefined) updateData.color = dto.color;

    return this.prisma.topic.update({
      where: { id: id },
      data: updateData,
    });
  }

  async remove(id: number, userId: number) {
    const topic = await this.prisma.topic.findUnique({
      where: { id },
    });

    if (!topic) {
      throw new NotFoundException('Assunto não encontrado.');
    }

    if (topic.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir este assunto.',
      );
    }

    return this.prisma.topic.delete({
      where: { id },
    });
  }
}
