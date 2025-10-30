"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { ProductoResumen } from "@/types/producto"

// Defino la forma mínima de un producto marcado como favorito en el cliente
export interface Favorito {
  id: number
  nombre: string
  precio: number
  imagenUrl?: string | null
  categoria?: { id?: number; nombre?: string }
}

// Expongo utilidades para consultar y mutar la lista de favoritos
interface FavoritesContextValue {
  favoritos: Favorito[]
  estaCargando: boolean
  esFavorito: (id: number) => boolean
  toggleFavorito: (producto: Favorito) => void
  eliminarFavorito: (id: number) => void
  limpiarFavoritos: () => void
}

// Creo el contexto para gestionar favoritos persistidos en localStorage
const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined)

// Uso una clave fija para almacenar los favoritos en localStorage
const STORAGE_KEY = "sp_favoritos"

type ProductoEntrada = Favorito | ProductoResumen

// Normalizo distintas formas de producto a mi tipo Favorito
const mapearProducto = (producto: ProductoEntrada): Favorito => ({
  id: producto.id,
  nombre: producto.nombre,
  precio: producto.precio,
  imagenUrl: producto.imagenUrl ?? null,
  categoria: "categoria" in producto ? producto.categoria : undefined,
})

// Proveedor de favoritos: hidrato desde localStorage y persisto en cambios
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoritos, setFavoritos] = useState<Favorito[]>([])
  const [estaCargando, setEstaCargando] = useState(true)

  // Al iniciar, leo favoritos del almacenamiento y manejo JSON inválido limpiando la clave
  useEffect(() => {
    const almacenados = localStorage.getItem(STORAGE_KEY)
    if (almacenados) {
      try {
        const parsed: Favorito[] = JSON.parse(almacenados)
        setFavoritos(parsed)
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setEstaCargando(false)
  }, [])

  // Cada cambio persisto la lista (evito escribir durante la carga inicial)
  useEffect(() => {
    if (!estaCargando) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favoritos))
    }
  }, [favoritos, estaCargando])

  // Compruebo si un producto está marcado como favorito
  const esFavorito = useCallback((id: number) => favoritos.some((fav) => fav.id === id), [favoritos])

  // Alterno el estado de favorito para un producto dado
  const toggleFavorito = useCallback((producto: ProductoEntrada) => {
    setFavoritos((prev) => {
      const existe = prev.some((fav) => fav.id === producto.id)
      if (existe) {
        return prev.filter((fav) => fav.id !== producto.id)
      }
      return [...prev, mapearProducto(producto)]
    })
  }, [])

  // Elimino un favorito por id
  const eliminarFavorito = useCallback((id: number) => {
    setFavoritos((prev) => prev.filter((fav) => fav.id !== id))
  }, [])

  // Limpio toda la lista de favoritos
  const limpiarFavoritos = useCallback(() => setFavoritos([]), [])

  // Memoizo el valor del contexto para evitar renders innecesarios
  const value = useMemo<FavoritesContextValue>(
    () => ({ favoritos, estaCargando, esFavorito, toggleFavorito, eliminarFavorito, limpiarFavoritos }),
    [favoritos, estaCargando, esFavorito, toggleFavorito, eliminarFavorito, limpiarFavoritos],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

// Expongo el hook para consumir Favorites y forzo su uso dentro del proveedor
export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error("useFavorites debe usarse dentro de FavoritesProvider")
  }
  return context
}
