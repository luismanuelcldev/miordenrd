"use client"

// Estructuro el área de repartidor: protejo por rol y renderizo menú + contenido de entregas

import { useState } from "react"
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import { LogOut, Menu, Package, Route, X } from "lucide-react"

const elementosMenuRepartidor = [
  { ruta: "/repartidor", etiqueta: "Resumen", icono: Route },
  { ruta: "/repartidor/pedidos", etiqueta: "Pedidos asignados", icono: Package },
]

export default function RepartidorLayout() {
  const { usuario, cerrarSesion } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)

  if (!usuario || usuario.rol !== "REPARTIDOR") {
    return <Navigate to="/login" replace />
  }

  // Cierro sesión desde el área de repartidor y redirijo a login
  const cerrarSesionYSalir = async () => {
    await cerrarSesion()
    navigate("/login", { replace: true })
  }

  // Pinto cada opción del menú y cierro el panel en móvil tras navegar
  const renderItemMenu = (
    ruta: string,
    etiqueta: string,
    Icono: typeof Route,
    cerrarLuego = false,
  ) => (
    <NavLink
      key={ruta}
      to={ruta}
      end={ruta === "/repartidor"}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-blue-50 hover:text-blue-600",
        ].join(" ")
      }
      onClick={() => cerrarLuego && setMenuAbierto(false)}
    >
      <Icono className="h-4 w-4" />
      {etiqueta}
    </NavLink>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar de escritorio con datos del repartidor y navegación */}
      <div className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 lg:border-r lg:bg-white">
        <div className="px-4 py-5 border-b">
          <p className="text-sm text-muted-foreground">Repartidor</p>
          <h2 className="text-lg font-semibold">{usuario.nombre ?? usuario.email}</h2>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {elementosMenuRepartidor.map((item) => renderItemMenu(item.ruta, item.etiqueta, item.icono))}
        </nav>
        <div className="px-4 pb-6">
          <Button variant="outline" className="w-full" onClick={cerrarSesionYSalir}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </div>

      <div className="lg:ml-64">
        {/* Topbar móvil con botón de menú, título contextual y cerrar sesión */}
        <header className="flex items-center justify-between border-b bg-white px-4 py-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMenuAbierto(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Centro de entregas</p>
            <p className="text-sm font-semibold">
              {
                elementosMenuRepartidor.find((item) =>
                  item.ruta === "/repartidor"
                    ? location.pathname === "/repartidor"
                    : location.pathname.startsWith(item.ruta),
                )?.etiqueta ?? "Repartidor"
              }
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={cerrarSesionYSalir}>
            <LogOut className="h-5 w-5" />
          </Button>
        </header>

        {/* Overlay de menú en móvil */}
        {menuAbierto && (
          <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={() => setMenuAbierto(false)}>
            <div
              className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div>
                  <p className="text-xs text-muted-foreground">Repartidor</p>
                  <p className="text-sm font-semibold">{usuario.nombre ?? usuario.email}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setMenuAbierto(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="p-4 space-y-2">
                {elementosMenuRepartidor.map((item) => renderItemMenu(item.ruta, item.etiqueta, item.icono, true))}
              </nav>
            </div>
          </div>
        )}

        {/* Contenido de páginas anidadas del repartidor */}
        <main className="px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
