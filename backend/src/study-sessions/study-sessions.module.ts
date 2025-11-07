import { Module } from '@nestjs/common';
import { StudySessionsService } from './study-sessions.service';
import { StudySessionsController } from './study-sessions.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [AuthModule],
  providers: [StudySessionsService, PrismaService],
  controllers: [StudySessionsController],
})
export class StudySessionsModule {}
