import { Module } from '@nestjs/common';
import { ScheduledSessionsService } from './scheduled-sessions.service';
import { ScheduledSessionsController } from './scheduled-sessions.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [ScheduledSessionsController],
  providers: [ScheduledSessionsService],
})
export class ScheduledSessionsModule {}

