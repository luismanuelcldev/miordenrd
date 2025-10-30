// Declaro los tipos de producto, categorías y paginación usados en la UI y servicios
export interface CategoriaResumen {
  id: number
  nombre: string
  descripcion?: string | null
}

export interface ProductoResumen {
  id: number
  nombre: string
  descripcion?: string | null
  precio: number
  precioOferta?: number | null
  stock: number
  imagenUrl?: string | null
  enOferta: boolean
  categoria?: Pick<CategoriaResumen, "id" | "nombre">
  subcategoria?: Pick<CategoriaResumen, "id" | "nombre">
  creadoEn?: string
  actualizadoEn?: string
}

export interface MovimientoStock {
  id: number
  cantidad: number
  estado: string
  motivo?: string | null
  fecha: string
}

export interface ProductoDetalle extends ProductoResumen {
  historialStock?: MovimientoStock[]
  categoria?: CategoriaResumen
  subcategoria?: CategoriaResumen
}

export interface Paginacion {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface ListadoProductosResponse {
  productos: ProductoResumen[]
  paginacion: Paginacion
}
