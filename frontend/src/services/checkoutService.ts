import { api } from "./api"
import type { MetodoPago, PedidoDetalle } from "@/types/pedido"

interface CheckoutPayload {
  direccionId: number
  metodoPago: MetodoPago
  observaciones?: string
}

// Envío el checkout al backend y recibo el pedido generado
async function procesarCompra(payload: CheckoutPayload): Promise<PedidoDetalle> {
  const { data } = await api.post<PedidoDetalle>("/checkout", payload)
  return data
}

export const checkoutService = {
  procesarCompra,
}

