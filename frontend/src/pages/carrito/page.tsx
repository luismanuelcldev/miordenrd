"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/lib/cart"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/components/ui/toastContext"
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Tag } from "lucide-react"
import { formatCurrency } from "@/utils/currency"

// Renderizo el carrito con edición de cantidades, cupones y resumen de compra
export default function CarritoPage() {
  const { carrito, actualizarCantidad, eliminarItem, aplicarDescuento } = useCart()
  const [codigoDescuento, setCodigoDescuento] = useState("")
  const [aplicandoDescuento, setAplicandoDescuento] = useState(false)
  const [mensajeDescuento, setMensajeDescuento] = useState("")
  const navegar = useNavigate()
  const { estaAutenticado } = useAuth()
  const { showToast } = useToast()

  // Aplico un código de descuento simulando una latencia de API
  const handleAplicarDescuento = async () => {
    if (!codigoDescuento.trim()) return

    setAplicandoDescuento(true)
    setMensajeDescuento("")

    // Simular delay de API
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const resultado = aplicarDescuento(codigoDescuento)

    if (resultado) {
      setMensajeDescuento("¡Descuento aplicado correctamente!")
      setCodigoDescuento("")
    } else {
      setMensajeDescuento("Código de descuento inválido")
    }

    setAplicandoDescuento(false)
  }

  // Muestro estado vacío con CTA para seguir comprando
  if (carrito.items.length === 0) {
    return (
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-4">Tu carrito está vacío</h1>
          <p className="text-muted-foreground mb-8">Agrega algunos productos para comenzar tu compra</p>
          <Button size="lg" asChild>
            <Link to="/productos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continuar Comprando
            </Link>
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-4">Carrito de Compras</h1>
          <p className="text-muted-foreground">
            {carrito.cantidadItems} artículo{carrito.cantidadItems !== 1 ? "s" : ""} en tu carrito
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items del carrito */}
          <div className="lg:col-span-2 space-y-4">
            {carrito.items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Imagen del producto */}
                    <div className="w-full sm:w-32 h-32 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.producto.imagenUrl ?? "/producto-placeholder.svg"}
                        alt={item.producto.nombre}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Información del producto */}
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{item.producto.nombre}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{item.producto.descripcion}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => eliminarItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        {/* Controles de cantidad */}
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">Cantidad:</span>
                          <div className="flex items-center border rounded-md">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                              disabled={item.cantidad <= 1}
                              className="h-8 w-8"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="px-3 py-1 min-w-[2rem] text-center text-sm">{item.cantidad}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                              disabled={item.cantidad >= item.producto.stock}
                              className="h-8 w-8"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="text-xs text-muted-foreground">{item.producto.stock} disponibles</span>
                        </div>

                        {/* Precios */}
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(item.subtotal)}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(item.producto.precio)} c/u
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Resumen del pedido */}
          <div className="space-y-6">
            {/* Código de descuento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Tag className="mr-2 h-5 w-5" />
                  Código de Descuento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Ingresa tu código"
                    value={codigoDescuento}
                    onChange={(e) => setCodigoDescuento(e.target.value)}
                    disabled={aplicandoDescuento}
                  />
                  <Button onClick={handleAplicarDescuento} disabled={aplicandoDescuento || !codigoDescuento.trim()}>
                    {aplicandoDescuento ? "Aplicando..." : "Aplicar"}
                  </Button>
                </div>
                {mensajeDescuento && (
                  <p
                    className={`text-sm ${
                      mensajeDescuento.includes("correctamente") ? "text-green-600" : "text-destructive"
                    }`}
                  >
                    {mensajeDescuento}
                  </p>
                )}
                <div className="text-xs text-muted-foreground">
                  <p>Códigos disponibles para prueba:</p>
                  <p>• DESCUENTO10 (10% off)</p>
                  <p>• BIENVENIDO (15% off)</p>
                  <p>• VERANO2024 (20% off)</p>
                </div>
              </CardContent>
            </Card>

            {/* Resumen de precios */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(carrito.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Impuestos (16%)</span>
                    <span>{formatCurrency(carrito.impuestos)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Envío</span>
                    <span>
                      {carrito.envio === 0 ? <Badge variant="secondary">Gratis</Badge> : formatCurrency(carrito.envio)}
                    </span>
                  </div>
                  {carrito.descuento > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento</span>
                      <span>-{formatCurrency(carrito.descuento)}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(carrito.total)}</span>
                </div>

                {carrito.subtotal < 50 && (
                  <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                    Agrega {formatCurrency(50 - carrito.subtotal)} más para obtener envío gratuito
                  </div>
                )}

                <div className="space-y-2">
                  <Button
                    size="lg"
                    className="w-full"
                    type="button"
                    onClick={() => {
                      if (!estaAutenticado) {
                        showToast("Inicia sesión para finalizar tu compra", "info")
                        navegar("/login", { state: { from: "/checkout" } })
                        return
                      }
                      navegar("/checkout")
                    }}
                  >
                    Proceder al Checkout
                  </Button>
                  <Button variant="outline" size="lg" className="w-full bg-transparent" asChild>
                    <Link to="/productos">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Continuar Comprando
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
    </main>
  )
}
