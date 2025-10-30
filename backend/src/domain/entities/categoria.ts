// Aquí he representado una categoría del catálogo manteniendo su estado y trazabilidad temporal.
export class Categoria {
  private id?: number;
  private nombre: string;
  private descripcion?: string;
  private creadoEn: Date;
  private actualizadoEn: Date;

  // Aquí he definido el constructor para iniciar la categoría con valores por defecto cuando haga falta.
  constructor(props: {
    id?: number;
    nombre: string;
    descripcion?: string;
    creadoEn?: Date;
    actualizadoEn?: Date;
  }) {
    this.id = props.id;
    this.nombre = props.nombre;
    this.descripcion = props.descripcion;
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

  getCreadoEn(): Date {
    return this.creadoEn;
  }

  getActualizadoEn(): Date {
    return this.actualizadoEn;
  }

  // Aquí he centralizado la actualización del nombre/descripcion y la marca temporal de modificación.
  actualizar(datos: { nombre?: string; descripcion?: string }): void {
    if (datos.nombre !== undefined) this.nombre = datos.nombre;
    if (datos.descripcion !== undefined) this.descripcion = datos.descripcion;
    this.actualizadoEn = new Date();
  }
}
