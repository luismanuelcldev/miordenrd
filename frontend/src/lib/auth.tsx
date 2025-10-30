"use client"

import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from "react"
import { authService } from "@/services/authService"
import { tokenStorage } from "@/services/tokenStorage"
import type { PerfilUsuario } from "@/types/auth"

// Defino el contrato del contexto de autenticación que expongo a la app
interface AuthContextValue {
  usuario: PerfilUsuario | null
  estaAutenticado: boolean
  cargando: boolean
  iniciarSesion: (email: string, contrasena: string) => Promise<{ exito: boolean; usuario?: PerfilUsuario; error?: string }>
  registrarse: (datos: {
    nombre: string
    apellido: string
    email: string
    contrasena: string
    telefono?: string
  }) => Promise<{ exito: boolean; usuario?: PerfilUsuario; error?: string }>
  iniciarSesionConCodigo: (code: string, state?: string) => Promise<{ exito: boolean; usuario?: PerfilUsuario; error?: string }>
  cerrarSesion: () => Promise<void>
  refrescarPerfil: () => Promise<void>
}

// Creo el contexto de Auth para compartir estado y acciones en toda la app
const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// Normalizo el mensaje de error que pueda venir de Axios o fuentes desconocidas
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

// Proveedor de autenticación: leo tokens, cargo perfil y expongo acciones de login/logout
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<PerfilUsuario | null>(null)
  const [cargando, setCargando] = useState(true)

  // Al montar, si hay token intento recuperar el perfil; si falla, limpio sesión
  useEffect(() => {
    const token = tokenStorage.getAccessToken()
    if (!token) {
      setCargando(false)
      return
    }

    authService
      .getProfile()
      .then((perfil) => setUsuario(perfil))
      .catch(() => {
        tokenStorage.clearTokens()
        setUsuario(null)
      })
      .finally(() => setCargando(false))
  }, [])

  // Inicio sesión con email/contraseña, guardo perfil y gestiono errores limpiando tokens
  const iniciarSesion = useCallback(async (email: string, contrasena: string) => {
    setCargando(true)
    try {
      await authService.login({ email, contrasena })
      const perfil = await authService.getProfile()
      setUsuario(perfil)
      return { exito: true, usuario: perfil }
    } catch (error) {
      tokenStorage.clearTokens()
      setUsuario(null)
      return { exito: false, error: obtenerMensajeError(error) }
    } finally {
      setCargando(false)
    }
  }, [])

  // Registro de usuario y posterior recuperación del perfil autenticado
  const registrarse = useCallback(async (datos: {
    nombre: string
    apellido: string
    email: string
    contrasena: string
    telefono?: string
  }) => {
    setCargando(true)
    try {
      await authService.register(datos)
      const perfil = await authService.getProfile()
      setUsuario(perfil)
      return { exito: true, usuario: perfil }
    } catch (error) {
      tokenStorage.clearTokens()
      setUsuario(null)
      return { exito: false, error: obtenerMensajeError(error) }
    } finally {
      setCargando(false)
    }
  }, [])

  // Cierro sesión en backend si aplica y siempre limpio tokens/local state
  const cerrarSesion = useCallback(async () => {
    setCargando(true)
    try {
      await authService.logout()
    } finally {
      tokenStorage.clearTokens()
      setUsuario(null)
      setCargando(false)
    }
  }, [])

  // Refresco el perfil si hay token válido; si falla, invalido la sesión
  const refrescarPerfil = useCallback(async () => {
    if (!tokenStorage.getAccessToken()) {
      setUsuario(null)
      return
    }
    try {
      const perfil = await authService.getProfile()
      setUsuario(perfil)
    } catch (error) {
      tokenStorage.clearTokens()
      setUsuario(null)
      throw error
    }
  }, [])

  // Completo el flujo de login OAuth con el code recibido y actualizo el perfil
  const iniciarSesionConCodigo = useCallback(async (code: string, state?: string) => {
    setCargando(true)
    try {
      await authService.loginWithOAuthCode({ code, state })
      const perfil = await authService.getProfile()
      setUsuario(perfil)
      return { exito: true, usuario: perfil }
    } catch (error) {
      tokenStorage.clearTokens()
      setUsuario(null)
      return { exito: false, error: obtenerMensajeError(error) }
    } finally {
      setCargando(false)
    }
  }, [])

  // Memoizo el valor del contexto para evitar renders innecesarios
  const value = useMemo<AuthContextValue>(
    () => ({
      usuario,
      estaAutenticado: Boolean(usuario),
      cargando,
      iniciarSesion,
      registrarse,
      iniciarSesionConCodigo,
      cerrarSesion,
      refrescarPerfil,
    }),
    [usuario, cargando, iniciarSesion, registrarse, iniciarSesionConCodigo, cerrarSesion, refrescarPerfil],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Expongo el hook para consumir el contexto y aseguro su uso dentro del proveedor
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider")
  }
  return context
}
