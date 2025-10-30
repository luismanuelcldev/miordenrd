import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../decorators/public.decorator';
import { PrismaService } from '../../persistence/prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  // Aquí he implementado un health check público que verifica uptime y conexión a la base de datos.
  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check del sistema' })
  @ApiResponse({
    status: 200,
    description: 'Sistema funcionando correctamente',
  })
  async check() {
    try {
      // Verificar conexión a la base de datos
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'connected',
        version: process.env.npm_package_version || '1.0.0',
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'disconnected',
        error: error.message,
      };
    }
  }
}
