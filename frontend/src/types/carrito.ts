import type { ProductoResumen } from "./producto"

// Especifico los tipos para el estado del carrito y su forma en API/UI
export interface ItemCarritoApi {
  id: number
  carritoId: number
  productoId: number
  cantidad: number
  producto: ProductoResumen & { descripcion?: string | null }
}

export interface CarritoApiResponse {
  id: number
  usuarioId: number
  creadoEn?: string
  actualizadoEn?: string
  items: ItemCarritoApi[]
}

export interface ItemCarrito {
  id: number
  producto: ProductoResumen
  cantidad: number
  subtotal: number
}

export interface CarritoEstado {
  items: ItemCarrito[]
  subtotal: number
  impuestos: number
  envio: number
  descuento: number
  descuentoCodigo?: string | null
  descuentoPorcentaje?: number | null
  total: number
  cantidadItems: number
  cargando: boolean
  error?: string | null
}
