import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CrearUsuario } from '../useCases/crearUsuario';
import { Usuario, Rol } from '../../domain/entities/usuario';

describe('CrearUsuario use case', () => {
  const repositorioMock = {
    guardar: jest.fn(),
  } as any;

  let useCase: CrearUsuario;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CrearUsuario(repositorioMock);
  });

  it('persiste un usuario con rol por defecto', async () => {
    const usuarioDominio = new Usuario({
      id: 10,
      email: 'demo@test.com',
      contrasena: 'hashed',
      nombre: 'Demo',
      apellido: 'Test',
      rol: Rol.CLIENTE,
    });

    repositorioMock.guardar.mockResolvedValue(usuarioDominio);

    const resultado = await useCase.ejecutar({
      email: 'demo@test.com',
      contrasena: 'hashed',
      nombre: 'Demo',
      apellido: 'Test',
    });

    expect(repositorioMock.guardar).toHaveBeenCalledTimes(1);
    const usuarioPersistido = repositorioMock.guardar.mock.calls[0][0] as Usuario;
    expect(usuarioPersistido).toBeInstanceOf(Usuario);
    expect(usuarioPersistido.getEmail()).toBe('demo@test.com');
    expect(usuarioPersistido.getRol()).toBe(Rol.CLIENTE);
    expect(resultado).toBe(usuarioDominio);
  });

  it('permite especificar un rol distinto', async () => {
    const usuarioDominio = new Usuario({
      id: 11,
      email: 'empleado@test.com',
      contrasena: 'hashed',
      nombre: 'Empleado',
      apellido: 'Test',
      rol: Rol.EMPLEADO,
    });

    repositorioMock.guardar.mockResolvedValue(usuarioDominio);

    await useCase.ejecutar({
      email: 'empleado@test.com',
      contrasena: 'hashed',
      nombre: 'Empleado',
      apellido: 'Test',
      rol: Rol.EMPLEADO,
    });

    const usuarioPersistido = repositorioMock.guardar.mock.calls[0][0] as Usuario;
    expect(usuarioPersistido.getRol()).toBe(Rol.EMPLEADO);
  });
});
