import { api } from "./api"

export interface ContactoPayload {
  nombre: string
  email: string
  asunto?: string
  mensaje: string
}

// Envío el formulario de contacto al backend y retorno la respuesta
export async function enviarContacto(payload: ContactoPayload) {
  const { data } = await api.post("/contacto", payload)
  return data
}

