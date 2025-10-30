import { Producto } from '../../../../domain/entities/producto';

export class ProductoMapper {
  // Opté por mapear explícitamente tipos opcionales (undefined/null) para mantener consistencia entre dominio y base.
  static aDominio(prisma: any): Producto {
    return new Producto({
      id: prisma.id,
      nombre: prisma.nombre,
      descripcion: prisma.descripcion ?? undefined,
      precio: prisma.precio,
      stock: prisma.stock,
      imagenUrl: prisma.imagenUrl ?? undefined,
      categoriaId: prisma.categoriaId ?? undefined,
      subcategoriaId: prisma.subcategoriaId ?? undefined,
      enOferta: prisma.enOferta ?? false,
      precioOferta: prisma.precioOferta ?? undefined,
      creadoEn: prisma.creadoEn,
      actualizadoEn: prisma.actualizadoEn,
    });
  }

  // Convierto la entidad a un payload de Prisma, normalizando opcionales en null cuando corresponde.
  static aPrisma(producto: Producto) {
    return {
      id: producto.getId(),
      nombre: producto.getNombre(),
      descripcion: producto.getDescripcion() ?? null,
      precio: producto.getPrecio(),
      stock: producto.getStock(),
      imagenUrl: producto.getImagenUrl() ?? null,
      categoriaId: producto.getCategoriaId() ?? null,
      subcategoriaId: producto.getSubcategoriaId() ?? null,
      enOferta: producto.estaEnOferta(),
      precioOferta: producto.getPrecioOferta() ?? null,
    };
  }

  // Para updates, proyecto únicamente campos mutables respetando las convenciones de null/undefined.
  static actualizarPrisma(producto: Producto) {
    return {
      nombre: producto.getNombre(),
      descripcion: producto.getDescripcion() ?? null,
      precio: producto.getPrecio(),
      stock: producto.getStock(),
      imagenUrl: producto.getImagenUrl() ?? null,
      categoriaId: producto.getCategoriaId() ?? null,
      subcategoriaId: producto.getSubcategoriaId() ?? null,
      enOferta: producto.estaEnOferta(),
      precioOferta: producto.getPrecioOferta() ?? null,
    };
  }
}
