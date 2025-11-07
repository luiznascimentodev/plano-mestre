// /backend/src/topics/topics.module.ts
import { Module } from '@nestjs/common';
import { TopicsService } from './topics.service';
import { TopicController } from './topics.controller';
import { AuthModule } from '../auth/auth.module'; // 1. Importe o AuthModule
import { PrismaService } from '../prisma/prisma.service'; // 2. Importe o PrismaService

@Module({
  imports: [AuthModule], // 3. Adicione AuthModule (para o AuthGuard)
  controllers: [TopicController],
  providers: [TopicsService, PrismaService], // 4. Adicione o PrismaService
})
export class TopicsModule {}
