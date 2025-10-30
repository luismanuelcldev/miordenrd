import { Usuario, Rol } from '../../../../domain/entities/usuario';

export class UsuarioMapper {
  // Trabajo con resultados de Prisma (findUnique/findFirst) y los llevo a mi entidad de dominio.
  static aDominio(prisma: any): Usuario {
    return new Usuario({
      id: prisma.id,
      nombre: prisma.nombre || undefined,
      apellido: prisma.apellido || undefined,
      email: prisma.email,
      contrasena: prisma.contrasena,
      rol: Rol[prisma.rol as keyof typeof Rol],
      telefono: prisma.telefono || undefined,
      activo: prisma.activo,
      creadoEn: prisma.creadoEn,
      actualizadoEn: prisma.actualizadoEn,
    });
  }

  // Al crear/guardar, proyecto la entidad de dominio al shape aceptado por Prisma.
  static aPrisma(usuario: Usuario) {
    return {
      id: usuario.getId(),
      nombre: usuario.getNombre() ?? null,
      apellido: usuario.getApellido() ?? null,
      email: usuario.getEmail(),
      contrasena: usuario.getContrasena(),
      rol: usuario.getRol(),
      telefono: usuario.getTelefono() ?? null,
      activo: usuario.estaActivo(),
    };
  }

  // Para actualizar, mantengo sólo campos modificables y dejo que Prisma gestione timestamps.
  static actualizarPrisma(usuario: Usuario) {
    return {
      nombre: usuario.getNombre(),
      apellido: usuario.getApellido(),
      contrasena: usuario.getContrasena(),
      rol: usuario.getRol(),
      telefono: usuario.getTelefono() ?? null,
      activo: usuario.estaActivo(),
    };
  }
}
