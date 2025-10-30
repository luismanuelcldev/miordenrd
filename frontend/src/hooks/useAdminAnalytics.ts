import { useEffect, useMemo, useState } from "react"
import { orderService } from "@/services/orderService"
import { productService } from "@/services/productService"
import { userService } from "@/services/userService"
import type { UsuarioAdministrador } from "@/services/userService"
import type { ProductoResumen } from "@/types/producto"
import type { PedidoListado } from "@/types/pedido"
import { useToast } from "@/components/ui/toastContext"
import { useAuth } from "@/lib/auth"

// Expongo métricas y colecciones para el panel admin calculadas desde servicios
interface DashboardStats {
  ventasHoy: number
  ingresosMes: number
  ventasMes: number
  pedidosPendientes: number
  productosStock: number
  usuariosActivos: number
}

interface AdminAnalytics {
  cargando: boolean
  stats: DashboardStats
  ventasMensuales: Array<{ mes: string; ventas: number }>
  pedidosRecientes: PedidoListado[]
  pedidos: PedidoListado[]
  productos: ProductoResumen[]
  totales: {
    pedidos: number
    productos: number
    usuarios: number
  }
  actualizar: () => Promise<void>
}

const STATS_INICIALES: DashboardStats = {
  ventasHoy: 0,
  ingresosMes: 0,
  ventasMes: 0,
  pedidosPendientes: 0,
  productosStock: 0,
  usuariosActivos: 0,
}

// Formateo el mes en etiqueta corta para los gráficos
const formatearMes = (fecha: Date) =>
  new Intl.DateTimeFormat("es-ES", { month: "short" }).format(fecha)

export function useAdminAnalytics(): AdminAnalytics {
  const { showToast } = useToast()
  const { usuario } = useAuth()
  const esAdministrador = usuario?.rol === "ADMINISTRADOR"
  const [cargando, setCargando] = useState(true)
  const [stats, setStats] = useState<DashboardStats>(STATS_INICIALES)
  const [ventasMensuales, setVentasMensuales] = useState<Array<{ mes: string; ventas: number }>>([])
  const [pedidos, setPedidos] = useState<PedidoListado[]>([])
  const [productos, setProductos] = useState<ProductoResumen[]>([])
  const [pedidosRecientes, setPedidosRecientes] = useState<PedidoListado[]>([])
  const [totales, setTotales] = useState({ pedidos: 0, productos: 0, usuarios: 0 })

  // Preparo un memo para transformar pedidos en una serie de ventas por mes
  const calcularVentasMensuales = useMemo(
    () =>
      (lista: PedidoListado[], meses = 6) => {
        const ahora = new Date()
        const resultado: Array<{ mes: string; ventas: number }> = []

        for (let i = meses - 1; i >= 0; i -= 1) {
          const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
          const clave = `${fecha.getFullYear()}-${fecha.getMonth()}`
          const ventas = lista
            .filter((pedido) => {
              const creado = new Date(pedido.creadoEn)
              return `${creado.getFullYear()}-${creado.getMonth()}` === clave
            })
            .reduce((suma, pedido) => suma + pedido.total, 0)

          resultado.push({ mes: formatearMes(fecha), ventas: Number(ventas.toFixed(2)) })
        }

        return resultado
      },
    [],
  )

  // Cargo pedidos/productos/usuarios según rol y calculo métricas agregadas
  const cargarDatos = async () => {
    try {
      setCargando(true)
      const promesas: Promise<any>[] = [
        orderService.listarPedidosAdmin({ limit: 200 }),
        productService.listarProductos({ page: 1, limit: 200 }),
      ]

      if (esAdministrador) {
        promesas.push(userService.listarUsuariosAdmin())
      }

  const [pedidosResp, productosResp, usuariosResp] = await Promise.all(promesas)

  const pedidosLista = (pedidosResp.pedidos ?? []) as PedidoListado[]
  const productosLista = (productosResp.productos ?? []) as ProductoResumen[]
  const usuariosLista = esAdministrador ? ((usuariosResp ?? []) as UsuarioAdministrador[]) : []

      setPedidos(pedidosLista)
      setProductos(productosLista)
      setTotales({
        pedidos: pedidosResp.paginacion?.total ?? pedidosLista.length,
        productos: productosResp.paginacion?.total ?? productosLista.length,
        usuarios: usuariosLista.length,
      })

      setPedidosRecientes(
        [...pedidosLista]
          .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())
          .slice(0, 5),
      )

      const hoy = new Date()
      const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)

      const pedidosDelMes = pedidosLista.filter(
        (pedido: PedidoListado) => new Date(pedido.creadoEn) >= inicioMes,
      )
      const ventasHoy = pedidosLista
        .filter((pedido: PedidoListado) => new Date(pedido.creadoEn) >= inicioDia)
        .reduce((suma: number, pedido: PedidoListado) => suma + pedido.total, 0)
      const ingresosMes = pedidosDelMes.reduce((suma: number, pedido: PedidoListado) => suma + pedido.total, 0)
      const pedidosMes = pedidosDelMes.length
      const pendientes = pedidosLista.filter((pedido: PedidoListado) => pedido.estado === "PENDIENTE").length
      const stockTotal = productosLista.reduce((suma: number, producto: ProductoResumen) => suma + (producto.stock ?? 0), 0)
      const usuariosActivos = usuariosLista.filter((usuario: UsuarioAdministrador) => usuario.activo !== false).length

      setStats({
        ventasHoy: Number(ventasHoy.toFixed(2)),
        ingresosMes: Number(ingresosMes.toFixed(2)),
        ventasMes: pedidosMes,
        pedidosPendientes: pendientes,
        productosStock: stockTotal,
        usuariosActivos,
      })

      setVentasMensuales(calcularVentasMensuales(pedidosLista))
    } catch (error) {
      console.error(error)
      showToast("No fue posible cargar los datos del panel", "error")
    } finally {
      setCargando(false)
    }
  }

  // Disparo la carga inicial y vuelvo a cargar si cambia el rol con permisos
  useEffect(() => {
    void cargarDatos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esAdministrador])

  return {
    cargando,
    stats,
    ventasMensuales,
    pedidosRecientes,
    pedidos,
    productos,
    totales,
    actualizar: cargarDatos,
  }
}
