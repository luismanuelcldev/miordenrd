"use client"

import { useEffect, useState, type FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ShoppingCart, User, Menu, X, Search, Heart, LogOut, Settings, Package } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useCart } from "@/lib/cart"

// Dibujo el encabezado global con navegación, búsqueda, carrito y menú de usuario
export function Header() {
  const [menuAbierto, establecerMenuAbierto] = useState(false)
  const [busquedaAbierta, setBusquedaAbierta] = useState(false)
  const [terminoBusqueda, setTerminoBusqueda] = useState("")
  const { carrito } = useCart()
  const { usuario, estaAutenticado, cerrarSesion } = useAuth()
  const location = useLocation()
  const navegar = useNavigate()
  const esPersonalAdministrativo = usuario?.rol === "ADMINISTRADOR" || usuario?.rol === "EMPLEADO"
  const esRepartidor = usuario?.rol === "REPARTIDOR"

  // Mantengo el término de búsqueda sincronizado con la URL cuando la modal está cerrada
  useEffect(() => {
    if (busquedaAbierta) return
    const params = new URLSearchParams(location.search)
    setTerminoBusqueda(params.get("q") ?? "")
  }, [busquedaAbierta, location.search])

  // Abro el diálogo de búsqueda avanzada
  const abrirBusqueda = () => {
    setBusquedaAbierta(true)
  }

  // Lanzo la navegación aplicando el término normalizado
  const realizarBusqueda = (termino: string) => {
    const consulta = termino.trim()
    setBusquedaAbierta(false)
    if (consulta) {
      navegar(`/productos?q=${encodeURIComponent(consulta)}`)
    } else {
      navegar("/productos")
    }
  }

  // Manejo el submit del formulario de búsqueda en desktop
  const manejarEnvioBusqueda = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    realizarBusqueda(terminoBusqueda)
  }

  // Manejo el submit del formulario de búsqueda en móvil
  const manejarBusquedaMovil = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    establecerMenuAbierto(false)
    realizarBusqueda(terminoBusqueda)
  }

  // Cierro sesión y envío al inicio
  const cerrarSesionYRedirigir = () => {
    cerrarSesion()
    navegar("/")
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-blue-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            to={esPersonalAdministrativo ? "/admin" : esRepartidor ? "/repartidor" : "/"}
            className="flex items-center gap-2 group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-100 bg-[#2b62e1]/5 shadow-sm transition group-hover:border-[#2b62e1]/40">
              <img
                src="/images/Logo.PNG"
                alt="MiOrdenRD"
                className="h-6 w-6"
              />
            </div>

          </Link>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            {esPersonalAdministrativo ? (
              <Link
                to="/admin"
                className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors relative group"
              >
                Panel Admin
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            ) : esRepartidor ? (
              <>
                <Link
                  to="/repartidor"
                  className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors relative group"
                >
                  Inicio
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
                </Link>
                <Link
                  to="/repartidor/pedidos"
                  className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors relative group"
                >
                  Pedidos asignados
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/productos"
                  className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors relative group"
                >
                  Productos
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
                </Link>
                <Link
                  to="/categorias"
                  className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors relative group"
                >
                  Categorías
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
                </Link>
                <Link
                  to="/ofertas"
                  className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors relative group"
                >
                  Ofertas
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
                </Link>
                <Link
                  to="/contacto"
                  className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors relative group"
                >
                  Contacto
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
                </Link>
              </>
            )}
          </nav>

          {/* Acciones del usuario */}
          <div className="flex items-center space-x-2">
            {!esPersonalAdministrativo && !esRepartidor && (
              <>
                {/* Búsqueda */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden sm:flex hover:bg-blue-50 hover:text-blue-600"
                  onClick={abrirBusqueda}
                  aria-label="Buscar productos"
                >
                  <Search className="h-5 w-5" />
                </Button>

                {/* Favoritos */}
                <Link to="/cuenta/favoritos">
                  <Button variant="ghost" size="icon" className="hidden sm:flex hover:bg-blue-50 hover:text-blue-600">
                    <Heart className="h-5 w-5" />
                  </Button>
                </Link>

                {/* Carrito */}
                <Button variant="ghost" size="icon" className="relative hover:bg-blue-50 hover:text-blue-600" asChild>
                  <Link to="/carrito">
                    <ShoppingCart className="h-5 w-5" />
                    {carrito.cantidadItems > 0 && (
                      <Badge
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
                      >
                        {carrito.cantidadItems}
                      </Badge>
                    )}
                  </Link>
                </Button>
              </>
            )}

            {estaAutenticado ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">
                        {usuario?.nombre} {usuario?.apellido}
                      </p>
                      <p className="text-xs text-muted-foreground">{usuario?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {esPersonalAdministrativo ? (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Panel Admin
                      </Link>
                    </DropdownMenuItem>
                  ) : esRepartidor ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/repartidor" className="flex items-center">
                          <Settings className="mr-2 h-4 w-4" />
                          Centro de entregas
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/repartidor/pedidos" className="flex items-center">
                          <Package className="mr-2 h-4 w-4" />
                          Pedidos asignados
                        </Link>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/cuenta" className="flex items-center">
                          <Settings className="mr-2 h-4 w-4" />
                          Mi Cuenta
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/cuenta/pedidos" className="flex items-center">
                          <Package className="mr-2 h-4 w-4" />
                          Mis Pedidos
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={cerrarSesionYRedirigir} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50" asChild>
                  <Link to="/login">Iniciar Sesión</Link>
                </Button>
                <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white shadow-md" asChild>
                  <Link to="/registro">Registrarse</Link>
                </Button>
              </div>
            )}

            {/* Menú móvil */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => establecerMenuAbierto(!menuAbierto)}
            >
              {menuAbierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Menú móvil */}
        {menuAbierto && (
          <div className="md:hidden border-t py-4">
            <nav className="flex flex-col space-y-4">
              {esPersonalAdministrativo ? (
                <Link
                  to="/admin"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => establecerMenuAbierto(false)}
                >
                  Panel Admin
                </Link>
              ) : esRepartidor ? (
                <>
                  <Link
                    to="/repartidor"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => establecerMenuAbierto(false)}
                  >
                    Inicio
                  </Link>
                  <Link
                    to="/repartidor/pedidos"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => establecerMenuAbierto(false)}
                  >
                    Pedidos asignados
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/productos"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => establecerMenuAbierto(false)}
                  >
                    Productos
                  </Link>
                  <Link
                    to="/categorias"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => establecerMenuAbierto(false)}
                  >
                    Categorías
                  </Link>
                  <Link
                    to="/ofertas"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => establecerMenuAbierto(false)}
                  >
                    Ofertas
                  </Link>
                  <Link
                    to="/contacto"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => establecerMenuAbierto(false)}
                  >
                    Contacto
                  </Link>
                </>
              )}

              {!esRepartidor && (
                <div className="pt-4 border-t">
                  <form onSubmit={manejarBusquedaMovil} className="flex flex-col sm:flex-row gap-2">
                    <Input
                      value={terminoBusqueda}
                      onChange={(event) => setTerminoBusqueda(event.target.value)}
                      placeholder="Buscar productos"
                      aria-label="Buscar productos"
                    />
                    <Button type="submit" size="sm">
                      Buscar
                    </Button>
                  </form>
                </div>
              )}

              {!estaAutenticado && (
                <div className="flex flex-col space-y-2 pt-4">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/login" onClick={() => establecerMenuAbierto(false)}>
                      Iniciar Sesión
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to="/registro" onClick={() => establecerMenuAbierto(false)}>
                      Registrarse
                    </Link>
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>

      <Dialog open={busquedaAbierta} onOpenChange={setBusquedaAbierta}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Buscar productos</DialogTitle>
          </DialogHeader>
          <form onSubmit={manejarEnvioBusqueda} className="space-y-4">
            <Input
              value={terminoBusqueda}
              onChange={(event) => setTerminoBusqueda(event.target.value)}
              placeholder="Busca por nombre, categoría o descripción"
              aria-label="Buscar productos"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setBusquedaAbierta(false)}>
                Cancelar
              </Button>
              <Button type="submit">Buscar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
