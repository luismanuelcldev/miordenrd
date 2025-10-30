import { Inject, Injectable } from '@nestjs/common';
import {
  FiltrosPedidoQuery,
  PedidoQueryRepository,
} from '../../ports/pedidoQueryRepository';
import { Rol } from '../../../domain/entities/usuario';

@Injectable()
// Expongo un listado paginado de pedidos aplicando filtros y contexto del usuario.
export class ListarPedidos {
  // Inyecto el repositorio de consultas para separar lectura de escritura.
  constructor(
    @Inject('PedidoQueryRepository')
    private readonly queryRepository: PedidoQueryRepository,
  ) {}

  // Ejecuto la búsqueda y calculo metadatos de paginación antes de responder.
  async ejecutar(
    filtros: FiltrosPedidoQuery,
    usuarioActual: { id: number; rol: Rol },
  ) {
    const pedidos = await this.queryRepository.listar(filtros, usuarioActual);
    const total = await this.queryRepository.contar(filtros, usuarioActual);

    const totalPages = Math.ceil(total / filtros.limit);
    const page = filtros.page;

    return {
      pedidos,
      paginacion: {
        page,
        limit: filtros.limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
}
