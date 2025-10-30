// Defino el contrato de usuario/autenticación compartido por vistas y servicios
export type RolUsuario = "CLIENTE" | "ADMINISTRADOR" | "EMPLEADO" | "REPARTIDOR"

export interface Usuario {
  id: number
  email: string
  nombre?: string | null
  apellido?: string | null
  telefono?: string | null
  rol: RolUsuario
  creadoEn?: string
  actualizadoEn?: string
  activo?: boolean
}

export interface PerfilUsuario extends Usuario {
  direcciones?: Direccion[]
}

export interface Direccion {
  id: number
  calle: string
  ciudad: string
  pais: string
  codigoPostal?: string | null
  creadoEn?: string
}

