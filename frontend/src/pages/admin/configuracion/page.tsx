"use client"

// Administro la configuración del sistema: tienda, notificaciones, seguridad, envíos/pagos y apariencia

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Save, Store, Mail, Bell, Shield, Palette, Loader2 } from "lucide-react"
import { configService, type ConfiguracionSistema } from "@/services/configService"
import { useToast } from "@/components/ui/toastContext"

export default function ConfiguracionAdmin() {
  const [configuracion, setConfiguracion] = useState<ConfiguracionSistema | null>(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const { showToast } = useToast()

  // Al montar, traigo la configuración actual del sistema y manejo estados
  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        setCargando(true)
        const data = await configService.obtenerConfiguracion()
        setConfiguracion(data)
      } catch (error) {
        console.error(error)
        showToast("No fue posible obtener la configuración del sistema", "error")
      } finally {
        setCargando(false)
      }
    }

    void cargarConfiguracion()
  }, [showToast])

  // Actualizo un campo de la configuración en memoria sin perder el resto
  const updateConfig = <K extends keyof ConfiguracionSistema>(key: K, value: ConfiguracionSistema[K]) => {
    setConfiguracion((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  // Persisto los cambios de configuración y reflejo el resultado en la UI
  const handleSave = async () => {
    if (!configuracion) return
    try {
      setGuardando(true)
      const data = await configService.actualizarConfiguracion(configuracion)
      setConfiguracion(data)
      showToast("Configuración guardada correctamente", "success")
    } catch (error) {
      console.error(error)
      showToast("No fue posible guardar la configuración", "error")
    } finally {
      setGuardando(false)
    }
  }

  if (cargando || !configuracion) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p>Cargando configuración del sistema...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Configuración del Sistema</h1>
          <p className="text-muted-foreground">Administra la configuración general de tu tienda</p>
        </div>
        <Button onClick={handleSave} disabled={guardando}>
          {guardando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {guardando ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información de la tienda */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Información de la Tienda
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nombreTienda">Nombre de la Tienda</Label>
              <Input
                id="nombreTienda"
                value={configuracion.nombreTienda}
                onChange={(e) => updateConfig("nombreTienda", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={configuracion.descripcion ?? ""}
                onChange={(e) => updateConfig("descripcion", e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="email">Email de Contacto</Label>
              <Input
                id="email"
                type="email"
                value={configuracion.email}
                onChange={(e) => updateConfig("email", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={configuracion.telefono ?? ""}
                onChange={(e) => updateConfig("telefono", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="direccion">Dirección</Label>
              <Textarea
                id="direccion"
                value={configuracion.direccion ?? ""}
                onChange={(e) => updateConfig("direccion", e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configuración de notificaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Notificaciones de Pedidos</Label>
                <p className="text-sm text-muted-foreground">Recibir alertas de nuevos pedidos</p>
              </div>
              <Switch
                checked={configuracion.notificacionesPedidos}
                onCheckedChange={(checked) => updateConfig("notificacionesPedidos", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Alertas de Stock Bajo</Label>
                <p className="text-sm text-muted-foreground">Notificar cuando el stock esté bajo</p>
              </div>
              <Switch
                checked={configuracion.notificacionesStock}
                onCheckedChange={(checked) => updateConfig("notificacionesStock", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Notificaciones de Clientes</Label>
                <p className="text-sm text-muted-foreground">Alertas de nuevos registros de clientes</p>
              </div>
              <Switch
                checked={configuracion.notificacionesClientes}
                onCheckedChange={(checked) => updateConfig("notificacionesClientes", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configuración de seguridad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Autenticación de Dos Factores</Label>
                <p className="text-sm text-muted-foreground">Habilitar 2FA para administradores</p>
              </div>
              <Switch
                checked={configuracion.autenticacionDosFactor}
                onCheckedChange={(checked) => updateConfig("autenticacionDosFactor", checked)}
              />
            </div>
            <Separator />
            <div>
              <Label htmlFor="sesionExpiracion">Expiración de Sesión (horas)</Label>
              <Input
                id="sesionExpiracion"
                type="number"
                value={configuracion.sesionExpiracion}
                onChange={(e) => {
                  const valor = Number.parseInt(e.target.value)
                  updateConfig("sesionExpiracion", Number.isNaN(valor) ? 0 : valor)
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configuración de envíos y pagos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Envíos y Pagos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="envioGratis">Envío Gratis a partir de (RD$)</Label>
              <Input
                id="envioGratis"
                type="number"
                step="0.01"
                value={configuracion.envioGratis}
                onChange={(e) => {
                  const valor = Number.parseFloat(e.target.value)
                  updateConfig("envioGratis", Number.isNaN(valor) ? 0 : valor)
                }}
              />
            </div>
            <div>
              <Label htmlFor="costoEnvio">Costo de Envío Estándar (RD$)</Label>
              <Input
                id="costoEnvio"
                type="number"
                step="0.01"
                value={configuracion.costoEnvio}
                onChange={(e) => {
                  const valor = Number.parseFloat(e.target.value)
                  updateConfig("costoEnvio", Number.isNaN(valor) ? 0 : valor)
                }}
              />
            </div>
            <div>
              <Label htmlFor="tiempoEntrega">Tiempo de Entrega</Label>
              <Input
                id="tiempoEntrega"
                value={configuracion.tiempoEntrega ?? ""}
                onChange={(e) => updateConfig("tiempoEntrega", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="iva">IVA (%)</Label>
              <Input
                id="iva"
                type="number"
                value={configuracion.iva}
                onChange={(e) => {
                  const valor = Number.parseInt(e.target.value)
                  updateConfig("iva", Number.isNaN(valor) ? 0 : valor)
                }}
              />
            </div>
            <div>
              <Label htmlFor="moneda">Moneda</Label>
              <Input
                id="moneda"
                value={configuracion.moneda}
                onChange={(e) => updateConfig("moneda", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuración de apariencia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Apariencia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="colorPrimario">Color Primario</Label>
              <div className="flex gap-2">
                <Input
                  id="colorPrimario"
                  type="color"
                  value={configuracion.colorPrimario}
                  onChange={(e) => updateConfig("colorPrimario", e.target.value)}
                  className="w-16 h-10"
                />
              <Input
                value={configuracion.colorPrimario}
                onChange={(e) => updateConfig("colorPrimario", e.target.value)}
                className="flex-1"
              />
              </div>
            </div>
            <div>
              <Label htmlFor="colorSecundario">Color Secundario</Label>
              <div className="flex gap-2">
                <Input
                  id="colorSecundario"
                  type="color"
                  value={configuracion.colorSecundario}
                  onChange={(e) => updateConfig("colorSecundario", e.target.value)}
                  className="w-16 h-10"
                />
              <Input
                value={configuracion.colorSecundario}
                onChange={(e) => updateConfig("colorSecundario", e.target.value)}
                className="flex-1"
              />
              </div>
            </div>
            <div>
              <Label htmlFor="logoUrl">URL del Logo</Label>
              <Input
                id="logoUrl"
                value={configuracion.logoUrl ?? ""}
                onChange={(e) => updateConfig("logoUrl", e.target.value)}
                placeholder="https://ejemplo.com/logo.png"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
