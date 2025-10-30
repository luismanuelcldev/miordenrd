import { api } from "./api"

export interface ZonaEntregaResumen {
  id: number
  nombre: string
  color?: string | null
  activa: boolean
}

export interface DireccionEnvio {
  id: number
  calle: string
  ciudad: string
  pais: string
  codigoPostal?: string | null
  referencias?: string | null
  latitud?: number | null
  longitud?: number | null
  validada: boolean
  zonaId?: number | null
  zona?: ZonaEntregaResumen
  usuarioId: number
  creadoEn: string
  actualizadoEn: string
}

export interface CrearDireccionDto {
  calle: string
  ciudad: string
  pais: string
  codigoPostal?: string
  referencias?: string
  latitud?: number
  longitud?: number
  zonaId?: number
}

export type ActualizarDireccionDto = Partial<CrearDireccionDto> & {
  validada?: boolean
}

// Listo direcciones de envío del usuario autenticado
async function listarDirecciones(): Promise<DireccionEnvio[]> {
  const { data } = await api.get<DireccionEnvio[]>("/direcciones")
  return data
}

// Obtengo una dirección específica
async function obtenerDireccion(id: number): Promise<DireccionEnvio> {
  const { data } = await api.get<DireccionEnvio>(`/direcciones/${id}`)
  return data
}

// Creo una nueva dirección de envío
async function crearDireccion(payload: CrearDireccionDto): Promise<DireccionEnvio> {
  const { data } = await api.post<DireccionEnvio>("/direcciones", payload)
  return data
}

// Actualizo campos de una dirección
async function actualizarDireccion(id: number, payload: ActualizarDireccionDto): Promise<DireccionEnvio> {
  const { data } = await api.patch<DireccionEnvio>(`/direcciones/${id}`, payload)
  return data
}

// Elimino una dirección por id
async function eliminarDireccion(id: number): Promise<void> {
  await api.delete(`/direcciones/${id}`)
}

export const addressService = {
  listarDirecciones,
  obtenerDireccion,
  crearDireccion,
  actualizarDireccion,
  eliminarDireccion,
}
