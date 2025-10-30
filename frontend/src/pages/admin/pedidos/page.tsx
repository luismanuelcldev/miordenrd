"use client"

// Gestiono pedidos: filtro por estado, veo detalles, asigno repartidor y actualizo estados

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Eye, Loader2, RefreshCw, PackageOpen } from "lucide-react"
import { orderService } from "@/services/orderService"
import type { EstadoPedido, PedidoDetalle, PedidoListado } from "@/types/pedido"
import { useToast } from "@/components/ui/toastContext"
import { userService, type UsuarioAdministrador } from "@/services/userService"
import type { RolUsuario } from "@/types/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"

type EstadoFiltro = "todos" | EstadoPedido

// Defino la lista de estados para filtrar y pintar badges coherentes
const estadosDisponibles: Array<{ value: EstadoPedido; label: string; badgeClass: string }> = [
  { value: "PENDIENTE", label: "Pendiente", badgeClass: "bg-yellow-100 text-yellow-800" },
  { value: "EN_PREPARACION", label: "En preparación", badgeClass: "bg-blue-100 text-blue-800" },
  { value: "ENVIADO", label: "Enviado", badgeClass: "bg-purple-100 text-purple-800" },
  { value: "ENTREGADO", label: "Entregado", badgeClass: "bg-green-100 text-green-800" },
  { value: "CANCELADO", label: "Cancelado", badgeClass: "bg-red-100 text-red-800" },
]

// Obtengo la clase de estilo según el estado para mostrarlo consistente
const badgeEstado = (estado: EstadoPedido) =>
  estadosDisponibles.find((item) => item.value === estado)?.badgeClass ?? "bg-gray-100 text-gray-800"

// Considero qué roles pueden ser candidatos a reparto en la asignación
const rolesRepartidores: RolUsuario[] = ["REPARTIDOR", "EMPLEADO"]

