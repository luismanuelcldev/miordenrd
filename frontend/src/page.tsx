import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Truck, Shield, CreditCard, Headphones, ShoppingCart, Loader2, Heart } from "lucide-react"
import { Link } from "react-router-dom"
import { productService } from "@/services/productService"
import type { ProductoResumen } from "@/types/producto"
import { useCart } from "@/lib/cart"
import { useFavorites } from "@/lib/favorites"
import { useToast } from "@/components/ui/toastContext"
import { useAuth } from "@/lib/auth"
import { formatCurrency } from "@/utils/currency"

// Pinto la página de inicio y cargo productos destacados al montar el componente
export default function HomePage() {
  // Mantengo el listado de destacados y el estado de carga para la UI
  const [destacados, setDestacados] = useState<ProductoResumen[]>([])
  const [cargandoDestacados, setCargandoDestacados] = useState(true)
  const { agregarProducto } = useCart()
  const { showToast } = useToast()
  const { usuario } = useAuth()
  const { esFavorito, toggleFavorito } = useFavorites()

  // Al montar, solicito los destacados y gestiono cancelación para evitar updates tras unmount
  useEffect(() => {
    let activo = true
    const cargarDestacados = async () => {
      setCargandoDestacados(true)
      try {
        const { productos } = await productService.listarProductos({ limit: 8 })
        if (activo) setDestacados(productos)
      } catch (error) {
        console.error(error)
      } finally {
        if (activo) setCargandoDestacados(false)
      }
    }
    void cargarDestacados()
    return () => {
      activo = false
    }
  }, [])

  // Agrego un producto al carrito y muestro un toast según el resultado
  const handleAgregar = async (producto: ProductoResumen) => {
    const resultado = await agregarProducto(producto.id, 1)
    if (resultado.exito) {
      showToast("Producto agregado al carrito", "success")
    } else if (resultado.error) {
      showToast(resultado.error, "error")
    }
  }

  return (
    <main>
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-100 py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="w-fit bg-blue-500 hover:bg-blue-600 text-white">Compra local, compra seguro</Badge>
                <h1 className="font-display text-4xl lg:text-6xl font-bold text-balance bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Encuentra los mejores productos para tu hogar y mucho mas
                </h1>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Descubre nuestro catálogo de productos.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/productos">
                  <Button size="lg" className="group bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/50">
                    Explorar productos
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/ofertas">
                  <Button variant="outline" size="lg" className="border-blue-500 text-blue-600 hover:bg-blue-50">
                    Ver ofertas
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                <img src="public/images/Image-Login-Register.PNG" alt="Producto destacado" className="w-3/4 h-3/4 object-contain" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Caracteristica icono={<Truck className="h-8 w-8 text-white" />} titulo="Envío rápido" descripcion="Recibe tus pedidos entre 2 y 4 días" />
            <Caracteristica icono={<Shield className="h-8 w-8 text-white" />} titulo="Compra segura" descripcion="Protección total en tus pagos" />
            <Caracteristica icono={<CreditCard className="h-8 w-8 text-white" />} titulo="Pagos flexibles" descripcion="Tarjeta, transferencia o contra entrega" />
            <Caracteristica icono={<Headphones className="h-8 w-8 text-white" />} titulo="Soporte 24/7" descripcion="Atención personalizada siempre" />
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-b from-blue-50/50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <h2 className="font-display text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Productos destacados
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Agregados por el administrador. Los clientes pueden ver aquí los productos más recientes del catálogo.
            </p>
          </div>

          {cargandoDestacados ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : destacados.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center space-y-3">
                <p className="text-lg font-semibold">Todavía no hay productos publicados</p>
                <p className="text-muted-foreground">
                  Cuando el administrador agregue productos, aparecerán automáticamente en esta sección.
                </p>
                {usuario?.rol === "ADMINISTRADOR" && (
                  <Button asChild>
                    <Link to="/admin/productos">Ir al panel de administración</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {destacados.slice(0, 4).map((producto) => (
                <Card key={producto.id} className="group h-full">
                  <CardContent className="p-0 flex flex-col h-full">
                    <div className="aspect-square bg-muted rounded-t-lg overflow-hidden relative">
                      <img
                        src={producto.imagenUrl ?? "/producto-placeholder.svg"}
                        alt={producto.nombre}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`absolute top-2 right-2 bg-white/80 hover:bg-white ${esFavorito(producto.id) ? "text-red-500" : "text-muted-foreground"}`}
                        onClick={() => {
                          const yaFav = esFavorito(producto.id)
                          toggleFavorito(producto)
                          showToast(
                            yaFav ? "Producto eliminado de favoritos" : "Producto añadido a favoritos",
                            yaFav ? "info" : "success",
                          )
                        }}
                      >
                        <Heart className="h-5 w-5" fill={esFavorito(producto.id) ? "currentColor" : "transparent"} />
                      </Button>
                    </div>
                    <div className="p-4 flex flex-col gap-3 flex-1">
                      <div className="space-y-1">
                        {producto.enOferta && <Badge variant="destructive">Oferta</Badge>}
                        <Link to={`/productos/${producto.id}`} className="block font-semibold text-lg leading-tight">
                          {producto.nombre}
                        </Link>
                        {producto.descripcion && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{producto.descripcion}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-xl font-semibold text-primary">
                          {formatCurrency(producto.precioOferta ?? producto.precio)}
                        </span>
                        <Button size="sm" onClick={() => handleAgregar(producto)} disabled={producto.stock <= 0}>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Agregar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

// Renderizo una tarjeta de característica reutilizable para la sección informativa
function Caracteristica({ icono, titulo, descripcion }: { icono: React.ReactNode; titulo: string; descripcion: string }) {
  return (
    <div className="text-center space-y-4 p-6 rounded-xl hover:bg-blue-50 transition-colors">
      <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
        {icono}
      </div>
      <h3 className="font-bold text-slate-800">{titulo}</h3>
      <p className="text-sm text-slate-600">{descripcion}</p>
    </div>
  )
}
