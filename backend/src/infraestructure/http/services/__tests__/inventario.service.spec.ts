import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { InventarioService } from '../inventario.service';
import { TipoAjusteInventario } from '../../dto/registrar-ajuste-inventario.dto';
// Mock de PrismaService, no se importa el módulo real
import { NotFoundException } from '@nestjs/common';

type AsyncFn = (args?: any) => Promise<any>;

// Aquí he probado InventarioService validando consulta de stock y ajustes positivos/negativos.
describe('InventarioService', () => {
  let service: InventarioService;
  let prisma: any;
  let findProducto: jest.MockedFunction<AsyncFn>;
  let findProductos: jest.MockedFunction<AsyncFn>;
  let updateProducto: jest.MockedFunction<AsyncFn>;
  let createHistorial: jest.MockedFunction<AsyncFn>;

  // Aquí he preparado los mocks de Prisma y la transacción para cada prueba.
  beforeEach(() => {
    findProducto = jest.fn<AsyncFn>();
    findProductos = jest.fn<AsyncFn>();
    updateProducto = jest.fn<AsyncFn>();
    createHistorial = jest.fn<AsyncFn>();

    prisma = {
      producto: {
        findUnique: findProducto,
        findMany: findProductos,
        update: updateProducto,
      },
      historialStock: { create: createHistorial },
      $transaction: jest.fn((acciones: Promise<unknown>[]) => Promise.all(acciones)),
    };
    service = new InventarioService(prisma);
  });

  // Aquí he verificado que al ajustar un producto inexistente se lanza NotFound.
  it('debe lanzar NotFoundException si el producto no existe al ajustar inventario', async () => {
    findProducto.mockResolvedValue(null);
    await expect(
      service.registrarAjuste({
        productoId: 1,
        cantidad: 5,
        estado: TipoAjusteInventario.AJUSTE,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  // Aquí he probado la consulta de stock devolviendo la lista del mock.
  it('debe consultar el stock de productos correctamente', async () => {
    const productos = [{ id: 1, nombre: 'Prod1', stock: 10 }];
    findProductos.mockResolvedValue(productos);
    const resultado = await service.consultarStock();
    expect(resultado).toEqual(productos);
  });

  // Aquí he probado registrar un ajuste y obtener el nuevo stock actualizado.
  it('debe registrar ajuste de inventario exitosamente', async () => {
    const producto = { id: 1, nombre: 'Prod1', stock: 10 };
    findProducto.mockResolvedValue(producto);
    createHistorial.mockResolvedValue({});
    updateProducto.mockResolvedValue({});
    findProducto.mockResolvedValue({
      id: 1,
      nombre: 'Prod1',
      stock: 15,
    });
    const resultado = await service.registrarAjuste({
      productoId: 1,
      cantidad: 5,
      estado: TipoAjusteInventario.AJUSTE,
      motivo: 'Reposición',
    });
    expect(resultado).toEqual({ id: 1, nombre: 'Prod1', stock: 15 });
  });
});
