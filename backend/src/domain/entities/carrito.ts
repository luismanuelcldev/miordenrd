// Aquí he modelado el carrito en el dominio encapsulando identidad, usuario y trazabilidad temporal.
export class Carrito {
  private id?: number;
  private creadoEn: Date;
  private actualizadoEn: Date;
  private usuarioId: number;

  // Aquí he inicializado el carrito con valores por defecto para fechas de creación y actualización.
  constructor(props: {
    id?: number;
    usuarioId: number;
    creadoEn?: Date;
    actualizadoEn?: Date;
  }) {
    this.id = props.id;
    this.usuarioId = props.usuarioId;
    this.creadoEn = props.creadoEn || new Date();
    this.actualizadoEn = props.actualizadoEn || new Date();
  }

  getId(): number | undefined {
    return this.id;
  }

  getUsuarioId(): number {
    return this.usuarioId;
  }

  getCreadoEn(): Date {
    return this.creadoEn;
  }

  getActualizadoEn(): Date {
    return this.actualizadoEn;
  }

  // Aquí he actualizado la marca de tiempo para reflejar cambios sobre el carrito.
  tocar(): void {
    this.actualizadoEn = new Date();
  }
}
