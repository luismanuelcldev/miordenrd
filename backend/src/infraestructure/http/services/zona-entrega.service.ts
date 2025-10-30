import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma/prisma.service';
import {
  ActualizarZonaEntregaDto,
  CalcularTarifaZonaDto,
  CrearTarifaZonaDto,
  CrearZonaEntregaDto,
  ZonaEntregaResponseDto,
} from '../dtos/zona-entrega.dto';
import {
  GeoPoint,
  calcularCentroide,
  distanciaHaversineKm,
  isPointInsideGeometry,
  parseSupportedGeometry,
} from '../../../common/utils/geo.util';
const normalizarTarifas = (tarifas?: CrearTarifaZonaDto[]) =>
  tarifas?.map((tarifa) => ({
    distanciaMin: tarifa.distanciaMin,
    distanciaMax: tarifa.distanciaMax ?? null,
    costoBase: tarifa.costoBase,
    costoPorKm: tarifa.costoPorKm ?? null,
    recargo: tarifa.recargo ?? 0,
  }));

const HUB_ENVIO = {
  latitud: Number(process.env.SHIPPING_ORIGIN_LAT ?? 18.486057),
  longitud: Number(process.env.SHIPPING_ORIGIN_LNG ?? -69.931211),
};

// Aquí he gestionado zonas de entrega, su geometría GeoJSON y cálculo de tarifas por distancia.
@Injectable()
export class ZonaEntregaService {
  constructor(private readonly prisma: PrismaService) {}

  // Aquí he listado zonas con opción de incluir inactivas y mapeo a DTO de respuesta.
  async listarTodas(
    incluirInactivas = true,
  ): Promise<ZonaEntregaResponseDto[]> {
    const zonas = await this.prisma.zonaEntrega.findMany({
      where: incluirInactivas ? undefined : { activa: true },
      include: { tarifas: { orderBy: { distanciaMin: 'asc' } } },
      orderBy: { nombre: 'asc' },
    });

    return zonas.map((zona) => this.mapearZona(zona));
  }

  // Aquí he obtenido una zona por id, incluyendo sus tarifas ordenadas.
  async obtenerPorId(id: number): Promise<ZonaEntregaResponseDto> {
    const zona = await this.prisma.zonaEntrega.findUnique({
      where: { id },
      include: { tarifas: { orderBy: { distanciaMin: 'asc' } } },
    });

    if (!zona) {
      throw new NotFoundException('La zona solicitada no existe');
    }

    return this.mapearZona(zona);
  }

  // Aquí he creado una zona validando el polígono y calculando el centroide si no se provee.
  async crear(dto: CrearZonaEntregaDto): Promise<ZonaEntregaResponseDto> {
    const geometria = parseSupportedGeometry(dto.poligono);

    if (!geometria) {
      throw new BadRequestException(
        'El polígono proporcionado no es válido. Debe respetar el estándar GeoJSON (Polygon o MultiPolygon).',
      );
    }

    const centroid =
      dto.centroideLatitud !== undefined && dto.centroideLongitud !== undefined
        ? { latitud: dto.centroideLatitud, longitud: dto.centroideLongitud }
        : calcularCentroide(geometria);

    const tarifas = normalizarTarifas(dto.tarifas);

    const zona = await this.prisma.zonaEntrega.create({
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        color: dto.color,
        activa: dto.activa ?? true,
        poligono: geometria as any,
        centroideLatitud: centroid?.latitud ?? null,
        centroideLongitud: centroid?.longitud ?? null,
        radioCoberturaKm: dto.radioCoberturaKm ?? null,
        tarifas: tarifas
          ? {
              create: tarifas,
            }
          : undefined,
      },
      include: { tarifas: { orderBy: { distanciaMin: 'asc' } } },
    });

