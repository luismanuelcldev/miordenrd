import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Combino clases condicionales y resuelvo conflictos de Tailwind en una sola utilidad
export function cn(...clases: ClassValue[]) {
  return twMerge(clsx(clases))
}
