import { Inject, Injectable } from '@nestjs/common';
import { Producto } from '../../domain/entities/producto';
import { RepositorioProducto } from '../ports/repositorioProducto';
import { ProductoQueryRepository } from '../ports/productoQueryRepository';

@Injectable()
// Orquesto la creación de productos validando referencias y registrando movimientos de stock inicial.
export class CrearProducto {
  // Inyecto puertos de escritura y lectura para componer la operación sin dependencia directa de Prisma.
  constructor(
    @Inject('RepositorioProducto')
    private readonly repositorio: RepositorioProducto,
    @Inject('ProductoQueryRepository')
    private readonly productoQuery: ProductoQueryRepository,
  ) {}

  // Ejecuto validaciones, construyo la entidad y registro un movimiento si se definió stock inicial.
  async ejecutar(datos: {
    nombre: string;
    descripcion?: string;
    precio: number;
    stock: number;
    imagenUrl?: string;
    categoriaId?: number;
    subcategoriaId?: number;
    enOferta?: boolean;
    precioOferta?: number;
  }): Promise<Producto> {
    if (datos.categoriaId) {
      const existeCategoria = await this.productoQuery.verificarCategoria(
        datos.categoriaId,
      );
      if (!existeCategoria) {
        throw new Error('La categoría especificada no existe');
      }
    }

    if (datos.subcategoriaId) {
      const existeSubcategoria = await this.productoQuery.verificarSubcategoria(
        datos.subcategoriaId,
      );
      if (!existeSubcategoria) {
        throw new Error('La subcategoría especificada no existe');
      }
    }

    const producto = new Producto(datos);
    const creado = await this.repositorio.guardar(producto);

    if (datos.stock && datos.stock > 0) {
      await this.productoQuery.registrarMovimientoStock({
        productoId: creado.getId()!,
        cantidad: datos.stock,
        estado: 'ENTRADA',
        motivo: 'Stock inicial',
      });
    }

    return creado;
  }
}
