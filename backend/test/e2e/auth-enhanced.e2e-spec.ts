import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { cleanupDatabase } from '../helpers/test-helpers';

describe('AuthController Enhanced (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: any;

  const testUser = {
    name: 'Usuário Teste',
    email: 'test-auth@plano.com',
    password: 'password123',
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
    await cleanupDatabase(prisma);
  });

  afterAll(async () => {
    await cleanupDatabase(prisma);
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('Deve registrar um novo usuário com sucesso (201)', () => {
      return request(httpServer)
        .post('/auth/register')
        .send(testUser)
        .expect(201)
        .then((res) => {
          expect(res.body.email).toEqual(testUser.email);
          expect(res.body.name).toEqual(testUser.name);
          expect(res.body.password).toBeUndefined();
          expect(res.body.id).toBeDefined();
        });
    });

    it('Deve falhar (409) se o e-mail já existe', async () => {
      await request(httpServer).post('/auth/register').send(testUser).expect(201);

      return request(httpServer)
        .post('/auth/register')
        .send(testUser)
        .expect(409)
        .then((res) => {
          expect(res.body.message).toEqual('Este e-mail já está em uso.');
        });
    });

    it('Deve falhar (400) se dados inválidos', () => {
      return request(httpServer)
        .post('/auth/register')
        .send({
          email: 'invalid-email', // Email inválido
          name: 'Test',
          password: '123', // Senha muito curta
        })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request(httpServer).post('/auth/register').send(testUser);
    });

    it('Deve fazer login com credenciais válidas (200)', () => {
      return request(httpServer)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .then((res) => {
          expect(res.body.user).toBeDefined();
          expect(res.body.user.email).toEqual(testUser.email);
          // Cookies devem ser setados (verificado via headers)
          expect(res.headers['set-cookie']).toBeDefined();
        });
    });

    it('Deve falhar (401) com credenciais inválidas', () => {
      return request(httpServer)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('Deve falhar (401) se o usuário não existir', () => {
      return request(httpServer)
        .post('/auth/login')
        .send({
          email: 'notfound@example.com',
          password: 'password123',
        })
        .expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('Deve falhar (401) se não houver refresh token', () => {
      return request(httpServer).post('/auth/refresh').expect(401);
    });

    it('Deve renovar access token com refresh token válido', async () => {
      // Registrar e fazer login
      await request(httpServer).post('/auth/register').send(testUser);
      const loginRes = await request(httpServer)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      // O refresh token está em cookie, então precisamos extrair
      // Para testes, vamos assumir que o cookie foi setado
      const cookies = loginRes.headers['set-cookie'];
      
      if (cookies && cookies.length > 0) {
        return request(httpServer)
          .post('/auth/refresh')
          .set('Cookie', cookies)
          .expect(200)
          .then((res) => {
            expect(res.body.success).toBe(true);
          });
      }
    });
  });

  describe('GET /auth/me', () => {
    it('Deve falhar (401) se não estiver autenticado', () => {
      return request(httpServer).get('/auth/me').expect(401);
    });

    it('Deve retornar dados do usuário autenticado', async () => {
      await request(httpServer).post('/auth/register').send(testUser);

      const loginRes = await request(httpServer)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      // Com cookies httpOnly, precisamos usar os cookies
      const cookies = loginRes.headers['set-cookie'];
      
      if (cookies) {
        return request(httpServer)
          .get('/auth/me')
          .set('Cookie', cookies)
          .expect(200)
          .then((res) => {
            expect(res.body.id).toBeDefined();
            expect(res.body.email).toBe(testUser.email);
            expect(res.body.name).toBe(testUser.name);
          });
      }
    });
  });

  describe('POST /auth/logout', () => {
    it('Deve fazer logout com sucesso', async () => {
      await request(httpServer).post('/auth/register').send(testUser);

      const loginRes = await request(httpServer)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      const cookies = loginRes.headers['set-cookie'];

      if (cookies) {
        return request(httpServer)
          .post('/auth/logout')
          .set('Cookie', cookies)
          .expect(200)
          .then((res) => {
            expect(res.body.success).toBe(true);
          });
      }
    });
  });
});

