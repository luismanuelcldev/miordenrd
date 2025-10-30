import { api } from "./api"

export interface TarifaZona {
  id: number
  distanciaMin: number
  distanciaMax: number | null
  costoBase: number
  costoPorKm: number | null
  recargo: number | null
}

export interface ZonaEntrega {
  id: number
  nombre: string
  descripcion?: string | null
  color?: string | null
  activa: boolean
  poligono: unknown
  centroideLatitud?: number | null
  centroideLongitud?: number | null
  radioCoberturaKm?: number | null
  tarifas?: TarifaZona[]
  creadoEn: string
  actualizadoEn: string
}

export interface CrearZonaPayload {
  nombre: string
  descripcion?: string
  color?: string
  activa?: boolean
  poligono: unknown
  centroideLatitud?: number
  centroideLongitud?: number
  radioCoberturaKm?: number
  tarifas?: Array<{
    distanciaMin: number
    distanciaMax?: number
    costoBase: number
    costoPorKm?: number
    recargo?: number
  }>
}

export type ActualizarZonaPayload = Partial<CrearZonaPayload>

export interface CalcularTarifaPayload {
  latitud: number
  longitud: number
  zonaId?: number
}

export interface CalculoTarifaRespuesta {
  zona: ZonaEntrega
  tarifaAplicada: (TarifaZona & { costoTotal: number }) | null
  distanciaEstimadaKm: number | null
}

// Listo zonas de entrega, permitiendo filtrar solo activas
async function listarZonas(params?: { soloActivas?: boolean }): Promise<ZonaEntrega[]> {
  const query = params?.soloActivas ? "?soloActivas=true" : ""
  const { data } = await api.get<ZonaEntrega[]>(`/zonas-entrega${query}`)
  return data
}

// Obtengo el detalle de una zona específica
async function obtenerZona(id: number): Promise<ZonaEntrega> {
  const { data } = await api.get<ZonaEntrega>(`/zonas-entrega/${id}`)
  return data
}

// Creo una zona con sus parámetros geográficos y de tarifas
async function crearZona(payload: CrearZonaPayload): Promise<ZonaEntrega> {
  const { data } = await api.post<ZonaEntrega>("/zonas-entrega", payload)
  return data
}

// Actualizo una zona existente
async function actualizarZona(id: number, payload: ActualizarZonaPayload): Promise<ZonaEntrega> {
  const { data } = await api.patch<ZonaEntrega>(`/zonas-entrega/${id}`, payload)
  return data
}

// Elimino una zona por id
async function eliminarZona(id: number): Promise<void> {
  await api.delete(`/zonas-entrega/${id}`)
}

// Calculo la tarifa de envío estimada para una ubicación
async function calcularTarifa(payload: CalcularTarifaPayload): Promise<CalculoTarifaRespuesta> {
  const { data } = await api.post<CalculoTarifaRespuesta>("/zonas-entrega/calcular", payload)
  return data
}

export const zoneService = {
  listarZonas,
  obtenerZona,
  crearZona,
  actualizarZona,
  eliminarZona,
  calcularTarifa,
}
