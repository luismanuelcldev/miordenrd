import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ActualizarEstadoPedido } from '../useCases/pedidos/actualizarEstadoPedido';
import { Pedido, EstadoPedido, MetodoPago } from '../../domain/entities/pedido';
import { Rol } from '../../domain/entities/usuario';

describe('ActualizarEstadoPedido use case', () => {
  const repositorioPedido = {
    encontrarPorId: jest.fn(),
    actualizar: jest.fn(),
  } as any;

  const queryRepository = {
    obtenerPorId: jest.fn(),
    registrarNotificacion: jest.fn(),
  } as any;

  let useCase: ActualizarEstadoPedido;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ActualizarEstadoPedido(repositorioPedido, queryRepository);
  });

  const pedidoBase = () =>
    new Pedido({
      id: 55,
      estado: EstadoPedido.PENDIENTE,
      total: 100,
      metodoPago: MetodoPago.TARJETA,
      usuarioId: 1,
      direccionId: 1,
      repartidorId: 99,
    });

  it('devuelve null si el pedido no existe', async () => {
    repositorioPedido.encontrarPorId.mockResolvedValue(null);

    const resultado = await useCase.ejecutar(33, EstadoPedido.EN_PREPARACION, {
      id: 1,
      rol: Rol.ADMINISTRADOR,
    });

    expect(resultado).toBeNull();
    expect(repositorioPedido.actualizar).not.toHaveBeenCalled();
  });

  it('impide a un repartidor actualizar pedidos ajenos', async () => {
    repositorioPedido.encontrarPorId.mockResolvedValue(pedidoBase());

    await expect(
      useCase.ejecutar(55, EstadoPedido.EN_PREPARACION, {
        id: 123,
        rol: Rol.REPARTIDOR,
      }),
    ).rejects.toThrow('No tienes permisos para cambiar el estado de este pedido');
  });

  it('lanza error cuando la transición no es válida', async () => {
    const pedido = pedidoBase();
    pedido.actualizarEstado(EstadoPedido.EN_PREPARACION);
    repositorioPedido.encontrarPorId.mockResolvedValue(pedido);

    await expect(
      useCase.ejecutar(55, EstadoPedido.PENDIENTE, {
        id: 99,
        rol: Rol.REPARTIDOR,
      }),
    ).rejects.toThrow(
      `No se puede cambiar el estado de ${EstadoPedido.EN_PREPARACION} a ${EstadoPedido.PENDIENTE}`,
    );
  });

  it('permite al repartidor avanzar el pedido y registra notificación', async () => {
    const pedido = pedidoBase();
    repositorioPedido.encontrarPorId.mockResolvedValue(pedido);
    queryRepository.obtenerPorId.mockResolvedValue({
      id: 55,
      usuario: { email: 'cliente@test.com' },
    });

    const resultado = await useCase.ejecutar(55, EstadoPedido.EN_PREPARACION, {
      id: 99,
      rol: Rol.REPARTIDOR,
    });

    expect(repositorioPedido.actualizar).toHaveBeenCalledTimes(1);
    expect(queryRepository.registrarNotificacion).toHaveBeenCalledWith({
      pedidoId: 55,
      email: 'cliente@test.com',
      mensaje: 'Tu pedido está siendo preparado',
    });
    expect(resultado).toEqual({
      id: 55,
      usuario: { email: 'cliente@test.com' },
    });
  });
});
