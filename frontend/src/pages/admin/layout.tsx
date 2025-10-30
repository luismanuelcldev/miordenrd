"use client"

import { useState } from "react"
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Layers,
  Boxes,
  Map,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"

// Estructuro el layout del panel admin con sidebar adaptable y control por rol
const elementosMenuAdmin = [
  { ruta: "/admin", icono: LayoutDashboard, etiqueta: "Dashboard" },
  { ruta: "/admin/usuarios", icono: Users, etiqueta: "Usuarios" },
  { ruta: "/admin/categorias", icono: Layers, etiqueta: "Categorías" },
  { ruta: "/admin/productos", icono: Package, etiqueta: "Productos" },
  { ruta: "/admin/inventario", icono: Boxes, etiqueta: "Inventario" },
  { ruta: "/admin/logistica/zonas", icono: Map, etiqueta: "Zonas de entrega" },
  { ruta: "/admin/pedidos", icono: ShoppingCart, etiqueta: "Pedidos" },
  { ruta: "/admin/auditoria", icono: Shield, etiqueta: "Auditoría" },
  { ruta: "/admin/reportes", icono: BarChart3, etiqueta: "Reportes" },
  { ruta: "/admin/configuracion", icono: Settings, etiqueta: "Configuración" },
]

const elementosMenuEmpleado = [
  { ruta: "/admin", icono: LayoutDashboard, etiqueta: "Dashboard" },
  { ruta: "/admin/pedidos", icono: ShoppingCart, etiqueta: "Pedidos" },
  { ruta: "/admin/productos", icono: Package, etiqueta: "Productos" },
  { ruta: "/admin/inventario", icono: Boxes, etiqueta: "Inventario" },
  { ruta: "/admin/logistica/zonas", icono: Map, etiqueta: "Zonas de entrega" },
  { ruta: "/admin/reportes", icono: BarChart3, etiqueta: "Reportes" },
]

// Protejo el acceso por rol y renderizo la navegación + contenido anidado
export default function AdminLayout() {
  const { usuario, cerrarSesion } = useAuth()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const [barraLateralAbierta, establecerBarraLateralAbierta] = useState(false)

  const rolNormalizado = usuario?.rol?.toString().toUpperCase()
  const tieneAcceso = Boolean(usuario && (rolNormalizado === "ADMINISTRADOR" || rolNormalizado === "EMPLEADO"))

  if (!tieneAcceso) {
    return <Navigate to="/login" replace />
  }

  // Cierro sesión desde el panel y regreso al inicio
  const cerrarSesionYVolver = () => {
    cerrarSesion()
    navegar("/")
  }


  // Pinto un ítem del menú lateral y cierro el overlay en móvil tras navegar
  const pintarElementoMenu = (ruta: string, etiqueta: string, Icono: typeof LayoutDashboard, cerrarDespues = false) => (
    <NavLink
      key={ruta}
      to={ruta}
      end={ruta === "/admin"}
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

  const menuItems = rolNormalizado === "ADMINISTRADOR" ? elementosMenuAdmin : elementosMenuEmpleado

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar móvil: overlay + panel deslizable */}
      <div className={`fixed inset-0 z-50 lg:hidden ${barraLateralAbierta ? "block" : "hidden"}`}>
        <div className="fixed inset-0 bg-black/50" onClick={() => establecerBarraLateralAbierta(false)} />
        <div className="fixed left-0 top-0 h-full w-64 bg-card border-r">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Panel Admin</h2>
            <Button variant="ghost" size="sm" onClick={() => establecerBarraLateralAbierta(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => pintarElementoMenu(item.ruta, item.etiqueta, item.icono, true))}
          </nav>
        </div>
      </div>

      {/* Sidebar de escritorio fijo con menú y botón de cerrar sesión */}
      <div className="hidden lg:fixed lg:left-0 lg:top-0 lg:h-full lg:w-64 lg:bg-card lg:border-r lg:block">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Panel de Administración</h2>
          <p className="text-sm text-muted-foreground">
            {usuario?.nombre ?? usuario?.email} · {rolNormalizado ?? "SIN ROL"}
          </p>
        </div>
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => pintarElementoMenu(item.ruta, item.etiqueta, item.icono))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <Button variant="outline" className="w-full bg-transparent" onClick={cerrarSesionYVolver}>
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>

      <div className="lg:ml-64">
        {/* Barra superior en móvil con botón de menú y acción de cerrar sesión */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b bg-card">
          <Button variant="ghost" size="sm" onClick={() => establecerBarraLateralAbierta(true)}>
            <Menu className="h-4 w-4" />
          </Button>
          <h1 className="font-semibold">
            {
              menuItems.find((item) =>
                item.ruta === "/admin"
                  ? ubicacion.pathname === "/admin"
                  : ubicacion.pathname.startsWith(item.ruta),
              )?.etiqueta || "Panel Admin"
            }
          </h1>
          <Button variant="ghost" size="sm" onClick={cerrarSesionYVolver}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Contenido anidado del panel */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
