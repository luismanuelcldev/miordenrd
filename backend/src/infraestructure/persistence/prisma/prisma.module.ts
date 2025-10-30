import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// En este módulo expongo PrismaService para que pueda inyectarlo en el resto de capas sin acoplar dependencias.
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
