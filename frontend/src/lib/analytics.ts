import { apiPrivate } from './api';
import { AnalyticsEventType } from '@/types/analytics';

// Gerar session ID único
let sessionId: string | null = null;

const getSessionId = (): string => {
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
  }
  return sessionId;
};

// Carregar session ID do sessionStorage se existir
if (typeof window !== 'undefined') {
  const stored = sessionStorage.getItem('analytics_session_id');
  if (stored) {
    sessionId = stored;
  }
}

export const trackEvent = async (
  eventType: AnalyticsEventType,
  options?: {
    entityType?: string;
    entityId?: number;
    metadata?: Record<string, any>;
    duration?: number;
  },
) => {
  try {
    await apiPrivate.post('/analytics/track', {
      eventType,
      entityType: options?.entityType,
      entityId: options?.entityId,
      metadata: options?.metadata,
      duration: options?.duration,
    });
  } catch (error) {
    // Silenciosamente falha - não deve interromper o fluxo do usuário
    console.debug('Analytics tracking failed:', error);
  }
};

// Helpers para eventos comuns
export const analytics = {
  // Sessões de Estudo
  trackStudySessionStarted: (topicId: number, topicName?: string) =>
    trackEvent(AnalyticsEventType.STUDY_SESSION_STARTED, {
      entityType: 'topic',
      entityId: topicId,
      metadata: { topicName },
    }),

  trackStudySessionCompleted: (
    topicId: number,
    duration: number,
    topicName?: string,
  ) =>
    trackEvent(AnalyticsEventType.STUDY_SESSION_COMPLETED, {
      entityType: 'topic',
      entityId: topicId,
      metadata: { topicName },
      duration,
    }),

  trackStudySessionPaused: (topicId: number) =>
    trackEvent(AnalyticsEventType.STUDY_SESSION_PAUSED, {
      entityType: 'topic',
      entityId: topicId,
    }),

  trackStudySessionStopped: (topicId: number) =>
    trackEvent(AnalyticsEventType.STUDY_SESSION_STOPPED, {
      entityType: 'topic',
      entityId: topicId,
    }),

  // Assuntos
  trackTopicCreated: (topicId: number, topicName: string) =>
    trackEvent(AnalyticsEventType.TOPIC_CREATED, {
      entityType: 'topic',
      entityId: topicId,
      metadata: { topicName },
    }),

  trackTopicUpdated: (topicId: number, topicName: string) =>
    trackEvent(AnalyticsEventType.TOPIC_UPDATED, {
      entityType: 'topic',
      entityId: topicId,
      metadata: { topicName },
    }),

  trackTopicDeleted: (topicId: number, topicName: string) =>
    trackEvent(AnalyticsEventType.TOPIC_DELETED, {
      entityType: 'topic',
      entityId: topicId,
      metadata: { topicName },
    }),

  trackTopicViewed: (topicId: number, topicName: string) =>
    trackEvent(AnalyticsEventType.TOPIC_VIEWED, {
      entityType: 'topic',
      entityId: topicId,
      metadata: { topicName },
    }),

  // Flashcards
  trackFlashcardCreated: (flashcardId: number, topicId: number) =>
    trackEvent(AnalyticsEventType.FLASHCARD_CREATED, {
      entityType: 'flashcard',
      entityId: flashcardId,
      metadata: { topicId },
    }),

  trackFlashcardReviewed: (
    flashcardId: number,
    difficulty: string,
    topicId: number,
  ) =>
    trackEvent(AnalyticsEventType.FLASHCARD_REVIEWED, {
      entityType: 'flashcard',
      entityId: flashcardId,
      metadata: { difficulty, topicId },
    }),

  trackFlashcardDeleted: (flashcardId: number) =>
    trackEvent(AnalyticsEventType.FLASHCARD_DELETED, {
      entityType: 'flashcard',
      entityId: flashcardId,
    }),

  // Sessões Agendadas
  trackSessionScheduled: (sessionId: number, topicId: number) =>
    trackEvent(AnalyticsEventType.SESSION_SCHEDULED, {
      entityType: 'scheduledSession',
      entityId: sessionId,
      metadata: { topicId },
    }),

  trackSessionCompleted: (sessionId: number, topicId: number) =>
    trackEvent(AnalyticsEventType.SESSION_COMPLETED, {
      entityType: 'scheduledSession',
      entityId: sessionId,
      metadata: { topicId },
    }),

  trackSessionCancelled: (sessionId: number) =>
    trackEvent(AnalyticsEventType.SESSION_CANCELLED, {
      entityType: 'scheduledSession',
      entityId: sessionId,
    }),

  // Hábitos
  trackHabitCreated: (habitId: number, habitName: string) =>
    trackEvent(AnalyticsEventType.HABIT_CREATED, {
      entityType: 'habit',
      entityId: habitId,
      metadata: { habitName },
    }),

  trackHabitCompleted: (habitId: number, habitName: string) =>
    trackEvent(AnalyticsEventType.HABIT_COMPLETED, {
      entityType: 'habit',
      entityId: habitId,
      metadata: { habitName },
    }),

  trackHabitUpdated: (habitId: number, habitName: string) =>
    trackEvent(AnalyticsEventType.HABIT_UPDATED, {
      entityType: 'habit',
      entityId: habitId,
      metadata: { habitName },
    }),

  trackHabitDeleted: (habitId: number) =>
    trackEvent(AnalyticsEventType.HABIT_DELETED, {
      entityType: 'habit',
      entityId: habitId,
    }),

  // Navegação
  trackPageView: (path: string, pageName?: string) =>
    trackEvent(AnalyticsEventType.PAGE_VIEWED, {
      metadata: { path, pageName },
    }),

  trackFeatureAccessed: (feature: string, metadata?: Record<string, any>) =>
    trackEvent(AnalyticsEventType.FEATURE_ACCESSED, {
      metadata: { feature, ...metadata },
    }),

  // Interações
  trackButtonClick: (buttonName: string, location?: string) =>
    trackEvent(AnalyticsEventType.BUTTON_CLICKED, {
      metadata: { buttonName, location },
    }),

  trackFormSubmitted: (formName: string, success: boolean) =>
    trackEvent(AnalyticsEventType.FORM_SUBMITTED, {
      metadata: { formName, success },
    }),

  trackSearch: (query: string, resultsCount?: number) =>
    trackEvent(AnalyticsEventType.SEARCH_PERFORMED, {
      metadata: { query, resultsCount },
    }),
};

