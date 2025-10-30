// Aquí he modelado al usuario del sistema de forma independiente al framework, con rol y estado activo.
export enum Rol {
  CLIENTE = 'CLIENTE',
  ADMINISTRADOR = 'ADMINISTRADOR',
  EMPLEADO = 'EMPLEADO',
  REPARTIDOR = 'REPARTIDOR',
}

export class Usuario {
  private id?: number;
  private nombre?: string;
  private apellido?: string;
  private email: string;
  private contrasena: string;
  private rol: Rol;
  private telefono?: string;
  private activo: boolean;
  private creadoEn: Date;
  private actualizadoEn: Date;

  constructor(props: {
    id?: number;
    nombre?: string;
    apellido?: string;
    email: string;
    contrasena: string;
    rol: Rol;
    telefono?: string;
    activo?: boolean;
    creadoEn?: Date;
    actualizadoEn?: Date;
  }) {
    this.id = props.id;
    this.nombre = props.nombre;
    this.apellido = props.apellido;
    this.email = props.email;
    this.contrasena = props.contrasena;
    this.rol = props.rol;
    this.telefono = props.telefono;
    this.activo = props.activo ?? true;
    this.creadoEn = props.creadoEn || new Date();
    this.actualizadoEn = props.actualizadoEn || new Date();
  }

  getId(): number | undefined {
    return this.id;
  }

  getNombre(): string | undefined {
    return this.nombre;
  }

  getApellido(): string | undefined {
    return this.apellido;
  }

  getEmail(): string {
    return this.email;
  }

  getContrasena(): string {
    return this.contrasena;
  }

  getRol(): Rol {
    return this.rol;
  }

  getTelefono(): string | undefined {
    return this.telefono;
  }

  estaActivo(): boolean {
    return this.activo;
  }

  getCreadoEn(): Date {
    return this.creadoEn;
  }

  getActualizadoEn(): Date {
    return this.actualizadoEn;
  }

  actualizarPerfil(props: { nombre?: string; apellido?: string }): void {
    // Aquí he permitido cambios parciales de nombre y apellido conservando el resto del perfil.
    if (props.nombre !== undefined) this.nombre = props.nombre;
    if (props.apellido !== undefined) this.apellido = props.apellido;
    this.actualizadoEn = new Date();
  }

  actualizarTelefono(telefono?: string): void {
    // Aquí he actualizado el teléfono de contacto del usuario.
    this.telefono = telefono;
    this.actualizadoEn = new Date();
  }

  cambiarRol(rol: Rol): void {
    // Aquí he cambiado el rol del usuario para ajustar sus permisos.
    this.rol = rol;
    this.actualizadoEn = new Date();
  }

  actualizarContrasena(contrasenaHasheada: string): void {
    // Aquí he reemplazado la contraseña por su hash sin exponer la original.
    this.contrasena = contrasenaHasheada;
    this.actualizadoEn = new Date();
  }

  activar(): void {
    // Aquí he activado la cuenta del usuario.
    this.activo = true;
    this.actualizadoEn = new Date();
  }

  desactivar(): void {
    // Aquí he desactivado la cuenta del usuario.
    this.activo = false;
    this.actualizadoEn = new Date();
  }
}
