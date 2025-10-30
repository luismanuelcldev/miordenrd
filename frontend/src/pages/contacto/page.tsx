// Presento el formulario de contacto y envío el mensaje al backend mostrando toasts de éxito o error
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { enviarContacto } from "@/services/contactService"
import { useToast } from "@/components/ui/toastContext"
import { Loader2 } from "lucide-react"

export default function ContactoPage() {
  const [form, setForm] = useState({ nombre: "", email: "", asunto: "", mensaje: "" })
  const [enviando, setEnviando] = useState(false)
  const { showToast } = useToast()

  // Actualizo el estado del formulario campo por campo manteniendo el control del input
  const handleChange = (campo: string, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  // Valido datos mínimos y gestiono el envío asincrónico mostrando feedback y reseteando el formulario
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.nombre.trim() || !form.email.trim() || !form.mensaje.trim()) {
      showToast("Por favor completa los campos obligatorios", "error")
      return
    }

    setEnviando(true)
    try {
      await enviarContacto({
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        asunto: form.asunto.trim() || undefined,
        mensaje: form.mensaje.trim(),
      })
      showToast("¡Gracias! Hemos recibido tu mensaje.", "success")
      setForm({ nombre: "", email: "", asunto: "", mensaje: "" })
    } catch (error) {
      console.error(error)
      showToast("No pudimos enviar tu mensaje. Inténtalo nuevamente.", "error")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
      {/* Encabezado descriptivo del formulario de contacto */}
      <div className="text-center mb-10 space-y-3">
        <h1 className="font-display text-3xl lg:text-4xl font-bold">Contáctanos</h1>
        <p className="text-muted-foreground">
          ¿Tienes dudas, sugerencias o necesitas ayuda? Envíanos un mensaje y nuestro equipo te responderá a la
          brevedad.
        </p>
      </div>

      {/* Formulario controlado con validaciones mínimas y feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Formulario de contacto</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="nombre">
                  Nombre completo
                </label>
                <Input
                  id="nombre"
                  value={form.nombre}
                  onChange={(e) => handleChange("nombre", e.target.value)}
                  placeholder="Tu nombre"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="email">
                  Correo electrónico
                </label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="tu@correo.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="asunto">
                Asunto (opcional)
              </label>
              <Input
                id="asunto"
                value={form.asunto}
                onChange={(e) => handleChange("asunto", e.target.value)}
                placeholder="¿Sobre qué trata tu mensaje?"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="mensaje">
                Mensaje
              </label>
              <Textarea
                id="mensaje"
                rows={6}
                value={form.mensaje}
                onChange={(e) => handleChange("mensaje", e.target.value)}
                placeholder="Cuéntanos en qué podemos ayudarte"
                required
              />
            </div>

            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                También puedes escribirnos a <strong>contacto@miordenrd.com</strong>
              </p>
              <Button type="submit" disabled={enviando}>
                {enviando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                  </>
                ) : (
                  "Enviar mensaje"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

