import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
const cookieParser = require('cookie-parser');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Validar variáveis de ambiente obrigatórias
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
  const missingVars = requiredEnvVars.filter(
    (varName) => !configService.get(varName),
  );

  if (missingVars.length > 0) {
    logger.error(
      `Variáveis de ambiente obrigatórias não encontradas: ${missingVars.join(', ')}`,
    );
    process.exit(1);
  }

  // Cookie parser para cookies httpOnly
  app.use(cookieParser());

  // Helmet para proteção de headers HTTP
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    }),
  );

  // CORS configurável via variáveis de ambiente
  const allowedOrigins = configService
    .get<string>('ALLOWED_ORIGINS', 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim());

  const isProduction = configService.get('NODE_ENV') === 'production';

  app.enableCors({
    origin: (origin, callback) => {
      // Em desenvolvimento, permitir localhost
      if (!isProduction && (!origin || origin.includes('localhost'))) {
        callback(null, true);
        return;
      }

      // Em produção, verificar lista de origens permitidas
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    optionsSuccessStatus: 200,
  });

  // Swagger apenas em desenvolvimento
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Plano Mestre API')
      .setDescription(
        'Documentação da API da plataforma de estudos Plano Mestre.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
    logger.log('Swagger disponível em /api-docs (apenas em desenvolvimento)');
  } else {
    logger.warn('Swagger desabilitado em produção por segurança');
  }

  // Validação global com sanitização
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: isProduction, // Não expor detalhes de erro em produção
    }),
  );

  // Porta configurável
  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);

  logger.log(`Backend rodando em http://localhost:${port}`);
  logger.log(`Ambiente: ${isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);
}
bootstrap();
