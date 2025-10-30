"use client"

import { Placeholder } from "@/components/Placeholder"

// Presento el centro de ayuda con un placeholder navegable a contacto
export default function AyudaPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Placeholder
        titulo="Centro de ayuda"
        descripcion="Muy pronto encontrarás preguntas frecuentes, guías y soporte en tiempo real para que tu experiencia sea impecable."
        cta={{ etiqueta: "Necesito asistencia", href: "/contacto" }}
      />
    </div>
  )
}
