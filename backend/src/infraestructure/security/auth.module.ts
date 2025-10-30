import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { AuthController } from '../http/controllers/auth.controller';
import { PrismaModule } from '../persistence/prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuditoriaService } from '../http/services/auditoria.service';

@Module({
  imports: [
    // Aquí he importado los módulos necesarios para acceder a la base y gestionar estrategias de autenticación.
    PrismaModule,
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      // Aquí he registrado el módulo JWT tomando llave y expiración desde la configuración.
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') ?? '15m',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  // Aquí he expuesto los proveedores que encapsulan la lógica de autenticación y auditoría.
  providers: [JwtStrategy, AuthService, AuditoriaService],
  exports: [JwtModule, AuthService],
})
export class AuthModule {}
