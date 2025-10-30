import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma/prisma.service';

@Injectable()
export class CarritoService {
  // Aquí he inyectado Prisma para operar el carrito sin exponer detalles de persistencia.
  constructor(private readonly prisma: PrismaService) {}

  // Aquí he recuperado el carrito del usuario incluyendo sus items y productos asociados.
  async obtenerCarrito(usuarioId: number) {
    const carrito = await this.prisma.carrito.findUnique({
      where: { usuarioId },
      include: { items: { include: { producto: true } } },
    });
    if (!carrito) throw new NotFoundException('Carrito no encontrado');
    return carrito;
  }

  // Aquí he agregado un producto al carrito, validando stock y creando/actualizando el item.
  async agregarProducto(
    usuarioId: number,
    productoId: number,
    cantidad: number,
  ) {
    const producto = await this.prisma.producto.findUnique({
      where: { id: productoId },
    });
    if (!producto) throw new NotFoundException('Producto no encontrado');
    if (producto.stock < cantidad)
      throw new BadRequestException('Stock insuficiente');

    // Actualizar o crear item en el carrito
    const carrito = await this.prisma.carrito.upsert({
      where: { usuarioId },
      update: {},
      create: { usuarioId },
    });
    const itemExistente = await this.prisma.itemCarrito.findFirst({
      where: { carritoId: carrito.id, productoId },
    });
    if (itemExistente) {
      await this.prisma.itemCarrito.update({
        where: { id: itemExistente.id },
        data: { cantidad: itemExistente.cantidad + cantidad },
      });
    } else {
      await this.prisma.itemCarrito.create({
        data: { carritoId: carrito.id, productoId, cantidad },
      });
    }
    return this.obtenerCarrito(usuarioId);
  }

  // Aquí he editado la cantidad del item del carrito validando stock disponible.
  async editarProducto(usuarioId: number, itemId: number, cantidad: number) {
    const item = await this.prisma.itemCarrito.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new NotFoundException('Item no encontrado');
    const producto = await this.prisma.producto.findUnique({
      where: { id: item.productoId },
    });
    if (!producto) throw new NotFoundException('Producto no encontrado');
    if (producto.stock < cantidad)
      throw new BadRequestException('Stock insuficiente');
    await this.prisma.itemCarrito.update({
      where: { id: itemId },
      data: { cantidad },
    });
    return this.obtenerCarrito(usuarioId);
  }

  // Aquí he eliminado un item del carrito y devuelvo el carrito actualizado.
  async eliminarProducto(usuarioId: number, itemId: number) {
    const item = await this.prisma.itemCarrito.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new NotFoundException('Item no encontrado');
    await this.prisma.itemCarrito.delete({ where: { id: itemId } });
    return this.obtenerCarrito(usuarioId);
  }
}
