import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { ProcesarCheckout } from '../useCases/pedidos/procesarCheckout';
import { MetodoPago } from '../../domain/entities/pedido';
import { CrearPedido } from '../useCases/crearPedido';

type AsyncFn = (args?: any) => Promise<any>;

describe('ProcesarCheckout use case', () => {
  const carritoQuery = {
    obtenerCarrito: jest.fn<AsyncFn>(),
    vaciarCarrito: jest.fn<AsyncFn>(),
  } as any;

  const pedidoQuery = {
    obtenerPorId: jest.fn<AsyncFn>(),
  } as any;

  const crearPedidoEjecutar = jest.fn<AsyncFn>();
  const crearPedido = {
    ejecutar: crearPedidoEjecutar,
  } as unknown as CrearPedido;

  const useCase = new ProcesarCheckout(carritoQuery, crearPedido, pedidoQuery);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should forbid processing checkout for another user when not admin', async () => {
    await expect(
      useCase.ejecutar(
        { usuarioId: 2, direccionId: 1, metodoPago: MetodoPago.TARJETA },
        { id: 1, rol: 'CLIENTE' as any },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw when carrito is empty', async () => {
    carritoQuery.obtenerCarrito.mockResolvedValue({
      id: 1,
      usuarioId: 1,
      items: [],
    });

    await expect(
      useCase.ejecutar(
        { usuarioId: 1, direccionId: 1, metodoPago: MetodoPago.TARJETA },
        { id: 1, rol: 'CLIENTE' as any },
      ),
    ).rejects.toThrow('Carrito vacío');
  });

  it('should create order, clear cart and return detailed order', async () => {
    carritoQuery.obtenerCarrito.mockResolvedValue({
      id: 10,
      usuarioId: 1,
      items: [
        {
          id: 1,
          cantidad: 2,
          producto: { id: 5, nombre: 'Prod', precio: 15, stock: 10 },
        },
      ],
    });
    crearPedidoEjecutar.mockResolvedValue({ getId: () => 99 });
    pedidoQuery.obtenerPorId.mockResolvedValue({ id: 99 });

    const result = await useCase.ejecutar(
      { usuarioId: 1, direccionId: 2, metodoPago: MetodoPago.TARJETA },
      { id: 1, rol: 'CLIENTE' as any },
    );

    expect(crearPedidoEjecutar).toHaveBeenCalledWith({
      usuarioId: 1,
      direccionId: 2,
      metodoPago: MetodoPago.TARJETA,
      items: [{ productoId: 5, cantidad: 2, precio: 15 }],
      costoEnvio: 0,
    });
    expect(carritoQuery.vaciarCarrito).toHaveBeenCalledWith(10);
    expect(result).toEqual({ id: 99 });
  });
});
