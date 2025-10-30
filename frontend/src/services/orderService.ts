import { api } from "./api"
import type { EstadoPedido, ListadoPedidosResponse, PedidoDetalle } from "@/types/pedido"

interface ListarMisPedidosParams {
  page?: number
  limit?: number
  estado?: string
}

const defaultParams = { page: 1, limit: 10 }

interface ListarPedidosAdminParams {
  page?: number
  limit?: number
  estado?: EstadoPedido
  fechaInicio?: string
  fechaFin?: string
  usuarioId?: number
}

const defaultAdminParams = { page: 1, limit: 20 }

interface ListarPedidosRepartidorParams {
  page?: number
  limit?: number
  estado?: EstadoPedido
}

// Listo mis pedidos (cliente) con paginación y filtro por estado
async function listarMisPedidos(params: ListarMisPedidosParams = {}) {
  const query = { ...defaultParams, ...params }
  const { data } = await api.get<ListadoPedidosResponse>("/pedidos/usuario/mis-pedidos", { params: query })
  return data
}

// Obtengo el detalle de un pedido por su id
async function obtenerPedido(id: number) {
  const { data } = await api.get<PedidoDetalle>(`/pedidos/${id}`)
  return data
}

// Listo pedidos para administración con filtros diversos
async function listarPedidosAdmin(params: ListarPedidosAdminParams = {}) {
  const query = { ...defaultAdminParams, ...params }
  const { data } = await api.get<ListadoPedidosResponse>("/pedidos", { params: query })
  return data
}

// Listo pedidos asignados al repartidor autenticado
async function listarPedidosRepartidor(params: ListarPedidosRepartidorParams = {}) {
  const query = { page: 1, limit: 20, ...params }
  const { data } = await api.get<ListadoPedidosResponse>("/pedidos/repartidor/asignados", { params: query })
  return data
}

// Actualizo el estado de un pedido (admin/repartidor según rol)
async function actualizarEstadoPedido(id: number, estado: EstadoPedido) {
  const { data } = await api.patch<PedidoDetalle>(`/pedidos/${id}/estado`, { estado })
  return data
}

// Asigno un repartidor a un pedido desde administración
async function asignarRepartidorPedido(id: number, repartidorId: number) {
  const { data } = await api.patch<PedidoDetalle>(`/pedidos/${id}/asignar-repartidor`, { repartidorId })
  return data
}

export const orderService = {
  listarMisPedidos,
  listarPedidosRepartidor,
  obtenerPedido,
  listarPedidosAdmin,
  actualizarEstadoPedido,
  asignarRepartidorPedido,
}
