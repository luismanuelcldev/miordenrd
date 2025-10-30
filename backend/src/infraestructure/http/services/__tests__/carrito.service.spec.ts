import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CarritoService } from '../carrito.service';
// Mock de PrismaService, no se importa el módulo real
import { NotFoundException, BadRequestException } from '@nestjs/common';

type AsyncFn = (args?: any) => Promise<any>;

// Aquí he probado CarritoService aislando Prisma con mocks para cubrir casos felices y de error.
describe('CarritoService', () => {
  let service: CarritoService;
  let prisma: any;
  let findCarrito: jest.MockedFunction<AsyncFn>;
  let upsertCarrito: jest.MockedFunction<AsyncFn>;
  let findProducto: jest.MockedFunction<AsyncFn>;
  let findItem: jest.MockedFunction<AsyncFn>;
  let updateItem: jest.MockedFunction<AsyncFn>;
  let createItem: jest.MockedFunction<AsyncFn>;

  // Aquí he configurado los mocks de Prisma antes de cada prueba.
  beforeEach(() => {
    findCarrito = jest.fn<AsyncFn>();
    upsertCarrito = jest.fn<AsyncFn>();
    findProducto = jest.fn<AsyncFn>();
    findItem = jest.fn<AsyncFn>();
    updateItem = jest.fn<AsyncFn>();
    createItem = jest.fn<AsyncFn>();

    prisma = {
      carrito: { findUnique: findCarrito, upsert: upsertCarrito },
      producto: { findUnique: findProducto },
      itemCarrito: {
        findFirst: findItem,
        update: updateItem,
        create: createItem,
      },
    };
    service = new CarritoService(prisma);
  });

  // Aquí he verificado que devuelve NotFound cuando el carrito no existe.
  it('debe lanzar NotFoundException si el carrito no existe', async () => {
    findCarrito.mockResolvedValue(null);
    await expect(service.obtenerCarrito(1)).rejects.toThrow(NotFoundException);
  });

  // Aquí he verificado que al agregar producto inexistente lanza NotFound.
  it('debe lanzar NotFoundException si el producto no existe al agregar', async () => {
    findProducto.mockResolvedValue(null);
    await expect(service.agregarProducto(1, 2, 1)).rejects.toThrow(
      NotFoundException,
    );
  });

  // Aquí he verificado que al agregar con stock insuficiente lanza BadRequest.
  it('debe lanzar BadRequestException si el stock es insuficiente', async () => {
    findProducto.mockResolvedValue({ stock: 0 });
    await expect(service.agregarProducto(1, 2, 1)).rejects.toThrow(
      BadRequestException,
    );
  });

  // Aquí he probado el flujo de agregado de producto creando item cuando no existe.
  it('debe agregar producto al carrito exitosamente', async () => {
    findProducto.mockResolvedValue({ stock: 10 });
    upsertCarrito.mockResolvedValue({
      id: 1,
      usuarioId: 1,
    });
    findCarrito.mockResolvedValue({
      id: 1,
      usuarioId: 1,
      items: [],
    });
    findItem.mockResolvedValue(null);
    createItem.mockResolvedValue({
      id: 1,
      carritoId: 1,
      productoId: 2,
      cantidad: 1,
    });
    const resultado = await service.agregarProducto(1, 2, 1);
    expect(resultado).toEqual({ id: 1, usuarioId: 1, items: [] }); // El método retorna el carrito actualizado
  });

  // Aquí he probado obtenerCarrito devolviendo el objeto tal cual del mock.
  it('debe obtener el carrito exitosamente', async () => {
    const carrito = { id: 1, usuarioId: 1, items: [] };
    findCarrito.mockResolvedValue(carrito);
    const resultado = await service.obtenerCarrito(1);
    expect(resultado).toEqual(carrito);
  });
});
