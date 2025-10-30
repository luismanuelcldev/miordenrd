import { api } from "./api"
import type { AuditoriaListadoResponse } from "@/types/auditoria"

export interface AuditoriaFiltros {
  page?: number
  limit?: number
  modulo?: string
  accion?: string
  usuarioId?: number
  fechaDesde?: string
  fechaHasta?: string
}

const defaultParams: Required<Pick<AuditoriaFiltros, "page" | "limit">> = {
  page: 1,
  limit: 20,
}

// Construyo los parámetros de consulta a partir del filtro recibido
const toQueryParams = (params: AuditoriaFiltros) => {
  const query: Record<string, string> = {}
  const merged = { ...defaultParams, ...params }

  query.page = String(merged.page)
  query.limit = String(Math.min(merged.limit, 100))

  if (merged.modulo) query.modulo = merged.modulo
  if (merged.accion) query.accion = merged.accion
  if (merged.usuarioId) query.usuarioId = String(merged.usuarioId)
  if (merged.fechaDesde) query.fechaDesde = merged.fechaDesde
  if (merged.fechaHasta) query.fechaHasta = merged.fechaHasta

  return query
}

// Listo eventos de auditoría con paginación y filtros
async function listar(params: AuditoriaFiltros = {}): Promise<AuditoriaListadoResponse> {
  const { data } = await api.get<AuditoriaListadoResponse>("/auditoria", {
    params: toQueryParams(params),
  })
  return data
}

// Obtengo la lista de módulos registrados en auditoría
async function obtenerModulos(): Promise<string[]> {
  const { data } = await api.get<{ data: string[] }>("/auditoria/modulos")
  return data.data
}

// Obtengo la lista de acciones registradas en auditoría
async function obtenerAcciones(): Promise<string[]> {
  const { data } = await api.get<{ data: string[] }>("/auditoria/acciones")
  return data.data
}

export const auditService = {
  listar,
  obtenerModulos,
  obtenerAcciones,
}
