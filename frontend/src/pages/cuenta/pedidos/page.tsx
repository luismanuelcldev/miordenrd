// Listo el historial de pedidos con filtros y un modal para ver detalles sin salir de la página
"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Eye, Package, Truck, CheckCircle, Clock, Loader2 } from "lucide-react"
import { orderService } from "@/services/orderService"
import type { PedidoDetalle, PedidoListado } from "@/types/pedido"
import { useToast } from "@/components/ui/toastContext"
import { formatCurrency } from "@/utils/currency"

const ESTADO_ETIQUETA: Record<PedidoListado["estado"], string> = {
  PENDIENTE: "Pendiente",
  EN_PREPARACION: "En preparación",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
}

const estadoBadge = (estado: PedidoListado["estado"]) => {
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

const estadoIcono = (estado: PedidoListado["estado"]) => {
  switch (estado) {
    case "PENDIENTE":
      return <Clock className="h-4 w-4" />
    case "EN_PREPARACION":
      return <Package className="h-4 w-4" />
    case "ENVIADO":
      return <Truck className="h-4 w-4" />
    case "ENTREGADO":
      return <CheckCircle className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

export default function MisPedidos() {
  const { showToast } = useToast()
  const [cargando, setCargando] = useState(true)
  const [pedidos, setPedidos] = useState<PedidoListado[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [detalle, setDetalle] = useState<PedidoDetalle | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  useEffect(() => {
    // Cargo mis pedidos desde la API y gestiono estados de carga y error
    const cargar = async () => {
      try {
        setCargando(true)
        const respuesta = await orderService.listarMisPedidos({ limit: 50 })
        setPedidos(respuesta.pedidos ?? [])
      } catch (error) {
        console.error(error)
        showToast("No fue posible cargar tus pedidos", "error")
      } finally {
        setCargando(false)
      }
    }

    void cargar()
  }, [showToast])

  // Aplico búsqueda por id y filtro por estado de manera memoizada
  const pedidosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    return pedidos.filter((pedido) => {
      const coincideBusqueda = !termino || pedido.id.toString().toLowerCase().includes(termino)
      const coincideEstado = filtroEstado === "todos" || pedido.estado === filtroEstado
      return coincideBusqueda && coincideEstado
    })
  }, [pedidos, busqueda, filtroEstado])

  // Obtengo el detalle del pedido seleccionado y abro el modal de visualización
  const verDetallePedido = async (pedidoId: number) => {
    try {
      setCargandoDetalle(true)
      const detallePedido = await orderService.obtenerPedido(pedidoId)
      setDetalle(detallePedido)
      setModalAbierto(true)
    } catch (error) {
      console.error(error)
      showToast("No fue posible obtener el detalle del pedido", "error")
    } finally {
      setCargandoDetalle(false)
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
        Cargando tus pedidos...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mis Pedidos</h1>
        <p className="text-muted-foreground">Revisa tu historial y el estado actual de tus pedidos.</p>
      </div>

      {/* Filtros por búsqueda e índice de estado */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ID de pedido"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {Object.keys(ESTADO_ETIQUETA).map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {ESTADO_ETIQUETA[estado as PedidoListado["estado"]]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Listado de pedidos con acciones para ver detalle */}
      <div className="space-y-4">
        {pedidosFiltrados.map((pedido) => (
          <Card key={pedido.id}>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">Pedido #{pedido.id}</h3>
                    <div className="flex items-center gap-2">
                      {estadoIcono(pedido.estado)}
                      <Badge className={estadoBadge(pedido.estado)}>{ESTADO_ETIQUETA[pedido.estado]}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Realizado el {new Date(pedido.creadoEn).toLocaleDateString("es-ES")}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold">{formatCurrency(pedido.total)}</p>
                    <p className="text-sm text-muted-foreground">{pedido.metodoPago}</p>
                  </div>
                  <Button variant="outline" onClick={() => verDetallePedido(pedido.id)} disabled={cargandoDetalle}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalles
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Estado vacío cuando no hay resultados acorde a los filtros */}
      {pedidosFiltrados.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron pedidos</h3>
            <p className="text-muted-foreground">
              {busqueda || filtroEstado !== "todos"
                ? "Prueba a modificar los filtros de búsqueda."
                : "Aún no has realizado ningún pedido."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal con resumen, productos y dirección del pedido seleccionado */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del pedido {detalle?.id}</DialogTitle>
          </DialogHeader>
          {detalle ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumen</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Estado</p>
                    <p className="font-semibold">{ESTADO_ETIQUETA[detalle.estado]}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fecha</p>
                    <p className="font-semibold">
                      {new Date(detalle.creadoEn).toLocaleDateString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-semibold">{formatCurrency(detalle.total)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Método de pago</p>
                    <p className="font-semibold">{detalle.metodoPago}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Productos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {detalle.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{item.producto.nombre}</p>
                        <p className="text-muted-foreground">Cantidad: {item.cantidad}</p>
                      </div>
                      <div className="text-right">
                        <p>{formatCurrency(item.cantidad * item.precio)}</p>
                        <p className="text-muted-foreground">{formatCurrency(item.precio)}/ud</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dirección de envío</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>{detalle.direccion.calle}</p>
                  <p>
                    {detalle.direccion.ciudad}
                    {detalle.direccion.codigoPostal ? `, ${detalle.direccion.codigoPostal}` : ""}
                  </p>
                  <p>{detalle.direccion.pais}</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Cargando detalle...
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
