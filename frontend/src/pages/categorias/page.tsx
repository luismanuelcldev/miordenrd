"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Loader2 } from "lucide-react"
import { Link } from "react-router-dom"
import { categoryService, type Categoria } from "@/services/categoryService"
import { useToast } from "@/components/ui/toastContext"

// Listo categorías desde API y presento cards con CTA hacia productos
export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [cargando, setCargando] = useState(true)
  const { showToast } = useToast()

  // Cargo categorías al montar y manejo estados de carga/errores
  useEffect(() => {
    let activo = true
    const cargar = async () => {
      setCargando(true)
      try {
        const data = await categoryService.listarCategorias()
        if (activo) setCategorias(data)
      } catch (error) {
        console.error(error)
        if (activo) showToast("No fue posible cargar las categorías", "error")
      } finally {
        if (activo) setCargando(false)
      }
    }
    void cargar()
    return () => {
      activo = false
    }
  }, [showToast])

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Encabezado de la página de categorías */}
      <div className="text-center mb-12">
        <h1 className="font-display text-3xl lg:text-4xl font-bold mb-4">Nuestras Categorías</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Explora nuestra amplia gama de productos organizados por categorías para encontrar exactamente lo que
          necesitas.
        </p>
      </div>

      {/* Estado de carga, vacío o grilla de categorías */}
      {cargando ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : categorias.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-lg font-semibold">Aún no hay categorías disponibles</p>
            <p className="text-muted-foreground">Cuando el administrador cree nuevas categorías aparecerán aquí.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categorias.map((categoria) => (
            <Card key={categoria.id} className="group cursor-pointer hover:shadow-lg transition-shadow overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-video bg-muted overflow-hidden">
                  <img
                    src={categoria.imagenUrl || "/categoria-placeholder.svg"}
                    alt={categoria.nombre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="font-display text-xl font-semibold mb-2">{categoria.nombre}</h3>
                    <p className="text-muted-foreground">{categoria.descripcion ?? ""}</p>
                  </div>
                  <Button asChild className="w-full group">
                    <Link to={`/productos?categoria=${categoria.id}`}>
                      Explorar Categoría
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* CTA final para contactar en caso de no encontrar una categoría */}
      <div className="text-center mt-16 py-12 bg-muted/30 rounded-2xl">
        <h2 className="font-display text-2xl font-bold mb-4">¿No encuentras lo que buscas?</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Contáctanos y te ayudaremos a encontrar el producto perfecto para ti.
        </p>
        <Button size="lg" asChild>
          <Link to="/contacto">Contactar</Link>
        </Button>
      </div>
    </main>
  )
}
