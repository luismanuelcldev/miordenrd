// Aquí he definido el ítem del carrito que relaciona producto, carrito y cantidad.
export class ItemCarrito {
  private id?: number;
  private cantidad: number;
  private carritoId: number;
  private productoId: number;

  constructor(props: {
    id?: number;
    cantidad: number;
    carritoId: number;
    productoId: number;
  }) {
    this.id = props.id;
    this.cantidad = props.cantidad;
    this.carritoId = props.carritoId;
    this.productoId = props.productoId;
  }

  getId(): number | undefined {
    return this.id;
  }

  getCantidad(): number {
    return this.cantidad;
  }

  getCarritoId(): number {
    return this.carritoId;
  }

  getProductoId(): number {
    return this.productoId;
  }

  // Aquí he encapsulado el cambio de cantidad del ítem del carrito.
  actualizarCantidad(cantidad: number): void {
    this.cantidad = cantidad;
  }
}
