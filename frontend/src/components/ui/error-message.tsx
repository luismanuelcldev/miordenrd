import { AlertCircle, AlertTriangle, XCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ErrorMessageProps {
  title?: string
  message: string
  variant?: "error" | "warning" | "info"
  onRetry?: () => void
  retryText?: string
  className?: string
}

// Centralizo iconos y estilos por variante para reutilizarlos en mensajes
const variantConfig = {
  error: {
    icon: XCircle,
    className: "border-red-500/50 text-red-900 bg-red-50 dark:border-red-500 dark:text-red-200 dark:bg-red-950/50",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-yellow-500/50 text-yellow-900 bg-yellow-50 dark:border-yellow-500 dark:text-yellow-200 dark:bg-yellow-950/50",
  },
  info: {
    icon: AlertCircle,
    className: "border-blue-500/50 text-blue-900 bg-blue-50 dark:border-blue-500 dark:text-blue-200 dark:bg-blue-950/50",
  },
}

// Muestro un bloque de alerta con icono, título opcional y botón de reintento
export function ErrorMessage({
  title = "Error",
  message,
  variant = "error",
  onRetry,
  retryText = "Reintentar",
  className,
}: ErrorMessageProps) {
  const { icon: Icon, className: variantClassName } = variantConfig[variant]

  return (
    <Alert className={cn(variantClassName, className)}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        <p>{message}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm" className="mt-3">
            {retryText}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

interface PageErrorProps {
  title?: string
  message: string
  onRetry?: () => void
}

// En páginas, centro el mensaje de error con un ancho máximo legible
export function PageError({ title = "Error al cargar los datos", message, onRetry }: PageErrorProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ErrorMessage title={title} message={message} onRetry={onRetry} />
      </div>
    </div>
  )
}

interface InlineErrorProps {
  message: string
}

// Renderizo un mensaje de error compacto para contextos inline (formularios, celdas)
export function InlineError({ message }: InlineErrorProps) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
