// Decidí implementar el repositorio de Pedido sobre Prisma para aislar la persistencia del dominio.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RepositorioPedido } from '../../../../application/ports/repositorioPedido';
import { Pedido } from '../../../../domain/entities/pedido';
import { PedidoMapper } from '../mappers/pedidoMapper';

@Injectable()
export class RepositorioPedidoPrisma implements RepositorioPedido {
  constructor(private prisma: PrismaService) {}

  // Guardo un pedido nuevo y regreso la entidad reconstruida desde el resultado de Prisma.
  async guardar(pedido: Pedido): Promise<Pedido> {
    const data = PedidoMapper.aPrisma(pedido);
    const creado = await this.prisma.pedido.create({
      data,
    });
    return PedidoMapper.aDominio(creado);
  }

  // Recupero un pedido por id; si no existe, devuelvo null.
  async encontrarPorId(id: number): Promise<Pedido | null> {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
    });
    return pedido ? PedidoMapper.aDominio(pedido) : null;
  }

  // Listo pedidos por usuario ordenados por fecha de creación.
  async listarPorUsuario(usuarioId: number): Promise<Pedido[]> {
    const pedidos = await this.prisma.pedido.findMany({
      where: { usuarioId },
      orderBy: { creadoEn: 'desc' },
    });
    return pedidos.map(PedidoMapper.aDominio);
  }

  // Actualizo un pedido existente proyectando sólo campos mutables.
  async actualizar(pedido: Pedido): Promise<Pedido> {
    const data = PedidoMapper.actualizarPrisma(pedido);
    const actualizado = await this.prisma.pedido.update({
      where: { id: pedido.getId() },
      data,
    });
    return PedidoMapper.aDominio(actualizado);
  }

  // Inserto en bloque los ítems del pedido para eficiencia; si no hay ítems, no hago nada.
  async guardarItems(
    pedidoId: number,
    items: { productoId: number; cantidad: number; precio: number }[],
  ): Promise<void> {
    if (items.length === 0) return;
    await this.prisma.itemPedido.createMany({
      data: items.map((item) => ({
        pedidoId,
        productoId: item.productoId,
        cantidad: item.cantidad,
        precio: item.precio,
      })),
    });
  }
}
