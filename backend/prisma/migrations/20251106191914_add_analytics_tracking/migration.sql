-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('STUDY_SESSION_STARTED', 'STUDY_SESSION_COMPLETED', 'STUDY_SESSION_PAUSED', 'STUDY_SESSION_STOPPED', 'TOPIC_CREATED', 'TOPIC_UPDATED', 'TOPIC_DELETED', 'TOPIC_VIEWED', 'FLASHCARD_CREATED', 'FLASHCARD_REVIEWED', 'FLASHCARD_DELETED', 'SESSION_SCHEDULED', 'SESSION_COMPLETED', 'SESSION_CANCELLED', 'HABIT_CREATED', 'HABIT_COMPLETED', 'HABIT_UPDATED', 'HABIT_DELETED', 'PAGE_VIEWED', 'FEATURE_ACCESSED', 'BUTTON_CLICKED', 'FORM_SUBMITTED', 'SEARCH_PERFORMED');

-- DropIndex
DROP INDEX "public"."HabitCompletion_habitId_completedAt_key";

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" SERIAL NOT NULL,
    "eventType" "AnalyticsEventType" NOT NULL,
    "entityType" TEXT,
    "entityId" INTEGER,
    "metadata" JSONB,
    "sessionId" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_idx" ON "AnalyticsEvent"("userId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_idx" ON "AnalyticsEvent"("eventType");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_entityType_idx" ON "AnalyticsEvent"("entityType");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_eventType_createdAt_idx" ON "AnalyticsEvent"("userId", "eventType", "createdAt");

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
