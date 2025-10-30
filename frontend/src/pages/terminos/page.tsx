// Presento los términos y condiciones como placeholder legal con navegación de regreso
"use client"

import { Placeholder } from "@/components/Placeholder"

export default function TerminosPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Placeholder
        titulo="Términos y condiciones"
        descripcion="El documento legal definitivo se encuentra en preparación. "
        cta={{ etiqueta: "Regresar al inicio", href: "/" }}
      />
    </div>
  )
}
