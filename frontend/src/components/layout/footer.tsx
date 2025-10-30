import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react"

// Renderizo el pie de página con enlaces, contacto y suscripción al boletín
export function Footer() {
  return (
    <footer className="border-t bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="flex flex-col items-center text-center lg:flex-row lg:items-center lg:justify-between lg:text-left gap-6">
          {/* Información de la empresa */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2b62e1]/10">
              <img src="/images/shopping.png" alt="MiOrdenRD" className="h-8 w-8" />
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-slate-800 tracking-tight">MiOrdenRD</p>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Entregamos productos confiables en todo el país con un servicio al cliente cercano y oportuno.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground sm:flex-row">
            <div className="flex -space-x-2">
              <Button variant="ghost" size="icon" aria-label="Facebook">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Twitter">
                <Twitter className="h-4 w-4" />
              </Button>
            </div>
            <span className="max-w-sm">
              Síguenos y mantente al día.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Información de la empresa extendida */}
          <div className="space-y-4 text-center md:text-left">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500">Sobre nosotros</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Somos la plataforma ideal para gestionar pedidos y entregas en República Dominicana, conectando comercios,
              clientes y repartidores en un mismo sistema.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Mail className="h-4 w-4" /> contacto@miordenrd.com
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Phone className="h-4 w-4" /> +1 (829) 727-3392
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <MapPin className="h-4 w-4" /> Santo Domingo, República Dominicana
              </div>
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div className="space-y-4 text-center md:text-left">
            <h3 className="font-semibold text-sm uppercase tracking-wider">Enlaces Rápidos</h3>
            <nav className="flex flex-col items-center space-y-2 md:items-start">
              <Link to="/productos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Productos
              </Link>
              <Link
                to="/categorias"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Categorías
              </Link>
              <Link to="/ofertas" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Ofertas
              </Link>
              <Link to="/cuenta" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Mi Cuenta
              </Link>
            </nav>
          </div>

          {/* Atención al cliente */}
          <div className="space-y-4 text-center md:text-left">
            <h3 className="font-semibold text-sm uppercase tracking-wider">Atención al Cliente</h3>
            <nav className="flex flex-col items-center space-y-2 md:items-start">
              <Link to="/ayuda" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Centro de Ayuda
              </Link>
              <Link to="/envios" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Información de Envíos
              </Link>
              <Link
                to="/devoluciones"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Devoluciones
              </Link>
              <Link to="/terminos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Términos y Condiciones
              </Link>
            </nav>
          </div>

          {/* Newsletter */}
          <div className="space-y-4 text-center md:text-left">
            <h3 className="font-semibold text-sm uppercase tracking-wider">Mantente Informado</h3>
            <p className="text-sm text-muted-foreground">
              Recibe las últimas ofertas y novedades directamente en tu correo.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-start">
              <Input type="email" placeholder="Tu email" className="flex-1 min-w-[220px]" />
              <Button size="sm" className="sm:w-auto">
                Suscribirse
              </Button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t pt-6 text-center text-muted-foreground text-sm">
          <p className="text-sm text-muted-foreground">© 2025 MiOrdenRD. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
