# Sistema de pedidos — Frontend

Frontend desarrollado con React y TypeScript sobre Vite. Implementa catálogo, carrito, checkout con pagos PayPal, cuenta de usuario, panel administrativo (productos, pedidos, usuarios, reportes, zonas/logística) y área de repartidor. Preparado para desarrollo local y despliegue en Docker, con pruebas unitarias via Vitest/MSW.

## Requisitos
Para ejecutar y mantener el frontend en condiciones productivas, necesito:

- Node.js 20.x y npm 10+ (para desarrollo y build).

- Backend accesible vía `VITE_API_URL` (p. ej. `http://localhost:3000/api/v1`).

- Variables `VITE_*` definidas en `.env` (ver Variables de entorno).

- Opcional: Docker Engine + BuildKit para imágenes reproducibles.

## Tecnologías seleccionadas
- React 18 + TypeScript para vistas tipadas y predecibles.
- Vite 7 para desarrollo rápido y builds eficientes.
- Tailwind CSS 4 + tailwind-merge para estilos utilitarios consistentes.
- Radix UI + shadcn-style (Slot, Tabs, Dialog, Select, etc.) para componentes accesibles.
- React Router v7 para enrutamiento SPA.
- Axios para cliente HTTP con interceptores.
- PayPal SDK (@paypal/react-paypal-js) para pagos.
- MapLibre GL + Mapbox Draw (compat) para zonas/logística sin token propietario.
- Recharts para visualizaciones en reportes.
- html2canvas + jsPDF para exportes a PDF.
- Vitest + Testing Library + MSW para pruebas unitarias y de componentes.

## Justificación general
- Vite mejora tiempos de arranque/HMR y simplifica el build.
- Tailwind reduce CSS global y promueve consistencia visual.
- Radix UI asegura accesibilidad y patrones robustos.
- MapLibre evita dependencia en tokens de terceros (open source), manteniendo compat con Draw.
- Vitest + MSW brindan tests rápidos y aislados del backend real.

## Estructura del proyecto
```
frontend/
├─ Dockerfile                      # Build multi-stage Nginx
├─ public/                         # Estáticos (imágenes)
├─ src/
│  ├─ components/
│  │  ├─ layout/                  # Layouts, navegación, pie
│  │  └─ ui/                      # Botones, inputs, tarjetas, etc.
│  ├─ pages/                      # Rutas/páginas (admin, cuenta, productos, checkout, etc.)
│  ├─ lib/                        # Providers (auth, cart) y utilidades
│  ├─ services/                   # Llamadas HTTP (auth, productos, pedidos, etc.)
│  ├─ hooks/                      # Hooks personalizados
│  ├─ mocks/                      # MSW para pruebas
│  ├─ types/                      # Tipos TS compartidos
│  └─ assets/                     # Recursos locales
├─ vite.config.ts                 # Configuración Vite/React
├─ vitest.config.ts               # Configuración Vitest
├─ tailwind.config.js             # Tailwind CSS
├─ tsconfig.*.json                # TypeScript
└─ .env.example                   # Variables de entorno de referencia
```

## Arquitectura y capas
- Páginas (routes) renderizan vistas y orquestan datos.
- Componentes (layout/ui) reutilizables y accesibles.
- Servicios HTTP centralizan API calls y manejo de errores.
- Providers (`lib/auth`, `lib/cart`) exponen estado y acciones.
- Hooks encapsulan lógica de UI/datos.

Relación general: Pages ⇄ Providers ⇄ Services ⇄ Backend.

## Componentes y responsabilidades
- Autenticación: login, protección de rutas, perfil.
- Catálogo de productos: filtros, paginación, detalle.
- Carrito: agregar/editar/eliminar, subtotal y totales.
- Checkout: direcciones, cálculo de envío por zonas, métodos de pago (PayPal).
- Cuenta: pedidos, direcciones, favoritos, perfil.
- Panel Admin: productos, inventario, categorías, pedidos, usuarios, reportes, configuración.
- Logística/Zonas: edición de polígonos y tarifas con MapLibre + Draw.
- Reportes: KPIs, gráficos y exporte a PDF.

## Variables de entorno
Archivo de referencia: `.env.example`.

- `VITE_API_URL`: URL base del backend (por ejemplo `http://localhost:3000/api/v1`).
- `VITE_PAYPAL_CLIENT_ID`: ID de cliente PayPal (si usas pagos PayPal en el frontend).

Nota: las variables deben comenzar con `VITE_` para quedar disponibles en tiempo de build. Nunca expongas secretos de backend aquí.

## Desarrollo local
```bash
# 1) Instalar dependencias
npm ci

# 2) Configurar variables (crear .env desde .env.example)
cp .env.example .env

# 3) Levantar en modo desarrollo
npm run dev
```
Frontend estará en `http://localhost:5173`.

## Docker
- `Dockerfile` multi-stage: compila en Node (builder) y sirve con Nginx.
- Se integra con `docker-compose.yml` desde la raíz del monorepo.

Build y run (opcional):
```bash
docker build -t sistemapedidos-frontend -f Dockerfile .
docker run -e VITE_API_URL=/api/v1 -e VITE_PAYPAL_CLIENT_ID=sb -p 5173:80 sistemapedidos-frontend
```

Con Docker Compose (recomendado desde la raíz):
```bash
cd ..
docker-compose up -d
```

## Scripts
```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview

# Linter
npm run lint
```

## Pruebas
```bash
# Unitarias/componentes
npm test

# Modo watch
npm run test:watch

# Cobertura
npm run test:coverage
```
Stack de pruebas: Vitest + @testing-library/react + MSW (mocks de red). Playwright está disponible si deseas pruebas E2E (opcional).

## Configuración de Vite y TypeScript
- `vite.config.ts`: plugin React, alias y optimizaciones de build.
- `tsconfig.*.json`: opciones estrictas de TS para mejor DX.
- `tailwind.config.js` y `globals.css`: estilos y utilidades.

## Seguridad
- Mantener `.env` fuera del repositorio (está ignorado por `.gitignore`).
- Sólo exponer variables `VITE_*` necesarias; nunca claves de backend o secretos JWT.
- PayPal: usar `VITE_PAYPAL_CLIENT_ID` en build; no hardcodear IDs reales en el código.
- Si hay certificados/llaves locales, no comprometerlos; están ignorados (nginx/ssl, *.key, *.crt, *.pem, *.pfx).

## Operación y mantenimiento
- Actualizar dependencias con cuidado y correr `npm run build` antes de publicar.
- Mantener consistencia de diseño con Tailwind y componentes UI compartidos.
- Verificar rutas protegidas tras cambios de auth.

## Notas finales
- Branding y assets están en `public/` y `src/assets/`.
- La subida de archivos y lógica de imágenes depende del backend (carpetas `uploads/`).
- Para integración de mapas/logística, no se requieren tokens (MapLibre), pero asegúrate de revisar compatibilidad de Draw.
