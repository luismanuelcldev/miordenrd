import { isAxiosError } from "axios"
import { api } from "./api"
import type { CarritoApiResponse } from "@/types/carrito"

const RUTA_BASE = "/carrito"

// Normalizo campos opcionales del producto dentro del carrito
const mapCarrito = (carrito: CarritoApiResponse | null): CarritoApiResponse | null => {
  if (!carrito) return null
  return {
    ...carrito,
    items: carrito.items.map((item) => ({
      ...item,
      producto: {
        ...item.producto,
        descripcion: item.producto.descripcion ?? undefined,
        imagenUrl: item.producto.imagenUrl ?? undefined,
      },
    })),
  }
}

// Recupero el carrito del usuario; si no existe, devuelvo null
async function obtenerCarrito(): Promise<CarritoApiResponse | null> {
  try {
    const { data } = await api.get<CarritoApiResponse>(RUTA_BASE)
    return mapCarrito(data)
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null
    }
    throw error
  }
}

// Agrego un producto al carrito y devuelvo el estado actualizado
async function agregarProducto(productoId: number, cantidad: number): Promise<CarritoApiResponse | null> {
  const { data } = await api.post<CarritoApiResponse>(`${RUTA_BASE}/agregar`, {
    productoId,
    cantidad,
  })
  return mapCarrito(data)
}

// Actualizo la cantidad de un ítem del carrito
async function editarProducto(itemId: number, cantidad: number): Promise<CarritoApiResponse | null> {
  const { data } = await api.put<CarritoApiResponse>(`${RUTA_BASE}/editar/${itemId}`, {
    cantidad,
  })
  return mapCarrito(data)
}

// Elimino un ítem del carrito
async function eliminarProducto(itemId: number): Promise<CarritoApiResponse | null> {
  const { data } = await api.delete<CarritoApiResponse>(`${RUTA_BASE}/eliminar/${itemId}`)
  return mapCarrito(data)
}

export const cartService = {
  obtenerCarrito,
  agregarProducto,
  editarProducto,
  eliminarProducto,
}
