import { Inject, Injectable } from '@nestjs/common';
import {
  FiltrosProducto,
  ProductoQueryRepository,
} from '../../ports/productoQueryRepository';

@Injectable()
// Devuelvo un listado de productos con soporte de filtros y metadatos de paginación.
export class ListarProductos {
  // Inyecto el repositorio de lectura para consultar productos sin exponer detalles de persistencia.
  constructor(
    @Inject('ProductoQueryRepository')
    private readonly queryRepository: ProductoQueryRepository,
  ) {}

  // Ejecuto la consulta y construyo la respuesta con información de paginado.
  async ejecutar(filtros: FiltrosProducto) {
    const items = await this.queryRepository.listar(filtros);
    const total = await this.queryRepository.contar(filtros);

    const limit = filtros.limit > 0 ? filtros.limit : 1;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const page = filtros.page;

    return {
      productos: items,
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
}
