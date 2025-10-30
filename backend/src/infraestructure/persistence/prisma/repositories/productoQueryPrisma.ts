import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  FiltrosProducto,
  MovimientoStock,
  ProductoDetalle,
  ProductoListado,
  ProductoQueryRepository,
  RegistrarMovimientoStockInput,
} from '../../../../application/ports/productoQueryRepository';

@Injectable()
export class ProductoQueryPrisma implements ProductoQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Expongo un listado de productos con múltiples filtros y ordenamiento seguro.
  async listar(filtros: FiltrosProducto): Promise<ProductoListado[]> {
    const {
      search,
      categoriaId,
      precioMin,
      precioMax,
      ordenarPor,
      orden = 'asc',
      page,
      limit,
      enOferta,
    } = filtros;

    const where: any = {};

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoriaId) {
      where.categoriaId = categoriaId;
    }

    if (enOferta !== undefined) {
      where.enOferta = enOferta;
    }

    if (precioMin !== undefined || precioMax !== undefined) {
      where.precio = {};

      if (precioMin !== undefined) {
        where.precio.gte = precioMin;
      }

      if (precioMax !== undefined) {
        where.precio.lte = precioMax;
      }
    }

    const orderBy: any = {};
    if (ordenarPor) {
      const camposValidos = ['nombre', 'precio', 'creadoEn', 'stock'];
      if (camposValidos.includes(ordenarPor)) {
        orderBy[ordenarPor] = orden;
      } else {
        orderBy.creadoEn = 'desc';
      }
    } else {
      orderBy.creadoEn = 'desc';
    }

    const productos = (await this.prisma.producto.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true,
          },
        },
        subcategoria: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    })) as any[];

    return productos.map((producto: any) => ({
      id: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      precioOferta: producto.precioOferta ?? null,
      stock: producto.stock,
      imagenUrl: producto.imagenUrl,
      enOferta: Boolean(producto.enOferta),
      categoria: producto.categoria
        ? { id: producto.categoria.id, nombre: producto.categoria.nombre }
        : undefined,
      subcategoria: producto.subcategoria
        ? { id: producto.subcategoria.id, nombre: producto.subcategoria.nombre }
        : undefined,
      creadoEn: producto.creadoEn,
      actualizadoEn: producto.actualizadoEn,
    }));
  }

  // Calculo el total para paginación reutilizando los mismos criterios de filtro.
  async contar(filtros: FiltrosProducto): Promise<number> {
    const { search, categoriaId, precioMin, precioMax, enOferta } = filtros;
    const where: any = {};

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoriaId) {
      where.categoriaId = categoriaId;
    }

    if (enOferta !== undefined) {
      where.enOferta = enOferta;
    }

    if (precioMin !== undefined || precioMax !== undefined) {
      where.precio = {};

      if (precioMin !== undefined) {
        where.precio.gte = precioMin;
      }

      if (precioMax !== undefined) {
        where.precio.lte = precioMax;
      }
    }

    return this.prisma.producto.count({ where });
  }

  // Devuelvo el detalle de un producto con categoría, subcategoría e historial de stock reciente.
  async obtenerDetalle(id: number): Promise<ProductoDetalle | null> {
    const producto = (await this.prisma.producto.findUnique({
      where: { id },
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
          },
        },
        subcategoria: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
          },
        },
        historialStock: {
          orderBy: { fecha: 'desc' },
          take: 10,
        },
      },
    })) as any;

    if (!producto) {
      return null;
    }

    const historial: MovimientoStock[] = producto.historialStock.map(
      (registro) => ({
        id: registro.id,
        cantidad: registro.cantidad,
        estado: registro.estado,
        motivo: registro.motivo,
        fecha: registro.fecha,
      }),
    );

    return {
      id: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      precioOferta: producto.precioOferta ?? null,
      stock: producto.stock,
      imagenUrl: producto.imagenUrl,
      enOferta: Boolean(producto.enOferta),
      categoria: producto.categoria
        ? {
            id: producto.categoria.id,
            nombre: producto.categoria.nombre,
            descripcion: producto.categoria.descripcion,
          }
        : undefined,
      subcategoria: producto.subcategoria
        ? {
            id: producto.subcategoria.id,
            nombre: producto.subcategoria.nombre,
            descripcion: producto.subcategoria.descripcion,
          }
        : undefined,
      historialStock: historial,
      creadoEn: producto.creadoEn,
      actualizadoEn: producto.actualizadoEn,
    };
  }

  // Verifico existencia de categoría para validaciones de entrada.
  async verificarCategoria(id: number): Promise<boolean> {
    if (!id) return false;
    const categoria = await this.prisma.categoria.findUnique({ where: { id } });
    return Boolean(categoria);
  }

  // Verifico existencia de subcategoría para validaciones de entrada.
  async verificarSubcategoria(id: number): Promise<boolean> {
    if (!id) return false;
    const subcategoria = await this.prisma.subcategoria.findUnique({
      where: { id },
    });
    return Boolean(subcategoria);
  }

  // Registro un movimiento de stock como parte de operaciones de inventario.
  async registrarMovimientoStock(
    data: RegistrarMovimientoStockInput,
  ): Promise<void> {
    await this.prisma.historialStock.create({
      data: {
        productoId: data.productoId,
        cantidad: data.cantidad,
        estado: data.estado,
        motivo: data.motivo,
      },
    });
  }

  // Compruebo si el producto aparece en algún pedido para proteger eliminaciones.
  async existePedidoAsociado(productoId: number): Promise<boolean> {
    const pedido = await this.prisma.itemPedido.findFirst({
      where: { productoId },
    });
    return Boolean(pedido);
  }

  // Efectúo una eliminación total del producto y sus dependencias en una transacción.
  async eliminarProductoTotal(productoId: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.itemCarrito.deleteMany({ where: { productoId } });
      await tx.historialStock.deleteMany({ where: { productoId } });
      await tx.reporteVenta.deleteMany({
        where: { productoMasVendidoId: productoId },
      });
      await tx.producto.delete({ where: { id: productoId } });
    });
  }
}
