import { Inject } from '@nestjs/common';
import { Pedido, EstadoPedido, MetodoPago } from '../../domain/entities/pedido';
import { RepositorioPedido } from '../ports/repositorioPedido';
import { RepositorioProducto } from '../ports/repositorioProducto';

// Construyo un pedido a partir de los ítems del carrito, ajustando stock y persistiendo sus ítems asociados.
export class CrearPedido {
  // Inyecto repositorios de pedido y producto para orquestar una operación transaccional.
  constructor(
    @Inject('RepositorioPedido')
    private readonly repositorioPedido: RepositorioPedido,
    @Inject('RepositorioProducto')
    private readonly repositorioProducto: RepositorioProducto,
  ) {}

  // Ejecuto la creación del pedido calculando totales y registrando sus ítems.
  async ejecutar(datos: {
    metodoPago: MetodoPago | string;
    usuarioId: number;
    direccionId: number;
    items: { cantidad: number; precio: number; productoId: number }[];
    costoEnvio?: number;
  }): Promise<Pedido> {
    const metodoPago =
      typeof datos.metodoPago === 'string'
        ? (datos.metodoPago as MetodoPago)
        : datos.metodoPago;

    let totalCalculado = 0;
    const pedido = new Pedido({
      estado: EstadoPedido.PENDIENTE,
      total: 0,
      metodoPago,
      usuarioId: datos.usuarioId,
      direccionId: datos.direccionId,
      costoEnvio: datos.costoEnvio ?? 0,
    });

    for (const item of datos.items) {
      const producto = await this.repositorioProducto.encontrarPorId(
        item.productoId,
      );
      if (!producto) {
        throw new Error(`Producto ${item.productoId} no encontrado`);
      }
      producto.reducirStock(item.cantidad);
      await this.repositorioProducto.actualizar(producto);
      totalCalculado += item.precio * item.cantidad;
    }

    pedido.actualizarTotales(totalCalculado, datos.costoEnvio ?? 0);
    const pedidoGuardado = await this.repositorioPedido.guardar(pedido);
    await this.repositorioPedido.guardarItems(
      pedidoGuardado.getId()!,
      datos.items.map((item) => ({
        productoId: item.productoId,
        cantidad: item.cantidad,
        precio: item.precio,
      })),
    );
    return pedidoGuardado;
  }
}
