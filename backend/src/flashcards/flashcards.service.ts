import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';
import { ReviewFlashcardDto } from './dto/review-flashcard.dto';
import { FlashcardDifficulty } from '@prisma/client';

@Injectable()
export class FlashcardsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo flashcard
   * Aplica SRP: Esta função apenas cria flashcards, delegando validação ao Controller
   */
  async create(dto: CreateFlashcardDto, userId: number) {
    // Verificar se o topic existe e pertence ao usuário
    const topic = await this.prisma.topic.findUnique({
      where: { id: dto.topicId },
    });

    if (!topic) {
      throw new NotFoundException('Assunto (Topic) não encontrado.');
    }

    if (topic.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para criar flashcards neste assunto.',
      );
    }

    return this.prisma.flashcard.create({
      data: {
        front: dto.front,
        back: dto.back,
        topicId: dto.topicId,
        userId: userId,
        difficulty: dto.difficulty || FlashcardDifficulty.MEDIUM,
        nextReview: new Date(), // Próxima revisão é agora (primeira vez)
      },
    });
  }

  /**
   * Lista todos os flashcards do usuário, opcionalmente filtrados por topic
   * Aplica SRP: Apenas busca dados, sem lógica de negócio complexa
   */
  async findAll(userId: number, topicId?: number) {
    const where: any = { userId };

    if (topicId) {
      // Verificar ownership do topic
      const topic = await this.prisma.topic.findUnique({
        where: { id: topicId },
      });

      if (!topic || topic.userId !== userId) {
        throw new ForbiddenException(
          'Você não tem permissão para acessar este assunto.',
        );
      }

      where.topicId = topicId;
    }

    return this.prisma.flashcard.findMany({
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
        nextReview: 'asc', // Próximos a revisar primeiro
      },
    });
  }

  /**
   * Busca flashcards que precisam ser revisados (nextReview <= agora)
   * Implementa algoritmo básico de repetição espaçada
   */
  async findDueForReview(userId: number, topicId?: number) {
    const now = new Date();
    const where: any = {
      userId,
      nextReview: {
        lte: now, // Less than or equal to now
      },
    };

    if (topicId) {
      const topic = await this.prisma.topic.findUnique({
        where: { id: topicId },
      });

      if (!topic || topic.userId !== userId) {
        throw new ForbiddenException(
          'Você não tem permissão para acessar este assunto.',
        );
      }

      where.topicId = topicId;
    }

    return this.prisma.flashcard.findMany({
      where,
      include: {
        topic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        nextReview: 'asc',
      },
    });
  }

  /**
   * Busca um flashcard específico
   */
  async findOne(id: number, userId: number) {
    const flashcard = await this.prisma.flashcard.findUnique({
      where: { id },
      include: {
        topic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!flashcard) {
      throw new NotFoundException('Flashcard não encontrado.');
    }

    if (flashcard.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este flashcard.',
      );
    }

    return flashcard;
  }

  /**
   * Atualiza um flashcard
   */
  async update(id: number, dto: UpdateFlashcardDto, userId: number) {
    const flashcard = await this.findOne(id, userId);

    return this.prisma.flashcard.update({
      where: { id },
      data: {
        ...(dto.front && { front: dto.front }),
        ...(dto.back && { back: dto.back }),
        ...(dto.difficulty && { difficulty: dto.difficulty }),
      },
    });
  }

  /**
   * Registra uma revisão do flashcard e calcula próxima revisão
   * Implementa algoritmo de repetição espaçada (Spaced Repetition)
   */
  async review(id: number, dto: ReviewFlashcardDto, userId: number) {
    const flashcard = await this.findOne(id, userId);

    // Calcular intervalo baseado na dificuldade e número de revisões
    const interval = this.calculateNextReviewInterval(
      dto.difficulty,
      flashcard.reviewCount,
    );

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    return this.prisma.flashcard.update({
      where: { id },
      data: {
        difficulty: dto.difficulty,
        reviewCount: flashcard.reviewCount + 1,
        lastReviewed: new Date(),
        nextReview: nextReview,
      },
    });
  }

  /**
   * Remove um flashcard
   */
  async remove(id: number, userId: number) {
    await this.findOne(id, userId); // Valida ownership

    return this.prisma.flashcard.delete({
      where: { id },
    });
  }

  /**
   * Calcula o intervalo até a próxima revisão baseado na dificuldade
   * Algoritmo simplificado de repetição espaçada:
   * - Fácil: aumenta exponencialmente
   * - Médio: aumenta linearmente
   * - Difícil: revisa em 1 dia
   */
  private calculateNextReviewInterval(
    difficulty: FlashcardDifficulty,
    reviewCount: number,
  ): number {
    switch (difficulty) {
      case FlashcardDifficulty.EASY:
        // Fácil: 1 dia, 3 dias, 7 dias, 14 dias, 30 dias...
        if (reviewCount === 0) return 1;
        if (reviewCount === 1) return 3;
        if (reviewCount === 2) return 7;
        if (reviewCount === 3) return 14;
        return 30; // Depois de 4 revisões, revisa a cada 30 dias
      case FlashcardDifficulty.MEDIUM:
        // Médio: 1 dia, 2 dias, 4 dias, 7 dias...
        if (reviewCount === 0) return 1;
        if (reviewCount === 1) return 2;
        if (reviewCount === 2) return 4;
        return 7;
      case FlashcardDifficulty.HARD:
        // Difícil: sempre revisa em 1 dia até melhorar
        return 1;
      default:
        return 1;
    }
  }
}

