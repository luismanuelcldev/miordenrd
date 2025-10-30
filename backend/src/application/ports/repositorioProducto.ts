// Defino el contrato del repositorio de Producto para operar sin acoplarme a una implementación concreta.
import { Producto } from '../../domain/entities/producto';

export interface RepositorioProducto {
  // Persiste un producto nuevo o existente y devuelve la entidad almacenada.
  guardar(producto: Producto): Promise<Producto>;
  // Obtengo un producto por su id o null si no aparece.
  encontrarPorId(id: number): Promise<Producto | null>;
  // Listo productos permitiendo filtros básicos como categoría o texto.
  listar(params?: {
    categoriaId?: number;
    texto?: string;
  }): Promise<Producto[]>;
  // Actualizo datos del producto y retorno la versión persistida.
  actualizar(producto: Producto): Promise<Producto>;
  // Remuevo definitivamente el producto indicado por id.
  eliminar(id: number): Promise<void>;
}
