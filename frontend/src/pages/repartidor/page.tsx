"use client"

// Presento el resumen del repartidor: totales por estado, ingresos estimados y próxima entrega

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { orderService } from "@/services/orderService"
import type { EstadoPedido, PedidoListado } from "@/types/pedido"
import { Loader2, MapPin, PackageCheck, Route, Truck } from "lucide-react"
import { formatCurrency } from "@/utils/currency"
import { Link } from "react-router-dom"

export default function RepartidorDashboardPage() {
  const [pedidos, setPedidos] = useState<PedidoListado[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Al montar, cargo pedidos asignados al repartidor y administro estados de carga/errores
  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      setError(null)
      try {
        const { pedidos } = await orderService.listarPedidosRepartidor({ limit: 50 })
        setPedidos(pedidos)
      } catch (err) {
        console.error(err)
        setError("No fue posible obtener tus pedidos asignados.")
      } finally {
        setCargando(false)
      }
    }
    void cargar()
  }, [])

  // Calculo totales por estado, ingresos estimados y la siguiente parada priorizando más antigua
  const resumen = useMemo(() => {
    const totalesPorEstado = pedidos.reduce<Record<EstadoPedido, number>>(
      (acumulado, pedido) => ({
        ...acumulado,
        [pedido.estado]: (acumulado[pedido.estado] ?? 0) + 1,
      }),
      {
        PENDIENTE: 0,
        EN_PREPARACION: 0,
        ENVIADO: 0,
        ENTREGADO: 0,
        CANCELADO: 0,
      },
    )

    const ingresosEstimados = pedidos.reduce((total, pedido) => total + pedido.total, 0)

    const siguienteParada = pedidos
      .filter((pedido) => pedido.estado === "ENVIADO" || pedido.estado === "EN_PREPARACION")
      .sort((a, b) => a.creadoEn.localeCompare(b.creadoEn))[0]

    return {
      totalesPorEstado,
      ingresosEstimados,
      siguienteParada,
    }
  }, [pedidos])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Tu jornada de entregas</h1>
        <p className="text-muted-foreground">
          Visualiza los pedidos asignados, las entregas pendientes y tu avance durante el día.
        </p>
      </div>

      {/* Muestro un mensaje si hubo error al cargar */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tarjetas KPI con conteos y valor estimado de la jornada */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos asignados</CardTitle>
            <Route className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cargando ? <Loader2 className="h-5 w-5 animate-spin" /> : pedidos.length}</div>
            <p className="text-xs text-muted-foreground">Pedidos activos en tu ruta.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En camino</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cargando ? <Loader2 className="h-5 w-5 animate-spin" /> : resumen.totalesPorEstado.ENVIADO}
            </div>
            <p className="text-xs text-muted-foreground">Pedidos marcados como enviados.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregados</CardTitle>
            <PackageCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cargando ? <Loader2 className="h-5 w-5 animate-spin" /> : resumen.totalesPorEstado.ENTREGADO}
            </div>
            <p className="text-xs text-muted-foreground">Pedidos completados hoy.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor estimado</CardTitle>
            <MapPin className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cargando ? <Loader2 className="h-5 w-5 animate-spin" /> : formatCurrency(resumen.ingresosEstimados)}
            </div>
            <p className="text-xs text-muted-foreground">Valor total de los pedidos actuales.</p>
          </CardContent>
        </Card>
      </div>

      {/* Detalle de la siguiente parada con CTA a la lista de pedidos */}
      <Card>
        <CardHeader>
          <CardTitle>Siguiente parada</CardTitle>
        </CardHeader>
        <CardContent>
          {cargando ? (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando información de entregas...
            </div>
          ) : resumen.siguienteParada ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pedido #{resumen.siguienteParada.id}</p>
                  <p className="text-lg font-semibold">
                    {resumen.siguienteParada.usuario?.nombre ?? "Cliente"} ·{" "}
                    {resumen.siguienteParada.usuario?.email ?? "Correo no disponible"}
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link to="/repartidor/pedidos">Ir a pedidos</Link>
                </Button>
              </div>
              <div className="grid gap-2 rounded-lg border bg-blue-50/60 p-4 text-sm text-blue-900">
                <p className="font-medium">Estado actual</p>
                <p>{resumen.siguienteParada.estado.replace(/_/g, " ")}</p>
                {resumen.siguienteParada.direccion && (
                  <div className="mt-2">
                    <p className="font-medium">Dirección</p>
                    <p>
                      {resumen.siguienteParada.direccion.calle}
                      {resumen.siguienteParada.direccion.ciudad
                        ? `, ${resumen.siguienteParada.direccion.ciudad}`
                        : ""}
                    </p>
                    {resumen.siguienteParada.direccion.codigoPostal && (
                      <p>{resumen.siguienteParada.direccion.codigoPostal}</p>
                    )}
                  </div>
                )}
                <p className="font-medium mt-2">Importe</p>
                <p>{formatCurrency(resumen.siguienteParada.total)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No tienes entregas pendientes por el momento. Cuando un administrador te asigne nuevos pedidos, los verás aquí.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
