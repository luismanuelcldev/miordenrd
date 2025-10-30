import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/lib/auth"
import { PageLoading } from "@/components/ui/loading-spinner"
import type { RolUsuario } from "@/types/auth"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: RolUsuario | RolUsuario[]
}

// Protejo rutas: verifico autenticación y roles antes de renderizar hijos
export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { usuario, estaAutenticado, cargando } = useAuth()
  const location = useLocation()

  if (cargando) {
    return <PageLoading text="Verificando autenticación..." />
  }

  if (!estaAutenticado) {
    // Guardo la ubicación actual para redirigir después del login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredRoles) {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
    if (!usuario || !roles.includes(usuario.rol)) {
      // Usuario autenticado pero sin el rol requerido
      return <Navigate to="/" replace />
    }
  }

  return <>{children}</>
}

interface RequireAuthProps {
  children: React.ReactNode
}

// Requiero autenticación sin restricción de rol
export function RequireAuth({ children }: RequireAuthProps) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}

interface RequireAdminProps {
  children: React.ReactNode
}

// Requiero que sea admin o empleado para acceder
export function RequireAdmin({ children }: RequireAdminProps) {
  return <ProtectedRoute requiredRoles={["ADMINISTRADOR", "EMPLEADO"]}>{children}</ProtectedRoute>
}

interface RequireStrictAdminProps {
  children: React.ReactNode
}

// Restringo exclusivamente a administradores
export function RequireStrictAdmin({ children }: RequireStrictAdminProps) {
  return <ProtectedRoute requiredRoles="ADMINISTRADOR">{children}</ProtectedRoute>
}

interface RequireClienteProps {
  children: React.ReactNode
}

// Restringo a clientes autenticados
export function RequireCliente({ children }: RequireClienteProps) {
  return <ProtectedRoute requiredRoles="CLIENTE">{children}</ProtectedRoute>
}

interface RequireRepartidorProps {
  children: React.ReactNode
}

// Restringo a repartidores autenticados
export function RequireRepartidor({ children }: RequireRepartidorProps) {
  return <ProtectedRoute requiredRoles="REPARTIDOR">{children}</ProtectedRoute>
}
