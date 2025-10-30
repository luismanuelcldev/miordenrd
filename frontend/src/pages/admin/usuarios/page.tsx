
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Edit, UserX, UserCheck, Loader2, Trash2 } from "lucide-react"
import { userService } from "@/services/userService"
import type { UsuarioAdministrador } from "@/services/userService"
import type { RolUsuario } from "@/types/auth"
import { useToast } from "@/components/ui/toastContext"

type ModalModo = "crear" | "editar"

interface UsuarioFormState {
  nombre?: string
  apellido?: string
  email: string
  telefono?: string
  contrasena?: string
  rol: RolUsuario
}

const rolesDisponibles: Array<{ value: RolUsuario; label: string; badgeClass: string }> = [
  { value: "ADMINISTRADOR", label: "Administrador", badgeClass: "bg-red-100 text-red-800" },
  { value: "EMPLEADO", label: "Empleado", badgeClass: "bg-blue-100 text-blue-800" },
  { value: "REPARTIDOR", label: "Repartidor", badgeClass: "bg-green-100 text-green-800" },
  { value: "CLIENTE", label: "Cliente", badgeClass: "bg-gray-100 text-gray-800" },
]

const estadoBadge = {
  activo: "bg-green-100 text-green-800",
  inactivo: "bg-gray-100 text-gray-800",
} as const

