import { Inject, Injectable } from '@nestjs/common';
import { ProductoQueryRepository } from '../../ports/productoQueryRepository';

@Injectable()
// Expongo la consulta de detalle de un producto por su id.
export class ObtenerProducto {
  // Inyecto el repositorio de lectura para mantener el caso de uso independiente de la infraestructura.
  constructor(
    @Inject('ProductoQueryRepository')
    private readonly queryRepository: ProductoQueryRepository,
  ) {}

  // Delego en el repositorio la recuperación del detalle y retorno su resultado.
  async ejecutar(id: number) {
    return this.queryRepository.obtenerDetalle(id);
  }
}
