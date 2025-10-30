"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { cartService } from "@/services/cartService"
import { checkoutService } from "@/services/checkoutService"
import type { CarritoApiResponse, ItemCarritoApi } from "@/types/carrito"
import type { CarritoEstado, ItemCarrito } from "@/types/carrito"
import type { MetodoPago, PedidoDetalle } from "@/types/pedido"
import { useAuth } from "@/lib/auth"

export interface CrearPedidoPayload {
  direccionId: number
  metodoPago: MetodoPago
  observaciones?: string
}

// Expongo las operaciones del carrito y el estado derivado para toda la app
export interface CartContextValue {
  carrito: CarritoEstado
  cargarCarrito: () => Promise<void>
  agregarProducto: (productoId: number, cantidad?: number) => Promise<{ exito: boolean; error?: string }>
  actualizarCantidad: (itemId: number, cantidad: number) => Promise<{ exito: boolean; error?: string }>
  eliminarItem: (itemId: number) => Promise<{ exito: boolean; error?: string }>
  aplicarDescuento: (codigo: string) => boolean
  vaciarCarrito: () => Promise<void>
  crearPedido: (payload: CrearPedidoPayload) => Promise<PedidoDetalle>
}

// Re-export types needed by other files
export type { MetodoPago, DireccionEnvio } from "@/types/pedido"

// Creo el contexto del carrito para compartir estado/acciones entre componentes
const CartContext = createContext<CartContextValue | undefined>(undefined)

// Defino el estado inicial del carrito cuando no hay sesión o no hay items
const ESTADO_INICIAL: CarritoEstado = {
  items: [],
  subtotal: 0,
  impuestos: 0,
  envio: 0,
  descuento: 0,
  descuentoCodigo: null,
  descuentoPorcentaje: null,
  total: 0,
  cantidadItems: 0,
  cargando: false,
  error: null,
}

// Mantengo cupones de ejemplo para la UI con su porcentaje de descuento
const DESCUENTOS: Record<string, number> = {
  DESCUENTO10: 0.1,
  BIENVENIDO: 0.15,
  VERANO2024: 0.2,
}

// Normalizo mensajes de error retornados por Axios/servidor
interface ErrorResponseData {
  message?: unknown
}

interface AxiosLikeError {
  response?: {
    data?: ErrorResponseData
    status?: number
  }
}

const obtenerMensajeError = (error: unknown): string => {
  if (!error || typeof error !== "object") return "Ocurrió un error inesperado"
  const axiosError = error as AxiosLikeError
  const mensaje = axiosError.response?.data?.message
  if (Array.isArray(mensaje)) return mensaje.join(". ")
  if (typeof mensaje === "string") return mensaje
  return "Ocurrió un error inesperado"
}

// Transformo la respuesta de API a la forma de item manejada por la UI
const mapItem = (item: ItemCarritoApi): ItemCarrito => ({
  id: item.id,
  producto: {
    id: item.producto.id,
    nombre: item.producto.nombre,
    descripcion: item.producto.descripcion ?? undefined,
    precio: item.producto.precio,
    precioOferta: item.producto.precioOferta ?? undefined,
    stock: item.producto.stock,
    imagenUrl: item.producto.imagenUrl ?? undefined,
    enOferta: item.producto.enOferta ?? false,
    categoria: item.producto.categoria,
    subcategoria: item.producto.subcategoria,
    creadoEn: item.producto.creadoEn,
    actualizadoEn: item.producto.actualizadoEn,
  },
  cantidad: item.cantidad,
  subtotal: item.cantidad * item.producto.precio,
})

// Calculo el estado derivado del carrito (totales, impuestos y descuentos)
const calcularEstado = (
  carrito: CarritoApiResponse | null,
  opciones?: { codigo?: string | null; porcentaje?: number | null },
): CarritoEstado => {
  const descuentoCodigo = opciones?.codigo ?? null
  const descuentoPorcentaje = opciones?.porcentaje ?? null

  if (!carrito || carrito.items.length === 0) {
    return {
      ...ESTADO_INICIAL,
      descuentoCodigo,
      descuentoPorcentaje,
    }
  }

  const items = carrito.items.map(mapItem)
  const subtotal = items.reduce((suma, item) => suma + item.subtotal, 0)
  const impuestos = subtotal * 0.16
  const envio = 0
  const descuento = descuentoPorcentaje ? subtotal * descuentoPorcentaje : 0
  const total = Math.max(subtotal + impuestos - descuento, 0)
  const cantidadItems = items.reduce((suma, item) => suma + item.cantidad, 0)

  return {
    items,
    subtotal,
    impuestos,
    envio,
    descuento,
    descuentoCodigo,
    descuentoPorcentaje,
    total,
    cantidadItems,
    cargando: false,
    error: null,
  }
}

