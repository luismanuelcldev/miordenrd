"use client"

// Controlo el inventario: consulto stock, filtro por categoría y registro ajustes (entrada/salida/ajuste)

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Boxes, RefreshCw, Loader2 } from "lucide-react"
import { productService, type AjusteInventarioPayload, type TipoAjusteInventario } from "@/services/productService"
import type { ProductoResumen } from "@/types/producto"
import { categoryService, type Categoria } from "@/services/categoryService"
import { useToast } from "@/components/ui/toastContext"

// Defino el modelo del formulario para registrar ajustes de inventario
interface AjusteFormState {
  productoId: number | null
  cantidad: string
  estado: TipoAjusteInventario
  motivo: string
}

export default function InventarioAdmin() {
  const [inventario, setInventario] = useState<ProductoResumen[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [filtroCategoria, setFiltroCategoria] = useState<number | "todas">("todas")

  const [modalAbierto, setModalAbierto] = useState(false)
  const [formState, setFormState] = useState<AjusteFormState>({
    productoId: null,
    cantidad: "1",
    estado: "AJUSTE",
    motivo: "",
  })
  const [guardando, setGuardando] = useState(false)
  const { showToast } = useToast()

  // Cargo el inventario actual desde el backend y gestiono estados de carga/errores
  const cargarInventario = useCallback(async () => {
    setCargando(true)
    try {
      const data = await productService.listarInventario()
      setInventario(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error(error)
      showToast("No fue posible cargar el inventario", "error")
    } finally {
      setCargando(false)
    }
  }, [showToast])

  // Traigo categorías para habilitar el filtro por categoría
  const cargarCategorias = useCallback(async () => {
    try {
      const data = await categoryService.listarCategorias()
      setCategorias(data)
    } catch (error) {
      console.error(error)
    }
  }, [])

  // Inicio: cargo inventario y categorías en paralelo
  useEffect(() => {
    void Promise.all([cargarInventario(), cargarCategorias()])
  }, [cargarCategorias, cargarInventario])

  // Filtro por texto y categoría para mostrar un listado acotado
  const inventarioFiltrado = useMemo(() => {
    return inventario.filter((producto) => {
      const coincideBusqueda =
        producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (producto.descripcion ?? "").toLowerCase().includes(busqueda.toLowerCase())
      const coincideCategoria =
        filtroCategoria === "todas" || producto.categoria?.id === filtroCategoria
      return coincideBusqueda && coincideCategoria
    })
  }, [inventario, busqueda, filtroCategoria])

  // Devuelvo un color semáforo según el nivel de stock para el badge
  const getStockBadgeColor = (stock?: number | null) => {
    const cantidad = stock ?? 0
    if (cantidad === 0) return "bg-red-100 text-red-800"
    if (cantidad < 10) return "bg-yellow-100 text-yellow-800"
    return "bg-green-100 text-green-800"
  }

  // Precargo el producto seleccionado y abro el modal de ajuste
  const abrirModalAjuste = (producto: ProductoResumen) => {
    setFormState({
      productoId: producto.id,
      cantidad: "1",
      estado: "AJUSTE",
      motivo: "",
    })
    setModalAbierto(true)
  }

  // Valido y envío el ajuste de inventario, luego refresco la tabla
  const manejarGuardarAjuste = async () => {
    if (!formState.productoId) return
    const cantidad = Number.parseInt(formState.cantidad, 10)
    if (Number.isNaN(cantidad) || cantidad === 0) {
      showToast("La cantidad debe ser un número distinto de cero", "error")
      return
    }

    const payload: AjusteInventarioPayload = {
      productoId: formState.productoId,
      cantidad,
      estado: formState.estado,
      motivo: formState.motivo.trim() || undefined,
    }

    setGuardando(true)
    try {
      await productService.registrarAjusteInventario(payload)
      showToast("Ajuste registrado correctamente", "success")
      setModalAbierto(false)
      await cargarInventario()
    } catch (error) {
      console.error(error)
      showToast("No fue posible registrar el ajuste. Verifica los datos.", "error")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventario</h1>
          <p className="text-muted-foreground">Controla el stock y registra ajustes de inventario</p>
        </div>
        <Button variant="outline" onClick={() => void cargarInventario()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

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
                  placeholder="Buscar productos..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filtroCategoria === "todas" ? "todas" : filtroCategoria.toString()}
              onValueChange={(valor) => setFiltroCategoria(valor === "todas" ? "todas" : Number.parseInt(valor))}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.id.toString()}>
                    {categoria.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

  <Card>
    <CardHeader>
      <CardTitle>
        Inventario actual
        <span className="ml-2 text-sm font-normal text-muted-foreground">({inventarioFiltrado.length})</span>
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
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventarioFiltrado.map((producto) => (
                <TableRow key={producto.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{producto.nombre}</p>
                      {producto.descripcion && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{producto.descripcion}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{producto.categoria?.nombre ?? "Sin categoría"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStockBadgeColor(producto.stock)}>{producto.stock ?? 0} uds</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => abrirModalAjuste(producto)}>
                      <Boxes className="h-4 w-4 mr-2" />
                      Ajustar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {inventarioFiltrado.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No se encontraron productos con los filtros seleccionados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </CardContent>
  </Card>

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar ajuste de inventario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Producto</Label>
              <Input
                value={
                  formState.productoId
                    ? inventario.find((producto) => producto.id === formState.productoId)?.nombre ?? ""
                    : ""
                }
                disabled
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cantidad">Cantidad</Label>
                <Input
                  id="cantidad"
                  type="number"
                  value={formState.cantidad}
                  onChange={(e) => setFormState((prev) => ({ ...prev, cantidad: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="estado">Tipo de ajuste</Label>
                <Select
                  value={formState.estado}
                  onValueChange={(valor: TipoAjusteInventario) => setFormState((prev) => ({ ...prev, estado: valor }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTRADA">Entrada</SelectItem>
                    <SelectItem value="SALIDA">Salida</SelectItem>
                    <SelectItem value="AJUSTE">Ajuste</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="motivo">Motivo</Label>
              <Textarea
                id="motivo"
                rows={3}
                value={formState.motivo}
                onChange={(e) => setFormState((prev) => ({ ...prev, motivo: e.target.value }))}
                placeholder="Describe la razón del ajuste"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalAbierto(false)} disabled={guardando}>
                Cancelar
              </Button>
              <Button onClick={manejarGuardarAjuste} disabled={guardando}>
                {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
