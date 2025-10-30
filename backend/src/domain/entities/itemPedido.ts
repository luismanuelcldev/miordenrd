// Aquí he representado el ítem facturado de un pedido con su cantidad y precio unitario.
export class ItemPedido {
  private id?: number;
  private cantidad: number;
  private precio: number;
  private pedidoId: number;
  private productoId: number;

  constructor(props: {
    id?: number;
    cantidad: number;
    precio: number;
    pedidoId: number;
    productoId: number;
  }) {
    this.id = props.id;
    this.cantidad = props.cantidad;
    this.precio = props.precio;
    this.pedidoId = props.pedidoId;
    this.productoId = props.productoId;
  }

  getId(): number | undefined {
    return this.id;
  }

  getCantidad(): number {
    return this.cantidad;
  }

  getPrecio(): number {
    return this.precio;
  }

  getPedidoId(): number {
    return this.pedidoId;
  }

  getProductoId(): number {
    return this.productoId;
  }
}
