// Presento información de envíos como placeholder mientras definimos políticas y tiempos
"use client"

import { Placeholder } from "@/components/Placeholder"

export default function EnviosPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Placeholder
        titulo="Información de envíos"
        descripcion="Estamos definiendo las políticas de envío, tiempos de entrega y aliados logísticos. Publicaremos todos los detalles en breve."
        cta={{ etiqueta: "Ver carrito", href: "/carrito" }}
      />
    </div>
  )
}