export default function PedidosAdmin() {
  const [pedidos, setPedidos] = useState<PedidoListado[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [filtroEstado, setFiltroEstado] = useState<EstadoFiltro>("todos")
  const [modalAbierto, setModalAbierto] = useState(false)
  const [pedidoDetalle, setPedidoDetalle] = useState<PedidoDetalle | null>(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [repartidores, setRepartidores] = useState<UsuarioAdministrador[]>([])
  const [actualizandoEstado, setActualizandoEstado] = useState(false)
  const [asignandoRepartidor, setAsignandoRepartidor] = useState(false)
  const { showToast } = useToast()

  // Cargo pedidos administrativamente con filtro de estado y paginación fija
  const cargarPedidos = useCallback(async () => {
    setCargando(true)
    try {
      const estado = filtroEstado === "todos" ? undefined : filtroEstado
      const { pedidos } = await orderService.listarPedidosAdmin({ page: 1, limit: 50, estado })
      setPedidos(pedidos)
    } catch (error) {
      console.error(error)
      showToast("No fue posible cargar los pedidos", "error")
    } finally {
      setCargando(false)
    }
  }, [filtroEstado, showToast])

  // Consulto usuarios y filtro aquellos con rol apto para reparto
  const cargarRepartidores = useCallback(async () => {
    try {
      const usuarios = await userService.listarUsuariosAdmin()
      const disponibles = usuarios.filter((usuario) => rolesRepartidores.includes(usuario.rol))
      setRepartidores(disponibles)
    } catch (error) {
      console.error(error)
    }
  }, [])

  useEffect(() => {
    void Promise.all([cargarPedidos(), cargarRepartidores()])
  }, [cargarPedidos, cargarRepartidores])

  // Aplico búsqueda por id, email o nombre completo
  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((pedido) => {
      const termino = busqueda.toLowerCase()
      const coincideBusqueda =
        pedido.id.toString().includes(termino) ||
        pedido.usuario?.email.toLowerCase().includes(termino) ||
        `${pedido.usuario?.nombre ?? ""} ${pedido.usuario?.apellido ?? ""}`.toLowerCase().includes(termino)
      return coincideBusqueda
    })
  }, [pedidos, busqueda])

  // Abro el modal y traigo el detalle completo del pedido
  const abrirModalDetalle = async (pedidoId: number) => {
    setPedidoDetalle(null)
    setModalAbierto(true)
    setCargandoDetalle(true)
    try {
      const detalle = await orderService.obtenerPedido(pedidoId)
      setPedidoDetalle(detalle)
    } catch (error) {
      console.error(error)
      showToast("No fue posible obtener los detalles del pedido", "error")
      setModalAbierto(false)
    } finally {
      setCargandoDetalle(false)
    }
  }

  // Cambio el estado del pedido y sincronizo tanto la tabla como el modal si corresponde
  const actualizarEstadoPedido = async (pedidoId: number, estado: EstadoPedido) => {
    setActualizandoEstado(true)
    try {
      await orderService.actualizarEstadoPedido(pedidoId, estado)
      showToast("Estado actualizado correctamente", "success")
      await cargarPedidos()
      if (pedidoDetalle?.id === pedidoId) {
        const detalleActualizado = await orderService.obtenerPedido(pedidoId)
        setPedidoDetalle(detalleActualizado)
      }
    } catch (error) {
      console.error(error)
      showToast("No fue posible actualizar el estado del pedido", "error")
    } finally {
      setActualizandoEstado(false)
    }
  }

  // Asigno un repartidor al pedido y refresco el detalle si está visible
  const asignarRepartidor = async (pedidoId: number, repartidorId: number) => {
    setAsignandoRepartidor(true)
    try {
      await orderService.asignarRepartidorPedido(pedidoId, repartidorId)
      showToast("Repartidor asignado correctamente", "success")
      await cargarPedidos()
      if (pedidoDetalle?.id === pedidoId) {
        const detalleActualizado = await orderService.obtenerPedido(pedidoId)
        setPedidoDetalle(detalleActualizado)
      }
    } catch (error) {
      console.error(error)
      showToast("No fue posible asignar el repartidor", "error")
    } finally {
      setAsignandoRepartidor(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Pedidos</h1>
          <p className="text-muted-foreground">Administra y realiza seguimiento de los pedidos realizados</p>
        </div>
        <Button variant="outline" onClick={() => void cargarPedidos()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

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
                  placeholder="Buscar por ID, cliente o email..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filtroEstado} onValueChange={(valor: EstadoFiltro) => setFiltroEstado(valor)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {estadosDisponibles.map((estado) => (
                  <SelectItem key={estado.value} value={estado.value}>
                    {estado.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Pedidos
            <span className="ml-2 text-sm font-normal text-muted-foreground">({pedidosFiltrados.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cargando ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Repartidor</TableHead>
                    <TableHead className="w-32">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidosFiltrados.map((pedido) => (
                    <TableRow key={pedido.id}>
                      <TableCell>#{pedido.id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {pedido.usuario?.nombre ?? ""} {pedido.usuario?.apellido ?? ""}
                          </span>
                          <span className="text-sm text-muted-foreground">{pedido.usuario?.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(pedido.creadoEn).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={badgeEstado(pedido.estado)}>{pedido.estado.replace("_", " ")}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">RD${pedido.total.toFixed(2)}</TableCell>
                      <TableCell>
                        {pedido.repartidor ? (
                          <div className="text-sm">
                            {pedido.repartidor.nombre ?? ""} {pedido.repartidor.apellido ?? ""}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sin asignar</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => void abrirModalDetalle(pedido.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {pedidosFiltrados.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No se encontraron pedidos para los filtros seleccionados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-w-xl md:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del pedido</DialogTitle>
          </DialogHeader>
          {cargandoDetalle ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : pedidoDetalle ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <PackageOpen className="h-5 w-5" /> Información
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium block text-muted-foreground">ID Pedido</span>
                      #{pedidoDetalle.id}
                    </div>
                    <div>
                      <span className="font-medium block text-muted-foreground">Fecha</span>
                      {new Date(pedidoDetalle.creadoEn).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium block text-muted-foreground">Estado</span>
                      <Badge className={badgeEstado(pedidoDetalle.estado)}>
                        {pedidoDetalle.estado.replace("_", " ")}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium block text-muted-foreground">Total</span>
                      <span className="text-lg font-semibold">RD${pedidoDetalle.total.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cliente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium block text-muted-foreground">Nombre</span>
                      {pedidoDetalle.usuario?.nombre ?? ""} {pedidoDetalle.usuario?.apellido ?? ""}
                    </div>
                    <div>
                      <span className="font-medium block text-muted-foreground">Email</span>
                      {pedidoDetalle.usuario?.email}
                    </div>
                    <div>
                      <span className="font-medium block text-muted-foreground">Dirección</span>
                      {pedidoDetalle.direccion.calle}, {pedidoDetalle.direccion.ciudad} ({pedidoDetalle.direccion.pais})
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Acciones del pedido</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Actualizar estado</Label>
                    <Select
                      value={pedidoDetalle.estado}
                      onValueChange={(valor: EstadoPedido) => void actualizarEstadoPedido(pedidoDetalle.id, valor)}
                      disabled={actualizandoEstado}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {estadosDisponibles.map((estado) => (
                          <SelectItem key={estado.value} value={estado.value}>
                            {estado.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                 </div>
                  <AsignacionRepartidor
                    pedido={pedidoDetalle}
                    repartidores={repartidores}
                    onAsignar={(id) => asignarRepartidor(pedidoDetalle.id, id)}
                    cargando={asignandoRepartidor}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Productos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pedidoDetalle.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{item.producto.nombre}</p>
                        <p className="text-sm text-muted-foreground">Cantidad: {item.cantidad}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">RD${(item.precio * item.cantidad).toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">RD${item.precio.toFixed(2)} c/u</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No se pudo cargar la información del pedido.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Componente auxiliar: gestiono la asignación de repartidor con validaciones por estado
interface AsignacionRepartidorProps {
  pedido: PedidoDetalle
  repartidores: UsuarioAdministrador[]
  onAsignar: (repartidorId: number) => Promise<void>
  cargando: boolean
}

function AsignacionRepartidor({ pedido, repartidores, onAsignar, cargando }: AsignacionRepartidorProps) {
  const puedeAsignar = pedido.estado === "EN_PREPARACION" || pedido.estado === "ENVIADO"

  if (!puedeAsignar) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">Asignar repartidor</Label>
        <Alert variant="destructive">
          <AlertDescription>
            Solo se puede asignar un repartidor cuando el pedido está en preparación o enviado.
            Cambia primero el estado del pedido.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Asignar repartidor</Label>
      <Select
        value={pedido.repartidor?.id?.toString() ?? ""}
        onValueChange={(valor) => {
          if (!valor) return
          void onAsignar(Number.parseInt(valor, 10))
        }}
        disabled={cargando || repartidores.length === 0}
      >
        <SelectTrigger>
          <SelectValue placeholder={repartidores.length === 0 ? "No hay repartidores disponibles" : "Selecciona un repartidor"} />
        </SelectTrigger>
        <SelectContent>
          {repartidores.map((usuario) => (
            <SelectItem key={usuario.id} value={usuario.id.toString()}>
              {usuario.nombre ?? ""} {usuario.apellido ?? ""} · {usuario.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
