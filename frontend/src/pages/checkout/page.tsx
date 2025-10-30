"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Loader2, MapPin, CreditCard, ShieldCheck, Truck } from "lucide-react"

import { useCart } from "@/lib/cart"
import { addressService, type DireccionEnvio } from "@/services/addressService"
import { useToast } from "@/components/ui/toastContext"
import { PayPalButton } from "@/components/ui/PayPalButton"
import type { MetodoPago } from "@/types/pedido"
import { useAuth } from "@/lib/auth"
import { zoneService } from "@/services/zoneService"
import { formatCurrency } from "@/utils/currency"

// Defino opciones de método de pago que presento como radios
const metodoPagoOpciones: Array<{ value: MetodoPago; titulo: string; descripcion: string; icono: ReactNode }> = [
  {
    value: "TARJETA",
    titulo: "Tarjeta de crédito o débito",
    descripcion: "Visa, MasterCard, American Express",
    icono: <CreditCard className="h-5 w-5" />,
  },
  {
    value: "TRANSFERENCIA",
    titulo: "Transferencia bancaria",
    descripcion: "Procesaremos tu pedido al recibir la confirmación",
    icono: <ShieldCheck className="h-5 w-5" />,
  },
  {
    value: "CONTRA_ENTREGA",
    titulo: "Pago contra entrega",
    descripcion: "Abona el pedido cuando lo recibas",
    icono: <Truck className="h-5 w-5" />,
  },
  {
    value: "PAYPAL",
    titulo: "PayPal",
    descripcion: "Paga de forma segura con tu cuenta PayPal",
    icono: <img src="https://www.paypalobjects.com/webstatic/icon/pp258.png" alt="PayPal" className="h-5" />,
  },
]

interface ErrorResponseData {
  message?: unknown
}

interface AxiosLikeError {
  response?: {
    data?: ErrorResponseData
    status?: number
  }
}

// Normalizo los mensajes de error de respuestas HTTP para el usuario
const obtenerMensajeError = (error: unknown) => {
  if (!error || typeof error !== "object") return "Ocurrió un error inesperado"
  const axiosError = error as AxiosLikeError
  const mensaje = axiosError.response?.data?.message
  if (Array.isArray(mensaje)) return mensaje.join(". ")
  if (typeof mensaje === "string") return mensaje
  return "Ocurrió un error inesperado"
}

