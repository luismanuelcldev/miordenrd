import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import configureServerlessExpress from '@codegenie/serverless-express';
import { Callback, Context, Handler } from 'aws-lambda';
import helmet from 'helmet';
import * as compression from 'compression';

let server: Handler;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Configuración de seguridad con Helmet (Igual que en main.ts)
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

  // Compresión
  app.use(compression());

  // Configuración de CORS (Lógica replicada de main.ts)
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

  app.enableCors({
    origin: (origin, callback) => {
      const isVercel = typeof origin === 'string' && /\.vercel\.app$/.test(origin);
      if (!origin || originsPermitidos.has(origin) || isVercel) {
        return callback(null, origin ?? true);
      }
      callback(new Error(`Origen no permitido por CORS: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Prefijo Global
  app.setGlobalPrefix('api/v1', {
    exclude: ['health'],
  });

  // Pipes Globales
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

  // Filtros e Interceptores Globales
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // NOTA: En Lambda no inicializamos Swagger ni servimos archivos estáticos locales (uploads)
  // ya que el sistema de archivos es efímero. Se recomienda usar S3 para uploads.

  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return configureServerlessExpress({ app: expressApp });
}

export const handler: Handler = async (
  event: Context,
  context: Context,
  callback: Callback,
) => {
  server = server ?? (await bootstrap());
  return server(event, context, callback);
};
