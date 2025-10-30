import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  text?: string
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
}

// Muestro un spinner configurable y, opcionalmente, un texto de estado
export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size], className)} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  )
}

interface PageLoadingProps {
  text?: string
}

// Ocupo el espacio de la página mostrando un estado de carga prominente
export function PageLoading({ text = "Cargando..." }: PageLoadingProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}

interface InlineLoadingProps {
  text?: string
}

// Inserto un indicador de carga compacto en línea con contenido
export function InlineLoading({ text }: InlineLoadingProps) {
  return (
    <div className="flex items-center gap-2 py-2">
      <LoadingSpinner size="sm" />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  )
}
