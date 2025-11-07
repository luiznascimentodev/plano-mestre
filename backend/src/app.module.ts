import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { TopicsModule } from './topics/topics.module';
import { StudySessionsModule } from './study-sessions/study-sessions.module';
import { FlashcardsModule } from './flashcards/flashcards.module';
import { ScheduledSessionsModule } from './scheduled-sessions/scheduled-sessions.module';
import { HabitsModule } from './habits/habits.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SuggestionsModule } from './suggestions/suggestions.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Rate Limiting - proteção contra ataques de força bruta
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL', 60000), // 1 minuto
          limit: config.get<number>('THROTTLE_LIMIT', 100), // 100 requisições por minuto
        },
      ],
    }),
    AuthModule,
    PrismaModule,
    TopicsModule,
    StudySessionsModule,
    FlashcardsModule,
    ScheduledSessionsModule,
    HabitsModule,
    AnalyticsModule,
    SuggestionsModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Aplicar rate limiting globalmente
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
