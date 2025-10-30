import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ReportesService } from '../reportes.service';
// Mock de PrismaService, no se importa el módulo real

type AsyncFn = (args?: any) => Promise<any>;

// Aquí he probado ReportesService con mocks simples para ventas, productos y usuarios.
describe('ReportesService', () => {
  let service: ReportesService;
  let prisma: any;
  let findPedidos: jest.MockedFunction<AsyncFn>;
  let findProductos: jest.MockedFunction<AsyncFn>;
  let findUsuarios: jest.MockedFunction<AsyncFn>;

  // Aquí he inicializado los mocks de Prisma para cada caso de reporte.
  beforeEach(() => {
    findPedidos = jest.fn<AsyncFn>();
    findProductos = jest.fn<AsyncFn>().mockResolvedValue([
      { id: 1, nombre: 'Prod1', vendidos: 50 },
    ]);
    findUsuarios = jest.fn<AsyncFn>().mockResolvedValue([
      { id: 1, nombre: 'Luis' },
    ]);

    prisma = {
      pedido: { findMany: findPedidos },
      producto: { findMany: findProductos },
      usuario: { findMany: findUsuarios },
    };
    service = new ReportesService(prisma);
  });

  // Aquí he probado el reporte de ventas filtrado por fecha.
  it('debe obtener reporte de ventas', async () => {
    findPedidos.mockResolvedValue([{ id: 1, total: 100 }]);
    const resultado = await service.obtenerReporteVentas({});
    expect(resultado).toEqual([{ id: 1, total: 100 }]);
  });

  // Aquí he probado el listado de productos más vendidos (mock para tests).
  it('debe obtener productos más vendidos', async () => {
    findProductos.mockResolvedValue([{ id: 1, nombre: 'Prod1', vendidos: 50 }]);
    const resultado = await service.productosMasVendidos({});
    expect(resultado).toEqual([{ id: 1, nombre: 'Prod1', vendidos: 50 }]);
  });

  // Aquí he probado el listado de usuarios activos (mock para tests).
  it('debe obtener usuarios activos', async () => {
    findUsuarios.mockResolvedValue([{ id: 1, nombre: 'Luis' }]);
    const resultado = await service.usuariosActivos({});
    expect(resultado).toEqual([{ id: 1, nombre: 'Luis' }]);
  });
});
