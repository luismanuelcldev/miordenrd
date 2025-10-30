// Presento la política de devoluciones como placeholder informativo con CTA hacia el catálogo
"use client"

import { Placeholder } from "@/components/Placeholder"

export default function DevolucionesPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Placeholder
        titulo="Política de devoluciones"
        descripcion="Estamos preparando un proceso sencillo y transparente para devoluciones y cambios. Publicaremos la política completa muy pronto."
        cta={{ etiqueta: "Explorar productos", href: "/productos" }}
      />
    </div>
  )
}
