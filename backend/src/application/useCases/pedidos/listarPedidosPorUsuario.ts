import { Inject, Injectable } from '@nestjs/common';
import { EstadoPedido } from '../../../domain/entities/pedido';
import { PedidoQueryRepository } from '../../ports/pedidoQueryRepository';

interface FiltrosUsuario {
  page: number;
  limit: number;
  estado?: EstadoPedido;
}

@Injectable()
// Expongo el listado paginado de pedidos de un usuario con la posibilidad de filtrar por estado.
export class ListarPedidosPorUsuario {
  // Inyecto el repositorio de consultas para ejecutar la lectura.
  constructor(
    @Inject('PedidoQueryRepository')
    private readonly queryRepository: PedidoQueryRepository,
  ) {}

  // Delego la obtención de pedidos en el repositorio entregando filtros y el usuario objetivo.
  async ejecutar(usuarioId: number, filtros: FiltrosUsuario) {
    return this.queryRepository.listarPorUsuario(usuarioId, filtros);
  }
}
