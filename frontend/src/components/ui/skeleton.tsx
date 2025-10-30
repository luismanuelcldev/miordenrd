import { cn } from "@/lib/utils"

// Pinto un placeholder animado para estados de carga
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />
}

