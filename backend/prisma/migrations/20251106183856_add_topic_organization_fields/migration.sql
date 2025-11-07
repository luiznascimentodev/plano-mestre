-- CreateEnum
CREATE TYPE "TopicPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "Topic" ADD COLUMN     "category" TEXT,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "priority" "TopicPriority",
ADD COLUMN     "tags" TEXT;

-- CreateIndex
CREATE INDEX "Topic_userId_idx" ON "Topic"("userId");

-- CreateIndex
CREATE INDEX "Topic_category_idx" ON "Topic"("category");

-- CreateIndex
CREATE INDEX "Topic_priority_idx" ON "Topic"("priority");

-- CreateIndex
CREATE INDEX "Topic_dueDate_idx" ON "Topic"("dueDate");
