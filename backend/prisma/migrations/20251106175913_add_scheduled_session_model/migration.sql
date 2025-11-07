-- CreateTable
CREATE TABLE "ScheduledSession" (
    "id" SERIAL NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "notes" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "topicId" INTEGER NOT NULL,

    CONSTRAINT "ScheduledSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduledSession_userId_idx" ON "ScheduledSession"("userId");

-- CreateIndex
CREATE INDEX "ScheduledSession_topicId_idx" ON "ScheduledSession"("topicId");

-- CreateIndex
CREATE INDEX "ScheduledSession_scheduledAt_idx" ON "ScheduledSession"("scheduledAt");

-- AddForeignKey
ALTER TABLE "ScheduledSession" ADD CONSTRAINT "ScheduledSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledSession" ADD CONSTRAINT "ScheduledSession_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
