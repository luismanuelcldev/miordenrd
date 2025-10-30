import { Suspense } from "react"
import { RouterProvider } from "react-router-dom"
import { PayPalScriptProvider } from "@paypal/react-paypal-js"
import { router } from "@/router"
import { PAYPAL_CLIENT_ID } from "./paypal.config"
import { ToastProvider } from "@/components/ui/toastContext"
import { AuthProvider } from "@/lib/auth"
import { CartProvider } from "@/lib/cart"
import { FavoritesProvider } from "@/lib/favorites"

// Defino la configuración inicial del SDK de PayPal que usaré en el checkout
const opcionesPayPal = {
  clientId: PAYPAL_CLIENT_ID || "test",
  currency: "USD",
}

// Envuelvo la app con proveedores globales y cargo el enrutador bajo Suspense
export default function App() {
  return (
    <PayPalScriptProvider options={opcionesPayPal}>
      <AuthProvider>
        <CartProvider>
          <FavoritesProvider>
            <ToastProvider>
              <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Cargando...</div>}>
                <RouterProvider router={router} />
              </Suspense>
            </ToastProvider>
          </FavoritesProvider>
        </CartProvider>
      </AuthProvider>
    </PayPalScriptProvider>
  )
}
