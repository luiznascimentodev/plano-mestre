import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { registerAndLogin, cleanupDatabase } from '../helpers/test-helpers';
import { TopicPriority, StudyStatus } from '@prisma/client';

describe('TopicController Enhanced (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: any;

  let tokenUserA: string;
  let tokenUserB: string;
  let userIdA: number;
  let userIdB: number;

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

    const userA = await registerAndLogin(httpServer, 'usera-topics@plano.com', 'User A');
    tokenUserA = userA.token;
    userIdA = userA.userId;

    const userB = await registerAndLogin(httpServer, 'userb-topics@plano.com', 'User B');
    tokenUserB = userB.token;
    userIdB = userB.userId;
  });

  afterAll(async () => {
    await cleanupDatabase(prisma);
    await app.close();
  });

  describe('POST /topics (Criar)', () => {
    it('Deve criar tópico com todos os campos opcionais', () => {
      return request(httpServer)
        .post('/topics')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          name: 'Tópico Completo',
          category: 'Programação',
          priority: TopicPriority.HIGH,
          description: 'Descrição detalhada',
          tags: 'typescript, nestjs, backend',
          color: '#4F46E5',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .expect(201)
        .then((res) => {
          expect(res.body.name).toBe('Tópico Completo');
          expect(res.body.category).toBe('Programação');
          expect(res.body.priority).toBe(TopicPriority.HIGH);
          expect(res.body.tags).toBe('typescript, nestjs, backend');
          expect(res.body.color).toBe('#4F46E5');
        });
    });

    it('Deve criar tópico apenas com nome (mínimo)', () => {
      return request(httpServer)
        .post('/topics')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ name: 'Tópico Simples' })
        .expect(201)
        .then((res) => {
          expect(res.body.name).toBe('Tópico Simples');
          expect(res.body.status).toBe(StudyStatus.NOT_STARTED);
        });
    });
  });

  describe('PATCH /topics/:id (Atualizar)', () => {
    it('Deve atualizar um tópico com sucesso', async () => {
      const topic = await prisma.topic.create({
        data: {
          name: 'Tópico Original',
          userId: userIdA,
        },
      });

      return request(httpServer)
        .patch(`/topics/${topic.id}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          name: 'Tópico Atualizado',
          status: StudyStatus.IN_PROGRESS,
          priority: TopicPriority.HIGH,
        })
        .expect(200)
        .then((res) => {
          expect(res.body.name).toBe('Tópico Atualizado');
          expect(res.body.status).toBe(StudyStatus.IN_PROGRESS);
          expect(res.body.priority).toBe(TopicPriority.HIGH);
        });
    });

    it('Deve falhar (403) se o usuário não for o dono', async () => {
      const topic = await prisma.topic.create({
        data: {
          name: 'Tópico User B',
          userId: userIdB,
        },
      });

      return request(httpServer)
        .patch(`/topics/${topic.id}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ name: 'Hacked' })
        .expect(403);
    });

    it('Deve falhar (404) se o tópico não existir', () => {
      return request(httpServer)
        .patch('/topics/99999')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ name: 'Test' })
        .expect(404);
    });
  });

  describe('DELETE /topics/:id (Deletar)', () => {
    it('Deve deletar um tópico com sucesso', async () => {
      const topic = await prisma.topic.create({
        data: {
          name: 'Tópico para Deletar',
          userId: userIdA,
        },
      });

      await request(httpServer)
        .delete(`/topics/${topic.id}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200);

      const deleted = await prisma.topic.findUnique({
        where: { id: topic.id },
      });
      expect(deleted).toBeNull();
    });

    it('Deve falhar (403) se o usuário não for o dono', async () => {
      const topic = await prisma.topic.create({
        data: {
          name: 'Tópico User B',
          userId: userIdB,
        },
      });

      return request(httpServer)
        .delete(`/topics/${topic.id}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(403);
    });
  });
});

