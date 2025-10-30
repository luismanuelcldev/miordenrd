import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsuarioService } from '../../services/usuario.service';
import { Rol, Usuario } from '../../../../domain/entities/usuario';

const crearUsuarioDominio = (overrides: Partial<ConstructorParameters<typeof Usuario>[0]> = {}) =>
  new Usuario({
    id: 10,
    email: 'demo@test.com',
    contrasena: 'hashed',
    nombre: 'Demo',
    apellido: 'Usuario',
    rol: Rol.CLIENTE,
    ...overrides,
  });

// Aquí he probado UsuarioService cubriendo creación, actualización, estado y errores esperados.
describe('UsuarioService', () => {
  const authService = {
    hashPassword: jest.fn(),
  } as any;

  const crearUsuario = {
    ejecutar: jest.fn(),
  } as any;

  const repositorio = {
    listar: jest.fn(),
    encontrarPorId: jest.fn(),
    encontrarPorEmail: jest.fn(),
    actualizar: jest.fn(),
    eliminar: jest.fn(),
  } as any;

  const auditoriaService = {
    registrarAccion: jest.fn(),
  } as any;

  let service: UsuarioService;

  // Aquí he limpiado mocks y he instanciado el servicio con dependencias simuladas.
  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsuarioService(
      authService,
      crearUsuario,
      repositorio,
      auditoriaService,
    );
  });

  // Aquí he verificado que se aplica hash a la contraseña y se registra auditoría al crear.
  it('crea un usuario nuevo aplicando hash a la contraseña', async () => {
    repositorio.encontrarPorEmail.mockResolvedValue(null);
    authService.hashPassword.mockResolvedValue('hashed-password');
    const dominio = crearUsuarioDominio({ contrasena: 'hashed-password' });
    crearUsuario.ejecutar.mockResolvedValue(dominio);

    const resultado = await service.create(
      {
        email: 'demo@test.com',
        contrasena: 'Plain123',
        nombre: 'Demo',
        apellido: 'Usuario',
        telefono: '123',
        rol: Rol.CLIENTE,
      },
      { id: 1 },
    );

    expect(authService.hashPassword).toHaveBeenCalledWith('Plain123');
    expect(crearUsuario.ejecutar).toHaveBeenCalledWith({
      email: 'demo@test.com',
      contrasena: 'hashed-password',
      nombre: 'Demo',
      apellido: 'Usuario',
      telefono: '123',
      rol: Rol.CLIENTE,
    });
    expect(auditoriaService.registrarAccion).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: 1,
        modulo: 'USUARIOS',
        accion: 'CREAR',
      }),
    );
    expect(resultado.email).toBe('demo@test.com');
    expect(resultado.rol).toBe(Rol.CLIENTE);
  });

  // Aquí he verificado que no permite crear si el email ya existe.
  it('lanza excepción cuando el email ya existe', async () => {
    repositorio.encontrarPorEmail.mockResolvedValue({});

    await expect(
      service.create(
        {
          email: 'demo@test.com',
          contrasena: 'Plain123',
        } as any,
        { id: 1 },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  // Aquí he verificado la actualización parcial de datos y el registro en auditoría.
  it('actualiza datos y registra auditoría', async () => {
    const usuario = crearUsuarioDominio();
    repositorio.encontrarPorId.mockResolvedValue(usuario);
    const actualizado = crearUsuarioDominio({
      nombre: 'Nuevo',
      telefono: '555',
    });
    repositorio.actualizar.mockResolvedValue(actualizado);

    const result = await service.actualizarDatos(
      10,
      { nombre: 'Nuevo', telefono: '555' },
      { id: 2 },
    );

    expect(repositorio.actualizar).toHaveBeenCalled();
    expect(result.nombre).toBe('Nuevo');
    expect(result.telefono).toBe('555');
    expect(auditoriaService.registrarAccion).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: 2,
        accion: 'ACTUALIZAR_DATOS',
      }),
    );
  });

  // Aquí he verificado que el usuario se marca como inactivo y audita la acción.
  it('marca usuario como inactivo', async () => {
    const usuario = crearUsuarioDominio();
    repositorio.encontrarPorId.mockResolvedValue(usuario);
    const usuarioDesactivado = crearUsuarioDominio({ activo: false });
    repositorio.actualizar.mockResolvedValue(usuarioDesactivado);

    const resultado = await service.desactivar(10, { id: 9 });

    expect(resultado.activo).toBe(false);
    expect(auditoriaService.registrarAccion).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'DESACTIVAR' }),
    );
  });

  // Aquí he verificado que al intentar actualizar uno inexistente lanza NotFound.
  it('lanza NotFound cuando no existe al actualizar', async () => {
    repositorio.encontrarPorId.mockResolvedValue(null);

    await expect(
      service.actualizarDatos(5, { nombre: 'X' }, { id: 1 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
