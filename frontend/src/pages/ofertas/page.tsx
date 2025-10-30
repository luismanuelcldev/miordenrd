// Listo las ofertas vigentes, cargo datos y permito añadir productos al carrito con feedback
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { productService } from "@/services/productService"
import type { ProductoResumen } from "@/types/producto"
import { useToast } from "@/components/ui/toastContext"
import { Link } from "react-router-dom"
import { Loader2, ShoppingCart } from "lucide-react"
import { useCart } from "@/lib/cart"
import { useAuth } from "@/lib/auth"
import { formatCurrency } from "@/utils/currency"

export default function OfertasPage() {
  const [ofertas, setOfertas] = useState<ProductoResumen[]>([])
  const [cargando, setCargando] = useState(true)
  const { showToast } = useToast()
  const { agregarProducto } = useCart()
  const { usuario } = useAuth()

  // Cargo los productos en oferta al montar el componente y manejo estados de carga y error
  useEffect(() => {
    let activo = true
    const cargar = async () => {
      setCargando(true)
      try {
        const { productos } = await productService.listarProductos({ enOferta: true, limit: 50 })
        if (activo) setOfertas(productos)
      } catch (error) {
        console.error(error)
        if (activo) showToast("No fue posible cargar las ofertas disponibles", "error")
      } finally {
        if (activo) setCargando(false)
      }
    }
    void cargar()
    return () => {
      activo = false
    }
  }, [showToast])

  // Agrego el producto al carrito y notifico el resultado al usuario
  const handleAgregar = async (producto: ProductoResumen) => {
    const resultado = await agregarProducto(producto.id, 1)
    if (resultado.exito) {
      showToast("Producto agregado al carrito", "success")
    } else if (resultado.error) {
      showToast(resultado.error, "error")
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Encabezado de la sección de ofertas con acción para administradores */}
      <header className="text-center space-y-4">
        <h1 className="font-display text-3xl lg:text-4xl font-bold">Ofertas especiales</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Descubre los productos seleccionados con descuentos exclusivos. El administrador puede activar o desactivar
          ofertas desde el panel de productos.
        </p>
        {usuario?.rol === "ADMINISTRADOR" && (
          <Button asChild variant="outline">
            <Link to="/admin/productos">Gestionar ofertas</Link>
          </Button>
        )}
      </header>

      {/* Condicional: loading, estado vacío o grid de ofertas */}
      {cargando ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : ofertas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-lg font-semibold">No hay ofertas activas en este momento</p>
            <p className="text-muted-foreground">
              Vuelve pronto o explora el catálogo completo para encontrar más productos.
            </p>
            <Button asChild>
              <Link to="/productos">Ir al catálogo</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ofertas.map((producto) => (
            <Card key={producto.id} className="h-full">
              <CardContent className="p-0">
                <div className="aspect-video bg-muted overflow-hidden">
                  <img
                    src={producto.imagenUrl ?? "/producto-placeholder.svg"}
                    alt={producto.nombre}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold">{producto.nombre}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{producto.descripcion}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(producto.precioOferta ?? producto.precio)}
                    </span>
                    <span className="text-sm text-muted-foreground line-through">
                      {formatCurrency(producto.precio)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button variant="outline" asChild>
                      <Link to={`/productos/${producto.id}`}>Ver detalle</Link>
                    </Button>
                    <Button size="sm" onClick={() => handleAgregar(producto)} disabled={producto.stock <= 0}>
                      <ShoppingCart className="h-4 w-4 mr-2" /> Añadir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
