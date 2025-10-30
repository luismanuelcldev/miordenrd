import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ListarAuditoriaDto } from '../dto/listar-auditoria.dto';
import { PrismaService } from '../../persistence/prisma/prisma.service';

interface RegistrarAccionParams {
  usuarioId: number;
  modulo: string;
  accion: string;
  descripcion?: string | null;
}

// Aquí he centralizado el registro y consulta de acciones de auditoría del sistema.
@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Aquí he registrado una acción de auditoría de forma tolerante a fallos (loggea si no persiste).
  async registrarAccion({
    usuarioId,
    modulo,
    accion,
    descripcion,
  }: RegistrarAccionParams): Promise<void> {
    try {
      await this.prisma.auditoriaAccion.create({
        data: {
          usuarioId,
          modulo,
          accion,
          descripcion: descripcion ?? null,
        },
      });
    } catch (error) {
      this.logger.warn(
        `No fue posible registrar la auditoría (${modulo}:${accion}) para el usuario ${usuarioId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  // Aquí he listado acciones de auditoría con filtros paginados y rangos de fecha.
  async listar(query: ListarAuditoriaDto) {
    const rawPage = Number(query.page ?? 1);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;

    const rawLimit = Number(query.limit ?? 20);
    const limitCandidate = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : 20;
    const limit = Math.min(limitCandidate, 100);
    const skip = (page - 1) * limit;

    const filtros: Prisma.AuditoriaAccionWhereInput[] = [];

    if (query.usuarioId) {
      filtros.push({ usuarioId: query.usuarioId });
    }
    if (query.modulo) {
      filtros.push({
        modulo: { contains: query.modulo, mode: 'insensitive' },
      });
    }
    if (query.accion) {
      filtros.push({
        accion: { contains: query.accion, mode: 'insensitive' },
      });
    }

    if (query.fechaDesde || query.fechaHasta) {
      const rango: Prisma.DateTimeFilter = {};
      if (query.fechaDesde) {
        const fechaDesde = new Date(query.fechaDesde);
        if (!Number.isNaN(fechaDesde.getTime())) rango.gte = fechaDesde;
      }
      if (query.fechaHasta) {
        const fechaHasta = new Date(query.fechaHasta);
        if (!Number.isNaN(fechaHasta.getTime())) rango.lte = fechaHasta;
      }
      if (rango.gte || rango.lte) {
        filtros.push({ fecha: rango });
      }
    }

    const where: Prisma.AuditoriaAccionWhereInput = filtros.length
      ? { AND: filtros }
      : {};

    const [registros, total] = await this.prisma.$transaction([
      this.prisma.auditoriaAccion.findMany({
        where,
        orderBy: { fecha: 'desc' },
        skip,
        take: limit,
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
              rol: true,
            },
          },
        },
      }),
      this.prisma.auditoriaAccion.count({ where }),
    ]);

    const totalPages = total === 0 ? 1 : Math.ceil(total / limit);

    return {
      registros,
      paginacion: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  // Aquí he obtenido el catálogo de módulos con actividad registrada.
  async listarModulos() {
    const modulos = await this.prisma.auditoriaAccion.findMany({
      distinct: ['modulo'],
      orderBy: { modulo: 'asc' },
      select: { modulo: true },
    });
    return modulos
      .map((registro) => registro.modulo)
      .filter((modulo): modulo is string => Boolean(modulo));
  }

  // Aquí he obtenido el catálogo de acciones registradas en auditoría.
  async listarAcciones() {
    const acciones = await this.prisma.auditoriaAccion.findMany({
      distinct: ['accion'],
      orderBy: { accion: 'asc' },
      select: { accion: true },
    });
    return acciones
      .map((registro) => registro.accion)
      .filter((accion): accion is string => Boolean(accion));
  }
}
