// Defino tipos para registros de auditoría y su paginación en listados
export interface AuditoriaRegistro {
  id: number
  usuarioId: number
  modulo: string
  accion: string
  descripcion?: string | null
  fecha: string
  usuario?: {
    id: number
    nombre?: string | null
    apellido?: string | null
    email: string
    rol: string
  } | null
}

export interface AuditoriaPaginacion {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface AuditoriaListadoResponse {
  registros: AuditoriaRegistro[]
  paginacion: AuditoriaPaginacion
}
