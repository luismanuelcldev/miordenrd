interface PlaceholderProps {
  titulo: string
  descripcion: string
  cta?: {
    etiqueta: string
    href: string
  }
}

import { Link } from "react-router-dom"

// Muestro un placeholder genérico con título, descripción y un CTA opcional
export function Placeholder({ titulo, descripcion, cta }: PlaceholderProps) {
  return (
    <section className="max-w-3xl mx-auto text-center space-y-6 py-16">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold">{titulo}</h1>
        <p className="text-muted-foreground">{descripcion}</p>
      </div>
      {cta && (
        <Link
          to={cta.href}
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          {cta.etiqueta}
        </Link>
      )}
    </section>
  )
}
