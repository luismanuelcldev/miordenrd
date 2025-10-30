import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  // Prefiero extender PrismaClient para aprovechar tipados y control del ciclo de vida con Nest.
  constructor() {
    super();
  }
}
