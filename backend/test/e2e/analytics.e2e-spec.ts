import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { registerAndLogin, cleanupDatabase } from '../helpers/test-helpers';
import { AnalyticsEventType } from '@prisma/client';

describe('AnalyticsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: any;

  let tokenUserA: string;
  let userIdA: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    prisma = app.get(PrismaService);
    await app.init();
    httpServer = app.getHttpServer();
  });

  beforeEach(async () => {
    await cleanupDatabase(prisma);

    const userA = await registerAndLogin(httpServer, 'usera-analytics@plano.com', 'User A');
    tokenUserA = userA.token;
    userIdA = userA.userId;
  });

  afterAll(async () => {
    await cleanupDatabase(prisma);
    await app.close();
  });

  describe('[Guards] Proteção de Rotas', () => {
    it('POST /analytics/track -> Deve falhar (401) se não estiver autenticado', () => {
      return request(httpServer)
        .post('/analytics/track')
        .send({
          eventType: AnalyticsEventType.PAGE_VIEWED,
        })
        .expect(401);
    });

    it('GET /analytics/daily -> Deve falhar (401) se não estiver autenticado', () => {
      return request(httpServer).get('/analytics/daily').expect(401);
    });
  });

  describe('POST /analytics/track (Rastrear Evento)', () => {
    it('Deve rastrear um evento com sucesso (201)', () => {
      return request(httpServer)
        .post('/analytics/track')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          eventType: AnalyticsEventType.PAGE_VIEWED,
          entityType: 'page',
          metadata: { path: '/dashboard' },
        })
        .expect(201)
        .then((res) => {
          expect(res.body.eventType).toBe(AnalyticsEventType.PAGE_VIEWED);
          expect(res.body.userId).toBe(userIdA);
        });
    });

    it('Deve rastrear evento de sessão de estudo', () => {
      return request(httpServer)
        .post('/analytics/track')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          eventType: AnalyticsEventType.STUDY_SESSION_COMPLETED,
          entityType: 'study_session',
          entityId: 1,
          duration: 25,
        })
        .expect(201)
        .then((res) => {
          expect(res.body.eventType).toBe(AnalyticsEventType.STUDY_SESSION_COMPLETED);
          expect(res.body.duration).toBe(25);
        });
    });
  });

  describe('GET /analytics/daily (Estatísticas Diárias)', () => {
    it('Deve retornar estatísticas do dia atual', async () => {
      // Criar alguns eventos
      await prisma.analyticsEvent.createMany({
        data: [
          {
            eventType: AnalyticsEventType.PAGE_VIEWED,
            userId: userIdA,
            metadata: { path: '/dashboard' },
          },
          {
            eventType: AnalyticsEventType.FEATURE_ACCESSED,
            userId: userIdA,
            metadata: { feature: 'flashcards' },
          },
          {
            eventType: AnalyticsEventType.STUDY_SESSION_COMPLETED,
            userId: userIdA,
            duration: 25,
          },
        ],
      });

      return request(httpServer)
        .get('/analytics/daily')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200)
        .then((res) => {
          expect(res.body.totalEvents).toBe(3);
          expect(res.body.eventsByType).toBeDefined();
          expect(res.body.totalSessionDuration).toBe(25);
        });
    });

    it('Deve retornar zeros se não houver eventos', () => {
      return request(httpServer)
        .get('/analytics/daily')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200)
        .then((res) => {
          expect(res.body.totalEvents).toBe(0);
          expect(res.body.totalSessionDuration).toBe(0);
        });
    });
  });

  describe('GET /analytics/weekly (Estatísticas Semanais)', () => {
    it('Deve retornar estatísticas dos últimos 7 dias', async () => {
      // Criar eventos em diferentes dias
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      await prisma.analyticsEvent.create({
        data: {
          eventType: AnalyticsEventType.STUDY_SESSION_COMPLETED,
          userId: userIdA,
          duration: 30,
          createdAt: today,
        },
      });

      await prisma.analyticsEvent.create({
        data: {
          eventType: AnalyticsEventType.STUDY_SESSION_COMPLETED,
          userId: userIdA,
          duration: 25,
          createdAt: yesterday,
        },
      });

      return request(httpServer)
        .get('/analytics/weekly')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200)
        .then((res) => {
          expect(res.body.totalEvents).toBe(2);
          expect(res.body.dailyStats).toBeInstanceOf(Array);
          expect(res.body.dailyStats.length).toBeGreaterThan(0);
        });
    });
  });

  describe('GET /analytics/features (Uso de Features)', () => {
    it('Deve retornar estatísticas de uso de features', async () => {
      await prisma.analyticsEvent.createMany({
        data: [
          {
            eventType: AnalyticsEventType.FEATURE_ACCESSED,
            userId: userIdA,
            metadata: { feature: 'flashcards' },
            duration: 10,
          },
          {
            eventType: AnalyticsEventType.FEATURE_ACCESSED,
            userId: userIdA,
            metadata: { feature: 'flashcards' },
            duration: 15,
          },
          {
            eventType: AnalyticsEventType.FEATURE_ACCESSED,
            userId: userIdA,
            metadata: { feature: 'topics' },
            duration: 5,
          },
        ],
      });

      return request(httpServer)
        .get('/analytics/features')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200)
        .then((res) => {
          expect(res.body.featureCounts).toBeDefined();
          expect(res.body.featureCounts.flashcards).toBe(2);
          expect(res.body.featureCounts.topics).toBe(1);
          expect(res.body.featureDurations.flashcards).toBe(25);
        });
    });
  });

  describe('GET /analytics/engagement (Métricas de Engajamento)', () => {
    it('Deve retornar métricas de engajamento', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      await prisma.analyticsEvent.createMany({
        data: [
          {
            eventType: AnalyticsEventType.STUDY_SESSION_COMPLETED,
            userId: userIdA,
            duration: 30,
            createdAt: today,
          },
          {
            eventType: AnalyticsEventType.STUDY_SESSION_COMPLETED,
            userId: userIdA,
            duration: 25,
            createdAt: yesterday,
          },
        ],
      });

      return request(httpServer)
        .get('/analytics/engagement')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200)
        .then((res) => {
          expect(res.body.activeDays).toBeGreaterThanOrEqual(1);
          expect(res.body.studySessions).toBe(2);
          expect(res.body.totalStudyTime).toBe(55);
          expect(res.body.totalInteractions).toBe(2);
        });
    });
  });
});

