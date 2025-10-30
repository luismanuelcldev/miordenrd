"use client"

// Muestro reportes y analítica: KPIs, gráficos y exportación rápida a PDF

import { useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"
import { Download, TrendingUp, Users, Package, ShoppingCart, Loader2 } from "lucide-react"
import { useAdminAnalytics } from "@/hooks/useAdminAnalytics"
import type { PedidoListado } from "@/types/pedido"
import { formatCurrency } from "@/utils/currency"
import { useToast } from "@/components/ui/toastContext"
import { useAuth } from "@/lib/auth"

const estadoLegible = (estado: PedidoListado["estado"]) => estado.replace(/_/g, " ")

export default function ReportesAdmin() {
  const { cargando, stats, ventasMensuales, pedidos, productos, totales } = useAdminAnalytics()
  const [exportando, setExportando] = useState(false)
  const reportRef = useRef<HTMLDivElement | null>(null)
  const { showToast } = useToast()
  const { usuario } = useAuth()
  const esAdministrador = usuario?.rol === "ADMINISTRADOR"

  // Calculo ingresos totales a partir de los pedidos cargados
  const ingresosTotales = useMemo(() => pedidos.reduce((suma, pedido) => suma + pedido.total, 0), [pedidos])
  // Cuento pedidos completados para un KPI rápido
  const pedidosCompletados = useMemo(
    () => pedidos.filter((pedido) => pedido.estado === "ENTREGADO").length,
    [pedidos],
  )
  // Agrupo pedidos por estado para alimentar la gráfica de distribución
  const pedidosPorEstado = useMemo(() => {
    const agrupado = new Map<string, number>()
    pedidos.forEach((pedido) => {
      agrupado.set(pedido.estado, (agrupado.get(pedido.estado) ?? 0) + 1)
    })
    return Array.from(agrupado.entries()).map(([estado, cantidad]) => ({ estado, cantidad }))
  }, [pedidos])

  // Exporto la vista actual como PDF usando html2canvas + jsPDF
  const handleExport = async () => {
    if (!reportRef.current) return
    try {
      setExportando(true)
      const html2canvas = (await import("html2canvas")).default
      const { jsPDF } = await import("jspdf")

      const canvas = await html2canvas(reportRef.current, { scale: 2 })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
      pdf.save(`reportes-${new Date().toISOString().slice(0, 10)}.pdf`)
      showToast("Reporte exportado en PDF", "success")
    } catch (error) {
      console.error(error)
      showToast("No fue posible exportar el reporte", "error")
    } finally {
      setExportando(false)
    }
  }

  // Muestro un spinner de carga mientras obtengo analítica y listados
  if (cargando) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Cargando reportes...
      </div>
    )
  }

  return (
    <div ref={reportRef} className="space-y-6 w-full max-w-[1024px] mx-auto">
      {/* Encabezado con selector de rango temporal y acción de exportar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reportes y Análisis</h1>
          <p className="text-muted-foreground">Visualiza el rendimiento real del negocio en tiempo real.</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="mes">
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Último mes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mes">Último mes</SelectItem>
              <SelectItem value="trimestre">Último trimestre</SelectItem>
              <SelectItem value="año">Último año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport} disabled={exportando}>
            {exportando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            {exportando ? "Generando PDF..." : "Exportar"}
          </Button>
        </div>
      </div>

      {/* Tarjetas KPI con métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {esAdministrador && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(ingresosTotales)}</div>
              <p className="text-xs text-muted-foreground">Sumatoria de todos los pedidos registrados.</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Completados</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pedidosCompletados}</div>
            <p className="text-xs text-muted-foreground">Pedidos con estado entregado.</p>
          </CardContent>
        </Card>

        {esAdministrador && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.usuariosActivos}</div>
              <p className="text-xs text-muted-foreground">Usuarios habilitados actualmente.</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventario Disponible</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productosStock.toLocaleString("es-ES")}</div>
            <p className="text-xs text-muted-foreground">{totales.productos} productos activos.</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficas de tendencia e histograma por estado (solo admins) */}
      {esAdministrador && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Ingresos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={ventasMensuales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value: number | string) => [formatCurrency(Number(value)), "Ingresos"]} />
                  <Line type="monotone" dataKey="ventas" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribución por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={pedidosPorEstado}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="estado" tickFormatter={estadoLegible} />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={(value) => [String(value), "Pedidos"]} labelFormatter={estadoLegible} />
                  <Area dataKey="cantidad" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla con el listado de pedidos recientes */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Pedidos</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">ID</th>
                <th className="text-left py-2">Fecha</th>
                <th className="text-left py-2">Cliente</th>
                <th className="text-left py-2">Estado</th>
                <th className="text-left py-2">Repartidor</th>
                <th className="text-right py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((pedido) => (
                <tr key={pedido.id} className="border-b last:border-0">
                  <td className="py-2 font-medium">#{pedido.id}</td>
                  <td className="py-2 text-muted-foreground">
                    {new Date(pedido.creadoEn).toLocaleDateString("es-ES")}
                  </td>
                  <td className="py-2">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {pedido.usuario?.nombre ?? "Cliente"} {pedido.usuario?.apellido ?? ""}
                      </span>
                      <span className="text-xs text-muted-foreground">{pedido.usuario?.email}</span>
                    </div>
                  </td>
                  <td className="py-2">
                    <span className="text-xs font-semibold uppercase text-muted-foreground">
                      {estadoLegible(pedido.estado)}
                    </span>
                  </td>
                  <td className="py-2">
                    {pedido.repartidor ? (
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {pedido.repartidor.nombre ?? ""} {pedido.repartidor.apellido ?? ""}
                        </span>
                        <span className="text-xs text-muted-foreground">{pedido.repartidor.email}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin asignar</span>
                    )}
                  </td>
                  <td className="py-2 text-right">{formatCurrency(pedido.total)}</td>
                </tr>
              ))}
              {pedidos.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">
                    No hay pedidos registrados todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Resumen compacto de productos (top N) */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Productos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Total de productos registrados: <span className="font-semibold">{totales.productos}</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {productos.slice(0, 6).map((producto) => (
              <div key={producto.id} className="border rounded-lg p-3 text-sm">
                <p className="font-semibold line-clamp-2">{producto.nombre}</p>
                <p className="text-muted-foreground">Stock: {producto.stock ?? 0} uds</p>
                <p className="text-muted-foreground">Precio: {formatCurrency(producto.precio)}</p>
              </div>
            ))}
            {productos.length === 0 && <p className="text-sm text-muted-foreground">No hay productos registrados.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
