import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { registerAndLogin, cleanupDatabase } from '../helpers/test-helpers';

describe('SuggestionsController (e2e)', () => {
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

    const userA = await registerAndLogin(httpServer, 'usera-suggest@plano.com', 'User A');
    tokenUserA = userA.token;
    userIdA = userA.userId;
  });

  afterAll(async () => {
    await cleanupDatabase(prisma);
    await app.close();
  });

  describe('[Guards] Proteção de Rotas', () => {
    it('POST /suggestions -> Deve falhar (401) se não estiver autenticado', () => {
      return request(httpServer)
        .post('/suggestions')
        .send({
          subject: 'Test Subject',
          message: 'Test Message',
        })
        .expect(401);
    });
  });

  describe('POST /suggestions (Enviar Sugestão)', () => {
    it('Deve enviar uma sugestão com sucesso (201)', () => {
      return request(httpServer)
        .post('/suggestions')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          subject: 'Nova funcionalidade',
          message: 'Gostaria de ver uma funcionalidade de exportação de dados.',
        })
        .expect(201)
        .then((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toContain('sucesso');
        });
    });

    it('Deve falhar (400) se campos obrigatórios estiverem faltando', () => {
      return request(httpServer)
        .post('/suggestions')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          subject: 'Test',
          // message faltando
        })
        .expect(400);
    });

    it('Deve funcionar mesmo se o email não estiver configurado', () => {
      // O serviço deve retornar sucesso mesmo sem email configurado
      return request(httpServer)
        .post('/suggestions')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          subject: 'Test Subject',
          message: 'Test Message',
        })
        .expect(201)
        .then((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });
});

