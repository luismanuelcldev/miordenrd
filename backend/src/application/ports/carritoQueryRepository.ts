// Modelé el detalle del ítem del carrito para exponer solo lo necesario al caso de uso.
export interface CarritoItemDetalle {
  id: number;
  cantidad: number;
  producto: {
    id: number;
    nombre: string;
    precio: number;
    stock: number;
  };
}

// Describo la vista de lectura del carrito con sus ítems asociados.
export interface CarritoDetalle {
  id: number;
  usuarioId: number;
  items: CarritoItemDetalle[];
}

export interface CarritoQueryRepository {
  // Recupero el carrito de un usuario o null si aún no existe.
  obtenerCarrito(usuarioId: number): Promise<CarritoDetalle | null>;
  // Vacío por completo un carrito ya existente.
  vaciarCarrito(carritoId: number): Promise<void>;
}
