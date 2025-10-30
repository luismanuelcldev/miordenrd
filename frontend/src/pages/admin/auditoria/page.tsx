"use client"

// Consulto el historial de auditoría: filtro por módulo/acción/usuario/fecha y navego por páginas

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, RefreshCw } from "lucide-react"
import { auditService, type AuditoriaFiltros } from "@/services/auditService"
import type { AuditoriaListadoResponse, AuditoriaRegistro } from "@/types/auditoria"

const FILTROS_BASE: AuditoriaFiltros = {
  page: 1,
  limit: 20,
}

const moduloLabels: Record<string, string> = {
  AUTH: "Autenticación",
  PEDIDOS: "Pedidos",
  PRODUCTOS: "Productos",
  USUARIOS: "Usuarios",
  INVENTARIO: "Inventario",
  CONFIGURACION: "Configuración",
}

const formatearFecha = (iso: string) => {
  const fecha = new Date(iso)
  return fecha.toLocaleString("es-DO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const labelModulo = (modulo: string) => moduloLabels[modulo] ?? modulo

export default function AdminAuditoriaPage() {
  const [filtros, setFiltros] = useState<AuditoriaFiltros>(FILTROS_BASE)
  const [registros, setRegistros] = useState<AuditoriaRegistro[]>([])
  const [paginacion, setPaginacion] = useState<AuditoriaListadoResponse["paginacion"] | null>(null)
  const [modulos, setModulos] = useState<string[]>([])
  const [acciones, setAcciones] = useState<string[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Al montar, cargo catálogos de módulos y acciones disponibles para los filtros
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [modulosData, accionesData] = await Promise.all([auditService.obtenerModulos(), auditService.obtenerAcciones()])
        setModulos(modulosData)
        setAcciones(accionesData)
      } catch (err) {
        console.error(err)
      }
    }
    void cargarCatalogos()
  }, [])

  // Reacciono a cambios de filtros: consulto la página actual y compongo la tabla
  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      setError(null)
      try {
        const data = await auditService.listar(filtros)
        setRegistros(data.registros)
        setPaginacion(data.paginacion)
      } catch (err) {
        console.error(err)
        setError("No fue posible obtener el historial de auditoría")
      } finally {
        setCargando(false)
      }
    }
    void cargar()
  }, [filtros])

  const paginaActual = paginacion?.page ?? filtros.page ?? 1
  const totalPaginas = paginacion?.totalPages ?? 1

  // Presento un mensaje de vacío solo cuando no hay datos y no estoy cargando
  const descripcionVacia = useMemo(
    () => (registros.length === 0 && !cargando ? "No hay registros para los filtros seleccionados" : null),
    [registros.length, cargando],
  )

  // Actualizo los filtros manteniendo la página en 1 al cambiar criterios
  const actualizarFiltros = (valores: Partial<AuditoriaFiltros>) => {
    setFiltros((prev) => ({
      ...prev,
      ...valores,
      page: valores.page ?? 1,
    }))
  }

  // Restauro filtros base respetando el tamaño de página actual
  const restablecerFiltros = () => {
    setFiltros({ ...FILTROS_BASE, limit: filtros.limit })
  }

  // Normalizo el ID de usuario recibido desde el input texto a número o indefinido
  const manejarCambioUsuario = (valor: string) => {
    if (!valor) {
      actualizarFiltros({ usuarioId: undefined })
      return
    }
    const numero = Number.parseInt(valor, 10)
    actualizarFiltros({ usuarioId: Number.isNaN(numero) ? undefined : numero })
  }

  // Convierto la fecha local a ISO con hora mínima del día
  const manejarFechaDesde = (valor: string) => {
    if (!valor) {
      actualizarFiltros({ fechaDesde: undefined })
      return
    }
    actualizarFiltros({ fechaDesde: new Date(`${valor}T00:00:00.000Z`).toISOString() })
  }

  // Convierto la fecha local a ISO con hora máxima del día
  const manejarFechaHasta = (valor: string) => {
    if (!valor) {
      actualizarFiltros({ fechaHasta: undefined })
      return
    }
    actualizarFiltros({ fechaHasta: new Date(`${valor}T23:59:59.999Z`).toISOString() })
  }

  // Retrocedo una página si es posible
  const paginaAnterior = () => {
    if (paginaActual <= 1) return
    actualizarFiltros({ page: paginaActual - 1 })
  }

  // Avanzo una página si no estoy al final
  const paginaSiguiente = () => {
    if (totalPaginas > 0 && paginaActual >= totalPaginas) return
    actualizarFiltros({ page: paginaActual + 1 })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Auditoría</h1>
        <p className="text-muted-foreground">
          Consulta los eventos críticos realizados por los usuarios administradores y operativos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Módulo</label>
              <Select
                value={filtros.modulo ?? "todos"}
                onValueChange={(valor) => actualizarFiltros({ modulo: valor === "todos" ? undefined : valor })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {modulos.map((modulo) => (
                    <SelectItem key={modulo} value={modulo}>
                      {labelModulo(modulo)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Acción</label>
              <Select
                value={filtros.accion ?? "todas"}
                onValueChange={(valor) => actualizarFiltros({ accion: valor === "todas" ? undefined : valor })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {acciones.map((accion) => (
                    <SelectItem key={accion} value={accion}>
                      {accion.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Usuario</label>
              <Input
                placeholder="ID de usuario"
                value={filtros.usuarioId?.toString() ?? ""}
                onChange={(event) => manejarCambioUsuario(event.target.value)}
                inputMode="numeric"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Desde</label>
              <Input
                type="date"
                value={filtros.fechaDesde ? filtros.fechaDesde.slice(0, 10) : ""}
                onChange={(event) => manejarFechaDesde(event.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Hasta</label>
              <Input
                type="date"
                value={filtros.fechaHasta ? filtros.fechaHasta.slice(0, 10) : ""}
                onChange={(event) => manejarFechaHasta(event.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={restablecerFiltros}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Restablecer
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Actividad reciente</CardTitle>
          {paginacion && (
            <div className="text-sm text-muted-foreground">
              Página {paginaActual} de {totalPaginas} · {paginacion.total} eventos
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Fecha</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Descripción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargando && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      <Loader2 className="h-5 w-5 mr-2 inline-block animate-spin" />
                      Cargando eventos de auditoría...
                    </TableCell>
                  </TableRow>
                )}

                {!cargando &&
                  registros.map((registro) => (
                    <TableRow key={registro.id}>
                      <TableCell className="text-sm">{formatearFecha(registro.fecha)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {registro.usuario?.nombre || registro.usuario?.apellido
                              ? `${registro.usuario?.nombre ?? ""} ${registro.usuario?.apellido ?? ""}`.trim()
                              : registro.usuario?.email ?? `Usuario #${registro.usuarioId}`}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {registro.usuario?.email ?? `ID ${registro.usuarioId}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{labelModulo(registro.modulo)}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{registro.accion.replace(/_/g, " ")}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {registro.descripcion ?? "Sin descripción adicional"}
                      </TableCell>
                    </TableRow>
                  ))}

                {!cargando && registros.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      {descripcionVacia}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={paginaAnterior} disabled={paginaActual <= 1 || cargando}>
              Anterior
            </Button>
            <div className="text-sm text-muted-foreground">
              Página {paginaActual} de {totalPaginas}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={paginaSiguiente}
              disabled={cargando || (totalPaginas > 0 && paginaActual >= totalPaginas)}
            >
              Siguiente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
