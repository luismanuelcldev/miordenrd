// Opto por definir el contrato del repositorio de Usuario para desacoplar casos de uso de la persistencia.
import { Usuario } from '../../domain/entities/usuario';

export interface RepositorioUsuario {
  // Guardo un usuario en la capa de persistencia y devuelvo la entidad resultante.
  guardar(usuario: Usuario): Promise<Usuario>;
  // Busco un usuario por su identificador único y retorno nulo si no existe.
  encontrarPorId(id: number): Promise<Usuario | null>;
  // Recorro la fuente de datos para localizar un usuario por su email.
  encontrarPorEmail(email: string): Promise<Usuario | null>;
  // Recupero el listado completo de usuarios disponibles.
  listar(): Promise<Usuario[]>;
  // Actualizo los datos del usuario y retorno la entidad ya persistida.
  actualizar(usuario: Usuario): Promise<Usuario>;
  // Elimino el usuario según su id sin devolver contenido.
  eliminar(id: number): Promise<void>;
}
