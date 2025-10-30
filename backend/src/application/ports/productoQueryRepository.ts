// Decido modelar los filtros de consulta de productos para soportar paginación y búsqueda flexible.
export interface FiltrosProducto {
  page: number;
  limit: number;
  search?: string;
  categoriaId?: number;
  precioMin?: number;
  precioMax?: number;
  ordenarPor?: string;
  orden?: 'asc' | 'desc';
  enOferta?: boolean;
}

export interface ProductoListado {
  id: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  precioOferta?: number | null;
  stock: number;
  imagenUrl?: string | null;
  enOferta: boolean;
  categoria?: { id: number; nombre: string };
  subcategoria?: { id: number; nombre: string };
  creadoEn: Date;
  actualizadoEn: Date;
}

export interface MovimientoStock {
  id: number;
  cantidad: number;
  estado: string;
  motivo?: string | null;
  fecha: Date;
}

export interface ProductoDetalle extends ProductoListado {
  categoria?: { id: number; nombre: string; descripcion?: string | null };
  subcategoria?: { id: number; nombre: string; descripcion?: string | null };
  historialStock: MovimientoStock[];
}

export interface RegistrarMovimientoStockInput {
  productoId: number;
  cantidad: number;
  estado: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  motivo?: string;
}

export interface ProductoQueryRepository {
  // Devuelvo una lista paginada de productos según filtros y ordenamientos.
  listar(filtros: FiltrosProducto): Promise<ProductoListado[]>;
  // Cuento el total de productos que cumplen los filtros recibidos.
  contar(filtros: FiltrosProducto): Promise<number>;
  // Recupero el detalle ampliado de un producto por su id.
  obtenerDetalle(id: number): Promise<ProductoDetalle | null>;
  // Verifico la existencia de una categoría por id.
  verificarCategoria(id: number): Promise<boolean>;
  // Verifico la existencia de una subcategoría por id.
  verificarSubcategoria(id: number): Promise<boolean>;
  // Registro un movimiento de stock asociado a un producto.
  registrarMovimientoStock(data: RegistrarMovimientoStockInput): Promise<void>;
  // Compruebo si el producto participa en algún pedido.
  existePedidoAsociado(productoId: number): Promise<boolean>;
  // Elimino físicamente el producto y sus dependencias asociadas.
  eliminarProductoTotal(productoId: number): Promise<void>;
}
