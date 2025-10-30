import { Inject, Injectable } from '@nestjs/common';
import { EstadoPedido } from '../../../domain/entities/pedido';
import { PedidoQueryRepository } from '../../ports/pedidoQueryRepository';

interface FiltrosRepartidor {
  page: number;
  limit: number;
  estado?: EstadoPedido;
}

@Injectable()
// Ofrezco el listado paginado de pedidos asignados a un repartidor, con filtro por estado.
export class ListarPedidosPorRepartidor {
  // Inyecto el repositorio de consultas para ejecutar la búsqueda.
  constructor(
    @Inject('PedidoQueryRepository')
    private readonly queryRepository: PedidoQueryRepository,
  ) {}

  // Ejecuto la consulta delegando en el repositorio con los filtros provistos.
  async ejecutar(repartidorId: number, filtros: FiltrosRepartidor) {
    return this.queryRepository.listarPorRepartidor(repartidorId, filtros);
  }
}