// Proveedor del carrito: sincronizo con backend según autenticación y expongo acciones
export function CartProvider({ children }: { children: ReactNode }) {
  const { estaAutenticado } = useAuth()
  const [estado, setEstado] = useState<CarritoEstado>({
    ...ESTADO_INICIAL,
    cargando: estaAutenticado,
  })

  // Cargo el carrito desde API y aplico el posible descuento vigente
  const cargarCarrito = useCallback(async () => {
    if (!estaAutenticado) return
    setEstado((prev) => ({ ...prev, cargando: true, error: null }))
    try {
      const data = await cartService.obtenerCarrito()
      setEstado((prev) =>
        calcularEstado(data, {
          codigo: prev.descuentoCodigo,
          porcentaje: prev.descuentoPorcentaje,
        }),
      )
    } catch (error) {
      setEstado((prev) => ({
        ...prev,
        cargando: false,
        error: obtenerMensajeError(error),
      }))
    }
  }, [estaAutenticado])

  // Reseteo o cargo el carrito según el estado de autenticación
  useEffect(() => {
    if (!estaAutenticado) {
      setEstado({ ...ESTADO_INICIAL })
      return
    }
    void cargarCarrito()
  }, [estaAutenticado, cargarCarrito])

  // Agrego un producto y recalculo totales manteniendo el descuento vigente
  const agregarProducto = useCallback(async (productoId: number, cantidad = 1) => {
    if (!estaAutenticado) {
      return { exito: false, error: "Debes iniciar sesión para agregar productos" }
    }

    setEstado((prev) => ({ ...prev, cargando: true, error: null }))

    try {
      const data = await cartService.agregarProducto(productoId, cantidad)
      setEstado((prev) =>
        calcularEstado(data, {
          codigo: prev.descuentoCodigo,
          porcentaje: prev.descuentoPorcentaje,
        }),
      )
      return { exito: true }
    } catch (error) {
      setEstado((prev) => ({
        ...prev,
        cargando: false,
        error: obtenerMensajeError(error),
      }))
      return { exito: false, error: obtenerMensajeError(error) }
    }
  }, [estaAutenticado])

  // Actualizo la cantidad de un ítem del carrito contra el backend
  const actualizarCantidad = useCallback(async (itemId: number, cantidad: number) => {
    if (!estaAutenticado) {
      return { exito: false, error: "Debes iniciar sesión para actualizar tu carrito" }
    }

    setEstado((prev) => ({ ...prev, cargando: true, error: null }))

    try {
      const data = await cartService.editarProducto(itemId, cantidad)
      setEstado((prev) =>
        calcularEstado(data, {
          codigo: prev.descuentoCodigo,
          porcentaje: prev.descuentoPorcentaje,
        }),
      )
      return { exito: true }
    } catch (error) {
      setEstado((prev) => ({
        ...prev,
        cargando: false,
        error: obtenerMensajeError(error),
      }))
      return { exito: false, error: obtenerMensajeError(error) }
    }
  }, [estaAutenticado])

  // Elimino un ítem del carrito y recalculo estado derivado
  const eliminarItem = useCallback(async (itemId: number) => {
    if (!estaAutenticado) {
      return { exito: false, error: "Debes iniciar sesión para actualizar tu carrito" }
    }

    setEstado((prev) => ({ ...prev, cargando: true, error: null }))

    try {
      const data = await cartService.eliminarProducto(itemId)
      setEstado((prev) =>
        calcularEstado(data, {
          codigo: prev.descuentoCodigo,
          porcentaje: prev.descuentoPorcentaje,
        }),
      )
      return { exito: true }
    } catch (error) {
      setEstado((prev) => ({
        ...prev,
        cargando: false,
        error: obtenerMensajeError(error),
      }))
      return { exito: false, error: obtenerMensajeError(error) }
    }
  }, [estaAutenticado])

  // Aplico un cupón localmente recalculando totales en memoria
  const aplicarDescuento = useCallback((codigo: string) => {
    const clave = codigo.trim().toUpperCase()
    const porcentaje = DESCUENTOS[clave]

    if (!porcentaje) {
      return false
    }

    setEstado((prev) => {
      const subtotal = prev.items.reduce((suma, item) => suma + item.subtotal, 0)
      const impuestos = subtotal * 0.16
      const envio = subtotal === 0 || subtotal >= 50 ? 0 : 9.99
      const descuento = subtotal * porcentaje
      const total = Math.max(subtotal + impuestos + envio - descuento, 0)

      return {
        ...prev,
        subtotal,
        impuestos,
        envio,
        descuento,
        descuentoCodigo: clave,
        descuentoPorcentaje: porcentaje,
        total,
      }
    })

    return true
  }, [])

  // Vacío el carrito eliminando ítems uno a uno en backend y reseteo estado
  const vaciarCarrito = useCallback(async () => {
    if (!estaAutenticado) {
      setEstado({ ...ESTADO_INICIAL })
      return
    }

    if (estado.items.length === 0) {
      setEstado({ ...ESTADO_INICIAL })
      return
    }

    setEstado((prev) => ({ ...prev, cargando: true, error: null }))

    try {
      for (const item of estado.items) {
        await cartService.eliminarProducto(item.id)
      }
      const data = await cartService.obtenerCarrito()
      setEstado(calcularEstado(data, { codigo: null, porcentaje: null }))
    } catch (error) {
      setEstado((prev) => ({
        ...prev,
        cargando: false,
        error: obtenerMensajeError(error),
      }))
    }
  }, [estaAutenticado, estado])

  // Creo un pedido vía checkout y reinicio el estado del carrito al finalizar
  const crearPedido = useCallback(async (payload: CrearPedidoPayload) => {
    const pedido = await checkoutService.procesarCompra(payload)
    setEstado({ ...ESTADO_INICIAL })
    return pedido
  }, [])

  // Memoizo el valor del contexto para evitar renders innecesarios
  const value = useMemo<CartContextValue>(
    () => ({
      carrito: estado,
      cargarCarrito,
      agregarProducto,
      actualizarCantidad,
      eliminarItem,
      aplicarDescuento,
      vaciarCarrito,
      crearPedido,
    }),
    [estado, cargarCarrito, agregarProducto, actualizarCantidad, eliminarItem, aplicarDescuento, vaciarCarrito, crearPedido],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// Expongo el hook para consumir el contexto del carrito de forma segura
export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart debe ser usado dentro de CartProvider")
  }
  return context
}
