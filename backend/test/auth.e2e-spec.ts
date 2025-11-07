import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let httpServer: any;

  // --- DADOS DE TESTE ---
  const testUser = {
    name: 'Usuário E2E',
    email: 'e2e@plano.com',
    password: 'password123',
  };

  // --- SETUP DA APLICAÇÃO ANTES DE TUDO ---
  beforeAll(async () => {
    // 1. Compila a aplicação em um ambiente de teste
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // 2. Importante: Aplicar os mesmos 'pipes' (validação) da aplicação real
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // 3. Pegar o serviço do Prisma para limpar o banco
    prisma = app.get(PrismaService);

    // 4. Iniciar a aplicação
    await app.init();
    httpServer = app.getHttpServer();
  });

  // --- LIMPAR O BANCO ANTES DE CADA TESTE ---
  beforeEach(async () => {
    // Garante que cada teste 'it()' comece com o banco limpo
    await prisma.user.deleteMany();
  });

  // --- FECHAR A APLICAÇÃO DEPOIS DE TUDO ---
  afterAll(async () => {
    await prisma.user.deleteMany(); // Limpa o banco após os testes
    await app.close();
  });

  // --- NOSSOS TESTES ---

  it('POST /auth/register -> Deve registrar um novo usuário (201)', () => {
    return request(httpServer)
      .post('/auth/register')
      .send(testUser) // Envia o body
      .expect(201) // Espera o status code
      .then((res) => {
        // Verifica se a resposta está correta
        expect(res.body.email).toEqual(testUser.email);
        expect(res.body.name).toEqual(testUser.name);
        expect(res.body.password).toBeUndefined(); // Confirma que a senha NÃO foi retornada
      });
  });

  it('POST /auth/register -> Deve falhar se o e-mail já existe (409)', async () => {
    // 1. Cria o usuário primeiro
    await request(httpServer).post('/auth/register').send(testUser);

    // 2. Tenta criar de novo com o mesmo e-mail
    return request(httpServer)
      .post('/auth/register')
      .send(testUser)
      .expect(409) // Espera um Conflito
      .then((res) => {
        expect(res.body.message).toEqual('Este e-mail já está em uso.');
      });
  });

  it('POST /auth/login -> Deve logar um usuário e retornar um token (200)', async () => {
    // 1. Registra o usuário
    await request(httpServer).post('/auth/register').send(testUser);

    // 2. Tenta logar
    return request(httpServer)
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200)
      .then((res) => {
        expect(res.body.access_token).toBeDefined(); // Verifica se o token foi retornado
        expect(res.body.user.email).toEqual(testUser.email);
      });
  });

  it('GET /perfil -> Deve falhar ao acessar rota protegida sem token (401)', () => {
    return request(httpServer).get('/perfil').expect(401);
  });

  it('GET /perfil -> Deve acessar a rota protegida com um token válido (200)', async () => {
    await request(httpServer).post('/auth/register').send(testUser).expect(201);

    const loginRes = await request(httpServer)
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    const token = loginRes.body.access_token;
    expect(token).toBeDefined();

    return request(httpServer)
      .get('/perfil')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .then((res) => {
        expect(res.body.email).toEqual(testUser.email);
      });
  });
});
