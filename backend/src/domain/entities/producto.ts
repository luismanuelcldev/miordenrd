// Aquí he definido el producto del catálogo con precios, stock y soporte para ofertas.
export class Producto {
  private id?: number;
  private nombre: string;
  private descripcion?: string;
  private precio: number;
  private stock: number;
  private imagenUrl?: string;
  private categoriaId?: number;
  private subcategoriaId?: number;
  private enOferta: boolean;
  private precioOferta?: number;
  private creadoEn: Date;
  private actualizadoEn: Date;

  constructor(props: {
    id?: number;
    nombre: string;
    descripcion?: string;
    precio: number;
    stock: number;
    imagenUrl?: string;
    categoriaId?: number;
    subcategoriaId?: number;
    enOferta?: boolean;
    precioOferta?: number;
    creadoEn?: Date;
    actualizadoEn?: Date;
  }) {
    this.id = props.id;
    this.nombre = props.nombre;
    this.descripcion = props.descripcion;
    this.precio = props.precio;
    this.stock = props.stock;
    this.imagenUrl = props.imagenUrl;
    this.categoriaId = props.categoriaId;
    this.subcategoriaId = props.subcategoriaId;
    this.enOferta = props.enOferta ?? false;
    this.precioOferta = props.precioOferta ?? undefined;
    this.creadoEn = props.creadoEn || new Date();
    this.actualizadoEn = props.actualizadoEn || new Date();
  }

  getId(): number | undefined {
    return this.id;
  }

  getNombre(): string {
    return this.nombre;
  }

  getDescripcion(): string | undefined {
    return this.descripcion;
  }

  getPrecio(): number {
    return this.precio;
  }

  getStock(): number {
    return this.stock;
  }

  getImagenUrl(): string | undefined {
    return this.imagenUrl;
  }

  getCategoriaId(): number | undefined {
    return this.categoriaId;
  }

  getSubcategoriaId(): number | undefined {
    return this.subcategoriaId;
  }

  estaEnOferta(): boolean {
    return this.enOferta;
  }

  getPrecioOferta(): number | undefined {
    return this.precioOferta;
  }

  getCreadoEn(): Date {
    return this.creadoEn;
  }

  getActualizadoEn(): Date {
    return this.actualizadoEn;
  }

  // Aquí he controlado la reducción de stock validando que no quede negativo.
  reducirStock(cantidad: number): void {
    if (this.stock < cantidad) throw new Error('Stock insuficiente');
    this.stock -= cantidad;
  }

  // Aquí he permitido incrementar el stock y registrar la actualización temporal.
  aumentarStock(cantidad: number): void {
    this.stock += cantidad;
    this.actualizadoEn = new Date();
  }

  // Aquí he agrupado las actualizaciones parciales del producto, incluida la oferta.
  actualizarDatos(datos: {
    nombre?: string;
    descripcion?: string;
    precio?: number;
    stock?: number;
    imagenUrl?: string;
    categoriaId?: number;
    subcategoriaId?: number;
    enOferta?: boolean;
    precioOferta?: number | null;
  }): void {
    if (datos.nombre !== undefined) this.nombre = datos.nombre;
    if (datos.descripcion !== undefined) this.descripcion = datos.descripcion;
    if (datos.precio !== undefined) this.precio = datos.precio;
    if (datos.stock !== undefined) this.stock = datos.stock;
    if (datos.imagenUrl !== undefined) this.imagenUrl = datos.imagenUrl;
    if (datos.categoriaId !== undefined) this.categoriaId = datos.categoriaId;
    if (datos.subcategoriaId !== undefined)
      this.subcategoriaId = datos.subcategoriaId;
    if (datos.enOferta !== undefined) this.enOferta = datos.enOferta;
    if (datos.precioOferta !== undefined)
      this.precioOferta = datos.precioOferta ?? undefined;
    this.actualizadoEn = new Date();
  }
}
