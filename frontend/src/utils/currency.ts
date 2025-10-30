const currencyFormatter = new Intl.NumberFormat("es-DO", {
  style: "currency",
  currency: "DOP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

// Formateo montos a DOP en español de RD, sin decimales por defecto
export function formatCurrency(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) {
    return "RD$ 0"
  }
  return currencyFormatter.format(valor)
}
