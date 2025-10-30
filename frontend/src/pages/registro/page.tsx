// Presento el formulario de registro con validaciones básicas y redirijo según el rol del nuevo usuario
"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff, ShoppingBag, Gift, Users } from "lucide-react"
import { useAuth } from "@/lib/auth"

const PRODUCT_IMAGE = "/images/Image-Login-Register.PNG"

export default function RegistroPage() {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [shouldRedirect, setShouldRedirect] = useState(false)

  const { registrarse, estaAutenticado } = useAuth()
  const navegar = useNavigate()

  useEffect(() => {
    // Redirijo si ya hay sesión activa para evitar mostrar el registro innecesariamente
    if (estaAutenticado) {
      setShouldRedirect(true)
    }
  }, [estaAutenticado])

  if (shouldRedirect) {
    return <Navigate to="/cuenta" replace />
  }

  // Sincronizo el estado del formulario en cada cambio de input controlado
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Valido campos mínimos, creo la cuenta y navego a destino apropiado mostrando errores si ocurren
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    if (!acceptTerms) {
      setError("Debes aceptar los términos y condiciones")
      return
    }

    setIsLoading(true)

    try {
      const result = await registrarse({
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        telefono: formData.telefono,
        contrasena: formData.password,
      })
      if (result.exito) {
        const destino = result.usuario?.rol === "ADMINISTRADOR" ? "/admin" : "/cuenta"
        navegar(destino, { replace: true })
      } else {
        setError(result.error || "Error al crear la cuenta")
      }
    } catch {
      setError("Error inesperado. Intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-white flex flex-col lg:flex-row">
      {/* Columna izquierda: formulario de registro con validaciones y feedback */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-12 lg:px-16">
        <div className="w-full max-w-xl space-y-10">
          <Link to="/" className="inline-flex items-center gap-2 font-semibold text-slate-900">
            <span className="text-lg">MiOrdenRD</span>
          </Link>

          <section className="space-y-2">
            <h1 className="text-3xl font-semibold text-slate-900">Regístrate gratis</h1>
            <p className="text-sm text-slate-500">
              Administra tu catálogo, configura alertas de stock y recibe correos automáticos cada vez que un pedido se
              procesa.
            </p>
          </section>

          {/* Tarjeta con formulario controlado */}
          <div className="rounded-3xl bg-white p-8 shadow-[0_32px_80px_-48px_rgba(59,130,246,0.45)] space-y-6 border border-slate-100">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Nombre"
                  name="nombre"
                  placeholder="Andrea"
                  value={formData.nombre}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <Field
                  label="Apellido"
                  name="apellido"
                  placeholder="Gómez"
                  value={formData.apellido}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              <Field
                label="Correo electrónico"
                name="email"
                type="email"
                placeholder="tienda@correo.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />

              <Field
                label="Teléfono (opcional)"
                name="telefono"
                type="tel"
                placeholder="+1 809 555 0000"
                value={formData.telefono}
                onChange={handleChange}
                disabled={isLoading}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <PasswordField
                  id="password"
                  name="password"
                  label="Contraseña"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  showValue={showPassword}
                  onToggle={() => setShowPassword((prev) => !prev)}
                  disabled={isLoading}
                />
                <PasswordField
                  id="confirmPassword"
                  name="confirmPassword"
                  label="Confirmar contraseña"
                  placeholder="Repite tu contraseña"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  showValue={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword((prev) => !prev)}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-start gap-3 text-sm text-slate-500">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                  disabled={isLoading}
                />
                <Label htmlFor="terms" className="leading-relaxed">
                  Acepto los {" "}
                  <Link to="/terminos" className="text-[#3b82f6] hover:text-[#2563eb]">
                    términos y condiciones
                  </Link>{" "}
                  y la {" "}
                  <Link to="/privacidad" className="text-[#3b82f6] hover:text-[#2563eb]">
                    política de privacidad
                  </Link>
                </Label>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="h-11 w-full rounded-xl bg-[#3b82f6] font-medium text-white shadow-lg shadow-[#3b82f6]/25 transition hover:bg-[#2563eb]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  "Crear cuenta"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Columna derecha: beneficios destacados visuales */}
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-white lg:flex">
        <div className="relative z-10 max-w-lg w-full space-y-4 p-10 text-slate-800">
          <img
            src={PRODUCT_IMAGE}
            alt="Colección de gadgets tecnológicos"
            className="w-full max-h-[420px] rounded-[28px] object-cover shadow-xl"
          />
          <div className="grid gap-3 rounded-2xl bg-[#3b82f6]/5 p-4 text-sm text-slate-600">
            <Highlight icon={<ShoppingBag className="h-5 w-5 text-[#3b82f6]" />}>Catálogo ilimitado y variaciones por producto</Highlight>
            <Highlight icon={<Gift className="h-5 w-5 text-[#3b82f6]" />}>Automatiza cupones y correos de fidelización</Highlight>
            <Highlight icon={<Users className="h-5 w-5 text-[#3b82f6]" />}>Activa autenticación de dos factores para tu equipo</Highlight>
          </div>
        </div>
      </div>
    </div>
  )
}

const Field = ({ label, name, placeholder, value, onChange, type = "text", disabled }: {
  label: string
  name: string
  placeholder: string
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  disabled?: boolean
}) => (
  <div className="space-y-2">
    <Label htmlFor={name} className="text-sm font-medium text-slate-600">
      {label}
    </Label>
    <Input
      id={name}
      name={name}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={name !== "telefono"}
      disabled={disabled}
      className="h-11 rounded-xl border-slate-200 focus-visible:ring-[#3b82f6]/60"
    />
  </div>
)

const PasswordField = ({
  id,
  name,
  label,
  placeholder,
  value,
  onChange,
  showValue,
  onToggle,
  disabled,
}: {
  id: string
  name: string
  label: string
  placeholder: string
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  showValue: boolean
  onToggle: () => void
  disabled?: boolean
}) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="text-sm font-medium text-slate-600">
      {label}
    </Label>
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={showValue ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        disabled={disabled}
        className="h-11 rounded-xl border-slate-200 pr-12 focus-visible:ring-[#3b82f6]/60"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-1.5 top-1.5 h-8 w-8 text-slate-500 hover:bg-transparent"
        onClick={onToggle}
        disabled={disabled}
      >
        {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        <span className="sr-only">Mostrar contraseña</span>
      </Button>
    </div>
  </div>
)

const Highlight = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3">
    <span className="mt-0.5">{icon}</span>
    <span>{children}</span>
  </div>
)
