// Implementé el repositorio de Producto sobre Prisma para mantener el dominio desacoplado de la base.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RepositorioProducto } from '../../../../application/ports/repositorioProducto';
import { Producto } from '../../../../domain/entities/producto';
import { ProductoMapper } from '../mappers/productoMapper';

@Injectable()
export class RepositorioProductoPrisma implements RepositorioProducto {
  constructor(private prisma: PrismaService) {}

  // Persiste un producto nuevo y reconstruyo la entidad desde el resultado Prisma.
  async guardar(producto: Producto): Promise<Producto> {
    const data = ProductoMapper.aPrisma(producto);
    const creado = await this.prisma.producto.create({ data });
    return ProductoMapper.aDominio(creado);
  }

  // Busca por id y devuelve la entidad de dominio o null.
  async encontrarPorId(id: number): Promise<Producto | null> {
    const producto = await this.prisma.producto.findUnique({ where: { id } });
    return producto ? ProductoMapper.aDominio(producto) : null;
  }

  // Lista productos con filtros sencillos de categoría y texto libre.
  async listar(
    params: { categoriaId?: number; texto?: string } = {},
  ): Promise<Producto[]> {
    const productos = await this.prisma.producto.findMany({
      where: {
        categoriaId: params.categoriaId ?? undefined,
        OR: params.texto
          ? [
              { nombre: { contains: params.texto, mode: 'insensitive' } },
              { descripcion: { contains: params.texto, mode: 'insensitive' } },
            ]
          : undefined,
      },
      orderBy: { creadoEn: 'desc' },
    });
    return productos.map(ProductoMapper.aDominio);
  }

  // Actualiza un producto existente validando que tenga id.
  async actualizar(producto: Producto): Promise<Producto> {
    const id = producto.getId();
    if (!id) {
      throw new Error('No es posible actualizar un producto sin identificador');
    }
    const data = ProductoMapper.actualizarPrisma(producto);
    const actualizado = await this.prisma.producto.update({
      where: { id },
      data,
    });
    return ProductoMapper.aDominio(actualizado);
  }

  // Elimina definitivamente el producto por id.
  async eliminar(id: number): Promise<void> {
    await this.prisma.producto.delete({ where: { id } });
  }
}