    return this.mapearZona(zona);
  }

  // Aquí he actualizado una zona permitiendo reemplazar polígono y refrescar tarifas.
  async actualizar(
    id: number,
    dto: ActualizarZonaEntregaDto,
  ): Promise<ZonaEntregaResponseDto> {
    const zonaExistente = await this.prisma.zonaEntrega.findUnique({
      where: { id },
      include: { tarifas: true },
    });

    if (!zonaExistente) {
      throw new NotFoundException('La zona que intenta actualizar no existe');
    }

    const geometria =
      dto.poligono !== undefined
        ? parseSupportedGeometry(dto.poligono)
        : parseSupportedGeometry(zonaExistente.poligono);

    if (!geometria) {
      throw new BadRequestException(
        'El polígono proporcionado no es válido. Debe respetar el estándar GeoJSON (Polygon o MultiPolygon).',
      );
    }

    const centroid =
      dto.centroideLatitud !== undefined && dto.centroideLongitud !== undefined
        ? {
            latitud: dto.centroideLatitud,
            longitud: dto.centroideLongitud,
          }
        : (calcularCentroide(geometria) ??
          (zonaExistente.centroideLatitud !== null &&
          zonaExistente.centroideLongitud !== null
            ? {
                latitud: zonaExistente.centroideLatitud,
                longitud: zonaExistente.centroideLongitud,
              }
            : null));

    const tarifas = normalizarTarifas(dto.tarifas);

    const resultado = await this.prisma.$transaction(async (tx) => {
      const zonaActualizada = await tx.zonaEntrega.update({
        where: { id },
        data: {
          nombre: dto.nombre ?? zonaExistente.nombre,
          descripcion: dto.descripcion ?? zonaExistente.descripcion,
          color: dto.color ?? zonaExistente.color,
          activa: dto.activa !== undefined ? dto.activa : zonaExistente.activa,
          poligono:
            dto.poligono !== undefined
              ? (geometria as any)
              : zonaExistente.poligono,
          centroideLatitud: centroid?.latitud ?? null,
          centroideLongitud: centroid?.longitud ?? null,
          radioCoberturaKm:
            dto.radioCoberturaKm ?? zonaExistente.radioCoberturaKm,
        },
      });

      if (tarifas) {
        await tx.tarifaZona.deleteMany({ where: { zonaId: id } });
        if (tarifas.length > 0) {
          await tx.tarifaZona.createMany({
            data: tarifas.map((tarifa) => ({
              ...tarifa,
              zonaId: id,
            })),
          });
        }
      }

      return zonaActualizada;
    });

    const zonaConTarifas = await this.prisma.zonaEntrega.findUnique({
      where: { id: resultado.id },
      include: { tarifas: { orderBy: { distanciaMin: 'asc' } } },
    });

    if (!zonaConTarifas) {
      throw new NotFoundException('La zona actualizada no pudo recuperarse');
    }

    return this.mapearZona(zonaConTarifas);
  }

  // Aquí he eliminado una zona si existe; de lo contrario retorno 404.
  async eliminar(id: number): Promise<void> {
    const zona = await this.prisma.zonaEntrega.findUnique({ where: { id } });

    if (!zona) {
      throw new NotFoundException('La zona que intenta eliminar no existe');
    }

    await this.prisma.zonaEntrega.delete({ where: { id } });
  }

  // Aquí he calculado la tarifa aplicable según la zona que contiene el punto y la distancia estimada.
  async calcularTarifa(params: CalcularTarifaZonaDto): Promise<{
    zona: ZonaEntregaResponseDto;
    tarifaAplicada: {
      id: number;
      distanciaMin: number;
      distanciaMax: number | null;
      costoBase: number;
      costoPorKm: number | null;
      recargo: number | null;
      costoTotal: number;
    } | null;
    distanciaEstimadaKm: number | null;
  }> {
    const punto: GeoPoint = {
      latitud: params.latitud,
      longitud: params.longitud,
    };

    const zonasEvaluar = params.zonaId
      ? [
          await this.prisma.zonaEntrega.findUnique({
            where: { id: params.zonaId },
            include: { tarifas: true },
          }),
        ]
      : await this.prisma.zonaEntrega.findMany({
          where: { activa: true },
          include: { tarifas: true },
        });

    if (!zonasEvaluar.length || !zonasEvaluar[0]) {
      throw new NotFoundException('No hay zonas de entrega configuradas');
    }

    const zonaEncontrada = zonasEvaluar.find((item) =>
      isPointInsideGeometry(punto, item.poligono),
    );

    if (!zonaEncontrada) {
      throw new BadRequestException(
        'La ubicación proporcionada no está cubierta por ninguna zona activa',
      );
    }

    const zonaResponse = this.mapearZona({
      ...zonaEncontrada,
      tarifas: zonaEncontrada.tarifas.sort(
        (a: any, b: any) => a.distanciaMin - b.distanciaMin,
      ),
    });

    const puntoReferencia: GeoPoint = {
      latitud:
        typeof zonaEncontrada.centroideLatitud === 'number'
          ? zonaEncontrada.centroideLatitud
          : HUB_ENVIO.latitud,
      longitud:
        typeof zonaEncontrada.centroideLongitud === 'number'
          ? zonaEncontrada.centroideLongitud
          : HUB_ENVIO.longitud,
    };

    const distancia = distanciaHaversineKm(puntoReferencia, punto);

    if (!zonaEncontrada.tarifas.length) {
      return {
        zona: zonaResponse,
        tarifaAplicada: null,
        distanciaEstimadaKm: distancia,
      };
    }

    const tarifasOrdenadas = zonaEncontrada.tarifas.sort(
      (a, b) => a.distanciaMin - b.distanciaMin,
    );

    const tarifa =
      distancia === null
        ? tarifasOrdenadas[0]
        : (tarifasOrdenadas.find((item) => {
            const minOk = distancia >= item.distanciaMin;
            const maxOk =
              item.distanciaMax === null || distancia < item.distanciaMax;
            return minOk && maxOk;
          }) ?? tarifasOrdenadas.at(-1)!);

    const costoTotal =
      distancia !== null && tarifa.costoPorKm
        ? tarifa.costoBase +
          distancia * tarifa.costoPorKm +
          (tarifa.recargo ?? 0)
        : tarifa.costoBase + (tarifa.recargo ?? 0);

    return {
      zona: zonaResponse,
      tarifaAplicada: {
        id: tarifa.id,
        distanciaMin: tarifa.distanciaMin,
        distanciaMax: tarifa.distanciaMax,
        costoBase: tarifa.costoBase,
        costoPorKm: tarifa.costoPorKm,
        recargo: tarifa.recargo,
        costoTotal: Math.round(costoTotal * 100) / 100,
      },
      distanciaEstimadaKm: distancia,
    };
  }

  // Aquí he mapeado el modelo persistido de zona y sus tarifas a un DTO de respuesta.
  private mapearZona(zona: any): ZonaEntregaResponseDto {
    return {
      id: zona.id,
      nombre: zona.nombre,
      descripcion: zona.descripcion,
      color: zona.color,
      activa: zona.activa,
      poligono: zona.poligono,
      centroideLatitud: zona.centroideLatitud,
      centroideLongitud: zona.centroideLongitud,
      radioCoberturaKm: zona.radioCoberturaKm,
      tarifas: zona.tarifas?.map((tarifa: any) => ({
        id: tarifa.id,
        distanciaMin: tarifa.distanciaMin,
        distanciaMax: tarifa.distanciaMax,
        costoBase: tarifa.costoBase,
        costoPorKm: tarifa.costoPorKm,
        recargo: tarifa.recargo,
      })),
      creadoEn: zona.creadoEn.toISOString(),
      actualizadoEn: zona.actualizadoEn.toISOString(),
    };
  }
}
