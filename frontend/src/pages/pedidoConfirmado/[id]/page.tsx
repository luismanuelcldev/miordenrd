// Muestro la confirmación del pedido y cargo el detalle por id para ofrecer acciones posteriores
"use client"

import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { orderService } from "@/services/orderService"
import type { PedidoDetalle } from "@/types/pedido"
import { CheckCircle, Package, Truck, Download, Loader2 } from "lucide-react"
import { formatCurrency } from "@/utils/currency"

export default function PedidoConfirmadoPage() {
  const { id } = useParams<{ id: string }>()
  const [pedido, setPedido] = useState<PedidoDetalle | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Obtengo el pedido desde la API usando el parámetro de ruta y gestiono estados de carga y error
  useEffect(() => {
    if (!id) return
    const cargar = async () => {
      setCargando(true)
      setError(null)
      try {
        const detalle = await orderService.obtenerPedido(Number(id))
        setPedido(detalle)
      } catch (err) {
        console.error(err)
        setError("No fue posible obtener la información del pedido")
      } finally {
        setCargando(false)
      }
    }
    void cargar()
  }, [id])

  if (!id) {
    return <AlertaPedidoNoEncontrado />
  }

  if (cargando) {
    return (
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center gap-4 py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando información del pedido...</p>
        </div>
      </main>
    )
  }

  if (error || !pedido) {
    return <AlertaPedidoNoEncontrado mensaje={error ?? "Pedido no encontrado"} />
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Cabecera de confirmación y acciones rápidas */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold">¡Gracias por tu compra!</h1>
          <p className="text-muted-foreground">El pedido #{pedido.id} se registró correctamente.</p>
        </div>
        <div className="flex justify-center gap-3">
          <Button asChild>
            <Link to="/pedidos">Ver mis pedidos</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/productos">Seguir comprando</Link>
          </Button>
        </div>
      </div>

      {/* Detalles del pedido, envío y productos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="h-5 w-5" /> Detalles del pedido
                </span>
                <Badge variant="secondary">#{pedido.id}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-muted-foreground">Fecha</p>
                  <p>{new Date(pedido.creadoEn).toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Estado</p>
                  <Badge className="mt-1">{pedido.estado.replace("_", " ")}</Badge>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Cliente</p>
                  <p>
                    {pedido.usuario?.nombre ?? ""} {pedido.usuario?.apellido ?? ""}
                  </p>
                  <p className="text-muted-foreground">{pedido.usuario?.email}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Total</p>
                  <p className="text-lg font-semibold">{formatCurrency(pedido.total)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" /> Dirección de envío
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>{pedido.direccion.calle}</p>
              <p>
                {pedido.direccion.ciudad}, {pedido.direccion.codigoPostal ?? ""}
              </p>
              <p>{pedido.direccion.pais}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Productos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pedido.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.producto.imagenUrl ?? "/producto-placeholder.svg"}
                      alt={item.producto.nombre}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.producto.nombre}</h3>
                    <p className="text-sm text-muted-foreground">
                      Cantidad: {item.cantidad} × {formatCurrency(item.precio)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(item.precio * item.cantidad)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Resumen y notificaciones del pedido */}
        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Total</span>
                <span className="text-lg font-semibold">{formatCurrency(pedido.total)}</span>
              </div>
              <Separator />
              <Button className="w-full" variant="outline">
                <Download className="h-4 w-4 mr-2" /> Descargar comprobante
              </Button>
            </CardContent>
          </Card>

          {pedido.notificaciones && pedido.notificaciones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Notificaciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {pedido.notificaciones.map((notificacion) => (
                  <div key={notificacion.id} className="border rounded-md p-3">
                    <p className="font-medium">{notificacion.mensaje}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notificacion.enviadoEn).toLocaleString()} ({notificacion.estado})
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </main>
  )
}

// Muestro una alerta de pedido inexistente y opciones de navegación para continuar
function AlertaPedidoNoEncontrado({ mensaje = "Pedido no encontrado" }: { mensaje?: string }) {
  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Alert variant="destructive" className="max-w-xl mx-auto">
        <AlertDescription>{mensaje}</AlertDescription>
      </Alert>
      <div className="mt-6 flex justify-center gap-3">
        <Button asChild>
          <Link to="/productos">Explorar productos</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/pedidos">Ver mis pedidos</Link>
        </Button>
      </div>
    </main>
  )
}
