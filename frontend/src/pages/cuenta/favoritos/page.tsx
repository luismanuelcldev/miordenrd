// Listo favoritos del usuario y permito añadir al carrito o eliminar de la lista
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, ShoppingCart, Trash2 } from "lucide-react"
import { useCart } from "@/lib/cart"
import { useFavorites } from "@/lib/favorites"
import { Link } from "react-router-dom"

export default function MisFavoritos() {
  const { agregarProducto } = useCart()
  const { favoritos, eliminarFavorito, estaCargando } = useFavorites()

  // Agrego al carrito y luego remuevo de favoritos para simplificar el flujo
  const agregarYQuitar = async (productoId: number) => {
    await agregarProducto(productoId, 1)
    eliminarFavorito(productoId)
  }

  if (estaCargando) {
    // Muestro un estado de carga simple mientras obtengo favoritos
    return <p className="text-muted-foreground">Cargando favoritos...</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mis Favoritos</h1>
        <p className="text-muted-foreground">Productos que guardaste para revisar más tarde.</p>
      </div>

      {/* Muestro tarjetas de productos favoritos o un estado vacío si no hay */}
      {favoritos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoritos.map((producto) => (
            <Card key={producto.id} className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="relative">
                  <Link to={`/productos/${producto.id}`}>
                    <img
                      src={producto.imagenUrl || "/producto-placeholder.svg"}
                      alt={producto.nombre}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white text-red-500"
                    onClick={() => eliminarFavorito(producto.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    {producto.categoria?.nombre && (
                      <Badge variant="outline" className="mb-2">
                        {producto.categoria.nombre}
                      </Badge>
                    )}
                    <Link to={`/productos/${producto.id}`}>
                      <h3 className="font-semibold text-lg hover:text-primary transition-colors">{producto.nombre}</h3>
                    </Link>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">RD${producto.precio.toFixed(2)}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => agregarYQuitar(producto.id)}>
                        <ShoppingCart className="h-4 w-4 mr-2" /> Añadir al carrito
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes favoritos guardados</h3>
            <p className="text-muted-foreground mb-4">
              Explora nuestro catálogo y guarda los productos que más te gusten.
            </p>
            <Button asChild>
              <Link to="/productos">Explorar productos</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
