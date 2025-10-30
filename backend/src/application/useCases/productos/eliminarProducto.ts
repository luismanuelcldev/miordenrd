import { Inject, Injectable } from '@nestjs/common';
import { RepositorioProducto } from '../../ports/repositorioProducto';
import { ProductoQueryRepository } from '../../ports/productoQueryRepository';

@Injectable()
// Gestiono la eliminación de productos asegurando que no existan pedidos asociados.
export class EliminarProducto {
  // Inyecto puertos para verificar dependencias y ejecutar la eliminación definitiva.
  constructor(
    @Inject('RepositorioProducto')
    private readonly repositorio: RepositorioProducto,
    @Inject('ProductoQueryRepository')
    private readonly queryRepository: ProductoQueryRepository,
  ) {}

  // Ejecuto la eliminación retornando true si se completó y false si el producto no existe.
  async ejecutar(id: number): Promise<boolean> {
    const producto = await this.repositorio.encontrarPorId(id);
    if (!producto) {
      return false;
    }

    const tienePedidos = await this.queryRepository.existePedidoAsociado(id);
    if (tienePedidos) {
      throw new Error(
        'No se puede eliminar el producto porque tiene pedidos asociados',
      );
    }

    await this.queryRepository.eliminarProductoTotal(id);
    return true;
  }
}
