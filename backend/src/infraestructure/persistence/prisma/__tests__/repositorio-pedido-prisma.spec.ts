import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { RepositorioPedidoPrisma } from '../repositories/repositorioPedidoPrisma';
import { PrismaService } from '../prisma.service';
import {
  Pedido,
  EstadoPedido,
  MetodoPago,
} from '../../../../domain/entities/pedido';

type AsyncFn = (args?: any) => Promise<any>;

// Decidí probar el repositorio de pedidos aislando Prisma con mocks para validar mapeos y llamadas.
describe('RepositorioPedidoPrisma', () => {
  const prisma = {
    pedido: {
      create: jest.fn(),
      update: jest.fn(),
    },
    itemPedido: {
      createMany: jest.fn(),
    },
  } as unknown as PrismaService;

  const repositorio = new RepositorioPedidoPrisma(prisma);

  // Restablezco mocks en cada caso para evitar interferencias.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Verifico que al guardar se invoca Prisma y retorna una entidad de dominio válida.
  it('guarda un pedido y retorna entidad de dominio', async () => {
    const fecha = new Date();
  const mockCreate = jest.fn<AsyncFn>().mockResolvedValue({
      id: 1,
      estado: 'PENDIENTE',
      total: 100,
      metodoPago: 'TARJETA',
      usuarioId: 1,
      direccionId: 2,
      creadoEn: fecha,
      actualizadoEn: fecha,
    });
    (prisma as any).pedido.create = mockCreate;

    const pedido = new Pedido({
      estado: EstadoPedido.PENDIENTE,
      total: 100,
      metodoPago: MetodoPago.TARJETA,
      usuarioId: 1,
      direccionId: 2,
      creadoEn: fecha,
      actualizadoEn: fecha,
    });

    const result = await repositorio.guardar(pedido);

    expect(prisma.pedido.create).toHaveBeenCalled();
    expect(result).toBeInstanceOf(Pedido);
    expect(result.getId()).toBe(1);
  });

  // Compruebo el guardado masivo de items asociados al pedido.
  it('guarda items asociados a un pedido', async () => {
    await repositorio.guardarItems(1, [
      { productoId: 5, cantidad: 2, precio: 20 },
    ]);

    expect(prisma.itemPedido.createMany).toHaveBeenCalledWith({
      data: [{ pedidoId: 1, productoId: 5, cantidad: 2, precio: 20 }],
    });
  });
});
