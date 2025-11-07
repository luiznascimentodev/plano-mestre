import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { registerAndLogin, cleanupDatabase, createTestTopic } from '../helpers/test-helpers';
import { StudyStatus } from '@prisma/client';

describe('StudySessionsController Enhanced (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: any;

  let tokenUserA: string;
  let tokenUserB: string;
  let userIdA: number;
  let userIdB: number;
  let topicA_id: number;
  let topicB_id: number;

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

    const userA = await registerAndLogin(httpServer, 'usera-session@plano.com', 'User A');
    tokenUserA = userA.token;
    userIdA = userA.userId;

    const userB = await registerAndLogin(httpServer, 'userb-session@plano.com', 'User B');
    tokenUserB = userB.token;
    userIdB = userB.userId;

    const topicA = await createTestTopic(prisma, userIdA, 'Topic A', StudyStatus.NOT_STARTED);
    topicA_id = topicA.id;

    const topicB = await createTestTopic(prisma, userIdB, 'Topic B');
    topicB_id = topicB.id;
  });

  afterAll(async () => {
    await cleanupDatabase(prisma);
    await app.close();
  });

  describe('GET /study-sessions (Listar)', () => {
    it('Deve retornar apenas sessões do usuário logado', async () => {
      await prisma.studySession.create({
        data: {
          duration: 25,
          userId: userIdA,
          topicId: topicA_id,
        },
      });

      await prisma.studySession.create({
        data: {
          duration: 30,
          userId: userIdB,
          topicId: topicB_id,
        },
      });

      return request(httpServer)
        .get('/study-sessions')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200)
        .then((res) => {
          expect(res.body).toBeInstanceOf(Array);
          expect(res.body.length).toBe(1);
          expect(res.body[0].userId).toBe(userIdA);
          expect(res.body[0].topic).toBeDefined();
        });
    });
  });

  describe('GET /study-sessions/stats/daily (Estatísticas Diárias)', () => {
    it('Deve retornar estatísticas do dia atual', async () => {
      const today = new Date();
      today.setHours(14, 0, 0, 0);

      await prisma.studySession.createMany({
        data: [
          {
            duration: 25,
            userId: userIdA,
            topicId: topicA_id,
            completedAt: today,
          },
          {
            duration: 30,
            userId: userIdA,
            topicId: topicA_id,
            completedAt: today,
          },
        ],
      });

      return request(httpServer)
        .get('/study-sessions/stats/daily')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200)
        .then((res) => {
          expect(res.body.totalMinutes).toBe(55);
          expect(res.body.sessionCount).toBe(2);
          expect(res.body.topicsStudied).toBe(1);
          expect(res.body.byTopic).toBeInstanceOf(Array);
        });
    });
  });

  describe('GET /study-sessions/stats/weekly (Estatísticas Semanais)', () => {
    it('Deve retornar estatísticas dos últimos 7 dias', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      await prisma.studySession.createMany({
        data: [
          {
            duration: 25,
            userId: userIdA,
            topicId: topicA_id,
            completedAt: today,
          },
          {
            duration: 30,
            userId: userIdA,
            topicId: topicA_id,
            completedAt: yesterday,
          },
        ],
      });

      return request(httpServer)
        .get('/study-sessions/stats/weekly')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200)
        .then((res) => {
          expect(res.body).toBeInstanceOf(Array);
          expect(res.body.length).toBe(7);
        });
    });
  });
});

