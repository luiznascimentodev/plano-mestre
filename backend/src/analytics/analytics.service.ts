import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnalyticsEventDto } from './dto/create-analytics-event.dto';
import { AnalyticsEventType } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async trackEvent(
    dto: CreateAnalyticsEventDto,
    userId: number,
    userAgent?: string,
    ipAddress?: string,
    sessionId?: string,
  ) {
    return this.prisma.analyticsEvent.create({
      data: {
        eventType: dto.eventType,
        entityType: dto.entityType,
        entityId: dto.entityId,
        metadata: dto.metadata || {},
        duration: dto.duration,
        userId: userId,
        userAgent: userAgent,
        ipAddress: ipAddress,
        sessionId: sessionId,
      },
    });
  }

  async getUserAnalytics(
    userId: number,
    startDate?: Date,
    endDate?: Date,
    eventTypes?: AnalyticsEventType[],
  ) {
    const where: any = {
      userId,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    if (eventTypes && eventTypes.length > 0) {
      where.eventType = { in: eventTypes };
    }

    const events = await this.prisma.analyticsEvent.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return events;
  }

  async getDailyStats(userId: number, date?: Date) {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        userId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Agrupar por tipo de evento
    const eventsByType = events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calcular tempo total de sessões
    const sessionEvents = events.filter(
      (e) =>
        e.eventType === AnalyticsEventType.STUDY_SESSION_STARTED ||
        e.eventType === AnalyticsEventType.STUDY_SESSION_COMPLETED,
    );
    const totalSessionDuration = sessionEvents.reduce(
      (acc, e) => acc + (e.duration || 0),
      0,
    );

    // Páginas mais visitadas
    const pageViews = events.filter(
      (e) => e.eventType === AnalyticsEventType.PAGE_VIEWED,
    );
    const pagesByPath = pageViews.reduce((acc, event) => {
      const path = (event.metadata as any)?.path || 'unknown';
      acc[path] = (acc[path] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Features mais usadas
    const featureAccesses = events.filter(
      (e) => e.eventType === AnalyticsEventType.FEATURE_ACCESSED,
    );
    const featuresByType = featureAccesses.reduce((acc, event) => {
      const feature = (event.metadata as any)?.feature || 'unknown';
      acc[feature] = (acc[feature] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEvents: events.length,
      eventsByType,
      totalSessionDuration,
      pagesByPath,
      featuresByType,
      events,
    };
  }

  async getWeeklyStats(userId: number, days: number = 7) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Agrupar por dia
    const eventsByDay: Record<string, any[]> = {};
    events.forEach((event) => {
      const day = event.createdAt.toISOString().split('T')[0];
      if (!eventsByDay[day]) {
        eventsByDay[day] = [];
      }
      eventsByDay[day].push(event);
    });

    // Calcular métricas por dia
    const dailyStats = Object.entries(eventsByDay).map(([day, dayEvents]) => {
      const sessionEvents = dayEvents.filter(
        (e) =>
          e.eventType === AnalyticsEventType.STUDY_SESSION_STARTED ||
          e.eventType === AnalyticsEventType.STUDY_SESSION_COMPLETED,
      );
      const totalDuration = sessionEvents.reduce(
        (acc, e) => acc + (e.duration || 0),
        0,
      );

      return {
        date: day,
        totalEvents: dayEvents.length,
        sessionDuration: totalDuration,
        topicsCreated: dayEvents.filter(
          (e) => e.eventType === AnalyticsEventType.TOPIC_CREATED,
        ).length,
        flashcardsReviewed: dayEvents.filter(
          (e) => e.eventType === AnalyticsEventType.FLASHCARD_REVIEWED,
        ).length,
        habitsCompleted: dayEvents.filter(
          (e) => e.eventType === AnalyticsEventType.HABIT_COMPLETED,
        ).length,
      };
    });

    return {
      period: { startDate, endDate },
      totalEvents: events.length,
      dailyStats,
      events,
    };
  }

  async getFeatureUsageStats(userId: number, days: number = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Contar uso de features
    const featureCounts: Record<string, number> = {};
    const featureDurations: Record<string, number> = {};

    events.forEach((event) => {
      if (event.eventType === AnalyticsEventType.FEATURE_ACCESSED) {
        const feature = (event.metadata as any)?.feature || 'unknown';
        featureCounts[feature] = (featureCounts[feature] || 0) + 1;
        if (event.duration) {
          featureDurations[feature] =
            (featureDurations[feature] || 0) + event.duration;
        }
      }
    });

    // Contar tipos de eventos
    const eventTypeCounts: Record<string, number> = {};
    events.forEach((event) => {
      eventTypeCounts[event.eventType] =
        (eventTypeCounts[event.eventType] || 0) + 1;
    });

    return {
      period: { startDate, endDate },
      featureCounts,
      featureDurations,
      eventTypeCounts,
      totalEvents: events.length,
    };
  }

  async getEngagementMetrics(userId: number, days: number = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Calcular dias ativos
    const activeDays = new Set(
      events.map((e) => e.createdAt.toISOString().split('T')[0]),
    ).size;

    // Calcular sessões de estudo
    const studySessions = events.filter(
      (e) => e.eventType === AnalyticsEventType.STUDY_SESSION_COMPLETED,
    ).length;

    // Calcular tempo total de estudo
    const totalStudyTime = events
      .filter((e) => e.eventType === AnalyticsEventType.STUDY_SESSION_COMPLETED)
      .reduce((acc, e) => acc + (e.duration || 0), 0);

    // Calcular interações totais
    const totalInteractions = events.length;

    // Calcular diversidade de features
    const uniqueFeatures = new Set(
      events
        .filter((e) => e.eventType === AnalyticsEventType.FEATURE_ACCESSED)
        .map((e) => (e.metadata as any)?.feature),
    ).size;

    // Calcular taxa de retorno (dias consecutivos)
    const dates = Array.from(
      new Set(events.map((e) => e.createdAt.toISOString().split('T')[0])),
    )
      .sort()
      .map((d) => new Date(d));

    let consecutiveDays = 0;
    let maxConsecutive = 0;
    let currentStreak = 0;

    for (let i = 0; i < dates.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const diffDays =
          (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays === 1) {
          currentStreak++;
        } else {
          maxConsecutive = Math.max(maxConsecutive, currentStreak);
          currentStreak = 1;
        }
      }
    }
    maxConsecutive = Math.max(maxConsecutive, currentStreak);

    // Verificar streak atual
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const hasToday = dates.some(
      (d) => d.toISOString().split('T')[0] === today.toISOString().split('T')[0],
    );
    const hasYesterday = dates.some(
      (d) =>
        d.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0],
    );

    if (hasToday || hasYesterday) {
      consecutiveDays = currentStreak;
    }

    return {
      period: { startDate, endDate },
      activeDays,
      totalDays: days,
      engagementRate: (activeDays / days) * 100,
      studySessions,
      totalStudyTime,
      totalInteractions,
      uniqueFeatures,
      maxConsecutiveDays: maxConsecutive,
      currentStreak: consecutiveDays,
      averageEventsPerDay: activeDays > 0 ? totalInteractions / activeDays : 0,
    };
  }
}

