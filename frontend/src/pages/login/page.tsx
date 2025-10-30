"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff, Truck, ShieldCheck, Clock } from "lucide-react"
import { useAuth } from "@/lib/auth"

const PRODUCT_IMAGE = "/images/Image-Login-Register.PNG"

// Gestiono el formulario de inicio de sesión, redirecciones por rol y feedback de error
export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [shouldRedirect, setShouldRedirect] = useState(false)

  const { iniciarSesion, estaAutenticado, usuario } = useAuth()
  const navegar = useNavigate()

  const destinoPorRol = (rol: string | undefined) => {
    switch (rol) {
      case "ADMINISTRADOR":
      case "EMPLEADO":
        return "/admin"
      case "REPARTIDOR":
        return "/repartidor"
      default:
        return "/cuenta"
    }
  }

  useEffect(() => {
    // Si ya está autenticado, preparo una redirección automática según su rol
    if (estaAutenticado) {
      setShouldRedirect(true)
    }
  }, [estaAutenticado])

  if (shouldRedirect) {
    return <Navigate to={destinoPorRol(usuario?.rol)} replace />
  }

  // Valido campos, ejecuto login y redirijo según rol
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setIsLoading(true)

    const email = formData.email.trim().toLowerCase()
    const password = formData.password.trim()

    if (!email || !password) {
      setError("Ingresa correo y contraseña.")
      setIsLoading(false)
      return
    }

    try {
      const result = await iniciarSesion(email, password)

      if (result.exito) {
        localStorage.setItem("sp_login_remember", rememberMe ? "1" : "0")
        const destino = destinoPorRol(result.usuario?.rol)
        navegar(destino, { replace: true })
      } else {
        setError(result.error || "Error al iniciar sesión")
      }
    } catch {
      setError("Error inesperado. Intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-white flex flex-col lg:flex-row">
      {/* Columna izquierda: formulario de inicio de sesión y feedback */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-12 lg:px-16">
        <div className="w-full max-w-md space-y-10">
          <Link to="/" className="inline-flex items-center gap-2 font-semibold text-slate-900">
            <span className="text-lg">MiOrdenRD</span>
          </Link>

          <section className="space-y-2">
            <h1 className="text-3xl font-semibold text-slate-900">Inicia sesión</h1>
            <p className="text-sm text-slate-500">
              Rastrea tus pedidos, aprovecha ofertas personalizadas y recibe entregas seguras a cualquier provincia.
            </p>
          </section>

          <div className="rounded-3xl bg-white p-8 shadow-[0_32px_80px_-48px_rgba(59,130,246,0.45)] space-y-6 border border-slate-100">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-600">
                  Correo electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="cliente@correo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-11 rounded-xl border-slate-200 focus-visible:ring-[#3b82f6]/60"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-600">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="h-11 rounded-xl border-slate-200 pr-12 focus-visible:ring-[#3b82f6]/60"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1.5 top-1.5 h-8 w-8 text-slate-500 hover:bg-transparent"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">Mostrar contraseña</span>
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
                <label className="inline-flex items-center gap-2">
                  <Checkbox checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked === true)} />
                  <span>Recordarme</span>
                </label>
                <span className="text-slate-400">¿Olvidaste tu contraseña?</span>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="h-11 w-full rounded-xl bg-[#3b82f6] font-medium text-white shadow-lg shadow-[#3b82f6]/25 transition hover:bg-[#2563eb]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  "Ingresar"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Columna derecha: imagen y beneficios destacados */}
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-white lg:flex">
        <div className="relative z-10 max-w-lg w-full space-y-4 p-10 text-slate-800">
          <img
            src={PRODUCT_IMAGE}
            alt="Catálogo de gadgets populares"
            className="w-full max-h-[420px] rounded-[28px] object-cover shadow-xl"
          />
          <div className="grid gap-3 rounded-2xl bg-[#3b82f6]/5 p-4 text-sm text-slate-600">
            <Highlight icon={<Truck className="h-5 w-5 text-[#3b82f6]" />}>Envíos a toda la República Dominicana</Highlight>
            <Highlight icon={<ShieldCheck className="h-5 w-5 text-[#3b82f6]" />}>Pagos protegidos y autenticación de dos factores</Highlight>
            <Highlight icon={<Clock className="h-5 w-5 text-[#3b82f6]" />}>Notificaciones por correo en cada movimiento de tu pedido</Highlight>
          </div>
        </div>
      </div>
    </div>
  )
}

const Highlight = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3">
    <span className="mt-0.5">{icon}</span>
    <span>{children}</span>
  </div>
)
