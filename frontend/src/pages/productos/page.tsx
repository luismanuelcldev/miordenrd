// Muestro el catálogo con filtros, orden, paginación y vistas en grid o lista sincronizadas con la URL
"use client"

import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { productService } from "@/services/productService"
import { categoryService } from "@/services/categoryService"
import type { ProductoResumen, Paginacion } from "@/types/producto"
import { Search, Filter, ShoppingCart, Grid, List, ChevronLeft, ChevronRight, Heart } from "lucide-react"
import { useCart } from "@/lib/cart"
import { useFavorites } from "@/lib/favorites"
import { useToast } from "@/components/ui/toastContext"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/utils/currency"

interface FiltrosEstado {
  categoriaId?: number
  precioMin: number
  precioMax: number
  busqueda: string
  ordenar: OrdenSeleccion
  page: number
}

type OrdenSeleccion =
  | "recientes"
  | "precio-asc"
  | "precio-desc"
  | "nombre"
  | "stock"

type CategoriaItem = { id: number; nombre: string }

const ORDEN_MAP: Record<OrdenSeleccion, { ordenarPor?: "nombre" | "precio" | "creadoEn" | "stock"; orden?: "asc" | "desc" }> = {
  recientes: { ordenarPor: "creadoEn", orden: "desc" },
  "precio-asc": { ordenarPor: "precio", orden: "asc" },
  "precio-desc": { ordenarPor: "precio", orden: "desc" },
  nombre: { ordenarPor: "nombre", orden: "asc" },
  stock: { ordenarPor: "stock", orden: "desc" },
}

const PRECIO_MAXIMO = 50000

interface ErrorResponseData {
  message?: unknown
}

interface AxiosLikeError {
  response?: {
    data?: ErrorResponseData
  }
}

