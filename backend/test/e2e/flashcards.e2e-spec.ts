import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { registerAndLogin, cleanupDatabase, createTestTopic } from '../helpers/test-helpers';
import { FlashcardDifficulty } from '@prisma/client';

describe('FlashcardsController (e2e)', () => {
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

    const userA = await registerAndLogin(httpServer, 'usera-flash@plano.com', 'User A');
    tokenUserA = userA.token;
    userIdA = userA.userId;

    const userB = await registerAndLogin(httpServer, 'userb-flash@plano.com', 'User B');
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
    it('GET /flashcards -> Deve falhar (401) se não estiver autenticado', () => {
      return request(httpServer).get('/flashcards').expect(401);
    });

    it('POST /flashcards -> Deve falhar (401) se não estiver autenticado', () => {
      return request(httpServer)
        .post('/flashcards')
        .send({ front: 'Test', back: 'Answer', topicId: topicA_id })
        .expect(401);
    });
  });

  describe('POST /flashcards (Criar)', () => {
    it('Deve criar um flashcard com sucesso (201)', () => {
      return request(httpServer)
        .post('/flashcards')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          front: 'O que é TypeScript?',
          back: 'TypeScript é um superset do JavaScript',
          topicId: topicA_id,
          difficulty: FlashcardDifficulty.MEDIUM,
        })
        .expect(201)
        .then((res) => {
          expect(res.body.front).toBe('O que é TypeScript?');
          expect(res.body.back).toBe('TypeScript é um superset do JavaScript');
          expect(res.body.topicId).toBe(topicA_id);
          expect(res.body.userId).toBe(userIdA);
          expect(res.body.difficulty).toBe(FlashcardDifficulty.MEDIUM);
        });
    });

    it('Deve falhar (400) se campos obrigatórios estiverem faltando', () => {
      return request(httpServer)
        .post('/flashcards')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          front: 'Test',
          // back faltando
          topicId: topicA_id,
        })
        .expect(400);
    });

    it('Deve falhar (403) se tentar criar flashcard em tópico de outro usuário', () => {
      return request(httpServer)
        .post('/flashcards')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          front: 'Test',
          back: 'Answer',
          topicId: topicB_id, // Tópico do User B
        })
        .expect(403);
    });

    it('Deve falhar (404) se o tópico não existir', () => {
      return request(httpServer)
        .post('/flashcards')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          front: 'Test',
          back: 'Answer',
          topicId: 99999,
        })
        .expect(404);
    });
  });

  describe('GET /flashcards (Listar)', () => {
    it('Deve retornar apenas flashcards do usuário logado', async () => {
      // Criar flashcards para User A
      await prisma.flashcard.create({
        data: {
          front: 'Flashcard A1',
          back: 'Answer A1',
          topicId: topicA_id,
          userId: userIdA,
        },
      });

      // Criar flashcards para User B
      await prisma.flashcard.create({
        data: {
          front: 'Flashcard B1',
          back: 'Answer B1',
          topicId: topicB_id,
          userId: userIdB,
        },
      });

      return request(httpServer)
        .get('/flashcards')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200)
        .then((res) => {
          expect(res.body).toBeInstanceOf(Array);
          expect(res.body.length).toBe(1);
          expect(res.body[0].userId).toBe(userIdA);
          expect(res.body[0].front).toBe('Flashcard A1');
        });
    });

    it('Deve filtrar por topicId quando fornecido', async () => {
      const topicA2 = await createTestTopic(prisma, userIdA, 'Topic A2');

      await prisma.flashcard.create({
        data: {
          front: 'Flashcard Topic A',
          back: 'Answer',
          topicId: topicA_id,
          userId: userIdA,
        },
      });

      await prisma.flashcard.create({
        data: {
          front: 'Flashcard Topic A2',
          back: 'Answer',
          topicId: topicA2.id,
          userId: userIdA,
        },
      });

      return request(httpServer)
        .get(`/flashcards?topicId=${topicA_id}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200)
        .then((res) => {
          expect(res.body.length).toBe(1);
          expect(res.body[0].topicId).toBe(topicA_id);
        });
    });
  });

  describe('GET /flashcards/due (Flashcards para revisar)', () => {
    it('Deve retornar flashcards que precisam ser revisados', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await prisma.flashcard.create({
        data: {
          front: 'Due Flashcard',
          back: 'Answer',
          topicId: topicA_id,
          userId: userIdA,
          nextReview: yesterday, // Deve ser revisado
        },
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await prisma.flashcard.create({
        data: {
          front: 'Not Due Flashcard',
          back: 'Answer',
          topicId: topicA_id,
          userId: userIdA,
          nextReview: tomorrow, // Ainda não precisa revisar
        },
      });

      return request(httpServer)
        .get('/flashcards/due')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200)
        .then((res) => {
          expect(res.body.length).toBe(1);
          expect(res.body[0].front).toBe('Due Flashcard');
        });
    });
  });

  describe('GET /flashcards/:id (Detalhe)', () => {
    it('Deve retornar o flashcard se o usuário for o dono', async () => {
      const flashcard = await prisma.flashcard.create({
        data: {
          front: 'Test Flashcard',
          back: 'Answer',
          topicId: topicA_id,
          userId: userIdA,
        },
      });

      return request(httpServer)
        .get(`/flashcards/${flashcard.id}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200)
        .then((res) => {
          expect(res.body.front).toBe('Test Flashcard');
          expect(res.body.userId).toBe(userIdA);
        });
    });

    it('Deve falhar (403) se o usuário não for o dono', async () => {
      const flashcard = await prisma.flashcard.create({
        data: {
          front: 'User B Flashcard',
          back: 'Answer',
          topicId: topicB_id,
          userId: userIdB,
        },
      });

      return request(httpServer)
        .get(`/flashcards/${flashcard.id}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(403);
    });

    it('Deve falhar (404) se o flashcard não existir', () => {
      return request(httpServer)
        .get('/flashcards/99999')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(404);
    });
  });

  describe('PATCH /flashcards/:id (Atualizar)', () => {
    it('Deve atualizar um flashcard com sucesso', async () => {
      const flashcard = await prisma.flashcard.create({
        data: {
          front: 'Original',
          back: 'Original Answer',
          topicId: topicA_id,
          userId: userIdA,
        },
      });

      return request(httpServer)
        .patch(`/flashcards/${flashcard.id}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          front: 'Updated',
          back: 'Updated Answer',
        })
        .expect(200)
        .then((res) => {
          expect(res.body.front).toBe('Updated');
          expect(res.body.back).toBe('Updated Answer');
        });
    });

    it('Deve falhar (403) se o usuário não for o dono', async () => {
      const flashcard = await prisma.flashcard.create({
        data: {
          front: 'User B Flashcard',
          back: 'Answer',
          topicId: topicB_id,
          userId: userIdB,
        },
      });

      return request(httpServer)
        .patch(`/flashcards/${flashcard.id}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ front: 'Hacked' })
        .expect(403);
    });
  });

  describe('POST /flashcards/:id/review (Revisar)', () => {
    it('Deve revisar um flashcard e atualizar próxima revisão', async () => {
      const flashcard = await prisma.flashcard.create({
        data: {
          front: 'Test',
          back: 'Answer',
          topicId: topicA_id,
          userId: userIdA,
          reviewCount: 0,
          nextReview: new Date(),
        },
      });

      return request(httpServer)
        .post(`/flashcards/${flashcard.id}/review`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          difficulty: FlashcardDifficulty.EASY,
        })
        .expect(200)
        .then((res) => {
          expect(res.body.reviewCount).toBe(1);
          expect(res.body.difficulty).toBe(FlashcardDifficulty.EASY);
          expect(new Date(res.body.nextReview).getTime()).toBeGreaterThan(
            new Date().getTime(),
          );
        });
    });

    it('Deve calcular intervalo correto para dificuldade EASY', async () => {
      const flashcard = await prisma.flashcard.create({
        data: {
          front: 'Test',
          back: 'Answer',
          topicId: topicA_id,
          userId: userIdA,
          reviewCount: 0,
        },
      });

      const res = await request(httpServer)
        .post(`/flashcards/${flashcard.id}/review`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ difficulty: FlashcardDifficulty.EASY })
        .expect(200);

      // Primeira revisão EASY deve ser em 1 dia
      const nextReview = new Date(res.body.nextReview);
      const today = new Date();
      const diffDays = Math.floor(
        (nextReview.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      expect(diffDays).toBe(1);
    });
  });

  describe('DELETE /flashcards/:id (Deletar)', () => {
    it('Deve deletar um flashcard com sucesso', async () => {
      const flashcard = await prisma.flashcard.create({
        data: {
          front: 'To Delete',
          back: 'Answer',
          topicId: topicA_id,
          userId: userIdA,
        },
      });

      await request(httpServer)
        .delete(`/flashcards/${flashcard.id}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200);

      // Verificar que foi deletado
      const deleted = await prisma.flashcard.findUnique({
        where: { id: flashcard.id },
      });
      expect(deleted).toBeNull();
    });

    it('Deve falhar (403) se o usuário não for o dono', async () => {
      const flashcard = await prisma.flashcard.create({
        data: {
          front: 'User B Flashcard',
          back: 'Answer',
          topicId: topicB_id,
          userId: userIdB,
        },
      });

      return request(httpServer)
        .delete(`/flashcards/${flashcard.id}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(403);
    });
  });
});

