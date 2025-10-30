// Muestro el perfil del usuario, permito editar datos básicos y resumo su actividad reciente
"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { authService } from "@/services/authService"
import { orderService } from "@/services/orderService"
import type { PerfilUsuario } from "@/types/auth"
import type { PedidoListado } from "@/types/pedido"
import { useToast } from "@/components/ui/toastContext"
import { formatCurrency } from "@/utils/currency"

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

export default function MiPerfil() {
  const { showToast } = useToast()
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null)
  const [form, setForm] = useState({ nombre: "", apellido: "", telefono: "" })
  const [pedidos, setPedidos] = useState<PedidoListado[]>([])
  const [cargando, setCargando] = useState(true)
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    // Cargo perfil e historial reciente en paralelo y preparo el formulario editable
    const cargar = async () => {
      try {
        setCargando(true)
        const [infoPerfil, pedidosRespuesta] = await Promise.all([
          authService.getProfile(),
          orderService.listarMisPedidos({ limit: 5 }),
        ])
        setPerfil(infoPerfil)
        setForm({
          nombre: infoPerfil.nombre ?? "",
          apellido: infoPerfil.apellido ?? "",
          telefono: infoPerfil.telefono ?? "",
        })
        setPedidos(pedidosRespuesta.pedidos ?? [])
      } catch (error) {
        console.error(error)
        showToast("No fue posible cargar la información del perfil", "error")
      } finally {
        setCargando(false)
      }
    }

    void cargar()
  }, [showToast])

  const totalGastado = useMemo(
    // Calculo el total gastado sumando los importes de los pedidos listados
    () => pedidos.reduce((suma, pedido) => suma + pedido.total, 0),
    [pedidos],
  )

  // Actualizo el estado del formulario de edición campo por campo
  const manejarCambio = (campo: "nombre" | "apellido" | "telefono", valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  // Persiste los cambios del perfil y muestra feedback de éxito o error
  const guardarPerfil = async () => {
    try {
      setGuardando(true)
      const actualizado = await authService.updateProfile({
        nombre: form.nombre.trim() || undefined,
        apellido: form.apellido.trim() || undefined,
        telefono: form.telefono.trim() || undefined,
      })
      setPerfil(actualizado)
      setEditando(false)
      showToast("Perfil actualizado", "success")
    } catch (error) {
      console.error(error)
      showToast("No fue posible actualizar el perfil", "error")
    } finally {
      setGuardando(false)
    }
  }

  if (cargando || !perfil) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
        Cargando datos del perfil...
      </div>
    )
  }

  const iniciales = `${perfil.nombre?.charAt(0) ?? ""}${perfil.apellido?.charAt(0) ?? ""}` || perfil.email.charAt(0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground">Visualiza tu información personal y actividad reciente.</p>
      </div>

      {/* Datos personales con opción de edición en línea */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Datos Personales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-lg">{iniciales.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">
                  {perfil.nombre ?? "Usuario"} {perfil.apellido ?? ""}
                </h3>
                <p className="text-muted-foreground">{perfil.email}</p>
                <Badge variant="outline" className="mt-1">
                  {perfil.rol === "CLIENTE" ? "Cliente" : perfil.rol.toLowerCase()}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nombre</p>
                {editando ? (
                  <Input value={form.nombre} onChange={(e) => manejarCambio("nombre", e.target.value)} />
                ) : (
                  <p className="font-medium">{perfil.nombre ?? "-"}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Apellido</p>
                {editando ? (
                  <Input value={form.apellido} onChange={(e) => manejarCambio("apellido", e.target.value)} />
                ) : (
                  <p className="font-medium">{perfil.apellido ?? "-"}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Correo</p>
                <p className="font-medium">{perfil.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Teléfono</p>
                {editando ? (
                  <Input value={form.telefono} onChange={(e) => manejarCambio("telefono", e.target.value)} />
                ) : (
                  <p className="font-medium">{perfil.telefono ?? "No registrado"}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha de registro</p>
                <p className="font-medium">
                  {perfil.creadoEn ? new Date(perfil.creadoEn).toLocaleDateString("es-ES") : "-"}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {!editando ? (
                <Button variant="outline" className="mt-2 w-fit" onClick={() => setEditando(true)}>
                  Editar información
                </Button>
              ) : (
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" onClick={() => {
                    setEditando(false)
                    setForm({
                      nombre: perfil.nombre ?? "",
                      apellido: perfil.apellido ?? "",
                      telefono: perfil.telefono ?? "",
                    })
                  }} disabled={guardando}>
                    Cancelar
                  </Button>
                  <Button onClick={guardarPerfil} disabled={guardando}>
                    {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta de resumen con métricas del usuario */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Actividad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pedidos realizados</span>
                <span className="font-semibold">{pedidos.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total gastado</span>
                <span className="font-semibold">{formatCurrency(totalGastado)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Último pedido</span>
                <span className="font-semibold">
                  {pedidos[0] ? new Date(pedidos[0].creadoEn).toLocaleDateString("es-ES") : "Sin pedidos"}
                </span>
              </div>
              <Button asChild variant="outline" className="w-full">
                <a href="/cuenta/pedidos">Ver todos mis pedidos</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Historial de últimos pedidos con estado y total */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          {pedidos.length === 0 && <p className="text-sm text-muted-foreground">Aún no has realizado pedidos.</p>}
          <div className="space-y-4">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="flex items-center justify-between border rounded-lg p-4">
                <div>
                  <p className="font-medium">Pedido #{pedido.id}</p>
                  <p className="text-sm text-muted-foreground">
                    Realizado el {new Date(pedido.creadoEn).toLocaleDateString("es-ES")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(pedido.total)}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${estadoBadge(pedido.estado)}`}>
                    {estadoLegible(pedido.estado)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function estadoLegible(estado: PedidoListado["estado"]) {
  return estado.replace(/_/g, " ")
}
