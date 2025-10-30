import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ProcesarCheckout } from '../../../application/useCases/pedidos/procesarCheckout';
import { MetodoPago } from '../../../domain/entities/pedido';
import { Rol } from '../../../domain/entities/usuario';
import { PrismaService } from '../../persistence/prisma/prisma.service';
import { ZonaEntregaService } from './zona-entrega.service';

interface DatosCompra {
  direccionId: number;
  metodoPago: MetodoPago;
  observaciones?: string;
}

// Aquí he orquestado el checkout calculando costo de envío antes de disparar el caso de uso.
@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private readonly procesarCheckout: ProcesarCheckout,
    private readonly prisma: PrismaService,
    private readonly zonaEntregaService: ZonaEntregaService,
  ) {}

  // Aquí he procesado la compra del usuario incorporando el costo de envío calculado.
  async procesarCompra(
    usuarioId: number,
    datosCompra: DatosCompra,
    usuarioActual: { id: number; rol: Rol },
  ) {
    const costoEnvio = await this.calcularCostoEnvio(datosCompra.direccionId);

    return this.procesarCheckout.ejecutar(
      {
        usuarioId,
        direccionId: datosCompra.direccionId,
        metodoPago: datosCompra.metodoPago,
        costoEnvio,
      },
      usuarioActual,
    );
  }

  // Aquí he calculado el costo de envío a partir de la dirección; si falla o no hay coordenadas, devuelvo 0.
  private async calcularCostoEnvio(direccionId: number): Promise<number> {
    const direccion = await this.prisma.direccion.findUnique({
      where: { id: direccionId },
    });

    if (!direccion) {
      throw new BadRequestException(
        'La dirección seleccionada no existe o fue eliminada',
      );
    }

    if (
      direccion.latitud === null ||
      direccion.longitud === null ||
      Number.isNaN(direccion.latitud) ||
      Number.isNaN(direccion.longitud)
    ) {
      this.logger.warn(
        `Dirección ${direccionId} no tiene coordenadas, no se calculará costo de envío`,
      );
      return 0;
    }

    try {
      const calculo = await this.zonaEntregaService.calcularTarifa({
        latitud: direccion.latitud,
        longitud: direccion.longitud,
        zonaId: direccion.zonaId ?? undefined,
      });
      return calculo.tarifaAplicada?.costoTotal ?? 0;
    } catch (error) {
      this.logger.error(
        `Error calculando costo de envío para la dirección ${direccionId}`,
        (error as Error).stack,
      );
      return 0;
    }
  }
}
