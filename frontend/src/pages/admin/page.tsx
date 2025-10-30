"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users, Package, ShoppingCart, DollarSign, Activity, Loader2 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useAdminAnalytics } from "@/hooks/useAdminAnalytics"
import type { PedidoListado } from "@/types/pedido"
import { formatCurrency } from "@/utils/currency"
import { useAuth } from "@/lib/auth"

// Assemblo el dashboard con métricas, gráfico y pedidos recientes
const estadoBadgeColor = (estado: PedidoListado["estado"]) => {
  switch (estado) {
    case "PENDIENTE":
      return "bg-yellow-100 text-yellow-800"
    case "EN_PREPARACION":
      return "bg-blue-100 text-blue-800"
    case "ENVIADO":
      return "bg-purple-100 text-purple-800"
    case "ENTREGADO":
      return "bg-green-100 text-green-800"
    case "CANCELADO":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

// Muestro KPIs y gráficos; si el usuario no es admin, limito la información
export default function AdminDashboard() {
  const { cargando, stats, ventasMensuales, pedidosRecientes, pedidos, totales } = useAdminAnalytics()
  const { usuario } = useAuth()
  const esAdministrador = usuario?.rol === "ADMINISTRADOR"

  // Calculo el ticket promedio a partir de los pedidos listados
  const ticketPromedio = useMemo(() => {
    if (pedidos.length === 0) return 0
    const ingresos = pedidos.reduce((suma, pedido) => suma + pedido.total, 0)
    return Number(ingresos / pedidos.length)
  }, [pedidos])

  // Muestro un indicador de carga mientras obtengo estadísticas y listados
  if (cargando) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
        Cargando información del panel...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen actualizado con los datos reales de ventas, pedidos y clientes.
        </p>
      </div>

      {/* KPIs principales solo para administradores */}
      {esAdministrador && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas Hoy</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.ventasHoy)}</div>
            <p className="text-xs text-muted-foreground">Total de ingresos registrados hoy.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.ingresosMes)}</div>
            <p className="text-xs text-muted-foreground">Sumatoria de pedidos del mes en curso.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Pendientes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pedidosPendientes}</div>
            <p className="text-xs text-muted-foreground">Pedidos que aún requieren atención.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Disponible</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productosStock.toLocaleString("es-ES")}</div>
            <p className="text-xs text-muted-foreground">{totales.productos} referencias activas.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usuariosActivos}</div>
            <p className="text-xs text-muted-foreground">{totales.usuarios} usuarios registrados.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(ticketPromedio)}</div>
            <p className="text-xs text-muted-foreground">Basado en {totales.pedidos} pedidos registrados.</p>
          </CardContent>
        </Card>
        </div>
      )}

      {/* Gráfico de ventas por mes y pedidos recientes */}
      {esAdministrador && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Ventas por Mes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ventasMensuales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`RD$${value}`, "Ingresos"]} />
                  <Bar dataKey="ventas" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pedidos Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pedidosRecientes.length === 0 && (
                  <p className="text-sm text-muted-foreground">Todavía no hay pedidos registrados.</p>
                )}
                {pedidosRecientes.map((pedido) => (
                  <div key={pedido.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Pedido #{pedido.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(pedido.creadoEn).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(pedido.total)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${estadoBadgeColor(pedido.estado)}`}>
                        {pedido.estado.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Para empleados, muestro únicamente el listado de pedidos recientes */}
      {!esAdministrador && (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pedidosRecientes.length === 0 && (
                  <p className="text-sm text-muted-foreground">Todavía no hay pedidos registrados.</p>
                )}
                {pedidosRecientes.map((pedido) => (
                  <div key={pedido.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Pedido #{pedido.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(pedido.creadoEn).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(pedido.total)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${estadoBadgeColor(pedido.estado)}`}>
                        {pedido.estado.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
