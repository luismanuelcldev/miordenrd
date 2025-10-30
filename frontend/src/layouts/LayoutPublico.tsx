import { Navigate, Outlet, useLocation } from "react-router-dom"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { useAuth } from "@/lib/auth"

// Estructuro el layout público y redirijo al panel si el usuario es administrativo
export function LayoutPublico() {
  const { usuario } = useAuth()
  const location = useLocation()
  const esPersonalAdministrativo = usuario?.rol === "ADMINISTRADOR" || usuario?.rol === "EMPLEADO"

  if (esPersonalAdministrativo) {
    return <Navigate to="/admin" state={{ from: location }} replace />
  }

  // Oculto el footer en secciones de cuenta para dar más foco al contenido
  const ocultarFooter = location.pathname.startsWith("/cuenta")

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1">
        <Outlet />
      </div>
      {!ocultarFooter && <Footer />}
    </div>
  )
}
