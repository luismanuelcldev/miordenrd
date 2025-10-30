import { Inject, Injectable } from '@nestjs/common';
import { Usuario, Rol } from '../../domain/entities/usuario';
import { RepositorioUsuario } from '../ports/repositorioUsuario';

@Injectable()
// Encapsulo la lógica para crear usuarios aplicando valores por defecto y delegando la persistencia.
export class CrearUsuario {
  // Inyecto el puerto del repositorio para mantener bajo acoplamiento con la infraestructura.
  constructor(
    @Inject('RepositorioUsuario')
    private readonly repositorio: RepositorioUsuario,
  ) {}

  // Ejecuto la creación tomando datos de entrada y retornando la entidad almacenada.
  async ejecutar(datos: {
    email: string;
    contrasena: string;
    nombre?: string;
    apellido?: string;
    telefono?: string;
    rol?: Rol;
    activo?: boolean;
  }): Promise<Usuario> {
    const usuario = new Usuario({
      ...datos,
      rol: datos.rol || Rol.CLIENTE,
    });
    return this.repositorio.guardar(usuario);
  }
}
