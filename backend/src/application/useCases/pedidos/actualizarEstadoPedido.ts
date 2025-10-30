import { Inject, Injectable } from '@nestjs/common';
import { EstadoPedido } from '../../../domain/entities/pedido';
import { Rol } from '../../../domain/entities/usuario';
import { RepositorioPedido } from '../../ports/repositorioPedido';
import { PedidoQueryRepository } from '../../ports/pedidoQueryRepository';

@Injectable()
// Centralizo las reglas para avanzar o revertir el estado de un pedido y emitir notificaciones.
export class ActualizarEstadoPedido {
  // Inyecto los puertos necesarios para leer detalles y persistir cambios.
  constructor(
    @Inject('RepositorioPedido')
    private readonly repositorioPedido: RepositorioPedido,
    @Inject('PedidoQueryRepository')
    private readonly queryRepository: PedidoQueryRepository,
  ) {}

  // Valido permisos y transiciones permitidas y devuelvo el detalle actualizado del pedido.
  async ejecutar(
    pedidoId: number,
    nuevoEstado: EstadoPedido,
    usuarioActual: { id: number; rol: Rol },
  ) {
    const pedido = await this.repositorioPedido.encontrarPorId(pedidoId);
    if (!pedido) {
      return null;
    }

    if (
      usuarioActual.rol === Rol.REPARTIDOR &&
      pedido.getRepartidorId() !== usuarioActual.id
    ) {
      throw new Error(
        'No tienes permisos para cambiar el estado de este pedido',
      );
    }

    const transicionesValidas = this.obtenerTransicionesValidas(
      pedido.getEstado(),
      usuarioActual.rol,
    );
    if (!transicionesValidas.includes(nuevoEstado)) {
      throw new Error(
        `No se puede cambiar el estado de ${pedido.getEstado()} a ${nuevoEstado}`,
      );
    }

    pedido.actualizarEstado(nuevoEstado);
    await this.repositorioPedido.actualizar(pedido);

    const detalle = await this.queryRepository.obtenerPorId(pedidoId);

    await this.queryRepository.registrarNotificacion({
      pedidoId,
      email: detalle?.usuario?.email ?? '',
      mensaje: this.mensajeEstado(nuevoEstado),
    });

    return detalle;
  }

  // Determino las transiciones válidas según el estado actual y el rol del usuario que opera.
  private obtenerTransicionesValidas(
    estadoActual: EstadoPedido,
    rol: Rol,
  ): EstadoPedido[] {
    const transicionesPorDefecto: Record<EstadoPedido, EstadoPedido[]> = {
      [EstadoPedido.PENDIENTE]: [
        EstadoPedido.EN_PREPARACION,
        EstadoPedido.CANCELADO,
      ],
      [EstadoPedido.EN_PREPARACION]: [
        EstadoPedido.ENVIADO,
        EstadoPedido.CANCELADO,
      ],
      [EstadoPedido.ENVIADO]: [EstadoPedido.ENTREGADO],
      [EstadoPedido.ENTREGADO]: [],
      [EstadoPedido.CANCELADO]: [],
    };

    if (rol === Rol.REPARTIDOR) {
      const transicionesRepartidor: Record<EstadoPedido, EstadoPedido[]> = {
        [EstadoPedido.PENDIENTE]: [EstadoPedido.EN_PREPARACION],
        [EstadoPedido.EN_PREPARACION]: [EstadoPedido.ENVIADO],
        [EstadoPedido.ENVIADO]: [EstadoPedido.ENTREGADO],
        [EstadoPedido.ENTREGADO]: [],
        [EstadoPedido.CANCELADO]: [],
      };
      return transicionesRepartidor[estadoActual] ?? [];
    }

    return transicionesPorDefecto[estadoActual] ?? [];
  }

  // Redacto el mensaje de notificación apropiado para el estado alcanzado.
  private mensajeEstado(estado: EstadoPedido): string {
    const mensajes: Record<EstadoPedido, string> = {
      [EstadoPedido.PENDIENTE]:
        'Tu pedido ha sido recibido y está siendo procesado',
      [EstadoPedido.EN_PREPARACION]: 'Tu pedido está siendo preparado',
      [EstadoPedido.ENVIADO]: 'Tu pedido ha sido enviado y está en camino',
      [EstadoPedido.ENTREGADO]: 'Tu pedido ha sido entregado exitosamente',
      [EstadoPedido.CANCELADO]: 'Tu pedido ha sido cancelado',
    };
    return mensajes[estado];
  }
}
