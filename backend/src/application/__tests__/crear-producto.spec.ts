import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CrearProducto } from '../useCases/crearProducto';
import { Producto } from '../../domain/entities/producto';

describe('CrearProducto use case', () => {
  const repositorioMock = {
    guardar: jest.fn(),
  } as any;

  const queryMock = {
    verificarCategoria: jest.fn(),
    verificarSubcategoria: jest.fn(),
    registrarMovimientoStock: jest.fn(),
  } as any;

  const useCase = new CrearProducto(repositorioMock, queryMock);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw if category does not exist', async () => {
    queryMock.verificarCategoria.mockResolvedValue(false);

    await expect(
      useCase.ejecutar({
        nombre: 'Producto',
        precio: 10,
        stock: 1,
        categoriaId: 99,
      }),
    ).rejects.toThrow('La categoría especificada no existe');

    expect(queryMock.verificarCategoria).toHaveBeenCalledWith(99);
    expect(repositorioMock.guardar).not.toHaveBeenCalled();
  });

  it('should persist product and register stock movement', async () => {
    queryMock.verificarCategoria.mockResolvedValue(true);
    queryMock.verificarSubcategoria.mockResolvedValue(true);

    const productoGuardado = new Producto({
      id: 1,
      nombre: 'Producto',
      precio: 10,
      stock: 5,
    });

    repositorioMock.guardar.mockResolvedValue(productoGuardado);

    const result = await useCase.ejecutar({
      nombre: 'Producto',
      descripcion: 'Desc',
      precio: 10,
      stock: 5,
      categoriaId: 1,
      subcategoriaId: 2,
    });

    expect(repositorioMock.guardar).toHaveBeenCalled();
    expect(queryMock.registrarMovimientoStock).toHaveBeenCalledWith({
      productoId: 1,
      cantidad: 5,
      estado: 'ENTRADA',
      motivo: 'Stock inicial',
    });
    expect(result).toBe(productoGuardado);
  });
});
