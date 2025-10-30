// Aquí he modelado el ciclo de vida de un pedido incluyendo estado, totales y asignación logística.
export enum EstadoPedido {
  PENDIENTE = 'PENDIENTE',
  EN_PREPARACION = 'EN_PREPARACION',
  ENVIADO = 'ENVIADO',
  ENTREGADO = 'ENTREGADO',
  CANCELADO = 'CANCELADO',
}

// Aquí he listado los métodos de pago aceptados en el dominio del pedido.
export enum MetodoPago {
  TARJETA = 'TARJETA',
  TRANSFERENCIA = 'TRANSFERENCIA',
  CONTRA_ENTREGA = 'CONTRA_ENTREGA',
  PAYPAL = 'PAYPAL',
}

export class Pedido {
  private id?: number;
  private creadoEn: Date;
  private actualizadoEn: Date;
  private estado: EstadoPedido;
  private total: number;
  private metodoPago: MetodoPago;
  private usuarioId: number;
  private direccionId: number;
  private repartidorId: number | null;
  private costoEnvio: number;

  constructor(props: {
    id?: number;
    estado: EstadoPedido;
    total: number;
    metodoPago: MetodoPago;
    usuarioId: number;
    direccionId: number;
    repartidorId?: number | null;
    costoEnvio?: number;
    creadoEn?: Date;
    actualizadoEn?: Date;
  }) {
    this.id = props.id;
    this.estado = props.estado;
    this.total = props.total;
    this.metodoPago = props.metodoPago;
    this.usuarioId = props.usuarioId;
    this.direccionId = props.direccionId;
    this.repartidorId = props.repartidorId ?? null;
    this.costoEnvio = props.costoEnvio ?? 0;
    this.creadoEn = props.creadoEn || new Date();
    this.actualizadoEn = props.actualizadoEn || new Date();
  }

  getId(): number | undefined {
    return this.id;
  }

  getEstado(): EstadoPedido {
    return this.estado;
  }

  getTotal(): number {
    return this.total;
  }

  getMetodoPago(): MetodoPago {
    return this.metodoPago;
  }

  getCostoEnvio(): number {
    return this.costoEnvio;
  }

  getUsuarioId(): number {
    return this.usuarioId;
  }

  getDireccionId(): number {
    return this.direccionId;
  }

  getRepartidorId(): number | null {
    return this.repartidorId;
  }

  getCreadoEn(): Date {
    return this.creadoEn;
  }

  getActualizadoEn(): Date {
    return this.actualizadoEn;
  }

  // Aquí he encapsulado el cambio de estado y la actualización de la traza temporal.
  actualizarEstado(nuevoEstado: EstadoPedido): void {
    this.estado = nuevoEstado;
    this.actualizadoEn = new Date();
  }

  // Aquí he recalculado el total del pedido aplicando el costo de envío.
  actualizarTotales(subtotalProductos: number, costoEnvio: number): void {
    this.costoEnvio = costoEnvio;
    this.total = subtotalProductos + costoEnvio;
    this.actualizadoEn = new Date();
  }

  // Aquí he asignado el repartidor responsable del pedido.
  asignarRepartidor(repartidorId: number): void {
    this.repartidorId = repartidorId;
    this.actualizadoEn = new Date();
  }
}
