import { createBrowserRouter, Navigate } from "react-router-dom"
import { LayoutPublico } from "@/layouts/LayoutPublico"
import { RequireAuth, RequireAdmin, RequireCliente, RequireRepartidor, RequireStrictAdmin } from "@/components/ProtectedRoute"
import HomePage from "@/page"
import ProductosPage from "@/pages/productos/page"
import ProductoDetallePage from "@/pages/productos/[id]/page"
import CategoriasPage from "@/pages/categorias/page"
import CarritoPage from "@/pages/carrito/page"
import CheckoutPage from "@/pages/checkout/page"
import PedidoConfirmadoPage from "@/pages/pedidoConfirmado/[id]/page"
import LoginPage from "@/pages/login/page"
import RegistroPage from "@/pages/registro/page"
import LoginCallbackPage from "@/pages/login/callback"
import OfertasPage from "@/pages/ofertas/page"
import ContactoPage from "@/pages/contacto/page"
import AyudaPage from "@/pages/ayuda/page"
import EnviosPage from "@/pages/envios/page"
import DevolucionesPage from "@/pages/devoluciones/page"
import TerminosPage from "@/pages/terminos/page"
import PrivacidadPage from "@/pages/privacidad/page"
import CuentaLayout from "@/pages/cuenta/layout"
import MiPerfil from "@/pages/cuenta/page"
import DireccionesPage from "@/pages/cuenta/direcciones/page"
import PedidosPage from "@/pages/cuenta/pedidos/page"
import FavoritosPage from "@/pages/cuenta/favoritos/page"
import ConfiguracionCuentaPage from "@/pages/cuenta/configuracion/page"
import AdminLayout from "@/pages/admin/layout"
import AdminDashboardPage from "@/pages/admin/page"
import AdminUsuariosPage from "@/pages/admin/usuarios/page"
import AdminProductosPage from "@/pages/admin/productos/page"
import AdminInventarioPage from "@/pages/admin/inventario/page"
import AdminCategoriasPage from "@/pages/admin/categorias/page"
import AdminPedidosPage from "@/pages/admin/pedidos/page"
import AdminReportesPage from "@/pages/admin/reportes/page"
import AdminConfiguracionPage from "@/pages/admin/configuracion/page"
import AdminZonasPage from "@/pages/admin/logistica/zonas/page"
import AdminAuditoriaPage from "@/pages/admin/auditoria/page"
import RepartidorLayout from "@/pages/repartidor/layout"
import RepartidorDashboardPage from "@/pages/repartidor/page"
import RepartidorPedidosPage from "@/pages/repartidor/pedidos/page"

// Construyo el enrutador con rutas públicas, privadas y protegidas por rol
export const router = createBrowserRouter([
  {
    path: "/",
    element: <LayoutPublico />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "productos", element: <ProductosPage /> },
      { path: "productos/:id", element: <ProductoDetallePage /> },
      { path: "categorias", element: <CategoriasPage /> },
      { path: "carrito", element: <CarritoPage /> },
      { 
        path: "checkout", 
        element: <RequireAuth><CheckoutPage /></RequireAuth> 
      },
      { 
        path: "pedido-confirmado/:id", 
        element: <RequireAuth><PedidoConfirmadoPage /></RequireAuth> 
      },
      { path: "login", element: <LoginPage /> },
      { path: "login/callback", element: <LoginCallbackPage /> },
      { path: "registro", element: <RegistroPage /> },
      { path: "ofertas", element: <OfertasPage /> },
      { path: "contacto", element: <ContactoPage /> },
      { path: "ayuda", element: <AyudaPage /> },
      { path: "envios", element: <EnviosPage /> },
      { path: "devoluciones", element: <DevolucionesPage /> },
      { path: "terminos", element: <TerminosPage /> },
      { path: "privacidad", element: <PrivacidadPage /> },
      {
        path: "cuenta",
        element: (
          <RequireCliente>
            <CuentaLayout />
          </RequireCliente>
        ),
        children: [
          { index: true, element: <MiPerfil /> },
          { path: "direcciones", element: <DireccionesPage /> },
          { path: "pedidos", element: <PedidosPage /> },
          { path: "favoritos", element: <FavoritosPage /> },
          { path: "configuracion", element: <ConfiguracionCuentaPage /> },
        ],
      },
    ],
  },
  {
    path: "/admin",
    element: <RequireAdmin><AdminLayout /></RequireAdmin>,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: "usuarios", element: <RequireStrictAdmin><AdminUsuariosPage /></RequireStrictAdmin> },
      { path: "categorias", element: <RequireStrictAdmin><AdminCategoriasPage /></RequireStrictAdmin> },
      { path: "productos", element: <AdminProductosPage /> },
      { path: "inventario", element: <AdminInventarioPage /> },
      { path: "logistica/zonas", element: <AdminZonasPage /> },
      { path: "pedidos", element: <AdminPedidosPage /> },
      { path: "auditoria", element: <RequireStrictAdmin><AdminAuditoriaPage /></RequireStrictAdmin> },
      { path: "reportes", element: <AdminReportesPage /> },
      { path: "configuracion", element: <RequireStrictAdmin><AdminConfiguracionPage /></RequireStrictAdmin> },
    ],
  },
  {
    path: "/repartidor",
    element: <RequireRepartidor><RepartidorLayout /></RequireRepartidor>,
    children: [
      { index: true, element: <RepartidorDashboardPage /> },
      { path: "pedidos", element: <RepartidorPedidosPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
])
