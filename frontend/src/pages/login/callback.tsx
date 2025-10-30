// Completo el flujo de login: valido el código de retorno y redirijo o muestro errores
import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"

export default function LoginCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { iniciarSesionConCodigo } = useAuth()

  const [estado, setEstado] = useState<"procesando" | "error">("procesando")
  const [mensaje, setMensaje] = useState("Procesando autenticación segura...")

  // Extraigo parámetros de retorno de OAuth/OIDC desde la URL
  const parametros = useMemo(() => {
    const code = searchParams.get("code") ?? undefined
    const state = searchParams.get("state") ?? undefined
    const error = searchParams.get("error") ?? undefined
    const errorDescription = searchParams.get("error_description") ?? undefined
    return { code, state, error, errorDescription }
  }, [searchParams])

  // Valido la respuesta: si hay error muestro mensaje, si hay code intento iniciar sesión y redirijo
  useEffect(() => {
    if (parametros.error) {
      setEstado("error")
      setMensaje(
        decodeURIComponent(parametros.errorDescription ?? "La autenticación fue cancelada. Intenta nuevamente."),
      )
      return
    }

    if (!parametros.code) {
      setEstado("error")
      setMensaje("No se recibió el código de autorización. Vuelve a iniciar sesión.")
      return
    }

    iniciarSesionConCodigo(parametros.code, parametros.state)
      .then((resultado) => {
        if (resultado.exito) {
          navigate("/cuenta", { replace: true })
        } else {
          setEstado("error")
          setMensaje(resultado.error ?? "No fue posible completar el inicio de sesión.")
        }
      })
      .catch(() => {
        setEstado("error")
        setMensaje("Ocurrió un problema al validar tus credenciales. Intenta nuevamente.")
      })
  }, [iniciarSesionConCodigo, navigate, parametros])

  // Muestro una vista centrada con spinner durante el proceso o el detalle de error con acciones
  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center bg-gradient-to-br from-white via-slate-50 to-white px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 shadow-[0_32px_80px_-48px_rgba(59,130,246,0.45)] space-y-6 text-center">
        {estado === "procesando" ? (
          <>
            <div className="flex justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-[#3b82f6]" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900">Un momento...</h1>
            <p className="text-sm text-slate-500">{mensaje}</p>
          </>
        ) : (
          <>
            <div className="flex justify-center">
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900">No pudimos iniciar tu sesión</h1>
            <p className="text-sm text-slate-500">{mensaje}</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild variant="outline">
                <Link to="/login">Volver al inicio de sesión</Link>
              </Button>
              <Button asChild className="bg-[#3b82f6] hover:bg-[#2563eb]">
                <Link to="/ayuda">Ir al centro de ayuda</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