// Orquesto el flujo de confirmación de pedido: dirección → método → pago
export default function CheckoutPage() {
  const { carrito, crearPedido } = useCart()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const { usuario } = useAuth()

  const [direcciones, setDirecciones] = useState<DireccionEnvio[]>([])
  const [cargandoDirecciones, setCargandoDirecciones] = useState(true)
  const [direccionId, setDireccionId] = useState<number | null>(null)
  const [metodoPago, setMetodoPago] = useState<MetodoPago | null>(null)
  const [observaciones, setObservaciones] = useState("")
  const [procesando, setProcesando] = useState(false)
  const [mostrarPayPal, setMostrarPayPal] = useState(false)
  const [costoEnvio, setCostoEnvio] = useState(0)
  const [calculandoEnvio, setCalculandoEnvio] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)

  const direccionSeleccionada = useMemo(
    () => direcciones.find((dir) => dir.id === direccionId) ?? null,
    [direcciones, direccionId],
  )

  // Cargo direcciones y restauro selección desde localStorage por usuario
  useEffect(() => {
    const cargarDirecciones = async () => {
      try {
        setCargandoDirecciones(true)
        const lista = await addressService.listarDirecciones()
        setDirecciones(lista)
        const storageKey = `sp_principal_dir_${usuario?.id ?? "anon"}`
        const guardado = localStorage.getItem(storageKey)
        let principal = lista[0]
        if (guardado) {
          const guardadoNum = Number.parseInt(guardado, 10)
          const encontrada = lista.find((direccion) => direccion.id === guardadoNum)
          if (encontrada) principal = encontrada
        }
        if (principal) {
          setDireccionId(principal.id)
        }
      } catch (error) {
        console.error(error)
        showToast("No fue posible cargar tus direcciones", "error")
      } finally {
        setCargandoDirecciones(false)
      }
    }

    void cargarDirecciones()
  }, [showToast, usuario?.id])

  // Calculo el costo de envío basado en coordenadas o muestro error si faltan
  useEffect(() => {
    if (!direccionSeleccionada) {
      setCostoEnvio(0)
      setErrorEnvio(null)
      return
    }

    if (
      typeof direccionSeleccionada.latitud !== "number" ||
      typeof direccionSeleccionada.longitud !== "number"
    ) {
      setCostoEnvio(0)
      setErrorEnvio("La dirección seleccionada no tiene coordenadas para calcular el envío.")
      return
    }

    setCalculandoEnvio(true)
    void zoneService
      .calcularTarifa({
        latitud: direccionSeleccionada.latitud,
        longitud: direccionSeleccionada.longitud,
        zonaId: direccionSeleccionada.zonaId ?? undefined,
      })
      .then((respuesta) => {
        const costo = respuesta.tarifaAplicada?.costoTotal ?? 0
        setCostoEnvio(Math.round(costo * 100) / 100)
        setErrorEnvio(null)
      })
      .catch((error) => {
        console.error(error)
        setCostoEnvio(0)
        setErrorEnvio(obtenerMensajeError(error))
      })
      .finally(() => {
        setCalculandoEnvio(false)
      })
  }, [direccionSeleccionada])

  const continuarDisponible = Boolean(direccionId && metodoPago)
  const requierePayPal = metodoPago === "PAYPAL"
  const totalPago = useMemo(
    () => Math.max(carrito.subtotal + carrito.impuestos - carrito.descuento + costoEnvio, 0),
    [carrito.descuento, carrito.impuestos, carrito.subtotal, costoEnvio],
  )

  // Creo el pedido en backend y navego a confirmación (o feedback de error)
  const procesarCheckout = async (metodo: MetodoPago) => {
    if (!direccionId) {
      showToast("Selecciona una dirección de envío", "error")
      return
    }

    try {
      setProcesando(true)
      const pedido = await crearPedido({
        direccionId,
        metodoPago: metodo,
        observaciones: observaciones.trim() || undefined,
      })
      showToast("Pedido creado correctamente", "success")
      navigate(`/pedido-confirmado/${pedido.id}`)
    } catch (error) {
      console.error(error)
      showToast(obtenerMensajeError(error), "error")
    } finally {
      setProcesando(false)
      setMostrarPayPal(false)
    }
  }

  // Valido selección y abro PayPal si aplica; de lo contrario proceso de inmediato
  const manejarConfirmacion = () => {
    if (!direccionId) {
      showToast("Selecciona una dirección para continuar", "error")
      return
    }
    if (!metodoPago) {
      showToast("Selecciona un método de pago", "error")
      return
    }

    if (metodoPago === "PAYPAL") {
      if (totalPago <= 0) {
        void procesarCheckout("PAYPAL")
      } else {
        setMostrarPayPal(true)
        showToast("Completa el pago con PayPal para finalizar", "info")
      }
      return
    }

    void procesarCheckout(metodoPago)
  }

  // Si no hay items en el carrito, redirijo de vuelta al carrito
  if (carrito.items.length === 0) {
    return <Navigate to="/carrito" replace />
  }

  // Muestro estado de carga mientras traigo direcciones del usuario
  if (cargandoDirecciones) {
    return (
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Cargando información para el checkout...</span>
        </div>
      </main>
    )
  }

  // Si no hay direcciones, sugiero gestionarlas antes de continuar
  if (direcciones.length === 0) {
    return (
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle>Agrega una dirección de envío</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Necesitamos una dirección para poder realizar el envío de tu pedido.</p>
            <Button asChild>
              <Link to="/cuenta/direcciones">Gestionar direcciones</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/carrito">Volver al carrito</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">Confirmar pedido</h1>
        <p className="text-muted-foreground">
          Revisa tus datos, selecciona cómo deseas pagar y finaliza la compra en solo un paso.
        </p>
      </div>

      {/* Flujo principal: izquierda (dirección y pago) · derecha (resumen) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Selección de dirección de envío */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" /> Dirección de envío
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={direccionId?.toString() ?? ""}
                onValueChange={(valor) => setDireccionId(Number(valor))}
                className="space-y-3"
              >
                {direcciones.map((direccion) => (
                  <label
                    key={direccion.id}
                    htmlFor={`direccion-${direccion.id}`}
                    className="flex w-full cursor-pointer items-start gap-4 rounded-lg border p-4 hover:border-primary"
                  >
                    <RadioGroupItem id={`direccion-${direccion.id}`} value={direccion.id.toString()} className="mt-1" />
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{direccion.calle}</p>
                        {direccionId === direccion.id && <Badge>Seleccionada</Badge>}
                      </div>
                      <p className="text-muted-foreground">
                        {direccion.ciudad}
                        {direccion.codigoPostal ? `, ${direccion.codigoPostal}` : ""}
                      </p>
                      <p className="text-muted-foreground">{direccion.pais}</p>
                      {direccion.referencias && (
                        <p className="text-xs text-muted-foreground">{direccion.referencias}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
                        {direccion.zona ? (
                          <Badge
                            variant="outline"
                            style={{
                              backgroundColor: `${direccion.zona.color ?? "#2563eb"}22`,
                              borderColor: direccion.zona.color ?? undefined,
                              color: direccion.zona.color ?? undefined,
                            }}
                          >
                            Zona {direccion.zona.nombre}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Fuera de cobertura</Badge>
                        )}
                        <Badge variant={direccion.validada ? "default" : "destructive"}>
                          {direccion.validada ? "Validada" : "Pendiente"}
                        </Badge>
                        {direccion.latitud && direccion.longitud && (
                          <span>
                            {direccion.latitud.toFixed(3)}, {direccion.longitud.toFixed(3)}
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </RadioGroup>
              {direccionSeleccionada && !direccionSeleccionada.validada && (
                <Alert className="border-amber-500 bg-amber-50 text-amber-900">
                  <AlertDescription>
                    Esta dirección aún no está validada dentro de una zona de entrega. Nuestro equipo confirmará la cobertura
                    antes de procesar el envío.
                  </AlertDescription>
                </Alert>
              )}
              <Button variant="ghost" asChild className="text-primary">
                <Link to="/cuenta/direcciones">Gestionar direcciones</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Selección de método de pago y notas */}
          <Card>
            <CardHeader>
              <CardTitle>Método de pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={metodoPago ?? ""}
                onValueChange={(valor) => {
                  setMetodoPago(valor as MetodoPago)
                  setMostrarPayPal(false)
                }}
                className="space-y-3"
              >
                {metodoPagoOpciones.map((metodo) => (
                  <label
                    key={metodo.value}
                    htmlFor={`metodo-${metodo.value}`}
                    className="flex w-full cursor-pointer items-start gap-4 rounded-lg border p-4 hover:border-primary"
                  >
                    <RadioGroupItem id={`metodo-${metodo.value}`} value={metodo.value} className="mt-1" />
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="text-primary flex items-center justify-center">{metodo.icono}</div>
                        <p className="font-semibold">{metodo.titulo}</p>
                      </div>
                      <p className="text-muted-foreground">{metodo.descripcion}</p>
                    </div>
                  </label>
                ))}
              </RadioGroup>

              <div>
                <Label htmlFor="observaciones">Notas para el pedido</Label>
                <Textarea
                  id="observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="¿Alguna indicación especial para la entrega?"
                  className="mt-2"
                  rows={3}
                />
              </div>

              {requierePayPal && mostrarPayPal && totalPago > 0 && (
                <div className="border rounded-lg p-4 bg-muted/40">
                  <p className="mb-2 text-sm text-muted-foreground">
                    Completa el pago y confirmaremos automáticamente tu pedido.
                  </p>
                  <PayPalButton amount={totalPago} onSuccess={() => void procesarCheckout("PAYPAL")} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna de resumen y totales */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen del pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {carrito.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div className="flex flex-col">
                      <span className="font-semibold">{item.producto.nombre}</span>
                      <span className="text-muted-foreground">Cantidad: {item.cantidad}</span>
                    </div>
                    <div className="text-right">
                      <span>{formatCurrency(item.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
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
                    {calculandoEnvio ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : costoEnvio === 0 ? (
                      <Badge variant="secondary">Gratis</Badge>
                    ) : (
                      formatCurrency(costoEnvio)
                    )}
                  </span>
                </div>
                {carrito.descuento > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento</span>
                    <span>-{formatCurrency(carrito.descuento)}</span>
                  </div>
                )}
                {errorEnvio && (
                  <p className="text-xs text-destructive">
                    {errorEnvio}
                  </p>
                )}
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-semibold">
                <span>Total a pagar</span>
                <span>{formatCurrency(totalPago)}</span>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={manejarConfirmacion}
                disabled={!continuarDisponible || procesando || calculandoEnvio || (requierePayPal && totalPago > 0 && mostrarPayPal)}
              >
                {procesando ? <Loader2 className="h-4 w-4 animate-spin" /> : requierePayPal ? "Pagar con PayPal" : "Confirmar pedido"}
              </Button>

              {requierePayPal && totalPago === 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Total a pagar 0 USD. Confirmaremos tu pedido sin pasar por PayPal.
                </p>
              )}

              <Button variant="ghost" size="lg" className="w-full" asChild>
                <Link to="/carrito">Regresar al carrito</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-muted/40">
            <CardHeader>
              <CardTitle className="text-base">¿Por qué comprar con nosotros?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>✔ Pagos seguros con tarjetas, transferencias o PayPal.</p>
              <p>✔ Envíos rápidos y seguimiento en todo momento.</p>
              <p>✔ Atención personalizada para cualquier consulta.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
