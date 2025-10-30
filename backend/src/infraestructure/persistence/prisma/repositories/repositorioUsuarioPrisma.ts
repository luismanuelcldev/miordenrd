import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RepositorioUsuario } from '../../../../application/ports/repositorioUsuario';
import { Usuario } from '../../../../domain/entities/usuario';
import { UsuarioMapper } from '../mappers/usuarioMapper';

@Injectable()
export class RepositorioUsuarioPrisma implements RepositorioUsuario {
  constructor(private prisma: PrismaService) {}

  // Persiste un usuario y devuelvo su entidad de dominio reconstruida.
  async guardar(usuario: Usuario): Promise<Usuario> {
    const data = UsuarioMapper.aPrisma(usuario);
    const creado = await this.prisma.usuario.create({ data });
    return UsuarioMapper.aDominio(creado);
  }

  // Encuentra por id y mapea a dominio o null.
  async encontrarPorId(id: number): Promise<Usuario | null> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    return usuario ? UsuarioMapper.aDominio(usuario) : null;
  }

  // Busca por email para flujos de autenticación/administración.
  async encontrarPorEmail(email: string): Promise<Usuario | null> {
    const usuario = await this.prisma.usuario.findUnique({ where: { email } });
    return usuario ? UsuarioMapper.aDominio(usuario) : null;
  }

  // Lista usuarios ordenados por fecha de creación.
  async listar(): Promise<Usuario[]> {
    const usuarios = await this.prisma.usuario.findMany({
      orderBy: { creadoEn: 'desc' },
    });
    return usuarios.map(UsuarioMapper.aDominio);
  }

  // Actualiza datos del usuario validando la presencia del id.
  async actualizar(usuario: Usuario): Promise<Usuario> {
    const id = usuario.getId();
    if (!id) {
      throw new Error('No es posible actualizar un usuario sin identificador');
    }
    const data = UsuarioMapper.actualizarPrisma(usuario);
    const actualizado = await this.prisma.usuario.update({
      where: { id },
      data,
    });
    return UsuarioMapper.aDominio(actualizado);
  }

  // Elimina al usuario y su traza de auditoría asociada.
  async eliminar(id: number): Promise<void> {
    await this.prisma.auditoriaAccion.deleteMany({
      where: { usuarioId: id },
    });
    await this.prisma.usuario.delete({ where: { id } });
  }
}
