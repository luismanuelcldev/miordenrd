import { api } from "./api"
import type { RolUsuario } from "@/types/auth"

export interface UsuarioAdministrador {
  id: number
  email: string
  nombre?: string | null
  apellido?: string | null
  telefono?: string | null
  rol: RolUsuario
  activo: boolean
  creadoEn: string
  actualizadoEn: string
}

export interface CrearUsuarioPayload {
  email: string
  contrasena: string
  nombre?: string
  apellido?: string
  telefono?: string
  rol?: RolUsuario
}

export interface ActualizarUsuarioPayload {
  nombre?: string
  apellido?: string
  telefono?: string
  rol?: RolUsuario
}

// Listo usuarios para administración
async function listarUsuariosAdmin(): Promise<UsuarioAdministrador[]> {
  const { data } = await api.get<UsuarioAdministrador[]>("/usuarios")
  return data
}

// Creo un usuario con rol específico
async function crearUsuarioAdmin(payload: CrearUsuarioPayload): Promise<UsuarioAdministrador> {
  const { data } = await api.post<UsuarioAdministrador>("/usuarios", payload)
  return data
}

// Cambio el rol de un usuario existente
async function actualizarRolUsuario(id: number, rol: RolUsuario): Promise<UsuarioAdministrador> {
  const { data } = await api.patch<UsuarioAdministrador>(`/usuarios/${id}/rol`, { rol })
  return data
}

// Actualizo datos generales del usuario
async function actualizarUsuario(id: number, payload: ActualizarUsuarioPayload): Promise<UsuarioAdministrador> {
  const { data } = await api.patch<UsuarioAdministrador>(`/usuarios/${id}`, payload)
  return data
}

// Activo un usuario deshabilitado
async function activarUsuario(id: number): Promise<UsuarioAdministrador> {
  const { data } = await api.patch<UsuarioAdministrador>(`/usuarios/${id}/activar`)
  return data
}

// Desactivo un usuario
async function desactivarUsuario(id: number): Promise<UsuarioAdministrador> {
  const { data } = await api.patch<UsuarioAdministrador>(`/usuarios/${id}/desactivar`)
  return data
}

// Elimino un usuario definitivamente
async function eliminarUsuario(id: number): Promise<void> {
  await api.delete(`/usuarios/${id}`)
}

export const userService = {
  listarUsuariosAdmin,
  crearUsuarioAdmin,
  actualizarRolUsuario,
  actualizarUsuario,
  activarUsuario,
  desactivarUsuario,
  eliminarUsuario,
}
