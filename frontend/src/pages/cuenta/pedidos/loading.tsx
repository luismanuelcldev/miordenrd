// Muestro un indicador de carga específico para la sección de pedidos de la cuenta
import { PageLoading } from "@/components/ui/loading-spinner"

export default function Loading() {
  return <PageLoading text="Cargando tus pedidos..." />
}