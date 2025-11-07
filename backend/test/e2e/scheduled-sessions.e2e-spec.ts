import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { registerAndLogin, cleanupDatabase, createTestTopic } from '../helpers/test-helpers';

describe('ScheduledSessionsController (e2e)', () => {
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

    const userA = await registerAndLogin(httpServer, 'usera-sched@plano.com', 'User A');
    tokenUserA = userA.token;
    userIdA = userA.userId;

    const userB = await registerAndLogin(httpServer, 'userb-sched@plano.com', 'User B');
    tokenUserB = userB.token;
    userIdB = userB.userId;

    const topicA = await createTestTopic(prisma, userIdA, 'Topic A');
    topicA_id = topicA.id;

    const topicB = await createTestTopic(prisma, userIdB, 'Topic B');
    topicB_id = topicB.id;
  });

  afterAll(async () => {
    await cleanupDatabase(prisma);
    await app.close();
  });

  describe('[Guards] Proteção de Rotas', () => {
    it('GET /scheduled-sessions -> Deve falhar (401) se não estiver autenticado', () => {
      return request(httpServer).get('/scheduled-sessions').expect(401);
    });

    it('POST /scheduled-sessions -> Deve falhar (401) se não estiver autenticado', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      return request(httpServer)
        .post('/scheduled-sessions')
        .send({
          topicId: topicA_id,
          scheduledAt: tomorrow.toISOString(),
          duration: 25,
        })
        .expect(401);
    });
  });

  describe('POST /scheduled-sessions (Criar)', () => {
    it('Deve criar uma sessão agendada com sucesso (201)', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);

      return request(httpServer)
        .post('/scheduled-sessions')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          topicId: topicA_id,
          scheduledAt: tomorrow.toISOString(),
          duration: 25,
          notes: 'Revisão de algoritmos',
        })
        .expect(201)
        .then((res) => {
          expect(res.body.topicId).toBe(topicA_id);
          expect(res.body.duration).toBe(25);
          expect(res.body.userId).toBe(userIdA);
          expect(res.body.isCompleted).toBe(false);
          expect(res.body.notes).toBe('Revisão de algoritmos');
        });
    });

    it('Deve falhar (403) se tentar agendar em tópico de outro usuário', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      return request(httpServer)
        .post('/scheduled-sessions')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          topicId: topicB_id,
          scheduledAt: tomorrow.toISOString(),
          duration: 25,
        })
        .expect(403);
    });

    it('Deve falhar (400) se campos obrigatórios estiverem faltando', () => {
      return request(httpServer)
        .post('/scheduled-sessions')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          topicId: topicA_id,
          // scheduledAt faltando
          duration: 25,
        })
        .expect(400);
    });
  });

  describe('GET /scheduled-sessions (Listar)', () => {
    it('Deve retornar apenas sessões agendadas do usuário', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await prisma.scheduledSession.create({
        data: {
          topicId: topicA_id,
          userId: userIdA,
          scheduledAt: tomorrow,
          duration: 25,
        },
      });

      await prisma.scheduledSession.create({
        data: {
          topicId: topicB_id,
          userId: userIdB,
          scheduledAt: tomorrow,
          duration: 30,
        },
      });

      return request(httpServer)
        .get('/scheduled-sessions')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200)
        .then((res) => {
          expect(res.body).toBeInstanceOf(Array);
          expect(res.body.length).toBe(1);
          expect(res.body[0].userId).toBe(userIdA);
        });
    });

    it('Deve filtrar por data quando fornecida', async () => {
      const today = new Date();
      today.setHours(14, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      await prisma.scheduledSession.create({
        data: {
          topicId: topicA_id,
          userId: userIdA,
          scheduledAt: today,
          duration: 25,
        },
      });

      await prisma.scheduledSession.create({
        data: {
          topicId: topicA_id,
          userId: userIdA,
          scheduledAt: tomorrow,
          duration: 30,
        },
      });

      const todayStr = today.toISOString().split('T')[0];

      return request(httpServer)
        .get(`/scheduled-sessions?date=${todayStr}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200)
        .then((res) => {
          expect(res.body.length).toBe(1);
          expect(new Date(res.body[0].scheduledAt).toISOString().split('T')[0]).toBe(todayStr);
        });
    });

    it('Deve filtrar apenas não completadas por padrão', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await prisma.scheduledSession.create({
        data: {
          topicId: topicA_id,
          userId: userIdA,
          scheduledAt: tomorrow,
          duration: 25,
          isCompleted: false,
        },
      });

      await prisma.scheduledSession.create({
        data: {
          topicId: topicA_id,
          userId: userIdA,
          scheduledAt: tomorrow,
          duration: 30,
          isCompleted: true,
        },
      });

      return request(httpServer)
        .get('/scheduled-sessions')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200)
        .then((res) => {
          expect(res.body.length).toBe(1);
          expect(res.body[0].isCompleted).toBe(false);
        });
    });
  });

  describe('PATCH /scheduled-sessions/:id (Atualizar)', () => {
    it('Deve atualizar uma sessão agendada com sucesso', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const session = await prisma.scheduledSession.create({
        data: {
          topicId: topicA_id,
          userId: userIdA,
          scheduledAt: tomorrow,
          duration: 25,
        },
      });

      const newDate = new Date(tomorrow);
      newDate.setDate(newDate.getDate() + 2);

      return request(httpServer)
        .patch(`/scheduled-sessions/${session.id}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          scheduledAt: newDate.toISOString(),
          duration: 30,
          notes: 'Atualizado',
        })
        .expect(200)
        .then((res) => {
          expect(res.body.duration).toBe(30);
          expect(res.body.notes).toBe('Atualizado');
        });
    });

    it('Deve falhar (403) se o usuário não for o dono', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const session = await prisma.scheduledSession.create({
        data: {
          topicId: topicB_id,
          userId: userIdB,
          scheduledAt: tomorrow,
          duration: 25,
        },
      });

      return request(httpServer)
        .patch(`/scheduled-sessions/${session.id}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ duration: 60 })
        .expect(403);
    });
  });

  describe('PATCH /scheduled-sessions/:id/complete (Completar)', () => {
    it('Deve marcar sessão como completada', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const session = await prisma.scheduledSession.create({
        data: {
          topicId: topicA_id,
          userId: userIdA,
          scheduledAt: tomorrow,
          duration: 25,
          isCompleted: false,
        },
      });

      return request(httpServer)
        .patch(`/scheduled-sessions/${session.id}/complete`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200)
        .then((res) => {
          expect(res.body.isCompleted).toBe(true);
        });
    });
  });

  describe('DELETE /scheduled-sessions/:id (Deletar)', () => {
    it('Deve deletar uma sessão agendada com sucesso', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const session = await prisma.scheduledSession.create({
        data: {
          topicId: topicA_id,
          userId: userIdA,
          scheduledAt: tomorrow,
          duration: 25,
        },
      });

      await request(httpServer)
        .delete(`/scheduled-sessions/${session.id}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200);

      const deleted = await prisma.scheduledSession.findUnique({
        where: { id: session.id },
      });
      expect(deleted).toBeNull();
    });
  });
});

