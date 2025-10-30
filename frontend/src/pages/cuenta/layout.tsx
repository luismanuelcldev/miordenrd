// Protejo el área de cuenta del cliente, pinto el menú lateral y gestiono el cierre de sesión
"use client"

import { useState } from "react"
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import { User, MapPin, ShoppingBag, Heart, Settings, LogOut, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"

const elementosMenu = [
  { ruta: "/cuenta", icono: User, etiqueta: "Mi Perfil" },
  { ruta: "/cuenta/direcciones", icono: MapPin, etiqueta: "Direcciones" },
  { ruta: "/cuenta/pedidos", icono: ShoppingBag, etiqueta: "Mis Pedidos" },
  { ruta: "/cuenta/favoritos", icono: Heart, etiqueta: "Favoritos" },
  { ruta: "/cuenta/configuracion", icono: Settings, etiqueta: "Configuración" },
]

export default function CuentaLayout() {
  const { usuario, cerrarSesion } = useAuth()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const [barraLateralAbierta, establecerBarraLateralAbierta] = useState(false)

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  if (usuario.rol === "ADMINISTRADOR" || usuario.rol === "EMPLEADO") {
    return <Navigate to="/admin" replace />
  }

  // Cierro la sesión y redirijo al inicio para salir del área de cuenta
  const cerrarSesionYVolverAlInicio = () => {
    cerrarSesion()
    navegar("/")
  }

  // Renderizo cada entrada del menú aplicando estilos según la ruta activa
  const pintarElementoMenu = (ruta: string, etiqueta: string, Icono: typeof User, cerrarDespues = false) => (
    <NavLink
      key={ruta}
      to={ruta}
      end={ruta === "/cuenta"}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
          isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent",
        ].join(" ")
      }
      onClick={() => {
        if (cerrarDespues) {
          establecerBarraLateralAbierta(false)
        }
      }}
    >
      <Icono className="h-4 w-4" />
      {etiqueta}
    </NavLink>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar móvil con overlay y listado de secciones */}
      <div className={`fixed inset-0 z-50 lg:hidden ${barraLateralAbierta ? "block" : "hidden"}`}>
        <div className="fixed inset-0 bg-black/50" onClick={() => establecerBarraLateralAbierta(false)} />
        <div className="fixed left-0 top-0 h-full w-64 bg-card border-r">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Mi Cuenta</h2>
            <Button variant="ghost" size="sm" onClick={() => establecerBarraLateralAbierta(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <nav className="p-4 space-y-2">
            {elementosMenu.map((item) => pintarElementoMenu(item.ruta, item.etiqueta, item.icono, true))}
          </nav>
        </div>
      </div>

      {/* Sidebar de escritorio fija con menú y botón de cierre de sesión */}
      <div className="hidden lg:fixed lg:left-0 lg:top-0 lg:h-full lg:w-64 lg:bg-card lg:border-r lg:block">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Mi Cuenta</h2>
          <p className="text-sm text-muted-foreground">Hola, {usuario.nombre ?? usuario.email}</p>
        </div>
        <nav className="p-4 space-y-2">
          {elementosMenu.map((item) => pintarElementoMenu(item.ruta, item.etiqueta, item.icono))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <Button variant="outline" className="w-full bg-transparent" onClick={cerrarSesionYVolverAlInicio}>
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>

      <div className="lg:ml-64">
        {/* Cabecera en móvil con botón de menú y acción de cerrar sesión */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b bg-card">
          <Button variant="ghost" size="sm" onClick={() => establecerBarraLateralAbierta(true)}>
            <Menu className="h-4 w-4" />
          </Button>
          <h1 className="font-semibold capitalize">
            {elementosMenu.find((item) => item.ruta === ubicacion.pathname)?.etiqueta || "Mi Cuenta"}
          </h1>
          <Button variant="ghost" size="sm" onClick={cerrarSesionYVolverAlInicio}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Slot para las páginas anidadas del área de cuenta */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
