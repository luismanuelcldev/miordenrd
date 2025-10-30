"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Save, Shield, Bell, Trash2, AlertTriangle } from "lucide-react"

export default function ConfiguracionCuenta() {
  const [configuracion, setConfiguracion] = useState({
    // Notificaciones
    emailPedidos: true,
    emailPromociones: false,
    emailNoticias: true,
    pushNotificaciones: true,

    // Privacidad
    perfilPublico: false,
    compartirDatos: false,

    // Seguridad
    autenticacionDosFactor: false,
  })

  const [cambioPassword, setCambioPassword] = useState({
    passwordActual: "",
    passwordNuevo: "",
    confirmarPassword: "",
  })

  // Valido y simulo el cambio de contraseña con feedback al usuario
  const handlePasswordChange = () => {
    if (cambioPassword.passwordNuevo !== cambioPassword.confirmarPassword) {
      alert("Las contraseñas no coinciden")
      return
    }
    console.log("Cambio de contraseña solicitado")
    alert("Contraseña actualizada exitosamente")
    setCambioPassword({
      passwordActual: "",
      passwordNuevo: "",
      confirmarPassword: "",
    })
  }

  // Confirmo y simulo la solicitud de eliminación de cuenta advirtiendo su irreversibilidad
  const handleDeleteAccount = () => {
    if (confirm("¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.")) {
      console.log("Eliminación de cuenta solicitada")
      alert("Solicitud de eliminación de cuenta enviada")
    }
  }

  // Actualizo el estado de configuración para cada toggle conservando el resto de opciones
  const updateConfig = (key: string, value: boolean) => {
    setConfiguracion((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración de Cuenta</h1>
        <p className="text-muted-foreground">Personaliza tu experiencia y gestiona tu privacidad</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notificaciones */}
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
                <Label>Emails de Pedidos</Label>
                <p className="text-sm text-muted-foreground">Recibir confirmaciones y actualizaciones de pedidos</p>
              </div>
              <Switch
                checked={configuracion.emailPedidos}
                onCheckedChange={(checked) => updateConfig("emailPedidos", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Emails Promocionales</Label>
                <p className="text-sm text-muted-foreground">Ofertas especiales y descuentos</p>
              </div>
              <Switch
                checked={configuracion.emailPromociones}
                onCheckedChange={(checked) => updateConfig("emailPromociones", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Newsletter</Label>
                <p className="text-sm text-muted-foreground">Noticias y novedades de productos</p>
              </div>
              <Switch
                checked={configuracion.emailNoticias}
                onCheckedChange={(checked) => updateConfig("emailNoticias", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Notificaciones Push</Label>
                <p className="text-sm text-muted-foreground">Alertas en tiempo real en tu dispositivo</p>
              </div>
              <Switch
                checked={configuracion.pushNotificaciones}
                onCheckedChange={(checked) => updateConfig("pushNotificaciones", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacidad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacidad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Perfil Público</Label>
                <p className="text-sm text-muted-foreground">Permitir que otros usuarios vean tu perfil</p>
              </div>
              <Switch
                checked={configuracion.perfilPublico}
                onCheckedChange={(checked) => updateConfig("perfilPublico", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Compartir Datos Analíticos</Label>
                <p className="text-sm text-muted-foreground">Ayudar a mejorar nuestros servicios</p>
              </div>
              <Switch
                checked={configuracion.compartirDatos}
                onCheckedChange={(checked) => updateConfig("compartirDatos", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Autenticación de Dos Factores</Label>
                <p className="text-sm text-muted-foreground">Seguridad adicional para tu cuenta</p>
              </div>
              <Switch
                checked={configuracion.autenticacionDosFactor}
                onCheckedChange={(checked) => updateConfig("autenticacionDosFactor", checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cambio de contraseña */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Cambiar Contraseña
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="passwordActual">Contraseña Actual</Label>
              <Input
                id="passwordActual"
                type="password"
                value={cambioPassword.passwordActual}
                onChange={(e) =>
                  setCambioPassword((prev) => ({
                    ...prev,
                    passwordActual: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="passwordNuevo">Nueva Contraseña</Label>
              <Input
                id="passwordNuevo"
                type="password"
                value={cambioPassword.passwordNuevo}
                onChange={(e) =>
                  setCambioPassword((prev) => ({
                    ...prev,
                    passwordNuevo: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="confirmarPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmarPassword"
                type="password"
                value={cambioPassword.confirmarPassword}
                onChange={(e) =>
                  setCambioPassword((prev) => ({
                    ...prev,
                    confirmarPassword: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <Button onClick={handlePasswordChange} className="h-11 w-full rounded-xl bg-[#3b82f6] font-medium text-white shadow-lg shadow-[#3b82f6]/25 transition hover:bg-[#2563eb]">
            <Save className="mr-2 h-4 w-4" /> Guardar cambios
          </Button>
        </CardContent>
      </Card>

      {/* Eliminar cuenta */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Eliminar cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Esta acción es irreversible. Se eliminarán tus datos personales, direcciones y pedidos asociados.
            </AlertDescription>
          </Alert>
          <Button variant="destructive" onClick={handleDeleteAccount} className="w-full">
            Eliminar permanentemente
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
