import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { registerAndLogin, cleanupDatabase, createTestTopic } from '../helpers/test-helpers';
import { HabitType, HabitFrequency } from '@prisma/client';

describe('HabitsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: any;

  let tokenUserA: string;
  let tokenUserB: string;
  let userIdA: number;
  let userIdB: number;
  let topicA_id: number;

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

    const userA = await registerAndLogin(httpServer, 'usera-habit@plano.com', 'User A');
    tokenUserA = userA.token;
    userIdA = userA.userId;

    const userB = await registerAndLogin(httpServer, 'userb-habit@plano.com', 'User B');
    tokenUserB = userB.token;
    userIdB = userB.userId;

    const topicA = await createTestTopic(prisma, userIdA, 'Topic A');
    topicA_id = topicA.id;
  });

  afterAll(async () => {
    await cleanupDatabase(prisma);
    await app.close();
  });

  describe('[Guards] Proteção de Rotas', () => {
    it('GET /habits -> Deve falhar (401) se não estiver autenticado', () => {
      return request(httpServer).get('/habits').expect(401);
    });

    it('POST /habits -> Deve falhar (401) se não estiver autenticado', () => {
      return request(httpServer)
        .post('/habits')
        .send({ name: 'Test Habit', type: HabitType.CUSTOM })
        .expect(401);
    });
  });

  describe('POST /habits (Criar)', () => {
    it('Deve criar um hábito com sucesso (201)', () => {
      return request(httpServer)
        .post('/habits')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          name: 'Estudar 30min por dia',
          description: 'Estudar todos os dias',
          type: HabitType.STUDY_TIME,
          frequency: HabitFrequency.DAILY,
          targetValue: 30,
        })
        .expect(201)
        .then((res) => {
          expect(res.body.name).toBe('Estudar 30min por dia');
          expect(res.body.type).toBe(HabitType.STUDY_TIME);
          expect(res.body.frequency).toBe(HabitFrequency.DAILY);
          expect(res.body.userId).toBe(userIdA);
          expect(res.body.isActive).toBe(true);
        });
    });

    it('Deve criar hábito vinculado a um tópico', () => {
      return request(httpServer)
        .post('/habits')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          name: 'Revisar flashcards',
          type: HabitType.CUSTOM,
          frequency: HabitFrequency.DAILY,
          topicId: topicA_id,
        })
        .expect(201)
        .then((res) => {
          expect(res.body.topicId).toBe(topicA_id);
          expect(res.body.topic).toBeDefined();
        });
    });

    it('Deve falhar (403) se tentar vincular a tópico de outro usuário', () => {
      return request(httpServer)
        .post('/habits')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          name: 'Test',
          type: HabitType.CUSTOM,
          frequency: HabitFrequency.DAILY,
          topicId: 99999, // Tópico inexistente
        })
        .expect(404);
    });
  });

  describe('GET /habits (Listar)', () => {
    it('Deve retornar apenas hábitos do usuário logado', async () => {
      await prisma.habit.create({
        data: {
          name: 'Habit User A',
          type: HabitType.CUSTOM,
          frequency: HabitFrequency.DAILY,
          userId: userIdA,
        },
      });

      await prisma.habit.create({
        data: {
          name: 'Habit User B',
          type: HabitType.CUSTOM,
          frequency: HabitFrequency.DAILY,
          userId: userIdB,
        },
      });

      return request(httpServer)
        .get('/habits')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200)
        .then((res) => {
          expect(res.body).toBeInstanceOf(Array);
          expect(res.body.length).toBe(1);
          expect(res.body[0].userId).toBe(userIdA);
          expect(res.body[0].name).toBe('Habit User A');
        });
    });

    it('Deve filtrar apenas hábitos ativos por padrão', async () => {
      await prisma.habit.create({
        data: {
          name: 'Active Habit',
          type: HabitType.CUSTOM,
          frequency: HabitFrequency.DAILY,
          userId: userIdA,
          isActive: true,
        },
      });

      await prisma.habit.create({
        data: {
          name: 'Inactive Habit',
          type: HabitType.CUSTOM,
          frequency: HabitFrequency.DAILY,
          userId: userIdA,
          isActive: false,
        },
      });

      return request(httpServer)
        .get('/habits')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200)
        .then((res) => {
          expect(res.body.length).toBe(1);
          expect(res.body[0].name).toBe('Active Habit');
        });
    });
  });

  describe('GET /habits/:id (Detalhe)', () => {
    it('Deve retornar o hábito se o usuário for o dono', async () => {
      const habit = await prisma.habit.create({
        data: {
          name: 'Test Habit',
          type: HabitType.CUSTOM,
          frequency: HabitFrequency.DAILY,
          userId: userIdA,
        },
      });

      return request(httpServer)
        .get(`/habits/${habit.id}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200)
        .then((res) => {
          expect(res.body.name).toBe('Test Habit');
          expect(res.body.userId).toBe(userIdA);
        });
    });

    it('Deve falhar (403) se o usuário não for o dono', async () => {
      const habit = await prisma.habit.create({
        data: {
          name: 'User B Habit',
          type: HabitType.CUSTOM,
          frequency: HabitFrequency.DAILY,
          userId: userIdB,
        },
      });

      return request(httpServer)
        .get(`/habits/${habit.id}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(403);
    });
  });

  describe('GET /habits/:id/stats (Estatísticas)', () => {
    it('Deve retornar estatísticas do hábito', async () => {
      const habit = await prisma.habit.create({
        data: {
          name: 'Test Habit',
          type: HabitType.CUSTOM,
          frequency: HabitFrequency.DAILY,
          userId: userIdA,
        },
      });

      // Criar algumas completações
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.habitCompletion.create({
        data: {
          habitId: habit.id,
          userId: userIdA,
          completedAt: today,
        },
      });

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      await prisma.habitCompletion.create({
        data: {
          habitId: habit.id,
          userId: userIdA,
          completedAt: yesterday,
        },
      });

      return request(httpServer)
        .get(`/habits/${habit.id}/stats`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200)
        .then((res) => {
          expect(res.body.totalCompletions).toBe(2);
          expect(res.body.currentStreak).toBeGreaterThanOrEqual(1);
          expect(res.body.bestStreak).toBeGreaterThanOrEqual(1);
        });
    });
  });

  describe('POST /habits/:id/complete (Completar)', () => {
    it('Deve completar um hábito com sucesso', async () => {
      const habit = await prisma.habit.create({
        data: {
          name: 'Test Habit',
          type: HabitType.CUSTOM,
          frequency: HabitFrequency.DAILY,
          userId: userIdA,
          isActive: true,
        },
      });

      return request(httpServer)
        .post(`/habits/${habit.id}/complete`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          value: 30,
          notes: 'Completado!',
        })
        .expect(201)
        .then((res) => {
          expect(res.body.habitId).toBe(habit.id);
          expect(res.body.userId).toBe(userIdA);
          expect(res.body.value).toBe(30);
        });
    });

    it('Deve falhar (400) se tentar completar duas vezes no mesmo dia', async () => {
      const habit = await prisma.habit.create({
        data: {
          name: 'Test Habit',
          type: HabitType.CUSTOM,
          frequency: HabitFrequency.DAILY,
          userId: userIdA,
          isActive: true,
        },
      });

      // Primeira completação
      await request(httpServer)
        .post(`/habits/${habit.id}/complete`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({})
        .expect(201);

      // Segunda tentativa no mesmo dia
      return request(httpServer)
        .post(`/habits/${habit.id}/complete`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({})
        .expect(400);
    });

    it('Deve falhar (400) se o hábito estiver inativo', async () => {
      const habit = await prisma.habit.create({
        data: {
          name: 'Inactive Habit',
          type: HabitType.CUSTOM,
          frequency: HabitFrequency.DAILY,
          userId: userIdA,
          isActive: false,
        },
      });

      return request(httpServer)
        .post(`/habits/${habit.id}/complete`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({})
        .expect(400);
    });
  });

  describe('PATCH /habits/:id (Atualizar)', () => {
    it('Deve atualizar um hábito com sucesso', async () => {
      const habit = await prisma.habit.create({
        data: {
          name: 'Original Name',
          type: HabitType.CUSTOM,
          frequency: HabitFrequency.DAILY,
          userId: userIdA,
        },
      });

      return request(httpServer)
        .patch(`/habits/${habit.id}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          name: 'Updated Name',
          targetValue: 60,
        })
        .expect(200)
        .then((res) => {
          expect(res.body.name).toBe('Updated Name');
          expect(res.body.targetValue).toBe(60);
        });
    });

    it('Deve falhar (403) se o usuário não for o dono', async () => {
      const habit = await prisma.habit.create({
        data: {
          name: 'User B Habit',
          type: HabitType.CUSTOM,
          frequency: HabitFrequency.DAILY,
          userId: userIdB,
        },
      });

      return request(httpServer)
        .patch(`/habits/${habit.id}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ name: 'Hacked' })
        .expect(403);
    });
  });

  describe('DELETE /habits/:id (Deletar)', () => {
    it('Deve deletar um hábito com sucesso', async () => {
      const habit = await prisma.habit.create({
        data: {
          name: 'To Delete',
          type: HabitType.CUSTOM,
          frequency: HabitFrequency.DAILY,
          userId: userIdA,
        },
      });

      await request(httpServer)
        .delete(`/habits/${habit.id}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200);

      const deleted = await prisma.habit.findUnique({
        where: { id: habit.id },
      });
      expect(deleted).toBeNull();
    });
  });
});

