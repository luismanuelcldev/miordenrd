import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma/prisma.service';
import {
  CrearDireccionDto,
  ActualizarDireccionDto,
  DireccionResponseDto,
} from '../dtos/direccion.dto';
import {
  GeoPoint,
  isPointInsideGeometry,
} from '../../../common/utils/geo.util';

@Injectable()
export class DireccionService {
  constructor(private readonly prisma: PrismaService) {}

  // Aquí he listado las direcciones del usuario incluyendo su zona mapeada a un DTO.
  async listarDirecciones(usuarioId: number): Promise<DireccionResponseDto[]> {
    const direcciones = await this.prisma.direccion.findMany({
      where: { usuarioId },
      orderBy: { creadoEn: 'desc' },
      include: { zona: true },
    });

    return direcciones.map((direccion) =>
      this.mapToDireccionResponse(direccion),
    );
  }

  // Aquí he obtenido una dirección validando pertenencia al usuario solicitante.
  async obtenerDireccion(
    id: number,
    usuarioId: number,
  ): Promise<DireccionResponseDto> {
    const direccion = await this.prisma.direccion.findFirst({
      where: { id, usuarioId },
      include: { zona: true },
    });

    if (!direccion) {
      throw new NotFoundException(`Dirección con ID ${id} no encontrada`);
    }

    return this.mapToDireccionResponse(direccion);
  }

  // Aquí he creado una dirección resolviendo la zona automáticamente cuando procede.
  async crearDireccion(
    usuarioId: number,
    crearDireccionDto: CrearDireccionDto,
  ): Promise<DireccionResponseDto> {
    const {
      zonaId: zonaSeleccionadaId,
      latitud,
      longitud,
      ...restoPayload
    } = crearDireccionDto;

    const resolucionZona = await this.resolverZona({
      zonaId: zonaSeleccionadaId,
      latitud,
      longitud,
    });

    const direccion = await this.prisma.direccion.create({
      data: {
        ...restoPayload,
        latitud,
        longitud,
        validada: resolucionZona.validada,
        zonaId: resolucionZona.zonaId ?? null,
        usuarioId,
      },
      include: { zona: true },
    });

    return this.mapToDireccionResponse(direccion);
  }

  // Aquí he actualizado una dirección permitiendo cambios parciales y recálculo de zona/validación.
  async actualizarDireccion(
    id: number,
    usuarioId: number,
    actualizarDireccionDto: ActualizarDireccionDto,
  ): Promise<DireccionResponseDto> {
    // Verificar que la dirección existe y pertenece al usuario
    const direccionExistente = await this.prisma.direccion.findFirst({
      where: { id, usuarioId },
    });

    if (!direccionExistente) {
      throw new NotFoundException(`Dirección con ID ${id} no encontrada`);
    }

    const {
      zonaId: zonaSeleccionadaId,
      latitud,
      longitud,
      validada,
      ...restoPayload
    } = actualizarDireccionDto;

    const resolucionZona = await this.resolverZona({
      zonaId: zonaSeleccionadaId ?? direccionExistente.zonaId ?? undefined,
      latitud: latitud ?? direccionExistente.latitud ?? undefined,
      longitud: longitud ?? direccionExistente.longitud ?? undefined,
      recalcularValidacion:
        latitud !== undefined ||
        longitud !== undefined ||
        zonaSeleccionadaId !== undefined,
      validadaCliente: validada,
    });

    const direccionActualizada = await this.prisma.direccion.update({
      where: { id },
      data: {
        ...restoPayload,
        latitud: latitud !== undefined ? latitud : direccionExistente.latitud,
        longitud:
          longitud !== undefined ? longitud : direccionExistente.longitud,
        zonaId:
          resolucionZona.zonaId !== undefined
            ? resolucionZona.zonaId
            : direccionExistente.zonaId,
        validada: resolucionZona.validada,
      },
      include: { zona: true },
    });

    return this.mapToDireccionResponse(direccionActualizada);
  }

  // Aquí he eliminado una dirección sólo si pertenece al usuario.
  async eliminarDireccion(id: number, usuarioId: number): Promise<void> {
    // Verificar que la dirección existe y pertenece al usuario
    const direccion = await this.prisma.direccion.findFirst({
      where: { id, usuarioId },
    });

    if (!direccion) {
      throw new NotFoundException(`Dirección con ID ${id} no encontrada`);
    }

    await this.prisma.direccion.delete({
      where: { id },
    });
  }

  // Aquí he resuelto la zona de entrega en base a zonaId y/o coordenadas, validando el polígono.
  private async resolverZona({
    zonaId,
    latitud,
    longitud,
    recalcularValidacion = true,
    validadaCliente,
  }: {
    zonaId?: number;
    latitud?: number;
    longitud?: number;
    recalcularValidacion?: boolean;
    validadaCliente?: boolean;
  }): Promise<{ zonaId?: number; validada: boolean }> {
    const tieneCoordenadas =
      typeof latitud === 'number' && typeof longitud === 'number';

    if (zonaId) {
      const zona = await this.prisma.zonaEntrega.findUnique({
        where: { id: zonaId },
      });

      if (!zona) {
        throw new BadRequestException(
          'La zona de entrega seleccionada no existe',
        );
      }

      if (!zona.activa) {
        throw new BadRequestException(
          'La zona seleccionada está deshabilitada actualmente',
        );
      }

      if (!recalcularValidacion) {
        return {
          zonaId,
          validada:
            typeof validadaCliente === 'boolean' ? validadaCliente : true,
        };
      }

      if (!tieneCoordenadas) {
        return { zonaId, validada: true };
      }

      const punto: GeoPoint = {
        latitud,
        longitud,
      };

      const esValida = isPointInsideGeometry(punto, zona.poligono);

      if (!esValida) {
        throw new BadRequestException(
          'Las coordenadas proporcionadas no pertenecen a la zona seleccionada',
        );
      }

      return { zonaId, validada: true };
    }

    if (!tieneCoordenadas) {
      return {
        zonaId: undefined,
        validada:
          typeof validadaCliente === 'boolean' ? validadaCliente : false,
      };
    }

    const zonasActivas = await this.prisma.zonaEntrega.findMany({
      where: { activa: true },
    });

    const punto: GeoPoint = { latitud, longitud };
    const zonaCoincidente = zonasActivas.find((zona) =>
      isPointInsideGeometry(punto, zona.poligono),
    );

    if (!zonaCoincidente) {
      return { zonaId: undefined, validada: false };
    }

    return { zonaId: zonaCoincidente.id, validada: true };
  }

  // Aquí he transformado el modelo persistido a un DTO de respuesta coherente con la API.
  private mapToDireccionResponse(direccion: any): DireccionResponseDto {
    return {
      id: direccion.id,
      calle: direccion.calle,
      ciudad: direccion.ciudad,
      pais: direccion.pais,
      codigoPostal: direccion.codigoPostal,
      referencias: direccion.referencias ?? undefined,
      latitud:
        typeof direccion.latitud === 'number' ? direccion.latitud : undefined,
      longitud:
        typeof direccion.longitud === 'number' ? direccion.longitud : undefined,
      validada: Boolean(direccion.validada),
      zonaId: direccion.zonaId ?? undefined,
      zona: direccion.zona
        ? {
            id: direccion.zona.id,
            nombre: direccion.zona.nombre,
            color: direccion.zona.color,
            activa: direccion.zona.activa,
          }
        : undefined,
      usuarioId: direccion.usuarioId,
      creadoEn: direccion.creadoEn.toISOString(),
      actualizadoEn: direccion.actualizadoEn.toISOString(),
    };
  }
}
