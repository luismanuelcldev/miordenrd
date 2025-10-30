import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ConfiguracionService } from '../../services/configuracion.service';

type AsyncFn = (args?: any) => Promise<any>;

// Aquí he probado ConfiguracionService verificando creación por defecto y actualización con auditoría.
describe('ConfiguracionService', () => {
  let findUnique: jest.MockedFunction<AsyncFn>;
  let createConfig: jest.MockedFunction<AsyncFn>;
  let upsertConfig: jest.MockedFunction<AsyncFn>;

  let prisma: any;

  const auditoriaService = {
    registrarAccion: jest.fn(),
  } as any;

  let service: ConfiguracionService;

  // Aquí he reiniciado los mocks y preparado el Prisma simulado.
  beforeEach(() => {
    jest.clearAllMocks();
    findUnique = jest.fn<AsyncFn>();
    createConfig = jest.fn<AsyncFn>();
    upsertConfig = jest.fn<AsyncFn>();

    prisma = {
      configuracionSistema: {
        findUnique,
        create: createConfig,
        upsert: upsertConfig,
      },
    };
    service = new ConfiguracionService(prisma, auditoriaService);
  });

  // Aquí he verificado que si no existe configuración, se crea con valores por defecto.
  it('crea valores por defecto cuando no existe configuración', async () => {
    findUnique.mockResolvedValue(null);
    createConfig.mockImplementation(({ data }: any) => data);

    const configuracion = await service.obtener();

    expect(createConfig).toHaveBeenCalledTimes(1);
    expect(configuracion.nombreTienda).toBe('Mi Orden RD');
    expect(configuracion.moneda).toBe('RD$');
  });

  // Aquí he verificado que al actualizar se hace upsert y se registra auditoría.
  it('actualiza configuración y registra auditoría', async () => {
    upsertConfig.mockResolvedValue({
      id: 1,
      nombreTienda: 'Mi Orden RD',
      email: 'nuevo@correo.com',
      moneda: 'RD$',
    });

    const resultado = await service.actualizar(
      ({
        nombreTienda: 'Mi Orden RD',
        descripcion: 'Demo',
        email: 'nuevo@correo.com',
        telefono: null,
        direccion: null,
        notificacionesPedidos: true,
        notificacionesStock: false,
        notificacionesClientes: false,
        autenticacionDosFactor: false,
        sesionExpiracion: 24,
        envioGratis: 0,
        costoEnvio: 0,
        tiempoEntrega: null,
        iva: 18,
        moneda: 'RD$',
        colorPrimario: '#2b62e1',
        colorSecundario: '#1f2937',
      logoUrl: '',
    } as any),
      { id: 7 },
    );

    expect(upsertConfig).toHaveBeenCalledWith({
      where: { id: 1 },
      create: expect.any(Object),
      update: expect.objectContaining({
        email: 'nuevo@correo.com',
      }),
    });
    expect(resultado.email).toBe('nuevo@correo.com');
    expect(auditoriaService.registrarAccion).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: 7,
        modulo: 'CONFIGURACION',
        accion: 'ACTUALIZAR',
      }),
    );
  });
});
