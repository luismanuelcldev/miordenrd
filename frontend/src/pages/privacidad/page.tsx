// Presento el aviso de privacidad como contenido provisional con un llamado a acción contextual
"use client"

import { Placeholder } from "@/components/Placeholder"

export default function PrivacidadPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Placeholder
        titulo="Aviso de privacidad"
        descripcion="Estamos redactando nuestra politica de privacidad para detallar cómo protegemos tus datos personales."
        cta={{ etiqueta: "Volver al registro", href: "/registro" }}
      />
    </div>
  )
}