export default function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState<UsuarioAdministrador[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [filtroRol, setFiltroRol] = useState<"todos" | RolUsuario>("todos")
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modoModal, setModoModal] = useState<ModalModo>("crear")
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioAdministrador | null>(null)
  const [formState, setFormState] = useState<UsuarioFormState>({
    email: "",
    contrasena: "",
    rol: "CLIENTE",
  })
  const [guardando, setGuardando] = useState(false)
  const { showToast } = useToast()

  // Cargo la lista completa de usuarios desde la API y gestiono estados de carga/errores
  const cargarUsuarios = useCallback(async () => {
    setCargando(true)
    try {
      const data = await userService.listarUsuariosAdmin()
      setUsuarios(data)
    } catch (error) {
      console.error(error)
      showToast("No fue posible cargar los usuarios", "error")
    } finally {
      setCargando(false)
    }
  }, [showToast])

  useEffect(() => {
    void cargarUsuarios()
  }, [cargarUsuarios])

  // Filtro por texto y por rol de forma memoizada para una UI fluida
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((usuario) => {
      const coincideBusqueda =
        usuario.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        usuario.apellido?.toLowerCase().includes(busqueda.toLowerCase()) ||
        usuario.email.toLowerCase().includes(busqueda.toLowerCase())
      const coincideRol = filtroRol === "todos" || usuario.rol === filtroRol
      return coincideBusqueda && coincideRol
    })
  }, [usuarios, busqueda, filtroRol])

  // Abro el modal en modo creación con valores por defecto
  const abrirModalCrear = () => {
    setModoModal("crear")
    setUsuarioEditando(null)
    setFormState({
      email: "",
      nombre: "",
      apellido: "",
      telefono: "",
      contrasena: "",
      rol: "CLIENTE",
    })
    setModalAbierto(true)
  }

  // Abro el modal en modo edición precargando los datos del usuario
  const abrirModalEditar = (usuario: UsuarioAdministrador) => {
    setModoModal("editar")
    setUsuarioEditando(usuario)
    setFormState({
      email: usuario.email,
      nombre: usuario.nombre ?? "",
      apellido: usuario.apellido ?? "",
      telefono: usuario.telefono ?? "",
      rol: usuario.rol,
    })
    setModalAbierto(true)
  }

  // Actualizo el formulario controlado campo a campo
  const manejarCambioForm = (campo: keyof UsuarioFormState, valor: string) => {
    setFormState((prev) => ({ ...prev, [campo]: valor }))
  }

  // Persiste creación o edición y refresco la tabla mostrando toasts
  const manejarGuardar = async () => {
    setGuardando(true)
    try {
    if (modoModal === "crear") {
      if (!formState.contrasena || formState.contrasena.length < 6) {
        showToast("La contraseña debe tener al menos 6 caracteres", "error")
        setGuardando(false)
        return
      }

      await userService.crearUsuarioAdmin({
        email: formState.email,
        nombre: formState.nombre,
        apellido: formState.apellido,
        telefono: formState.telefono,
        contrasena: formState.contrasena,
        rol: formState.rol,
      })
      showToast("Usuario creado exitosamente", "success")
    } else if (usuarioEditando) {
      await userService.actualizarUsuario(usuarioEditando.id, {
        nombre: formState.nombre,
        apellido: formState.apellido,
        telefono: formState.telefono,
        rol: formState.rol,
      })
      showToast("Usuario actualizado correctamente", "success")
    }
    setModalAbierto(false)
    await cargarUsuarios()
  } catch (error) {
    console.error(error)
      showToast("Ocurrió un error al guardar el usuario", "error")
    } finally {
      setGuardando(false)
    }
  }

  // Alterno estado activo/inactivo del usuario y notifico el resultado
  const cambiarEstadoUsuario = async (usuario: UsuarioAdministrador) => {
    try {
      if (usuario.activo) {
        await userService.desactivarUsuario(usuario.id)
        showToast("Usuario desactivado", "success")
      } else {
        await userService.activarUsuario(usuario.id)
        showToast("Usuario activado", "success")
      }
      await cargarUsuarios()
    } catch (error) {
      console.error(error)
      showToast("No fue posible actualizar el estado del usuario", "error")
    }
  }

  // Elimino el usuario tras confirmación y recargo la lista
  const eliminarUsuario = async (usuario: UsuarioAdministrador) => {
    const confirmar = window.confirm(
      `¿Eliminar al usuario ${usuario.email}? Esta acción no se puede deshacer.`,
    )
    if (!confirmar) return
    try {
      await userService.eliminarUsuario(usuario.id)
      showToast("Usuario eliminado", "success")
      await cargarUsuarios()
    } catch (error) {
      console.error(error)
      showToast("No fue posible eliminar el usuario", "error")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Administra los usuarios del sistema</p>
        </div>
        <Button onClick={abrirModalCrear}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Filtros: búsqueda por texto y selección por rol */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filtroRol} onValueChange={(valor: "todos" | RolUsuario) => setFiltroRol(valor)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los roles</SelectItem>
                {rolesDisponibles.map((rol) => (
                  <SelectItem key={rol.value} value={rol.value}>
                    {rol.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de resultados con acciones de edición/estado/eliminación */}
      <Card>
        <CardHeader>
          <CardTitle>
            Usuarios
            <span className="ml-2 text-sm font-normal text-muted-foreground">({usuariosFiltrados.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cargando ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead>Actualizado</TableHead>
                    <TableHead className="w-36">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuariosFiltrados.map((usuario) => {
                    const rolInfo = rolesDisponibles.find((rol) => rol.value === usuario.rol) ?? rolesDisponibles[0]
                    return (
                      <TableRow key={usuario.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {usuario.nombre ?? ""} {usuario.apellido ?? ""}
                            </p>
                            <p className="text-sm text-muted-foreground">{usuario.email}</p>
                            {usuario.telefono && (
                              <p className="text-sm text-muted-foreground">{usuario.telefono}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={rolInfo.badgeClass}>{rolInfo.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={usuario.activo ? estadoBadge.activo : estadoBadge.inactivo}>
                            {usuario.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(usuario.creadoEn).toLocaleString()}</TableCell>
                        <TableCell>{new Date(usuario.actualizadoEn).toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => abrirModalEditar(usuario)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => cambiarEstadoUsuario(usuario)}>
                              {usuario.activo ? (
                                <UserX className="h-4 w-4 text-red-600" />
                              ) : (
                                <UserCheck className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => eliminarUsuario(usuario)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {usuariosFiltrados.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No se encontraron usuarios con los criterios seleccionados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para crear/editar usuario (formulario controlado) */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{modoModal === "crear" ? "Nuevo Usuario" : "Editar Usuario"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={formState.nombre ?? ""}
                onChange={(e) => manejarCambioForm("nombre", e.target.value)}
                placeholder="Nombre"
              />
            </div>
            <div>
              <Label htmlFor="apellido">Apellido</Label>
              <Input
                id="apellido"
                value={formState.apellido ?? ""}
                onChange={(e) => manejarCambioForm("apellido", e.target.value)}
                placeholder="Apellido"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formState.email}
                onChange={(e) => manejarCambioForm("email", e.target.value)}
                placeholder="correo@ejemplo.com"
                disabled={modoModal === "editar"}
              />
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formState.telefono ?? ""}
                onChange={(e) => manejarCambioForm("telefono", e.target.value)}
                placeholder="+34 600 000 000"
              />
            </div>
            {modoModal === "crear" && (
              <div>
                <Label htmlFor="contrasena">Contraseña</Label>
                <Input
                  id="contrasena"
                  type="password"
                  value={formState.contrasena ?? ""}
                  onChange={(e) => manejarCambioForm("contrasena", e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            )}
            <div>
              <Label htmlFor="rol">Rol</Label>
              <Select value={formState.rol} onValueChange={(valor: RolUsuario) => manejarCambioForm("rol", valor)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {rolesDisponibles.map((rol) => (
                    <SelectItem key={rol.value} value={rol.value}>
                      {rol.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalAbierto(false)} disabled={guardando}>
                Cancelar
              </Button>
              <Button onClick={manejarGuardar} disabled={guardando}>
                {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : modoModal === "crear" ? "Crear" : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
