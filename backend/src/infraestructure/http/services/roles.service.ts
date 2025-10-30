import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma/prisma.service';
import { Rol } from '../../../domain/entities/usuario';

const selectUsuarioLigero = {
  id: true,
  nombre: true,
  apellido: true,
  email: true,
  rol: true,
  activo: true,
  actualizadoEn: true,
} as const;

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  // Aquí he expuesto el catálogo de roles disponibles en el dominio.
  async obtenerRoles() {
    return Object.values(Rol);
  }

  // Aquí he asignado un rol a un usuario tras verificar su existencia.
  async asignarRol(usuarioId: number, rol: Rol) {
    await this.assertUsuarioExiste(usuarioId);
    const actualizado = await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { rol },
      select: selectUsuarioLigero,
    });
    return { mensaje: 'Rol asignado correctamente', usuario: actualizado };
  }

  // Aquí he editado el rol de un usuario existente devolviendo una vista ligera.
  async editarRol(usuarioId: number, nuevoRol: Rol) {
    await this.assertUsuarioExiste(usuarioId);
    const actualizado = await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { rol: nuevoRol },
      select: selectUsuarioLigero,
    });
    return { mensaje: 'Rol editado correctamente', usuario: actualizado };
  }

  // Aquí he restablecido el rol del usuario a CLIENTE como eliminación lógica del rol.
  async eliminarRol(usuarioId: number) {
    await this.assertUsuarioExiste(usuarioId);
    const actualizado = await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { rol: Rol.CLIENTE },
      select: selectUsuarioLigero,
    });
    return {
      mensaje: 'Rol eliminado, usuario ahora es CLIENTE',
      usuario: actualizado,
    };
  }

  // Aquí he validado que el usuario exista antes de modificar su rol.
  private async assertUsuarioExiste(usuarioId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
  }
}
