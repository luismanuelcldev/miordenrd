import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CarritoDetalle,
  CarritoQueryRepository,
} from '../../../../application/ports/carritoQueryRepository';

@Injectable()
export class CarritoQueryPrisma implements CarritoQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Con este método obtengo el carrito con sus items y un resumen del producto.
  async obtenerCarrito(usuarioId: number): Promise<CarritoDetalle | null> {
    const carrito = await this.prisma.carrito.findUnique({
      where: { usuarioId },
      include: {
        items: {
          include: {
            producto: {
              select: {
                id: true,
                nombre: true,
                precio: true,
                stock: true,
              },
            },
          },
        },
      },
    });

    if (!carrito) return null;

    // Prefiero devolver un DTO liviano con lo necesario para la UI.
    return {
      id: carrito.id,
      usuarioId: carrito.usuarioId,
      items: carrito.items.map((item) => ({
        id: item.id,
        cantidad: item.cantidad,
        producto: {
          id: item.producto.id,
          nombre: item.producto.nombre,
          precio: item.producto.precio,
          stock: item.producto.stock,
        },
      })),
    };
  }

  // Con esta operación vacío el carrito eliminando todos sus items.
  async vaciarCarrito(carritoId: number): Promise<void> {
    await this.prisma.itemCarrito.deleteMany({ where: { carritoId } });
  }
}
