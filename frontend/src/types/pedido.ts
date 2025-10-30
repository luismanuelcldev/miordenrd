// Defino tipos para pedidos: estados, método de pago y estructuras de listado/detalle
export type EstadoPedido =
  | "PENDIENTE"
  | "EN_PREPARACION"
  | "ENVIADO"
  | "ENTREGADO"
  | "CANCELADO"

export type MetodoPago = "TARJETA" | "TRANSFERENCIA" | "CONTRA_ENTREGA" | "PAYPAL"

export interface DireccionEnvio {
  nombre: string
  apellido: string
  direccion: string
  ciudad: string
  estado?: string
  codigoPostal: string
  pais: string
  telefono: string
}

export interface PedidoListado {
  id: number
  estado: EstadoPedido
  total: number
  costoEnvio: number
  metodoPago: MetodoPago
  usuarioId: number
  direccionId: number
  repartidorId?: number | null
  creadoEn: string
  actualizadoEn: string
  usuario?: {
    id: number
    nombre?: string | null
    apellido?: string | null
    email: string
  }
  repartidor?: {
    id: number
    nombre?: string | null
    apellido?: string | null
    email: string
  } | null
  direccion?: {
    id: number
    calle: string
    ciudad: string
    pais: string
    codigoPostal?: string | null
  } | null
}

export interface PedidoItemDetalle {
  id: number
  cantidad: number
  precio: number
  producto: {
    id: number
    nombre: string
    precio: number
    imagenUrl?: string | null
  }
}

export interface PedidoDetalle extends PedidoListado {
  direccion: {
    id: number
    calle: string
    ciudad: string
    pais: string
    codigoPostal?: string | null
  }
  items: PedidoItemDetalle[]
  notificaciones: Array<{
    id: number
    mensaje: string
    estado: string
    enviadoEn: string
  }>
}

export interface ListadoPedidosResponse {
  pedidos: PedidoListado[]
  paginacion: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}