const mensajeError = (error: unknown) => {
  if (!error || typeof error !== "object") return "Ocurrió un error inesperado"
  const axiosError = error as AxiosLikeError
  const data = axiosError.response?.data
  if (Array.isArray(data?.message)) return data.message.join(". ")
  if (typeof data?.message === "string") return data.message
  return "Ocurrió un error inesperado"
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<ProductoResumen[]>([])
  const [categorias, setCategorias] = useState<CategoriaItem[]>([])
  const [paginacion, setPaginacion] = useState<Paginacion | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const searchParam = searchParams.get("q") ?? ""
  const pageParamRaw = Number(searchParams.get("page") ?? "1")
  const pageParam = Number.isNaN(pageParamRaw) || pageParamRaw < 1 ? 1 : Math.floor(pageParamRaw)
  const [filtros, setFiltros] = useState<FiltrosEstado>({
    categoriaId: undefined,
    precioMin: 0,
    precioMax: PRECIO_MAXIMO,
    busqueda: searchParam,
    ordenar: "recientes",
    page: pageParam,
  })
  const [vistaGrid, setVistaGrid] = useState(true)
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { agregarProducto } = useCart()
  const [mensajeCarrito, setMensajeCarrito] = useState<string | null>(null)
  const { esFavorito, toggleFavorito } = useFavorites()
  const { showToast } = useToast()
  const formatearPrecio = (valor: number) => formatCurrency(valor)

  useEffect(() => {
    // Cargo la lista de categorías al montar para alimentar el filtro lateral
    let activo = true
    categoryService
      .listarCategorias()
      .then((lista) => {
        if (!activo) return
        const categoriasMapeadas = lista.map((categoria) => ({ id: categoria.id, nombre: categoria.nombre }))
        setCategorias(categoriasMapeadas)
      })
      .catch(() => {
        /* ignoramos error de categorías */
      })
    return () => {
      activo = false
    }
  }, [])

  useEffect(() => {
    setFiltros((prev) => {
      let cambiado = false
      const siguiente = { ...prev }
      if (prev.busqueda !== searchParam) {
        siguiente.busqueda = searchParam
        siguiente.page = pageParam
        cambiado = true
      } else if (prev.page !== pageParam) {
        siguiente.page = pageParam
        cambiado = true
      }
      return cambiado ? siguiente : prev
    })
  }, [searchParam, pageParam])

  const syncSearchParams = (busqueda: string, page: number) => {
    // Sincronizo los filtros clave con el querystring para navegación y compartibilidad
    const params = new URLSearchParams()
    const termino = busqueda.trim()
    if (termino) params.set("q", termino)
    if (page > 1) params.set("page", page.toString())
    setSearchParams(params)
  }

  useEffect(() => {
    // Consulto productos cuando cambian filtros o la vista y manejo estados de carga y error
    let activo = true
    const cargarProductos = async () => {
      setCargando(true)
      setError(null)
      try {
        const ordenConfig = ORDEN_MAP[filtros.ordenar]
        const { productos, paginacion } = await productService.listarProductos({
          page: filtros.page,
          limit: vistaGrid ? 12 : 10,
          search: filtros.busqueda ? filtros.busqueda.trim() : undefined,
          categoriaId: filtros.categoriaId,
          precioMin: filtros.precioMin,
          precioMax: filtros.precioMax,
          ordenarPor: ordenConfig.ordenarPor,
          orden: ordenConfig.orden,
        })
        if (!activo) return
        setProductos(productos)
        setPaginacion(paginacion)
      } catch (err) {
        if (!activo) return
        setError(mensajeError(err))
      } finally {
        if (activo) setCargando(false)
      }
    }

    void cargarProductos()

    return () => {
      activo = false
    }
  }, [filtros, vistaGrid])

  const handleCategoria = (value: string) => {
    const categoriaSeleccionada = value === "all" ? undefined : Number(value)
    const busquedaActual = filtros.busqueda
    setFiltros((prev) => ({
      ...prev,
      categoriaId: categoriaSeleccionada,
      page: 1,
    }))
    syncSearchParams(busquedaActual, 1)
  }

  const handleRangoPrecio = (valores: number[]) => {
    const [min, max] = valores
    const busquedaActual = filtros.busqueda
    setFiltros((prev) => ({
      ...prev,
      precioMin: min,
      precioMax: max,
      page: 1,
    }))
    syncSearchParams(busquedaActual, 1)
  }

  const handleBusqueda = (valor: string) => {
    const termino = valor.trim()
    setFiltros((prev) => ({
      ...prev,
      busqueda: termino,
      page: 1,
    }))
    syncSearchParams(termino, 1)
  }

  const handleOrden = (valor: OrdenSeleccion) => {
    const busquedaActual = filtros.busqueda
    setFiltros((prev) => ({
      ...prev,
      ordenar: valor,
      page: 1,
    }))
    syncSearchParams(busquedaActual, 1)
  }

  const restablecerFiltros = () => {
    setFiltros({
      categoriaId: undefined,
      precioMin: 0,
      precioMax: PRECIO_MAXIMO,
      busqueda: "",
      ordenar: "recientes",
      page: 1,
    })
    syncSearchParams("", 1)
  }

  const handlePagina = (direccion: "prev" | "next") => {
    const busquedaActual = filtros.busqueda
    setFiltros((prev) => {
      const nuevaPagina = Math.max(1, direccion === "next" ? prev.page + 1 : prev.page - 1)
      syncSearchParams(busquedaActual, nuevaPagina)
      return {
        ...prev,
        page: nuevaPagina,
      }
    })
  }

  const aplicarAgregar = async (id: number) => {
    // Agrego un producto al carrito y muestro un mensaje contextual según el resultado
    setMensajeCarrito(null)
    const resultado = await agregarProducto(id, 1)
    if (!resultado.exito && resultado.error) {
      setMensajeCarrito(resultado.error)
    } else {
      setMensajeCarrito("Producto añadido al carrito")
    }
  }

  const hayResultados = productos.length > 0

  const categoriasConOpcion = useMemo(() => [{ id: -1, nombre: "Todas las categorías" }, ...categorias], [categorias])

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Encabezado con controles de vista y botón para mostrar filtros en móvil */}
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-wider text-muted-foreground">Catálogo</p>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-display text-3xl lg:text-4xl font-bold">Catálogo de productos</h1>
              <p className="text-muted-foreground">Explora los productos disponibles en nuestra tienda</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setMostrarFiltros((prev) => !prev)} className="md:hidden">
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
              <div className="flex border rounded-md">
                <Button
                  variant={vistaGrid ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setVistaGrid(true)}
                  className="rounded-r-none"
                  aria-label="Vista en cuadrícula"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={!vistaGrid ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setVistaGrid(false)}
                  className="rounded-l-none"
                  aria-label="Vista en lista"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          {mensajeCarrito && (
            <Alert>
              <AlertDescription>{mensajeCarrito}</AlertDescription>
            </Alert>
          )}
        </header>

        {/* Layout de filtros laterales + listado principal */}
        <section className="flex flex-col lg:flex-row gap-8">
          {/* Filtros y controles: búsqueda, categoría y rango de precio */}
          <aside className={cn("lg:w-72 space-y-6", mostrarFiltros ? "block" : "hidden lg:block")}> 
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar productos"
                      value={filtros.busqueda}
                      onChange={(event) => handleBusqueda(event.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Categoría</label>
                  <Select value={filtros.categoriaId?.toString() ?? "all"} onValueChange={handleCategoria}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriasConOpcion.map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.id === -1 ? "all" : categoria.id.toString()}>
                          {categoria.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-4">
                  <label className="text-sm font-medium text-muted-foreground">Rango de precio</label>
                  <Slider
                    value={[filtros.precioMin, filtros.precioMax]}
                    onValueChange={handleRangoPrecio}
                    max={PRECIO_MAXIMO}
                    step={100}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatearPrecio(filtros.precioMin)}</span>
                    <span>{formatearPrecio(filtros.precioMax)}</span>
                  </div>
                </div>

                <Button variant="ghost" onClick={restablecerFiltros}>
                  Restablecer filtros
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* Listado de productos con orden y paginación */}
          <section className="flex-1 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                {cargando ? "Cargando productos..." : hayResultados ? `${paginacion?.total ?? productos.length} productos encontrados` : "Sin resultados"}
              </div>
              <div className="flex items-center gap-3">
                <Select value={filtros.ordenar} onValueChange={(valor: OrdenSeleccion) => handleOrden(valor)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recientes">Más recientes</SelectItem>
                    <SelectItem value="precio-asc">Precio: menor a mayor</SelectItem>
                    <SelectItem value="precio-desc">Precio: mayor a menor</SelectItem>
                    <SelectItem value="nombre">Nombre A-Z</SelectItem>
                    <SelectItem value="stock">Mayor stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {cargando ? (
              <ListadoSkeleton vistaGrid={vistaGrid} />
            ) : hayResultados ? (
              <ListadoProductos
                productos={productos}
                vistaGrid={vistaGrid}
                onAgregar={aplicarAgregar}
                formatearPrecio={formatearPrecio}
                esFavorito={esFavorito}
                toggleFavorito={(producto) => {
                  const yaFav = esFavorito(producto.id)
                  toggleFavorito(producto)
                  showToast(
                    yaFav ? "Producto eliminado de favoritos" : "Producto añadido a favoritos",
                    yaFav ? "info" : "success",
                  )
                }}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center space-y-3">
                  <p className="text-lg font-semibold">No encontramos productos con los filtros seleccionados</p>
                  <p className="text-muted-foreground">Prueba con otra combinación o restablece los filtros</p>
                  <Button variant="outline" onClick={() => setFiltros({ categoriaId: undefined, precioMin: 0, precioMax: 1000, busqueda: "", ordenar: "recientes", page: 1 })}>
                    Restablecer filtros
                  </Button>
                </CardContent>
              </Card>
            )}

            {paginacion && paginacion.totalPages > 1 && (
              <div className="flex items-center justify-between border-t pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePagina("prev")}
                  disabled={!paginacion.hasPrevPage}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {paginacion.page} de {paginacion.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePagina("next")}
                  disabled={!paginacion.hasNextPage}
                >
                  Siguiente <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  )
}

// Renderizo el listado de productos adaptando la presentación a grid o lista con acciones rápidas
function ListadoProductos({
  productos,
  vistaGrid,
  onAgregar,
  formatearPrecio,
  esFavorito,
  toggleFavorito,
}: {
  productos: ProductoResumen[]
  vistaGrid: boolean
  onAgregar: (productoId: number) => Promise<void>
  formatearPrecio: (precio: number) => string
  esFavorito: (id: number) => boolean
  toggleFavorito: (producto: ProductoResumen) => void
}) {
  if (vistaGrid) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {productos.map((producto) => (
          <Card key={producto.id} className="group h-full">
            <CardContent className="p-0 flex flex-col h-full">
              <div className="aspect-square bg-muted rounded-t-lg overflow-hidden relative">
                <img
                  src={producto.imagenUrl || "/producto-placeholder.svg"}
                  alt={producto.nombre}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className={`absolute top-2 right-2 bg-white/80 hover:bg-white ${esFavorito(producto.id) ? "text-red-500" : "text-muted-foreground"}`}
                  onClick={() => toggleFavorito(producto)}
                >
                  <Heart className="h-5 w-5" fill={esFavorito(producto.id) ? "currentColor" : "transparent"} />
                </Button>
              </div>
              <div className="p-4 flex flex-col gap-3 flex-1">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    {producto.categoria && <Badge variant="outline">{producto.categoria.nombre}</Badge>}
                    {producto.subcategoria && <span>{producto.subcategoria.nombre}</span>}
                  </div>
                  <Link to={`/productos/${producto.id}`} className="block font-semibold text-lg leading-tight">
                    {producto.nombre}
                  </Link>
                  {producto.descripcion && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{producto.descripcion}</p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-semibold">{formatearPrecio(producto.precio)}</span>
                    {producto.stock <= 5 && <Badge variant="destructive">Stock limitado</Badge>}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onAgregar(producto.id)}
                    disabled={producto.stock <= 0}
                    className="shrink-0"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Agregar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {productos.map((producto) => (
        <Card key={producto.id} className="overflow-hidden">
          <CardContent className="p-0 flex flex-col sm:flex-row">
            <div className="w-full sm:w-56 h-56 bg-muted relative">
              <img
                src={producto.imagenUrl || "/producto-placeholder.svg"}
                alt={producto.nombre}
                className="h-full w-full object-cover"
              />
              <Button
                variant="ghost"
                size="icon"
                className={`absolute top-2 right-2 bg-white/80 hover:bg-white ${esFavorito(producto.id) ? "text-red-500" : "text-muted-foreground"}`}
                onClick={() => toggleFavorito(producto)}
              >
                <Heart className="h-5 w-5" fill={esFavorito(producto.id) ? "currentColor" : "transparent"} />
              </Button>
            </div>
            <div className="flex-1 p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {producto.categoria && <Badge variant="outline">{producto.categoria.nombre}</Badge>}
                    {producto.subcategoria && <span>{producto.subcategoria.nombre}</span>}
                    <span>Stock: {producto.stock}</span>
                  </div>
                  <h3 className="text-xl font-semibold leading-tight">{producto.nombre}</h3>
                  {producto.descripcion && (
                    <p className="text-muted-foreground mt-2 max-w-2xl">{producto.descripcion}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold">{formatearPrecio(producto.precio)}</p>
                  <p className="text-sm text-muted-foreground">Actualizado {new Date(producto.actualizadoEn ?? producto.creadoEn ?? Date.now()).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline">
                  <Link to={`/productos/${producto.id}`}>Ver detalle</Link>
                </Button>
                <Button onClick={() => onAgregar(producto.id)} disabled={producto.stock <= 0}>
                  <ShoppingCart className="mr-2 h-4 w-4" /> Añadir al carrito
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Presento esqueletos de carga acordes a la vista seleccionada para mantener el layout estable
function ListadoSkeleton({ vistaGrid }: { vistaGrid: boolean }) {
  if (vistaGrid) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-0">
              <Skeleton className="aspect-square w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="p-0 flex flex-col sm:flex-row">
            <Skeleton className="w-full sm:w-56 h-56" />
            <div className="flex-1 p-6 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-10 w-48" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
