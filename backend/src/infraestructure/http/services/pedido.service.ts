import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { EstadoPedido } from '../../../domain/entities/pedido';
import { Rol } from '../../../domain/entities/usuario';
import { FiltrosPedidoQuery } from '../../../application/ports/pedidoQueryRepository';
import { ListarPedidos } from '../../../application/useCases/pedidos/listarPedidos';
import { ObtenerPedido } from '../../../application/useCases/pedidos/obtenerPedido';
import { ActualizarEstadoPedido } from '../../../application/useCases/pedidos/actualizarEstadoPedido';
import { AsignarRepartidor } from '../../../application/useCases/pedidos/asignarRepartidor';
import { ListarPedidosPorUsuario } from '../../../application/useCases/pedidos/listarPedidosPorUsuario';
import { ListarPedidosPorRepartidor } from '../../../application/useCases/pedidos/listarPedidosPorRepartidor';
import { AuditoriaService } from './auditoria.service';

export type FiltrosPedido = FiltrosPedidoQuery;

// Aquí he coordinado casos de uso de pedidos y apliqué reglas de autorización por rol/propiedad.
@Injectable()
export class PedidoService {
  constructor(
    private readonly listarPedidos: ListarPedidos,
    private readonly obtenerPedidoUC: ObtenerPedido,
    private readonly actualizarEstadoUC: ActualizarEstadoPedido,
    private readonly asignarRepartidorUC: AsignarRepartidor,
    private readonly listarPorUsuarioUC: ListarPedidosPorUsuario,
    private readonly listarPorRepartidorUC: ListarPedidosPorRepartidor,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  // Aquí he listado pedidos aplicando filtros con el contexto del usuario actual.
  async findAll(
    filtros: FiltrosPedido,
    usuarioActual: { id: number; rol: Rol },
  ) {
    return this.listarPedidos.ejecutar(filtros, usuarioActual);
  }

  // Aquí he obtenido un pedido y validado que el usuario pueda verlo (admin/empleado/propietario/repartidor asignado).
  async findOne(id: number, usuarioActual: { id: number; rol: Rol }) {
    const pedido = await this.obtenerPedidoUC.ejecutar(id);
    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (
      usuarioActual.rol !== Rol.ADMINISTRADOR &&
      usuarioActual.rol !== Rol.EMPLEADO
    ) {
      const esCliente = pedido.usuarioId === usuarioActual.id;
      const esRepartidorAsignado =
        pedido.repartidorId != null && pedido.repartidorId === usuarioActual.id;

      if (!esCliente && !esRepartidorAsignado) {
        throw new ForbiddenException(
          'No tienes permisos para ver este pedido',
        );
      }
    }

    return pedido;
  }

  // Aquí he actualizado el estado de un pedido y registré la acción en auditoría.
  async actualizarEstado(
    id: number,
    estado: EstadoPedido,
    usuarioActual: { id: number; rol: Rol },
  ) {
    try {
      const actualizado = await this.actualizarEstadoUC.ejecutar(
        id,
        estado,
        usuarioActual,
      );
      if (!actualizado) {
        throw new NotFoundException('Pedido no encontrado');
      }
      await this.auditoriaService.registrarAccion({
        usuarioId: usuarioActual.id,
        modulo: 'PEDIDOS',
        accion: 'ACTUALIZAR_ESTADO',
        descripcion: `El estado del pedido ${id} se actualizó a ${estado}`,
      });
      return actualizado;
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  // Aquí he asignado un repartidor a un pedido restringiendo la acción a admin/empleado.
  async asignarRepartidor(
    id: number,
    repartidorId: number,
    usuarioActual: { id: number; rol: Rol },
  ) {
    if (![Rol.ADMINISTRADOR, Rol.EMPLEADO].includes(usuarioActual.rol)) {
      throw new ForbiddenException(
        'No tienes permisos para asignar repartidor',
      );
    }

    try {
      const actualizado = await this.asignarRepartidorUC.ejecutar(
        id,
        repartidorId,
      );
      if (!actualizado) {
        throw new NotFoundException('Pedido no encontrado');
      }
      await this.auditoriaService.registrarAccion({
        usuarioId: usuarioActual.id,
        modulo: 'PEDIDOS',
        accion: 'ASIGNAR_REPARTIDOR',
        descripcion: `Pedido ${id} asignado al repartidor ${repartidorId}`,
      });
      return actualizado;
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  // Aquí he listado pedidos del cliente autenticado con paginación.
  async findByUsuario(filtros: {
    page: number;
    limit: number;
    estado?: string;
    usuarioId: number;
  }) {
    const resultado = await this.listarPorUsuarioUC.ejecutar(
      filtros.usuarioId,
      {
        page: filtros.page,
        limit: filtros.limit,
        estado: filtros.estado as EstadoPedido | undefined,
      },
    );

    const totalPages = Math.ceil(resultado.total / filtros.limit);

    return {
      pedidos: resultado.pedidos,
      paginacion: {
        page: filtros.page,
        limit: filtros.limit,
        total: resultado.total,
        totalPages,
        hasNextPage: filtros.page < totalPages,
        hasPrevPage: filtros.page > 1,
      },
    };
  }

  // Aquí he listado pedidos asignados a un repartidor con paginación.
  async findByRepartidor(filtros: {
    page: number;
    limit: number;
    estado?: string;
    repartidorId: number;
  }) {
    const resultado = await this.listarPorRepartidorUC.ejecutar(
      filtros.repartidorId,
      {
        page: filtros.page,
        limit: filtros.limit,
        estado: filtros.estado as EstadoPedido | undefined,
      },
    );

    const totalPages = Math.ceil(resultado.total / filtros.limit);

    return {
      pedidos: resultado.pedidos,
      paginacion: {
        page: filtros.page,
        limit: filtros.limit,
        total: resultado.total,
        totalPages,
        hasNextPage: filtros.page < totalPages,
        hasPrevPage: filtros.page > 1,
      },
    };
  }
}
