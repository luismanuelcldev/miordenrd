import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { existsSync, mkdirSync, chmodSync } from 'fs';
import { UPLOADS_ROOT } from './infraestructure/http/constants/uploads';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Aquí he verificado que el directorio de cargas exista y tenga permisos de escritura antes de servir archivos estáticos.
  if (!existsSync(UPLOADS_ROOT)) {
    mkdirSync(UPLOADS_ROOT, { recursive: true, mode: 0o775 });
  }
  try {
    chmodSync(UPLOADS_ROOT, 0o775);
  } catch (error) {
    void error;
  }

  app.useStaticAssets(UPLOADS_ROOT, {
    prefix: '/uploads/',
  });

  // Aquí he configurado Helmet para aplicar cabeceras de seguridad estrictas en toda la API.
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          fontSrc: ["'self'", 'https:', 'data:'],
          frameAncestors: ["'none'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );
  app.use(helmet.permittedCrossDomainPolicies());
  app.use(helmet.noSniff());
  app.use(helmet.frameguard({ action: 'deny' }));
  app.use(helmet.hidePoweredBy());

  // Aquí he activado la compresión HTTP para reducir el tamaño de las respuestas.
  app.use(compression());

  // Aquí he construido la lista de orígenes permitidos para CORS considerando configuraciones personalizadas.
  const frontendOrigins = configService.get<string>('FRONTEND_URL');
  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ];
  const allowedOrigins = frontendOrigins
    ? frontendOrigins
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : defaultOrigins;

  const uniqueOrigins = Array.from(
    new Set([...defaultOrigins, ...allowedOrigins]),
  );

  const originsPermitidos = new Set(uniqueOrigins);

  // Aquí he habilitado CORS validando cada petición contra el conjunto de orígenes aceptados.
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || originsPermitidos.has(origin)) {
        return callback(null, origin ?? true);
      }
      callback(new Error(`Origen no permitido por CORS: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Aquí he establecido el prefijo global de la API manteniendo libre el endpoint de salud para Docker.
  app.setGlobalPrefix('api/v1', {
    exclude: ['health'],
  });

  // Aquí he configurado la tubería de validación para transformar y sanear datos de entrada automáticamente.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Aquí he definido la configuración de Swagger para exponer la documentación protegida con JWT.
  const config = new DocumentBuilder()
    .setTitle('Sistema de Pedidos API')
    .setDescription(
      'API para sistema de pedidos online con gestión de productos, carrito, checkout y administración',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingrese el token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get('PORT', 3000);
  await app.listen(port);

  logger.log(`🚀 Aplicación ejecutándose en: http://localhost:${port}`);
  logger.log(`📚 Documentación API: http://localhost:${port}/api/docs`);
}

bootstrap();
