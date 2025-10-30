"use client"

// Gestiono pedidos asignados al repartidor: filtro por estado, veo detalle y marco avance (preparación/ruta/entregado)

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { orderService } from "@/services/orderService"
import type { EstadoPedido, PedidoDetalle, PedidoListado } from "@/types/pedido"
import { Loader2, MapPin, RefreshCcw, User } from "lucide-react"
import { formatCurrency } from "@/utils/currency"
import { useToast } from "@/components/ui/toastContext"

// Defino los estados disponibles para filtrar mis entregas como repartidor
const ESTADOS_DISPONIBLES: Array<{ label: string; value: EstadoPedido | "TODOS" }> = [
  { label: "Todos", value: "TODOS" },
  { label: "En preparación", value: "EN_PREPARACION" },
  { label: "En ruta", value: "ENVIADO" },
  { label: "Entregados", value: "ENTREGADO" },
  { label: "Cancelados", value: "CANCELADO" },
]

// Mapeo cómo progresa cada pedido según su estado actual
const ACCIONES_POR_ESTADO: Partial<Record<EstadoPedido, EstadoPedido[]>> = {
  PENDIENTE: ["EN_PREPARACION"],
  EN_PREPARACION: ["ENVIADO"],
  ENVIADO: ["ENTREGADO"],
}

// Etiqueto los botones de acción con mensajes claros para el flujo de reparto
const LABEL_ACCION: Partial<Record<EstadoPedido, string>> = {
  EN_PREPARACION: "Marcar en preparación",
  ENVIADO: "Marcar en ruta",
  ENTREGADO: "Confirmar entrega",
}

