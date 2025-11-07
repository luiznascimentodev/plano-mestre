// /backend/test/topics.e2e-spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('TopicController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: any;

  let tokenUserA: string;
  let tokenUserB: string;

  let userIdA: number;
  let userIdB: number;

  const registerAndLogin = async (email: string, name: string) => {
    const regRes = await request(httpServer).post('/auth/register').send({
      name: name,
      email: email,
      password: 'password123',
    });

    if (regRes.status !== 201) {
      console.error('Register failed:', regRes.status, regRes.body);
      throw new Error(`Register failed with status ${regRes.status}`);
    }

    const userId = regRes.body.id;

    const loginRes = await request(httpServer).post('/auth/login').send({
      email: email,
      password: 'password123',
    });

    if (loginRes.status !== 200) {
      console.error('Login failed:', loginRes.status, loginRes.body);
      throw new Error(`Login failed with status ${loginRes.status}`);
    }

    const token = loginRes.body.access_token;

    return { token, userId };
  };

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
    await prisma.topic.deleteMany();
    await prisma.user.deleteMany();

    const userA = await registerAndLogin('usera@plano.com', 'User A');
    tokenUserA = userA.token;
    userIdA = userA.userId;

    const userB = await registerAndLogin('userb@plano.com', 'User B');
    tokenUserB = userB.token;
    userIdB = userB.userId;
  });

  afterAll(async () => {
    await prisma.topic.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('[Guards] Proteção de Rotas', () => {
    it('GET /topics -> Deve falhar (401) se não estiver autenticado', () => {
      return request(httpServer).get('/topics').expect(401);
    });

    it('POST /topics -> Deve falhar (401) se não estiver autenticado', () => {
      return request(httpServer)
        .post('/topics')
        .send({ name: 'Tópico de Teste' })
        .expect(401);
    });
  });

  // --- TESTES DE CRIAÇÃO (POST) ---
  describe('POST /topics (Criar)', () => {
    it('Deve criar um tópico com sucesso (201)', () => {
      return request(httpServer)
        .post('/topics')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ name: 'Meu primeiro tópico' })
        .expect(201)
        .then((res) => {
          expect(res.body.name).toEqual('Meu primeiro tópico');
          expect(res.body.status).toEqual('NOT_STARTED');
          expect(res.body.userId).toEqual(userIdA);
        });
    });

    it('Deve falhar (400) se o "name" estiver vazio (Validação DTO)', () => {
      return request(httpServer)
        .post('/topics')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ name: '' })
        .expect(400);
    });
  });

  // --- TESTES DE SEGURANÇA (MULTILOCAÇÃO) ---
  describe('GET /topics (Listar) e GET /topics/:id (Detalhe)', () => {
    it('GET /topics -> Deve retornar APENAS os tópicos do usuário logado', async () => {
      await prisma.topic.create({
        data: { name: 'Tópico do User A', userId: userIdA },
      });

      await prisma.topic.create({
        data: { name: 'Tópico do User B', userId: userIdB },
      });

      return request(httpServer)
        .get('/topics')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200)
        .then((res) => {
          expect(res.body).toBeInstanceOf(Array);
          expect(res.body.length).toBe(1);
          expect(res.body[0].name).toEqual('Tópico do User A');
          expect(res.body[0].userId).toEqual(userIdA);
        });
    });

    it('GET /topics/:id -> Deve retornar o tópico se o usuário for o dono', async () => {
      const topicA = await prisma.topic.create({
        data: { name: 'Tópico do User A', userId: userIdA },
      });

      return request(httpServer)
        .get(`/topics/${topicA.id}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(200)
        .then((res) => {
          expect(res.body.name).toEqual('Tópico do User A');
        });
    });

    it('GET /topics/:id -> Deve falhar (403 Forbidden) se o usuário NÃO for o dono', async () => {
      const topicB = await prisma.topic.create({
        data: { name: 'Tópico do User B', userId: userIdB },
      });

      return request(httpServer)
        .get(`/topics/${topicB.id}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(403);
    });

    it('GET /topics/:id -> Deve falhar (404 Not Found) se o tópico não existir', () => {
      const idInexistente = 99999;
      return request(httpServer)
        .get(`/topics/${idInexistente}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .expect(404);
    });
  });
});
