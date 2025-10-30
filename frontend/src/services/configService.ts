import { api } from "./api"

export interface ConfiguracionSistema {
  nombreTienda: string
  descripcion?: string | null
  email: string
  telefono?: string | null
  direccion?: string | null
  notificacionesPedidos: boolean
  notificacionesStock: boolean
  notificacionesClientes: boolean
  autenticacionDosFactor: boolean
  sesionExpiracion: number
  envioGratis: number
  costoEnvio: number
  tiempoEntrega?: string | null
  iva: number
  moneda: string
  colorPrimario: string
  colorSecundario: string
  logoUrl?: string | null
  actualizadoEn?: string
}

// Consulto la configuración del sistema ocultando el id interno
async function obtenerConfiguracion(): Promise<ConfiguracionSistema> {
  const { data } = await api.get<ConfiguracionSistema & { id: number }>("/configuracion")
  const { id, ...config } = data
  return config
}

// Actualizo la configuración y retorno el payload sin id
async function actualizarConfiguracion(payload: ConfiguracionSistema): Promise<ConfiguracionSistema> {
  const { data } = await api.put<ConfiguracionSistema & { id: number }>("/configuracion", payload)
  const { id, ...config } = data
  return config
}

export const configService = {
  obtenerConfiguracion,
  actualizarConfiguracion,
}
