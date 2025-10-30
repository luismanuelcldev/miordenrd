import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type AxiosRequestHeaders,
  type InternalAxiosRequestConfig,
} from "axios"
import { tokenStorage } from "./tokenStorage"

// Resuelvo la base URL de la API desde VITE_API_URL y la normalizo sin slash final
const rawBaseURL = import.meta.env.VITE_API_URL?.trim()
const baseURL =
  rawBaseURL && rawBaseURL.length > 0
    ? rawBaseURL.replace(/\/+$/, "")
    : "/api/v1"

if (!rawBaseURL) {
  console.warn(
    "⚠️ VITE_API_URL no está configurada. Se usará '/api/v1' relativo al origen actual. Configura VITE_API_URL para entornos locales."
  )
}

console.log("🔧 API Base URL:", baseURL)

// Creo dos clientes: uno autenticado con interceptores y otro plano para login/refresh
const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
})

const plainClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
})

// Adjunto el token de acceso y dejo que FormData gestione su propio Content-Type
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (config.data instanceof FormData && config.headers) {
    delete config.headers["Content-Type"]
  }
  return config
})

interface PendingRequest {
  resolve: (token: string) => void
  reject: (error: unknown) => void
}

let isRefreshing = false
const queue: PendingRequest[] = []

// Resuelvo o rechazo en cola cuando termina el refresh
const processQueue = (error: unknown, token: string | null) => {
  queue.forEach(({ resolve, reject }) => {
    if (error || !token) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  queue.length = 0
}

// Evito intentar refresh en rutas de autenticación
const shouldAttemptRefresh = (config?: AxiosRequestConfig) => {
  if (!config?.url) return false
  return !config.url.includes("/auth/login") && !config.url.includes("/auth/register") && !config.url.includes("/auth/refresh")
}

// Garantizo que existan headers en el request clonado
const ensureHeaders = (config: InternalAxiosRequestConfig & { _retry?: boolean }): AxiosRequestHeaders => {
  if (!config.headers) {
    config.headers = {} as AxiosRequestHeaders
  }
  return config.headers
}

// Intento refrescar tokens en 401 y reencolo solicitudes mientras tanto
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

    if (status === 401 && originalRequest && !originalRequest._retry && shouldAttemptRefresh(originalRequest)) {
      const refreshToken = tokenStorage.getRefreshToken()

      if (!refreshToken) {
        tokenStorage.clearTokens()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({
            resolve: (token) => {
              const headers = ensureHeaders(originalRequest)
              headers.Authorization = `Bearer ${token}`
              resolve(api(originalRequest))
            },
            reject,
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await plainClient.post("/auth/refresh", { refreshToken })
        const { accessToken, refreshToken: newRefreshToken } = data

        tokenStorage.setTokens({ accessToken, refreshToken: newRefreshToken ?? refreshToken })
        processQueue(null, accessToken)

        const headers = ensureHeaders(originalRequest)
        headers.Authorization = `Bearer ${accessToken}`

        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        tokenStorage.clearTokens()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export { api, plainClient }
