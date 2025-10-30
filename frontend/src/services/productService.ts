import { api } from "./api"
import type {
  ListadoProductosResponse,
  ProductoDetalle,
  ProductoResumen,
} from "@/types/producto"

export interface ListarProductosParams {
  page?: number
  limit?: number
  search?: string
  categoriaId?: number
  precioMin?: number
  precioMax?: number
  ordenarPor?: "nombre" | "precio" | "creadoEn" | "stock"
  orden?: "asc" | "desc"
  enOferta?: boolean
}

export interface GuardarProductoPayload {
  nombre: string
  descripcion?: string
  precio: number
  stock?: number
  imagenUrl?: string
  categoriaId?: number
  subcategoriaId?: number
  enOferta?: boolean
  precioOferta?: number | null
}

export type TipoAjusteInventario = "ENTRADA" | "SALIDA" | "AJUSTE"

export interface AjusteInventarioPayload {
  productoId: number
  cantidad: number
  estado: TipoAjusteInventario
  motivo?: string
}

// Defino valores por defecto para la paginación de listados
const defaultParams: Required<Pick<ListarProductosParams, "page" | "limit">> = {
  page: 1,
  limit: 20,
}

// Construyo los parámetros de consulta a partir del filtro recibido
const toQueryParams = (params: ListarProductosParams) => {
  const query: Record<string, string> = {}
  const merged = { ...defaultParams, ...params }

  query.page = String(merged.page)
  query.limit = String(merged.limit)

  if (merged.search) query.search = merged.search
  if (merged.categoriaId) query.categoriaId = String(merged.categoriaId)
  if (merged.precioMin !== undefined) query.precioMin = String(merged.precioMin)
  if (merged.precioMax !== undefined) query.precioMax = String(merged.precioMax)
  if (merged.ordenarPor) query.ordenarPor = merged.ordenarPor
  if (merged.orden) query.orden = merged.orden
  if (merged.enOferta !== undefined) query.enOferta = String(merged.enOferta)

  return query
}

// Listo productos con filtros de búsqueda y paginación
async function listarProductos(params: ListarProductosParams = {}): Promise<ListadoProductosResponse> {
  const { data } = await api.get<ListadoProductosResponse>("/productos", { params: toQueryParams(params) })
  return data
}

// Obtengo el detalle de un producto por su id
async function obtenerProducto(id: number): Promise<ProductoDetalle> {
  const { data } = await api.get<ProductoDetalle>(`/productos/${id}`)
  return data
}

// Creo un nuevo producto en el catálogo
async function crearProducto(payload: GuardarProductoPayload): Promise<ProductoDetalle> {
  const { data } = await api.post<ProductoDetalle>("/productos", payload)
  return data
}

// Actualizo campos de un producto existente
async function actualizarProducto(id: number, payload: Partial<GuardarProductoPayload>): Promise<ProductoDetalle> {
  const { data } = await api.patch<ProductoDetalle>(`/productos/${id}`, payload)
  return data
}

// Elimino un producto por id
async function eliminarProducto(id: number): Promise<void> {
  await api.delete(`/productos/${id}`)
}

// Consulto el stock consolidado para vista de inventario
async function listarInventario(): Promise<ProductoResumen[]> {
  const { data } = await api.get<{ statusCode: number; data: ProductoResumen[] }>("/inventario/stock")
  return data.data
}

// Registro ajustes de inventario (entrada/salida/ajuste)
async function registrarAjusteInventario(payload: AjusteInventarioPayload): Promise<ProductoDetalle> {
  const { data } = await api.post<{ statusCode: number; data: ProductoDetalle }>("/inventario/ajuste", payload)
  return data.data
}

export const productService = {
  listarProductos,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  listarInventario,
  registrarAjusteInventario,
}
