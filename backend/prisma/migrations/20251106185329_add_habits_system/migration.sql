-- CreateEnum
CREATE TYPE "HabitFrequency" AS ENUM ('DAILY', 'WEEKLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "HabitType" AS ENUM ('STUDY_TIME', 'SESSIONS_COUNT', 'TOPICS_COMPLETED', 'REVIEWS_DONE', 'CUSTOM');

-- CreateTable
CREATE TABLE "Habit" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "HabitType" NOT NULL DEFAULT 'CUSTOM',
    "frequency" "HabitFrequency" NOT NULL DEFAULT 'DAILY',
    "targetValue" INTEGER,
    "color" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "customDays" TEXT,
    "topicId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Habit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HabitCompletion" (
    "id" SERIAL NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "habitId" INTEGER NOT NULL,

    CONSTRAINT "HabitCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Habit_userId_idx" ON "Habit"("userId");

-- CreateIndex
CREATE INDEX "Habit_topicId_idx" ON "Habit"("topicId");

-- CreateIndex
CREATE INDEX "Habit_isActive_idx" ON "Habit"("isActive");

-- CreateIndex
CREATE INDEX "Habit_startDate_idx" ON "Habit"("startDate");

-- CreateIndex
CREATE INDEX "HabitCompletion_userId_idx" ON "HabitCompletion"("userId");

-- CreateIndex
CREATE INDEX "HabitCompletion_habitId_idx" ON "HabitCompletion"("habitId");

-- CreateIndex
CREATE INDEX "HabitCompletion_completedAt_idx" ON "HabitCompletion"("completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "HabitCompletion_habitId_completedAt_key" ON "HabitCompletion"("habitId", "completedAt");

-- AddForeignKey
ALTER TABLE "Habit" ADD CONSTRAINT "Habit_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Habit" ADD CONSTRAINT "Habit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitCompletion" ADD CONSTRAINT "HabitCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitCompletion" ADD CONSTRAINT "HabitCompletion_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
