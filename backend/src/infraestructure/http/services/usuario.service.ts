import {
  Inject,
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from '../../security/auth.service';
import { Rol, Usuario } from '../../../domain/entities/usuario';
import { CrearUsuario } from '../../../application/useCases/crearUsuario';
import { RepositorioUsuario } from '../../../application/ports/repositorioUsuario';
import { ActualizarUsuarioAdminDto } from '../dto/actualizar-usuario-admin.dto';
import { AuditoriaService } from './auditoria.service';
import { CrearUsuarioDto } from '../dto/crear-usuario.dto';

// Aquí he gestionado usuarios combinando Auth, casos de uso y auditoría, sin exponer detalles de persistencia.
@Injectable()
export class UsuarioService {
  constructor(
    private readonly authService: AuthService,
    private readonly crearUsuario: CrearUsuario,
    @Inject('RepositorioUsuario')
    private readonly repositorioUsuario: RepositorioUsuario,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  // Aquí he listado usuarios y los transformé a un DTO de respuesta.
  async findAll() {
    const usuarios = await this.repositorioUsuario.listar();
    return usuarios.map((usuario) => this.toResponse(usuario));
  }

  // Aquí he obtenido un usuario por id y lanzo 404 si no existe.
  async findById(id: number) {
    const usuario = await this.repositorioUsuario.encontrarPorId(id);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return this.toResponse(usuario);
  }

  // Aquí he creado un usuario nuevo validando email único y registré la acción en auditoría.
  async create(data: CrearUsuarioDto, usuarioActual: { id: number }) {
    const existente = await this.repositorioUsuario.encontrarPorEmail(
      data.email,
    );
    if (existente) {
      throw new ConflictException('El email ya está registrado');
    }

    const contrasena = await this.authService.hashPassword(data.contrasena);
    const usuario = await this.crearUsuario.ejecutar({
      email: data.email,
      contrasena,
      nombre: data.nombre,
      apellido: data.apellido,
      telefono: data.telefono,
      rol: data.rol ?? Rol.CLIENTE,
    });

    await this.auditoriaService.registrarAccion({
      usuarioId: usuarioActual.id,
      modulo: 'USUARIOS',
      accion: 'CREAR',
      descripcion: `Creó al usuario ${usuario.getEmail()} (${usuario.getRol()})`,
    });
    return this.toResponse(usuario);
  }

  // Aquí he actualizado el rol de un usuario y registré auditoría del cambio.
  async actualizarRol(
    usuarioId: number,
    rol: Rol,
    usuarioActual: { id: number },
  ) {
    const usuario = await this.repositorioUsuario.encontrarPorId(usuarioId);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    usuario.cambiarRol(rol);
    const actualizado = await this.repositorioUsuario.actualizar(usuario);

    await this.auditoriaService.registrarAccion({
      usuarioId: usuarioActual.id,
      modulo: 'USUARIOS',
      accion: 'ACTUALIZAR_ROL',
      descripcion: `Actualizó rol de ${usuario.getEmail()} a ${rol}`,
    });
    return this.toResponse(actualizado);
  }

  // Aquí he actualizado datos del usuario permitiendo cambios parciales en perfil y rol.
  async actualizarDatos(
    usuarioId: number,
    datos: ActualizarUsuarioAdminDto,
    usuarioActual: { id: number },
  ) {
    const usuario = await this.repositorioUsuario.encontrarPorId(usuarioId);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (datos.nombre !== undefined || datos.apellido !== undefined) {
      usuario.actualizarPerfil({
        nombre: datos.nombre ?? usuario.getNombre(),
        apellido: datos.apellido ?? usuario.getApellido(),
      });
    }

    if (datos.telefono !== undefined) {
      usuario.actualizarTelefono(datos.telefono);
    }

    if (datos.rol && datos.rol !== usuario.getRol()) {
      usuario.cambiarRol(datos.rol);
    }

    const actualizado = await this.repositorioUsuario.actualizar(usuario);

    await this.auditoriaService.registrarAccion({
      usuarioId: usuarioActual.id,
      modulo: 'USUARIOS',
      accion: 'ACTUALIZAR_DATOS',
      descripcion: `Actualizó datos del usuario ${usuario.getEmail()}`,
    });
    return this.toResponse(actualizado);
  }

  // Aquí he desactivado a un usuario y dejé traza en auditoría.
  async desactivar(usuarioId: number, usuarioActual: { id: number }) {
    const usuario = await this.repositorioUsuario.encontrarPorId(usuarioId);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    usuario.desactivar();
    const actualizado = await this.repositorioUsuario.actualizar(usuario);

    await this.auditoriaService.registrarAccion({
      usuarioId: usuarioActual.id,
      modulo: 'USUARIOS',
      accion: 'DESACTIVAR',
      descripcion: `Desactivó al usuario ${usuario.getEmail()}`,
    });
    return this.toResponse(actualizado);
  }

  // Aquí he activado a un usuario y dejé traza en auditoría.
  async activar(usuarioId: number, usuarioActual: { id: number }) {
    const usuario = await this.repositorioUsuario.encontrarPorId(usuarioId);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    usuario.activar();
    const actualizado = await this.repositorioUsuario.actualizar(usuario);

    await this.auditoriaService.registrarAccion({
      usuarioId: usuarioActual.id,
      modulo: 'USUARIOS',
      accion: 'ACTIVAR',
      descripcion: `Activó al usuario ${usuario.getEmail()}`,
    });
    return this.toResponse(actualizado);
  }

  // Aquí he eliminado un usuario del repositorio y registré la acción.
  async eliminar(usuarioId: number, usuarioActual: { id: number }) {
    const usuario = await this.repositorioUsuario.encontrarPorId(usuarioId);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    await this.repositorioUsuario.eliminar(usuarioId);
    await this.auditoriaService.registrarAccion({
      usuarioId: usuarioActual.id,
      modulo: 'USUARIOS',
      accion: 'ELIMINAR',
      descripcion: `Eliminó al usuario ${usuario.getEmail()}`,
    });
    return { message: 'Usuario eliminado exitosamente' };
  }

  // Aquí he mapeado la entidad de dominio Usuario a una respuesta serializable.
  private toResponse(usuario: Usuario) {
    return {
      id: usuario.getId(),
      nombre: usuario.getNombre(),
      apellido: usuario.getApellido(),
      email: usuario.getEmail(),
      telefono: usuario.getTelefono(),
      rol: usuario.getRol(),
      activo: usuario.estaActivo(),
      creadoEn: usuario.getCreadoEn(),
      actualizadoEn: usuario.getActualizadoEn(),
    };
  }
}
