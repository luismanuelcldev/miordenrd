import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { MetodoPago } from '../../../domain/entities/pedido';
import { Rol } from '../../../domain/entities/usuario';
import { CarritoQueryRepository } from '../../ports/carritoQueryRepository';
import { CrearPedido } from '../crearPedido';
import { PedidoQueryRepository } from '../../ports/pedidoQueryRepository';

// Defino los datos necesarios para convertir un carrito en un pedido válido.
interface ProcesarCheckoutInput {
  usuarioId: number;
  direccionId: number;
  metodoPago: MetodoPago;
  costoEnvio?: number;
}

@Injectable()
// Transformo el carrito del usuario en un pedido, validando permisos, stock y vaciando el carrito al final.
export class ProcesarCheckout {
  // Inyecto los puertos de carrito, pedidos y el caso de uso de creación para componer el flujo.
  constructor(
    @Inject('CarritoQueryRepository')
    private readonly carritoQuery: CarritoQueryRepository,
    private readonly crearPedido: CrearPedido,
    @Inject('PedidoQueryRepository')
    private readonly pedidoQuery: PedidoQueryRepository,
  ) {}

  // Ejecuto validaciones de seguridad y negocio y retorno el detalle del pedido creado.
  async ejecutar(
    input: ProcesarCheckoutInput,
    usuarioActual: { id: number; rol: Rol },
  ) {
    if (
      usuarioActual.id !== input.usuarioId &&
      usuarioActual.rol !== Rol.ADMINISTRADOR
    ) {
      throw new BadRequestException(
        'No puedes procesar el checkout de otro usuario',
      );
    }

    const carrito = await this.carritoQuery.obtenerCarrito(input.usuarioId);
    if (!carrito || carrito.items.length === 0) {
      throw new BadRequestException('Carrito vacío');
    }

    const items = carrito.items.map((item) => {
      if (item.producto.stock < item.cantidad) {
        throw new BadRequestException(
          `Stock insuficiente para ${item.producto.nombre}`,
        );
      }
      return {
        productoId: item.producto.id,
        cantidad: item.cantidad,
        precio: item.producto.precio,
      };
    });

    const pedido = await this.crearPedido.ejecutar({
      usuarioId: input.usuarioId,
      direccionId: input.direccionId,
      metodoPago: input.metodoPago,
      items,
      costoEnvio: input.costoEnvio ?? 0,
    });

    await this.carritoQuery.vaciarCarrito(carrito.id);

    return this.pedidoQuery.obtenerPorId(pedido.getId()!);
  }
}
