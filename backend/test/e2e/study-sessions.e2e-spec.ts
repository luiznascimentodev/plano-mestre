// /backend/test/study-sessions.e2e-spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { StudyStatus } from '@prisma/client';

describe('StudySessionController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: any;

  // Tokens e IDs dos usuários de teste
  let tokenUserA: string;
  let tokenUserB: string;
  let userIdA: number;
  let userIdB: number;

  // IDs dos Tópicos de teste
  let topicA_id: number; // Tópico do User A (em NOT_STARTED)
  let topicB_id: number; // Tópico do User B

  // --- FUNÇÃO HELPER: Registrar e Logar ---
  // (Poderíamos movê-la para um arquivo 'test-utils' no futuro)
  const registerAndLogin = async (email: string, name: string) => {
    const regRes = await request(httpServer).post('/auth/register').send({
      name: name,
      email: email,
      password: 'password123',
    });
    const userId = regRes.body.id;
    const loginRes = await request(httpServer).post('/auth/login').send({
      email: email,
      password: 'password123',
    });
    const token = loginRes.body.access_token;
    return { token, userId };
  };

  // --- SETUP DA APLICAÇÃO (Antes de todos os testes) ---
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

    // --- Limpar o banco ANTES de começar ---
    // Ordem de deleção: dependentes primeiro
    await prisma.studySession.deleteMany();
    await prisma.topic.deleteMany();
    await prisma.user.deleteMany();

    // --- Criar usuários de teste A e B ---
    const userA = await registerAndLogin('usera-session@plano.com', 'User A');
    tokenUserA = userA.token;
    userIdA = userA.userId;

    const userB = await registerAndLogin('userb-session@plano.com', 'User B');
    tokenUserB = userB.token;
    userIdB = userB.userId;

    // --- Criar Tópicos para os testes ---
    // User A cria um tópico que usaremos para o teste de sucesso
    const topicA = await prisma.topic.create({
      data: {
        name: 'Tópico A (Sessão)',
        userId: userIdA,
        status: StudyStatus.NOT_STARTED, // Importante!
      },
    });
    topicA_id = topicA.id;

    // User B cria um tópico que usaremos para o teste de segurança (403)
    const topicB = await prisma.topic.create({
      data: {
        name: 'Tópico B (Sessão)',
        userId: userIdB,
      },
    });
    topicB_id = topicB.id;
  });

  // --- LIMPAR O BANCO (Depois de todos os testes) ---
  afterAll(async () => {
    await prisma.studySession.deleteMany();
    await prisma.topic.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  // --- LIMPAR SÓ AS SESSÕES (Antes de CADA teste 'it()') ---
  beforeEach(async () => {
    await prisma.studySession.deleteMany();

    // Resetar o status do Tópico A para NOT_STARTED
    await prisma.topic.update({
      where: { id: topicA_id },
      data: { status: StudyStatus.NOT_STARTED },
    });
  });

  // --- NOSSOS TESTES ---

  it('POST /study-sessions -> Deve falhar (401) se não estiver autenticado', () => {
    return request(httpServer)
      .post('/study-sessions')
      .send({ duration: 25, topicId: topicA_id })
      .expect(401);
  });

  it('POST /study-sessions -> Deve falhar (400) se o "topicId" estiver faltando', () => {
    return request(httpServer)
      .post('/study-sessions')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ duration: 25 }) // Sem topicId
      .expect(400); // Erro de validação do DTO
  });

  it('POST /study-sessions -> Deve falhar (400) se "duration" for inválida', () => {
    return request(httpServer)
      .post('/study-sessions')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ duration: -10, topicId: topicA_id }) // Duração negativa
      .expect(400);
  });

  // TESTE DE SEGURANÇA CRÍTICO
  it('POST /study-sessions -> Deve falhar (403 Forbidden) se o Tópico pertencer a outro usuário', () => {
    return request(httpServer)
      .post('/study-sessions')
      .set('Authorization', `Bearer ${tokenUserA}`) // Logado como User A
      .send({ duration: 25, topicId: topicB_id }) // Tentando salvar no Tópico B
      .expect(403); // Prova que nossa segurança no 'create' service funciona
  });

  // TESTE DE SUCESSO E TRANSAÇÃO
  it('POST /study-sessions -> Deve criar a sessão E atualizar o Tópico (201)', async () => {
    // 1. Antes, confirme que o Tópico A está NOT_STARTED
    const topicBefore = await prisma.topic.findUnique({
      where: { id: topicA_id },
    });
    expect(topicBefore).not.toBeNull();
    expect(topicBefore!.status).toEqual(StudyStatus.NOT_STARTED);

    // 2. Execute a requisição
    const res = await request(httpServer)
      .post('/study-sessions')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ duration: 25, topicId: topicA_id })
      .expect(201); // Espera "Created"

    // 3. Verifique a resposta da API
    expect(res.body.duration).toBe(25);
    expect(res.body.topicId).toBe(topicA_id);
    expect(res.body.userId).toBe(userIdA);

    // 4. Verifique a Transação: O Tópico foi atualizado?
    // (Esta é a prova de que a Ação 2 da transação funcionou)
    const topicAfter = await prisma.topic.findUnique({
      where: { id: topicA_id },
    });
    expect(topicAfter).not.toBeNull();
    expect(topicAfter!.status).toEqual(StudyStatus.IN_PROGRESS);
  });
});
