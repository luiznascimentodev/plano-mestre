import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateStudySessionDto } from './dto/create-session.dto';
import { StudyStatus } from '@prisma/client';

@Injectable()
export class StudySessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStudySessionDto, userId: number) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: dto.topicId },
    });

    if (!topic) {
      throw new NotFoundException('Assunto (Topic) não encontrado.');
    }

    if (topic.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para este assunto.');
    }

    return this.prisma.$transaction(async(tx) => {
      const session = await tx.studySession.create({
        data: {
          duration: dto.duration,
          userId: userId,
          topicId: dto.topicId
        },
      });

      if (topic.status === StudyStatus.NOT_STARTED){
        await tx.topic.update({
          where: { id: dto.topicId },
          data: {
            status: StudyStatus.IN_PROGRESS,
          },
        });
      }
      return session;
    });
  }

  async findAll(userId: number) {
    return this.prisma.studySession.findMany({
      where: {
        userId: userId,
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
      orderBy: {
        completedAt: 'desc',
      },
    });
  }

  /**
   * Calcula estatísticas diárias de estudo
   * Aplica SRP: Esta função apenas agrega dados, sem lógica de negócio complexa
   */
  async getDailyStats(userId: number, date?: Date) {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const sessions = await this.prisma.studySession.findMany({
      where: {
        userId: userId,
        completedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        topic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        completedAt: 'asc',
      },
    });

    // Agregar dados
    const totalMinutes = sessions.reduce(
      (acc, session) => acc + session.duration,
      0,
    );
    const sessionCount = sessions.length;
    const uniqueTopics = new Set(sessions.map((s) => s.topicId));
    const topicsStudied = uniqueTopics.size;

    // Agrupar por tópico
    const byTopicMap = new Map<
      number,
      { topicId: number; topicName: string; totalMinutes: number; sessionCount: number }
    >();

    sessions.forEach((session) => {
      const existing = byTopicMap.get(session.topicId);
      if (existing) {
        existing.totalMinutes += session.duration;
        existing.sessionCount += 1;
      } else {
        byTopicMap.set(session.topicId, {
          topicId: session.topicId,
          topicName: session.topic.name,
          totalMinutes: session.duration,
          sessionCount: 1,
        });
      }
    });

    const byTopic = Array.from(byTopicMap.values());

    return {
      date: targetDate.toISOString().split('T')[0],
      totalMinutes,
      sessionCount,
      topicsStudied,
      byTopic,
    };
  }

  /**
   * Busca estatísticas de múltiplos dias (últimos N dias)
   */
  async getWeeklyStats(userId: number, days: number = 7) {
    const stats: Awaited<ReturnType<typeof this.getDailyStats>>[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayStats = await this.getDailyStats(userId, date);
      stats.push(dayStats);
    }

    return stats.reverse(); // Mais antigo primeiro
  }

  /**
   * Análise avançada de métricas diárias com algoritmos complexos
   */
  async getAdvancedDailyMetrics(userId: number, date?: Date) {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Buscar sessões do dia
    const sessions = await this.prisma.studySession.findMany({
      where: {
        userId: userId,
        completedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
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
      orderBy: {
        completedAt: 'asc',
      },
    });

    // Buscar histórico dos últimos 30 dias para comparação
    const thirtyDaysAgo = new Date(targetDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const historicalSessions = await this.prisma.studySession.findMany({
      where: {
        userId: userId,
        completedAt: {
          gte: thirtyDaysAgo,
          lt: startOfDay,
        },
      },
    });

    // Calcular métricas básicas
    const totalMinutes = sessions.reduce(
      (acc, session) => acc + session.duration,
      0,
    );
    const sessionCount = sessions.length;
    const avgSessionDuration =
      sessionCount > 0 ? totalMinutes / sessionCount : 0;

    // Distribuição por hora do dia (algoritmo de análise temporal)
    const hourlyDistribution = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      minutes: 0,
      sessionCount: 0,
    }));

    sessions.forEach((session) => {
      const hour = new Date(session.completedAt).getHours();
      hourlyDistribution[hour].minutes += session.duration;
      hourlyDistribution[hour].sessionCount += 1;
    });

    // Identificar picos de produtividade
    const peakHours = hourlyDistribution
      .map((h, idx) => ({ ...h, index: idx }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 3)
      .map((h) => h.index);

    // Análise de intervalo entre sessões (consistência)
    const intervals: number[] = [];
    for (let i = 1; i < sessions.length; i++) {
      const diff =
        (new Date(sessions[i].completedAt).getTime() -
          new Date(sessions[i - 1].completedAt).getTime()) /
        (1000 * 60); // em minutos
      intervals.push(diff);
    }

    const avgInterval =
      intervals.length > 0
        ? intervals.reduce((a, b) => a + b, 0) / intervals.length
        : 0;

    // Calcular média histórica (últimos 30 dias)
    const historicalTotal = historicalSessions.reduce(
      (acc, s) => acc + s.duration,
      0,
    );
    const historicalDays = 30;
    const historicalDailyAverage = historicalTotal / historicalDays;

    // Comparação com média histórica
    const vsAverage = totalMinutes - historicalDailyAverage;
    const vsAveragePercent =
      historicalDailyAverage > 0
        ? ((vsAverage / historicalDailyAverage) * 100).toFixed(1)
        : '0';

    // Análise de diversidade de assuntos (Shannon Index simplificado)
    const topicCounts = new Map<number, number>();
    sessions.forEach((s) => {
      topicCounts.set(s.topicId, (topicCounts.get(s.topicId) || 0) + 1);
    });

    const uniqueTopics = topicCounts.size;
    const totalSessions = sessions.length;
    const diversityScore =
      totalSessions > 0
        ? (uniqueTopics / totalSessions) * 100
        : 0; // Quanto maior, mais diversificado

    // Eficiência de estudo (minutos por assunto)
    const efficiency = uniqueTopics > 0 ? totalMinutes / uniqueTopics : 0;

    // Análise de tendência (comparar com últimos 7 dias)
    const last7Days: number[] = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date(targetDate);
      date.setDate(date.getDate() - i);
      const stats = await this.getDailyStats(userId, date);
      last7Days.push(stats.totalMinutes);
    }

    const last7DaysAvg =
      last7Days.reduce((a, b) => a + b, 0) / last7Days.length;
    const trend = totalMinutes > last7DaysAvg ? 'up' : totalMinutes < last7DaysAvg ? 'down' : 'stable';
    const trendPercent =
      last7DaysAvg > 0
        ? Math.abs(((totalMinutes - last7DaysAvg) / last7DaysAvg) * 100).toFixed(1)
        : '0';

    // Análise de consistência (desvio padrão dos últimos 7 dias)
    const variance =
      last7Days.reduce((acc, val) => acc + Math.pow(val - last7DaysAvg, 2), 0) /
      last7Days.length;
    const stdDev = Math.sqrt(variance);
    const consistencyScore = last7DaysAvg > 0
      ? Math.max(0, 100 - (stdDev / last7DaysAvg) * 100)
      : 0; // Quanto maior, mais consistente

    // Previsão para amanhã (média móvel simples)
    const tomorrowPrediction = last7DaysAvg;

    // Análise de progressão (crescimento semanal)
    const thisWeek = last7Days.slice(0, 7);
    const lastWeek: number[] = [];
    for (let i = 8; i <= 14; i++) {
      const date = new Date(targetDate);
      date.setDate(date.getDate() - i);
      const stats = await this.getDailyStats(userId, date);
      lastWeek.push(stats.totalMinutes);
    }

    const thisWeekTotal = thisWeek.reduce((a, b) => a + b, 0);
    const lastWeekTotal = lastWeek.reduce((a, b) => a + b, 0);
    const weeklyGrowth =
      lastWeekTotal > 0
        ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100
        : 0;

    return {
      date: targetDate.toISOString().split('T')[0],
      basic: {
        totalMinutes,
        sessionCount,
        avgSessionDuration: Math.round(avgSessionDuration),
        topicsStudied: uniqueTopics,
      },
      temporal: {
        hourlyDistribution,
        peakHours,
        avgInterval: Math.round(avgInterval),
      },
      comparison: {
        vsHistoricalAverage: Math.round(vsAverage),
        vsHistoricalAveragePercent: parseFloat(vsAveragePercent),
        vsLast7Days: Math.round(totalMinutes - last7DaysAvg),
        vsLast7DaysPercent: parseFloat(trendPercent),
        trend,
      },
      analysis: {
        diversityScore: Math.round(diversityScore),
        efficiency: Math.round(efficiency),
        consistencyScore: Math.round(consistencyScore),
        weeklyGrowth: Math.round(weeklyGrowth * 100) / 100,
      },
      prediction: {
        tomorrowPrediction: Math.round(tomorrowPrediction),
      },
      byTopic: Array.from(topicCounts.entries()).map(([topicId, count]) => {
        const topic = sessions.find((s) => s.topicId === topicId)?.topic;
        const topicMinutes = sessions
          .filter((s) => s.topicId === topicId)
          .reduce((acc, s) => acc + s.duration, 0);
        return {
          topicId,
          topicName: topic?.name || 'Desconhecido',
          sessionCount: count,
          totalMinutes: topicMinutes,
          percentage: totalMinutes > 0 ? (topicMinutes / totalMinutes) * 100 : 0,
        };
      }),
    };
  }
}
