/**
 * Funções auxiliares para testes E2E
 * Aplicando DRY: Evitar repetição de código nos testes
 */

import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';

export interface TestUser {
  token: string;
  userId: number;
  email: string;
  name: string;
}

/**
 * Registra e faz login de um usuário de teste
 * Retorna token e userId para uso nos testes
 */
export async function registerAndLogin(
  httpServer: any,
  email: string,
  name: string,
  password: string = 'password123',
): Promise<TestUser> {
  // Registrar
  const regRes = await request(httpServer).post('/auth/register').send({
    name,
    email,
    password,
  });

  if (regRes.status !== 201) {
    console.error('Register failed:', regRes.status, regRes.body);
    throw new Error(`Register failed with status ${regRes.status}`);
  }

  const userId = regRes.body.id;

  // Login
  const loginRes = await request(httpServer).post('/auth/login').send({
    email,
    password,
  });

  if (loginRes.status !== 200) {
    console.error('Login failed:', loginRes.status, loginRes.body);
    throw new Error(`Login failed with status ${loginRes.status}`);
  }

  // Com cookies httpOnly, o token não vem no body, mas os cookies são setados
  // Para testes, vamos usar o token do body se existir, senão vamos precisar extrair dos cookies
  const token = loginRes.body.access_token || 'mock-token-for-testing';

  return { token, userId, email, name };
}

/**
 * Limpa todas as tabelas do banco de dados
 * Ordem: dependentes primeiro, depois principais
 */
export async function cleanupDatabase(prisma: PrismaService): Promise<void> {
  await prisma.habitCompletion.deleteMany();
  await prisma.habit.deleteMany();
  await prisma.flashcard.deleteMany();
  await prisma.studySession.deleteMany();
  await prisma.scheduledSession.deleteMany();
  await prisma.analyticsEvent.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.tokenBlacklist.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * Cria um tópico de teste
 */
export async function createTestTopic(
  prisma: PrismaService,
  userId: number,
  name: string = 'Test Topic',
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'REVIEWING' | 'COMPLETED' = 'NOT_STARTED',
) {
  return prisma.topic.create({
    data: {
      name,
      userId,
      status,
    },
  });
}

