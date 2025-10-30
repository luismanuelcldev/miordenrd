// Muestro el detalle de producto, cargo relacionados por categoría y habilito compra y favoritos
"use client"

import { useState, useEffect } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { productService } from "@/services/productService"
import type { ProductoDetalle, ProductoResumen } from "@/types/producto"
import { useCart } from "@/lib/cart"
import { ShoppingCart, Heart, Minus, Plus, Truck, Shield, RotateCcw, Loader2 } from "lucide-react"
import { useFavorites } from "@/lib/favorites"
import { useToast } from "@/components/ui/toastContext"
import { formatCurrency } from "@/utils/currency"

export default function ProductoDetallePage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const [producto, setProducto] = useState<ProductoDetalle | null>(null)
  const [relacionados, setRelacionados] = useState<ProductoResumen[]>([])
  const [cantidad, setCantidad] = useState(1)
  const [cargando, setCargando] = useState(true)
  const { agregarProducto } = useCart()
  const { showToast } = useToast()
  const { esFavorito, toggleFavorito } = useFavorites()

  // Cargo el producto por id y, si es posible, también productos relacionados de la misma categoría
  useEffect(() => {
    if (!id) return
    let activo = true

    const cargarProducto = async () => {
      setCargando(true)
      try {
        const detalle = await productService.obtenerProducto(Number(id))
        if (!activo) return
        setProducto(detalle)
        if (detalle.categoria) {
          const { productos } = await productService.listarProductos({
            categoriaId: detalle.categoria.id,
            limit: 6,
          })
          if (!activo) return
          setRelacionados(productos.filter((item) => item.id !== detalle.id))
        } else {
          setRelacionados([])
        }
      } catch (error) {
        console.error(error)
        if (activo) showToast("No fue posible cargar la información del producto", "error")
      } finally {
        if (activo) setCargando(false)
      }
    }

    void cargarProducto()

    return () => {
      activo = false
    }
  }, [id, showToast])

  // Agrego la cantidad seleccionada al carrito y notifico el resultado
  const handleAgregarCarrito = async () => {
    if (!producto) return
    const resultado = await agregarProducto(producto.id, cantidad)
    if (resultado.exito) {
      showToast("Producto agregado al carrito", "success")
    } else if (resultado.error) {
      showToast(resultado.error, "error")
    }
  }

  // Alterno el estado de favorito y comunico el cambio con un toast informativo
  const manejarFavorito = () => {
    if (!producto) return
    const yaFav = esFavorito(producto.id)
    toggleFavorito(producto)
    showToast(
      yaFav ? "Producto eliminado de favoritos" : "Producto añadido a favoritos",
      yaFav ? "info" : "success",
    )
  }

  if (cargando) {
    return (
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Cargando información del producto...</p>
      </main>
    )
  }

  if (!producto) {
    const categoriaId = searchParams.get("categoria")
    return (
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center space-y-4">
        <h1 className="text-2xl font-bold">Producto no encontrado</h1>
        <p className="text-muted-foreground">Es posible que el producto haya sido retirado del catálogo.</p>
        <div className="flex justify-center gap-3">
          <Button asChild>
            <Link to="/productos">Volver al catálogo</Link>
          </Button>
          {categoriaId && (
            <Button variant="outline" asChild>
              <Link to={`/productos?categoria=${categoriaId}`}>Ver categoría</Link>
            </Button>
          )}
        </div>
      </main>
    )
  }

  const imagenPrincipal = producto.imagenUrl ?? "/producto-placeholder.svg"

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumb de navegación contextual */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Inicio
        </Link>
        <span>/</span>
        <Link to="/productos" className="hover:text-foreground">
          Productos
        </Link>
        {producto.categoria && (
          <>
            <span>/</span>
            <Link to={`/productos?categoria=${producto.categoria.id}`} className="hover:text-foreground">
              {producto.categoria.nombre}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground">{producto.nombre}</span>
      </nav>

      {/* Layout principal: imagen a la izquierda, información y acciones a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-4">
          <div className="aspect-square bg-muted rounded-xl overflow-hidden relative">
            <img src={imagenPrincipal} alt={producto.nombre} className="w-full h-full object-cover" />
            <Button
              variant="ghost"
              size="icon"
              className={`absolute top-3 right-3 bg-white/80 hover:bg-white ${esFavorito(producto.id) ? "text-red-500" : "text-muted-foreground"}`}
              onClick={manejarFavorito}
            >
              <Heart className="h-6 w-6" fill={esFavorito(producto.id) ? "currentColor" : "transparent"} />
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Título, etiquetas y precios */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              {producto.enOferta && <Badge variant="destructive">Oferta</Badge>}
              {producto.categoria && <Badge variant="secondary">{producto.categoria.nombre}</Badge>}
            </div>
            <h1 className="font-display text-3xl font-bold mb-4">{producto.nombre}</h1>
            <div className="flex items-center gap-4 mb-6">
              <span className="font-display text-3xl font-bold text-primary">
                {formatCurrency(producto.precioOferta ?? producto.precio)}
              </span>
              {producto.precioOferta != null && (
                <span className="text-xl text-muted-foreground line-through">
                  {formatCurrency(producto.precio)}
                </span>
              )}
            </div>
            {producto.descripcion && <p className="text-muted-foreground leading-relaxed">{producto.descripcion}</p>}
          </div>

          {/* Selector de cantidad y acciones de compra/favorito */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="font-medium">Cantidad:</span>
              <div className="flex items-center border rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                  disabled={cantidad <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="px-4 py-2 min-w-[3rem] text-center">{cantidad}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCantidad(Math.min(producto.stock ?? cantidad + 1, cantidad + 1))}
                  disabled={producto.stock !== undefined && cantidad >= producto.stock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {producto.stock !== undefined && (
                <span className="text-sm text-muted-foreground">{producto.stock} disponibles</span>
              )}
            </div>

            <div className="flex gap-4">
              <Button size="lg" className="flex-1" onClick={handleAgregarCarrito}>
                <ShoppingCart className="h-5 w-5 mr-2" />
                Agregar al carrito
              </Button>
              <Button variant="outline" size="lg">
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            <Button variant="outline" size="lg" className="w-full" asChild>
              <Link to="/checkout">Comprar ahora</Link>
            </Button>
          </div>

          {/* Beneficios destacados */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Envío rápido</p>
                <p className="text-xs text-muted-foreground">Recíbelo entre 2 y 4 días hábiles</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Compra segura</p>
                <p className="text-xs text-muted-foreground">Protegido con certificados SSL</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <RotateCcw className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Devoluciones fáciles</p>
                <p className="text-xs text-muted-foreground">Hasta 30 días después de tu compra</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs de descripción y políticas de envío/devolución */}
      <Tabs defaultValue="descripcion" className="space-y-6">
        <TabsList>
          <TabsTrigger value="descripcion">Descripción</TabsTrigger>
          <TabsTrigger value="envio">Envío y devoluciones</TabsTrigger>
        </TabsList>
        <TabsContent value="descripcion" className="text-muted-foreground leading-relaxed">
          {producto.descripcion || "El administrador aún no ha agregado una descripción detallada."}
        </TabsContent>
        <TabsContent value="envio" className="space-y-4 text-muted-foreground">
          <p>Envio gratuito en pedidos superiores a RD$ 2,000. También puedes recoger tus pedidos en tienda.</p>
          <p>Si no estás satisfecho con tu compra, puedes devolverla dentro de los 30 días posteriores a la entrega.</p>
        </TabsContent>
      </Tabs>

      {/* Sugerencias de productos relacionados */}
      {relacionados.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">También te puede interesar</h2>
            <Button variant="link" asChild>
              <Link to="/productos">Ver todos</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relacionados.slice(0, 3).map((relacionado) => (
              <Card key={relacionado.id} className="h-full">
                <CardContent className="p-0">
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img
                      src={relacionado.imagenUrl ?? "/producto-placeholder.svg"}
                      alt={relacionado.nombre}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-lg leading-tight">{relacionado.nombre}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{relacionado.descripcion}</p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="font-bold text-primary">
                        {formatCurrency(relacionado.precioOferta ?? relacionado.precio)}
                      </span>
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/productos/${relacionado.id}`}>Ver</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
