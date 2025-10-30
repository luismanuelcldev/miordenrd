"use client"

// Administro el catálogo: listar, filtrar y crear/editar/eliminar productos (con subida de imagen y oferta)

import { useEffect, useMemo, useState, useCallback } from "react"
import type { ChangeEvent } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Edit, Trash2, Loader2, RefreshCw } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { productService, type GuardarProductoPayload } from "@/services/productService"
import { categoryService } from "@/services/categoryService"
import type { Categoria, Subcategoria } from "@/services/categoryService"
import type { ProductoDetalle, ProductoResumen } from "@/types/producto"
import { useToast } from "@/components/ui/toastContext"
import { mediaService } from "@/services/mediaService"

// Controlo el modo del diálogo de producto (nuevo o edición)
type ModalModo = "crear" | "editar"

// Modelo del formulario local para gestionar campos y validaciones básicas
interface ProductoFormState {
  nombre: string
  descripcion: string
  precio: string
  stock: string
  imagenUrl: string
  categoriaId?: number
  subcategoriaId?: number
  enOferta: boolean
  precioOferta: string
}

export default function ProductosAdmin() {
  const [productos, setProductos] = useState<ProductoResumen[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [cargando, setCargando] = useState(true)
  const [cargandoCategorias, setCargandoCategorias] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [filtroCategoria, setFiltroCategoria] = useState<number | "todas">("todas")
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modoModal, setModoModal] = useState<ModalModo>("crear")
  const [productoEditando, setProductoEditando] = useState<ProductoDetalle | null>(null)
  const [formState, setFormState] = useState<ProductoFormState>({
    nombre: "",
    descripcion: "",
    precio: "0",
    stock: "0",
    imagenUrl: "",
    categoriaId: undefined,
    subcategoriaId: undefined,
    enOferta: false,
    precioOferta: "",
  })
  const [guardando, setGuardando] = useState(false)
  const [imagenArchivo, setImagenArchivo] = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const { showToast } = useToast()

  // Mantengo una vista previa de imagen y libero blobs anteriores para evitar fugas de memoria
  const actualizarPreview = useCallback((src: string | null) => {
    setImagenPreview((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev)
      }
      return src ?? null
    })
  }, [])

  // Al desmontar, revoco el blob de la última preview si aplica
  useEffect(() => {
    return () => {
      if (imagenPreview && imagenPreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagenPreview)
      }
    }
  }, [imagenPreview])

  // Cargo el listado base de productos con paginación fija
  const cargarProductos = useCallback(async () => {
    setCargando(true)
    try {
      const { productos } = await productService.listarProductos({ page: 1, limit: 100 })
      setProductos(productos)
    } catch (error) {
      console.error(error)
      showToast("No fue posible cargar los productos", "error")
    } finally {
      setCargando(false)
    }
  }, [showToast])

  // Traigo categorías para poblar selects y derivar subcategorías
  const cargarCategorias = useCallback(async () => {
    setCargandoCategorias(true)
    try {
      const data = await categoryService.listarCategorias()
      setCategorias(data)
    } catch (error) {
      console.error(error)
      showToast("No fue posible cargar las categorías", "error")
    } finally {
      setCargandoCategorias(false)
    }
  }, [showToast])

  // Inicio: cargo productos y categorías en paralelo
  useEffect(() => {
    void Promise.all([cargarProductos(), cargarCategorias()])
  }, [cargarCategorias, cargarProductos])

  // Filtro por texto y categoría para acotar el grid
  const productosFiltrados = useMemo(() => {
    return productos.filter((producto) => {
      const termo = busqueda.toLowerCase()
      const coincideBusqueda =
        producto.nombre.toLowerCase().includes(termo) ||
        (producto.descripcion ?? "").toLowerCase().includes(termo)
      const coincideCategoria = filtroCategoria === "todas" || producto.categoria?.id === filtroCategoria
      return coincideBusqueda && coincideCategoria
    })
  }, [productos, busqueda, filtroCategoria])

  // Derivo subcategorías según la categoría seleccionada
  const subcategoriasDisponibles = useMemo(() => {
    if (formState.categoriaId === undefined) return []
    const categoria = categorias.find((item) => item.id === formState.categoriaId)
    return categoria?.subcategorias ?? []
  }, [categorias, formState.categoriaId])

  // Inicializo el formulario nuevo y abro el modal
  const abrirModalCrear = () => {
    setModoModal("crear")
    setProductoEditando(null)
    setFormState({
      nombre: "",
      descripcion: "",
      precio: "0",
      stock: "0",
      imagenUrl: "",
      categoriaId: undefined,
      subcategoriaId: undefined,
      enOferta: false,
      precioOferta: "",
    })
    setImagenArchivo(null)
    actualizarPreview(null)
    setModalAbierto(true)
  }

  // Cargo el detalle del producto para edición y precargo la preview
  const abrirModalEditar = async (productoId: number) => {
    setModoModal("editar")
    setGuardando(false)
    try {
      const detalle = await productService.obtenerProducto(productoId)
      setProductoEditando(detalle)
      setFormState({
        nombre: detalle.nombre,
        descripcion: detalle.descripcion ?? "",
        precio: detalle.precio.toString(),
        stock: (detalle.stock ?? 0).toString(),
        imagenUrl: detalle.imagenUrl ?? "",
        categoriaId: detalle.categoria?.id,
        subcategoriaId: detalle.subcategoria?.id,
        enOferta: detalle.enOferta,
        precioOferta: detalle.precioOferta != null ? detalle.precioOferta.toString() : "",
      })
      setImagenArchivo(null)
      actualizarPreview(detalle.imagenUrl ?? null)
      setModalAbierto(true)
    } catch (error) {
      console.error(error)
      showToast("No fue posible cargar la información del producto", "error")
    }
  }

  // Actualizo campos del formulario y reseteo dependencias (subcategoría, oferta, imagen)
  const manejarCambioForm = (campo: keyof ProductoFormState, valor: string | number | boolean | undefined) => {
    setFormState((prev) => ({
      ...prev,
      [campo]: valor,
      ...(campo === "categoriaId" ? { subcategoriaId: undefined } : {}),
      ...(campo === "enOferta" && valor === false ? { precioOferta: "" } : {}),
    }))

    if (campo === "imagenUrl") {
      setImagenArchivo(null)
      const texto = typeof valor === "string" ? valor.trim() : ""
      actualizarPreview(texto ? texto : null)
    }
  }

  // Manejo subida local: genero blob para preview y vacío URL manual si corresponde
  const manejarArchivoImagen = (event: ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0]
    if (archivo) {
      setImagenArchivo(archivo)
      actualizarPreview(URL.createObjectURL(archivo))
      setFormState((prev) => ({ ...prev, imagenUrl: "" }))
    } else {
      setImagenArchivo(null)
      actualizarPreview(null)
    }
  }

  // Valido y construyo el payload a enviar al backend (incluye precio de oferta si aplica)
  const construirPayload = (imagenForzada?: string): GuardarProductoPayload | null => {
    const precio = Number.parseFloat(formState.precio)
    const stock = Number.parseInt(formState.stock)

    if (!formState.nombre.trim()) {
      showToast("El nombre del producto es obligatorio", "error")
      return null
    }
    if (Number.isNaN(precio) || precio < 0) {
      showToast("El precio debe ser un número válido", "error")
      return null
    }
    if (Number.isNaN(stock) || stock < 0) {
      showToast("El stock debe ser un número válido", "error")
      return null
    }

    let precioOferta: number | undefined
    if (formState.enOferta) {
      const valor = Number.parseFloat(formState.precioOferta)
      if (Number.isNaN(valor) || valor <= 0 || valor >= precio) {
        showToast("El precio de oferta debe ser menor que el precio regular", "error")
        return null
      }
      precioOferta = valor
    }

    const payload: GuardarProductoPayload = {
      nombre: formState.nombre.trim(),
      descripcion: formState.descripcion.trim() || undefined,
      precio,
      stock,
      imagenUrl: (imagenForzada ?? formState.imagenUrl.trim()) || undefined,
      categoriaId: formState.categoriaId,
      subcategoriaId: formState.subcategoriaId,
      enOferta: formState.enOferta,
    }

    if (formState.enOferta && precioOferta !== undefined) {
      payload.precioOferta = precioOferta
    }

    return payload
  }

  // Subo imagen si existe y guardo (crear/actualizar), luego refresco la lista
  const manejarGuardar = async () => {
    let imagenSubida: string | undefined
    if (imagenArchivo) {
      try {
        const respuesta = await mediaService.subirImagenProducto(imagenArchivo)
        imagenSubida = respuesta.url
      } catch (error) {
        console.error(error)
        showToast("No se pudo subir la imagen del producto", "error")
        return
      }
    }

    const payload = construirPayload(imagenSubida)
    if (!payload) return

    setGuardando(true)
    try {
      if (modoModal === "crear") {
        await productService.crearProducto(payload)
        showToast("Producto creado correctamente", "success")
      } else if (productoEditando) {
        const datosActualizados: Partial<GuardarProductoPayload> = {
          ...payload,
          precioOferta: payload.enOferta ? payload.precioOferta : undefined,
        }
        if (!payload.enOferta) {
          datosActualizados.enOferta = false
        }
        await productService.actualizarProducto(productoEditando.id, datosActualizados)
        showToast("Producto actualizado correctamente", "success")
      }
      setModalAbierto(false)
      setImagenArchivo(null)
      actualizarPreview(null)
      await cargarProductos()
    } catch (error) {
      console.error(error)
      showToast("Ocurrió un error al guardar el producto", "error")
    } finally {
      setGuardando(false)
    }
  }

  // Confirmo y elimino el producto, luego recargo el listado
  const eliminarProducto = async (productoId: number) => {
    if (!window.confirm("¿Seguro que deseas eliminar este producto?")) return
    try {
      await productService.eliminarProducto(productoId)
      showToast("Producto eliminado", "success")
      await cargarProductos()
    } catch (error) {
      console.error(error)
      showToast("No fue posible eliminar el producto", "error")
    }
  }

  // Asigno un color al badge según el nivel de stock
  const getStockBadgeColor = (stock?: number | null) => {
    const cantidad = stock ?? 0
    if (cantidad === 0) return "bg-red-100 text-red-800"
    if (cantidad < 10) return "bg-yellow-100 text-yellow-800"
    return "bg-green-100 text-green-800"
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de productos</h1>
          <p className="text-muted-foreground">Administra el catálogo disponible para los clientes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void Promise.all([cargarProductos(), cargarCategorias()])}>
            <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
          </Button>
          <Button onClick={abrirModalCrear}>
            <Plus className="h-4 w-4 mr-2" /> Nuevo producto
          </Button>
        </div>
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
                  onChange={(event) => setBusqueda(event.target.value)}
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
            Productos
            <span className="ml-2 text-sm font-normal text-muted-foreground">({productosFiltrados.length})</span>
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
                    <TableHead>Precio</TableHead>
                    <TableHead>Oferta</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="w-40">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productosFiltrados.map((producto) => (
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
                      <TableCell className="font-medium">
                        RD${producto.precio.toFixed(2)}
                        {producto.precioOferta != null && (
                          <span className="block text-sm text-muted-foreground line-through">
                            RD${producto.precioOferta.toFixed(2)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {producto.enOferta ? (
                          <Badge className="bg-amber-100 text-amber-700">En oferta</Badge>
                        ) : (
                          <Badge variant="secondary">Precio regular</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStockBadgeColor(producto.stock)}>{producto.stock ?? 0} uds</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => void abrirModalEditar(producto.id)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => void eliminarProducto(producto.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {productosFiltrados.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No hay productos que coincidan con los filtros seleccionados.
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
        <DialogContent className="max-w-2xl overflow-y-auto max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>{modoModal === "crear" ? "Nuevo producto" : "Editar producto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" value={formState.nombre} onChange={(e) => manejarCambioForm("nombre", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="categoria">Categoría</Label>
                <Select
                  value={formState.categoriaId !== undefined ? formState.categoriaId.toString() : "none"}
                  disabled={cargandoCategorias}
                  onValueChange={(valor) => manejarCambioForm("categoriaId", valor === "none" ? undefined : Number.parseInt(valor))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={cargandoCategorias ? "Cargando..." : "Selecciona una categoría"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin categoría</SelectItem>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id.toString()}>
                        {categoria.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="subcategoria">Subcategoría</Label>
              <Select
                value={formState.subcategoriaId !== undefined ? formState.subcategoriaId.toString() : "none"}
                disabled={subcategoriasDisponibles.length === 0}
                onValueChange={(valor) => manejarCambioForm("subcategoriaId", valor === "none" ? undefined : Number.parseInt(valor))}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={subcategoriasDisponibles.length === 0 ? "Selecciona una categoría" : "Selecciona subcategoría"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin subcategoría</SelectItem>
                  {subcategoriasDisponibles.map((subcategoria: Subcategoria) => (
                    <SelectItem key={subcategoria.id} value={subcategoria.id.toString()}>
                      {subcategoria.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                rows={3}
                value={formState.descripcion}
                onChange={(e) => manejarCambioForm("descripcion", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="precio">Precio (RD$)</Label>
                <Input id="precio" type="number" min={0} step="0.01" value={formState.precio} onChange={(e) => manejarCambioForm("precio", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="stock">Stock</Label>
                <Input id="stock" type="number" min={0} value={formState.stock} onChange={(e) => manejarCambioForm("stock", e.target.value)} />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Imagen del producto</Label>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-32 h-32 rounded-md border bg-muted/40 flex items-center justify-center overflow-hidden">
                  <img
                    src={imagenPreview ?? (formState.imagenUrl.trim() || "/producto-placeholder.svg")}
                    alt="Vista previa"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="imagen">URL de la imagen</Label>
                    <Input
                      id="imagen"
                      type="url"
                      value={formState.imagenUrl}
                      onChange={(e) => manejarCambioForm("imagenUrl", e.target.value)}
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="imagenArchivo">Subir imagen desde tu equipo</Label>
                    <Input id="imagenArchivo" type="file" accept="image/*" onChange={manejarArchivoImagen} />
                    <p className="text-xs text-muted-foreground">Formatos permitidos: JPG, PNG, WebP. Tamaño máximo 5 MB.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border p-4">
              <div>
                <p className="font-medium">¿Producto en oferta?</p>
                <p className="text-sm text-muted-foreground">
                  Activa esta opción para mostrar el producto en la sección de ofertas y definir un precio especial.
                </p>
              </div>
              <Switch checked={formState.enOferta} onCheckedChange={(checked) => manejarCambioForm("enOferta", checked)} />
            </div>

            {formState.enOferta && (
              <div>
                <Label htmlFor="precioOferta">Precio de oferta (RD$)</Label>
                <Input
                  id="precioOferta"
                  type="number"
                  min={0}
                  step="0.01"
                  value={formState.precioOferta}
                  onChange={(e) => manejarCambioForm("precioOferta", e.target.value)}
                  placeholder="Precio durante la oferta"
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalAbierto(false)} disabled={guardando}>
                Cancelar
              </Button>
              <Button onClick={manejarGuardar} disabled={guardando}>
                {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
