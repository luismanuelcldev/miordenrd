import { api, plainClient } from "./api"
import { tokenStorage } from "./tokenStorage"
import type { PerfilUsuario, Usuario } from "@/types/auth"

interface LoginPayload {
  email: string
  contrasena: string
}

interface RegisterPayload extends LoginPayload {
  nombre: string
  apellido: string
  telefono?: string
}

interface AuthResponse {
  usuario: Usuario
  accessToken: string
  refreshToken: string
  expiresIn: number
}

interface OAuthCallbackPayload {
  code: string
  state?: string
}

// Normalizo campos opcionales del usuario que podrían venir como null
const mapUsuario = (usuario: Usuario): Usuario => ({
  ...usuario,
  nombre: usuario.nombre ?? undefined,
  apellido: usuario.apellido ?? undefined,
  telefono: usuario.telefono ?? undefined,
})

// Inicio sesión con credenciales y guardo tokens en el storage
async function login(payload: LoginPayload): Promise<Usuario> {
  const { data } = await plainClient.post<AuthResponse>("/auth/login", payload)
  tokenStorage.setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken })
  return mapUsuario(data.usuario)
}

// Registro un nuevo usuario y persisto la sesión recibida
async function register(payload: RegisterPayload): Promise<Usuario> {
  const { data } = await plainClient.post<AuthResponse>("/auth/register", payload)
  tokenStorage.setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken })
  return mapUsuario(data.usuario)
}

// Cierro sesión en backend si aplica y siempre limpio tokens
async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout")
  } catch {
    // Ignoramos errores de logout para evitar bloquear al usuario
  } finally {
    tokenStorage.clearTokens()
  }
}

// Recupero el perfil del usuario autenticado
async function getProfile(): Promise<PerfilUsuario> {
  const { data } = await api.get<PerfilUsuario>("/auth/me")
  return data
}

// Cambio la contraseña del usuario autenticado
async function changePassword(payload: { contrasenaActual: string; nuevaContrasena: string }) {
  const { data } = await api.post("/auth/change-password", payload)
  return data
}

// Actualizo campos del perfil del usuario autenticado
async function updateProfile(payload: { nombre?: string; apellido?: string; telefono?: string }) {
  const { data } = await api.patch<PerfilUsuario>("/auth/me", payload)
  return data
}

// Completo el flujo OAuth con el code y guardo tokens/usuario
async function loginWithOAuthCode(payload: OAuthCallbackPayload): Promise<Usuario> {
  const { data } = await plainClient.post<AuthResponse>("/auth/oauth/callback", payload)
  tokenStorage.setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken })
  return mapUsuario(data.usuario)
}

export const authService = {
  login,
  register,
  logout,
  getProfile,
  changePassword,
  updateProfile,
  loginWithOAuthCode,
}
