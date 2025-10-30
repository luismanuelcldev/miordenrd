import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from './infraestructure/http/http.module';
import { AuthModule } from './infraestructure/security/auth.module';
import { PrismaModule } from './infraestructure/persistence/prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    // Aquí he cargado la configuración global para que todas las dependencias accedan a las variables de entorno.
    ConfigModule.forRoot({ isGlobal: true }),
    // Aquí he configurado el módulo de rate limiting obteniendo la política desde la configuración.
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): ThrottlerModuleOptions => ({
        ttl: Number(configService.get('THROTTLE_TTL') ?? 60),
        limit: Number(configService.get('THROTTLE_LIMIT') ?? 100),
        ignoreUserAgents: [/adsbot-google/i, /healthcheck/i],
      }),
    }),
    // Aquí he registrado los módulos principales que exponen la API, seguridad y acceso a datos.
    HttpModule,
    AuthModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [
    // Aquí he declarado los servicios compartidos y el guardián global para aplicar el throttling por defecto.
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
