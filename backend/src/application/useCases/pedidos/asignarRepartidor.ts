import { Inject, Injectable } from '@nestjs/common';
import { EstadoPedido } from '../../../domain/entities/pedido';
import { RepositorioPedido } from '../../ports/repositorioPedido';
import { PedidoQueryRepository } from '../../ports/pedidoQueryRepository';

@Injectable()
// Asigno un repartidor a un pedido en estados permitidos y notifico el cambio.
export class AsignarRepartidor {
  // Inyecto puertos de lectura y escritura para actualizar y consultar el pedido.
  constructor(
    @Inject('RepositorioPedido')
    private readonly repositorioPedido: RepositorioPedido,
    @Inject('PedidoQueryRepository')
    private readonly queryRepository: PedidoQueryRepository,
  ) {}

  // Ejecuto la asignación validando el estado y retorno el detalle actualizado.
  async ejecutar(pedidoId: number, repartidorId: number) {
    const pedido = await this.repositorioPedido.encontrarPorId(pedidoId);
    if (!pedido) {
      return null;
    }

    const detalle = await this.queryRepository.obtenerPorId(pedidoId);
    if (!detalle) {
      return null;
    }

    const estadoActual = detalle.estado;
    if (
      ![EstadoPedido.EN_PREPARACION, EstadoPedido.ENVIADO].includes(
        estadoActual,
      )
    ) {
      throw new Error(
        'Solo se puede asignar repartidor a pedidos en preparación o enviados',
      );
    }

    const nuevoEstado =
      estadoActual === EstadoPedido.EN_PREPARACION
        ? EstadoPedido.ENVIADO
        : estadoActual;

    pedido.asignarRepartidor(repartidorId);
    pedido.actualizarEstado(nuevoEstado);
    await this.repositorioPedido.actualizar(pedido);

    await this.queryRepository.registrarNotificacion({
      pedidoId,
      email: detalle.usuario?.email ?? '',
      mensaje: 'Pedido asignado a repartidor',
    });

    return this.queryRepository.obtenerPorId(pedidoId);
  }
}
