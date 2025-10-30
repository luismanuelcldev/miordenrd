// Aquí he modelado una dirección postal del usuario con control de propietario y tiempos de auditoría.
export class Direccion {
  private id?: number;
  private calle: string;
  private ciudad: string;
  private pais: string;
  private codigoPostal?: string;
  private usuarioId: number;
  private creadoEn: Date;
  private actualizadoEn: Date;

  constructor(props: {
    id?: number;
    calle: string;
    ciudad: string;
    pais: string;
    codigoPostal?: string;
    usuarioId: number;
    creadoEn?: Date;
    actualizadoEn?: Date;
  }) {
    this.id = props.id;
    this.calle = props.calle;
    this.ciudad = props.ciudad;
    this.pais = props.pais;
    this.codigoPostal = props.codigoPostal;
    this.usuarioId = props.usuarioId;
    this.creadoEn = props.creadoEn || new Date();
    this.actualizadoEn = props.actualizadoEn || new Date();
  }

  getId(): number | undefined {
    return this.id;
  }

  getCalle(): string {
    return this.calle;
  }

  getCiudad(): string {
    return this.ciudad;
  }

  getPais(): string {
    return this.pais;
  }

  getCodigoPostal(): string | undefined {
    return this.codigoPostal;
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

  // Aquí he previsto la actualización parcial de campos de la dirección y su timestamp.
  actualizar(datos: {
    calle?: string;
    ciudad?: string;
    pais?: string;
    codigoPostal?: string;
  }): void {
    if (datos.calle !== undefined) this.calle = datos.calle;
    if (datos.ciudad !== undefined) this.ciudad = datos.ciudad;
    if (datos.pais !== undefined) this.pais = datos.pais;
    if (datos.codigoPostal !== undefined)
      this.codigoPostal = datos.codigoPostal;
    this.actualizadoEn = new Date();
  }
}