export default function RepartidorPedidosPage() {
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoPedido | "TODOS">("TODOS")
  const [pedidos, setPedidos] = useState<PedidoListado[]>([])
  const [paginacion, setPaginacion] = useState<{ page: number; totalPages: number }>({ page: 1, totalPages: 1 })
  const [detalle, setDetalle] = useState<PedidoDetalle | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [actualizando, setActualizando] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useToast()

  // Obtengo un mensaje entendible desde un posible error HTTP del backend
  const mensajeErrorActualizacion = (err: unknown) => {
    if (!err || typeof err !== "object") return "No fue posible actualizar el estado del pedido"
    const posibleAxios = err as { response?: { data?: { message?: unknown } } }
    const mensaje = posibleAxios.response?.data?.message
    if (Array.isArray(mensaje)) return mensaje.join(". ")
    if (typeof mensaje === "string") return mensaje
    return "No fue posible actualizar el estado del pedido"
  }

  const cargarPedidos = useCallback(
    async (page = 1) => {
      // Cargo los pedidos asignados con paginación y el filtro de estado actual
      setCargando(true)
      setError(null)
      try {
        const { pedidos, paginacion } = await orderService.listarPedidosRepartidor({
          page,
          limit: 10,
          estado: estadoFiltro === "TODOS" ? undefined : estadoFiltro,
        })
        setPedidos(pedidos)
        setPaginacion({ page: paginacion.page, totalPages: paginacion.totalPages })
      } catch (err) {
        console.error(err)
        setError("No pudimos cargar tus pedidos asignados. Intenta de nuevo.")
      } finally {
        setCargando(false)
      }
    },
    [estadoFiltro],
  )

  useEffect(() => {
    void cargarPedidos(1)
  }, [cargarPedidos])

  // Abro el modal y consulto el detalle del pedido seleccionado
  const abrirDetalle = async (pedidoId: number) => {
    setModalAbierto(true)
    setDetalle(null)
    setCargandoDetalle(true)
    try {
      const data = await orderService.obtenerPedido(pedidoId)
      setDetalle(data)
    } catch (err) {
      console.error(err)
      showToast("No fue posible cargar el detalle del pedido", "error")
      setModalAbierto(false)
    } finally {
      setCargandoDetalle(false)
    }
  }

  // Avanzo el estado del pedido y sincronizo la lista y el modal si está abierto
  const actualizarEstado = async (pedido: PedidoListado, siguiente: EstadoPedido) => {
    setActualizando(pedido.id)
    try {
      await orderService.actualizarEstadoPedido(pedido.id, siguiente)
      showToast("Estado actualizado correctamente", "success")
      await cargarPedidos(paginacion.page)
      if (modalAbierto && detalle?.id === pedido.id) {
        const data = await orderService.obtenerPedido(pedido.id)
        setDetalle(data)
      }
    } catch (err) {
      console.error(err)
      showToast(mensajeErrorActualizacion(err), "error")
    } finally {
      setActualizando(null)
    }
  }

  // Memoizo la lista resultante para evitar renders innecesarios en la tabla
  const pedidosAgrupados = useMemo(() => pedidos, [pedidos])

  // Formateo el estado interno a un texto legible para la UI
  const estadoLegible = (estado: EstadoPedido) => estado.replace(/_/g, " ")

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Pedidos asignados</h1>
        <p className="text-muted-foreground">
          Controla el avance de cada entrega y reporta el estado en tiempo real.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Selecciona el estado para acotar tus entregas.</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={estadoFiltro}
              onValueChange={(valor) => {
                setEstadoFiltro(valor as EstadoPedido | "TODOS")
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_DISPONIBLES.map((estado) => (
                  <SelectItem key={estado.value} value={estado.value}>
                    {estado.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" onClick={() => cargarPedidos(paginacion.page)} disabled={cargando}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Listado de pedidos</CardTitle>
          <CardDescription>
            Pulsa sobre un pedido para ver los detalles o registrar la entrega.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {cargando ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cargando pedidos asignados...
            </div>
          ) : pedidosAgrupados.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No hay pedidos asignados con los filtros actuales.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedidosAgrupados.map((pedido) => {
                  const acciones = ACCIONES_POR_ESTADO[pedido.estado] ?? []
                  return (
                    <TableRow key={pedido.id} className="cursor-pointer hover:bg-blue-50/40">
                      <TableCell onClick={() => abrirDetalle(pedido.id)}>#{pedido.id}</TableCell>
                      <TableCell onClick={() => abrirDetalle(pedido.id)}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {pedido.usuario?.nombre ? `${pedido.usuario.nombre} ${pedido.usuario.apellido ?? ""}` : "Cliente"}
                          </span>
                          <span className="text-xs text-muted-foreground">{pedido.usuario?.email}</span>
                        </div>
                      </TableCell>
                      <TableCell onClick={() => abrirDetalle(pedido.id)}>
                        {new Date(pedido.creadoEn).toLocaleString("es-DO")}
                      </TableCell>
                      <TableCell onClick={() => abrirDetalle(pedido.id)}>
                        <Badge variant="outline">{estadoLegible(pedido.estado)}</Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={() => abrirDetalle(pedido.id)}>
                        {formatCurrency(pedido.total)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {acciones.map((accion) => (
                            <Button
                              key={accion}
                              size="sm"
                              variant={accion === "ENTREGADO" ? "default" : "outline"}
                              onClick={() => actualizarEstado(pedido, accion)}
                              disabled={actualizando === pedido.id}
                            >
                              {actualizando === pedido.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                LABEL_ACCION[accion] ?? "Actualizar"
                              )}
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
            <Button
              size="sm"
              variant="outline"
              onClick={() => cargarPedidos(Math.max(1, paginacion.page - 1))}
              disabled={cargando || paginacion.page <= 1}
            >
              Anterior
            </Button>
            <span>
              Página {paginacion.page} de {paginacion.totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => cargarPedidos(Math.min(paginacion.totalPages, paginacion.page + 1))}
              disabled={cargando || paginacion.page >= paginacion.totalPages}
            >
              Siguiente
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Pedido #{detalle?.id ?? ""}</DialogTitle>
          </DialogHeader>
          {cargandoDetalle ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Cargando información...
            </div>
          ) : detalle ? (
            <div className="space-y-6 text-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-xs uppercase text-muted-foreground mb-2">Cliente</p>
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="font-medium">
                        {detalle.usuario?.nombre ? `${detalle.usuario.nombre} ${detalle.usuario.apellido ?? ""}` : "Cliente"}
                      </p>
                      <p className="text-muted-foreground text-xs">{detalle.usuario?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs uppercase text-muted-foreground mb-2">Dirección</p>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <div>
                      <p>{detalle.direccion.calle}</p>
                      <p className="text-xs text-muted-foreground">
                        {detalle.direccion.ciudad}, {detalle.direccion.pais} {detalle.direccion.codigoPostal ?? ""}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase text-muted-foreground mb-3">Productos</p>
                <div className="space-y-2">
                  {detalle.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.producto.nombre}</p>
                        <p className="text-xs text-muted-foreground">Cantidad: {item.cantidad}</p>
                      </div>
                      <div className="text-right">
                        <p>{formatCurrency(item.precio * item.cantidad)}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(item.precio)} / unidad</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Estado actual</p>
                  <Badge variant="outline" className="mt-1">
                    {estadoLegible(detalle.estado)}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase text-muted-foreground">Total</p>
                  <p className="text-lg font-semibold">{formatCurrency(detalle.total)}</p>
                </div>
              </div>

              <div className="flex gap-2">
                {(ACCIONES_POR_ESTADO[detalle.estado] ?? []).map((accion) => (
                  <Button
                    key={accion}
                    onClick={() => actualizarEstado(detalle, accion)}
                    disabled={actualizando === detalle.id}
                    className="flex-1"
                  >
                    {actualizando === detalle.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      LABEL_ACCION[accion] ?? "Actualizar"
                    )}
                  </Button>
                ))}
                <Button variant="outline" onClick={() => setModalAbierto(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No se encontró información del pedido.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
