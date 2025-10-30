import { Inject, Injectable } from '@nestjs/common';
import { RepositorioProducto } from '../../ports/repositorioProducto';
import { ProductoQueryRepository } from '../../ports/productoQueryRepository';

// Defino los campos opcionales que permito actualizar en un producto.
interface ActualizarProductoInput {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  stock?: number;
  imagenUrl?: string;
  categoriaId?: number;
  subcategoriaId?: number;
  enOferta?: boolean;
  precioOferta?: number | null;
}

@Injectable()
// Centralizo la lógica para actualizar productos y registrar ajustes de stock cuando corresponda.
export class ActualizarProducto {
  // Inyecto puertos de escritura y lectura para validar y aplicar cambios.
  constructor(
    @Inject('RepositorioProducto')
    private readonly repositorio: RepositorioProducto,
    @Inject('ProductoQueryRepository')
    private readonly queryRepository: ProductoQueryRepository,
  ) {}

  // Ejecuto validaciones de referencias, aplico cambios y registro un movimiento de stock si varía.
  async ejecutar(id: number, datos: ActualizarProductoInput) {
    const producto = await this.repositorio.encontrarPorId(id);
    if (!producto) {
      return null;
    }

    if (datos.categoriaId) {
      const existeCategoria = await this.queryRepository.verificarCategoria(
        datos.categoriaId,
      );
      if (!existeCategoria) {
        throw new Error('La categoría especificada no existe');
      }
    }

    if (datos.subcategoriaId) {
      const existeSubcategoria =
        await this.queryRepository.verificarSubcategoria(datos.subcategoriaId);
      if (!existeSubcategoria) {
        throw new Error('La subcategoría especificada no existe');
      }
    }

    const stockAnterior = producto.getStock();

    producto.actualizarDatos({
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      precio: datos.precio,
      stock: datos.stock,
      imagenUrl: datos.imagenUrl,
      categoriaId: datos.categoriaId,
      subcategoriaId: datos.subcategoriaId,
      enOferta: datos.enOferta,
      precioOferta: datos.precioOferta ?? undefined,
    });

    await this.repositorio.actualizar(producto);

    if (datos.stock !== undefined && datos.stock !== stockAnterior) {
      const diferencia = datos.stock - stockAnterior;
      await this.queryRepository.registrarMovimientoStock({
        productoId: id,
        cantidad: Math.abs(diferencia),
        estado: 'AJUSTE',
        motivo: 'Actualización manual de stock',
      });
    }

    return this.queryRepository.obtenerDetalle(id);
  }
}
