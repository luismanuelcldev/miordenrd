# Frontend - Sistema de Pedidos Online

Frontend moderno desarrollado con React 19, TypeScript, Vite y Tailwind CSS para un sistema de pedidos online completo.

## 🚀 Tecnologías

- **React 19** - Biblioteca UI con las últimas características
- **TypeScript** - Tipado estático para mayor seguridad
- **Vite** - Build tool ultra-rápido
- **Tailwind CSS** - Framework CSS utility-first
- **React Router DOM** - Enrutamiento del lado del cliente
- **Axios** - Cliente HTTP para comunicación con API
- **Vitest** - Framework de testing moderno
- **MSW** - Mock Service Worker para pruebas
- **Radix UI** - Componentes accesibles y sin estilos
- **PayPal SDK** - Integración de pagos

## 📋 Requisitos Previos

- Node.js >= 18.x
- npm >= 9.x
- Backend del sistema corriendo en `http://localhost:3000/api/v1`

## 🔧 Instalación

1. **Clonar el repositorio** (si aún no lo has hecho):
```bash
git clone <repository-url>
cd sistemapedidos/frontend
```

2. **Instalar dependencias**:
```bash
npm install
```

3. **Configurar variables de entorno**:
Crea o edita el archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_PAYPAL_CLIENT_ID=YOUR_PAYPAL_CLIENT_ID_HERE
```

**Variables disponibles:**
- `VITE_API_URL`: URL del backend (por defecto: http://localhost:3000/api/v1)
- `VITE_PAYPAL_CLIENT_ID`: ID del cliente de PayPal para pagos

## 🏃 Ejecución

### Desarrollo

Inicia el servidor de desarrollo:
```bash
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

### Producción

Compilar para producción:
```bash
npm run build
```

Vista previa de la compilación:
```bash
npm run preview
```

### Con Backend (Docker Compose)

Desde la raíz del proyecto:
```bash
cd ..
docker-compose up
```

Esto iniciará tanto el frontend como el backend automáticamente.

## 🧪 Testing

### Ejecutar todas las pruebas
```bash
npm test
```

### Ejecutar con coverage
```bash
npm run test:coverage
```

### Modo watch
```bash
npm run test:watch
```

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/       # Componentes reutilizables
│   │   ├── layout/      # Header, Footer
│   │   └── ui/          # Componentes UI (Button, Card, etc.)
│   ├── pages/           # Páginas de la aplicación
│   │   ├── admin/       # Panel de administración
│   │   ├── cuenta/      # Gestión de cuenta
│   │   ├── productos/   # Catálogo de productos
│   │   ├── carrito/     # Carrito de compras
│   │   └── checkout/    # Proceso de pago
│   ├── services/        # Servicios de API
│   │   ├── api.ts       # Cliente Axios configurado
│   │   ├── authService.ts
│   │   ├── productService.ts
│   │   ├── cartService.ts
│   │   ├── orderService.ts
│   │   ├── userService.ts
│   │   └── addressService.ts
│   ├── lib/             # Contextos y utilidades
│   │   ├── auth.tsx     # AuthProvider
│   │   ├── cart.tsx     # CartProvider
│   │   └── utils.ts     # Utilidades generales
│   ├── types/           # Definiciones TypeScript
│   ├── mocks/           # Mocks para testing (MSW)
│   └── hooks/           # Custom hooks
├── public/              # Archivos estáticos
├── .env                 # Variables de entorno
├── vite.config.ts       # Configuración de Vite
├── vitest.config.ts     # Configuración de Vitest
└── tailwind.config.js   # Configuración de Tailwind
```

## 🔐 Autenticación

El sistema utiliza JWT (JSON Web Tokens) para autenticación:

- **Access Token**: Almacenado en localStorage, expira en 1 hora
- **Refresh Token**: Se usa para renovar el access token automáticamente
- **Interceptores Axios**: Manejo automático de tokens y renovación

### Flujo de autenticación:

1. Usuario inicia sesión → Recibe access + refresh tokens
2. Cada petición incluye el access token en headers
3. Si el token expira (401) → Se renueva automáticamente con refresh token
4. Si el refresh token expira → Usuario debe iniciar sesión nuevamente

## 🛒 Gestión del Carrito

El carrito se sincroniza con el backend:

- **Autenticado**: Carrito persistente en base de datos
- **No autenticado**: Redirige a login al intentar agregar productos
- **Actualización en tiempo real**: Cambios se reflejan inmediatamente

## 📦 Servicios Implementados

### AuthService
- `login()` - Iniciar sesión
- `register()` - Registrar usuario
- `logout()` - Cerrar sesión
- `getProfile()` - Obtener perfil
- `changePassword()` - Cambiar contraseña

### ProductService
- `listarProductos()` - Listar con filtros y paginación
- `obtenerProducto()` - Detalle de producto
- `obtenerCategoriasDisponibles()` - Categorías

### CartService
- `obtenerCarrito()` - Obtener carrito
- `agregarProducto()` - Agregar al carrito
- `editarProducto()` - Actualizar cantidad
- `eliminarProducto()` - Eliminar del carrito

### OrderService
- `listarMisPedidos()` - Historial de pedidos
- `obtenerPedido()` - Detalle de pedido

### CheckoutService
- `procesarCompra()` - Procesar pedido

### UserService
- `obtenerPerfil()` - Perfil del usuario
- `actualizarPerfil()` - Actualizar datos
- `listarUsuarios()` - Listar usuarios (admin)

### AddressService
- `listarDirecciones()` - Direcciones de envío
- `crearDireccion()` - Nueva dirección
- `actualizarDireccion()` - Editar dirección
- `eliminarDireccion()` - Eliminar dirección

## 🎨 Componentes UI Reutilizables

### Estados de Carga
```tsx
import { LoadingSpinner, PageLoading, InlineLoading } from '@/components/ui/loading-spinner'

<LoadingSpinner size="lg" text="Cargando..." />
<PageLoading text="Cargando productos..." />
<InlineLoading text="Procesando..." />
```

### Mensajes de Error
```tsx
import { ErrorMessage, PageError, InlineError } from '@/components/ui/error-message'

<ErrorMessage 
  title="Error" 
  message="No se pudo cargar" 
  onRetry={refetch} 
/>
<PageError message="Error al cargar datos" onRetry={reload} />
<InlineError message="Campo requerido" />
```

## 🔄 Providers y Contextos

### AuthProvider
```tsx
import { useAuth } from '@/lib/auth'

const { usuario, estaAutenticado, iniciarSesion, cerrarSesion } = useAuth()
```

### CartProvider
```tsx
import { useCart } from '@/lib/cart'

const { carrito, agregarProducto, actualizarCantidad, crearPedido } = useCart()
```

## 🐛 Debugging

### Revisar tokens almacenados:
```javascript
// En consola del navegador
localStorage.getItem('access_token')
localStorage.getItem('refresh_token')
```

### Revisar estado de MSW (testing):
Los mocks se configuran automáticamente en modo test. Ver `src/mocks/handlers.ts`

## 📝 Scripts Disponibles

```json
{
  "dev": "vite",                    // Desarrollo
  "build": "tsc -b && vite build",  // Compilar
  "lint": "eslint .",               // Linter
  "preview": "vite preview",        // Preview producción
  "test": "vitest",                 // Tests
  "test:coverage": "vitest --coverage" // Coverage
}
```

## 🔗 Integración con Backend

El frontend se comunica con el backend NestJS a través de la API REST:

**URL Base**: `http://localhost:3000` (configurable en `.env`)

**Endpoints principales**:
- `/auth/*` - Autenticación
- `/productos` - Productos
- `/carrito/*` - Carrito
- `/checkout` - Proceso de compra
- `/pedidos/*` - Pedidos
- `/usuarios/*` - Usuarios
- `/direcciones/*` - Direcciones

## 🚢 Despliegue

### Desarrollo Local
```bash
npm run dev
```

### Docker
```bash
docker build -t frontend-pedidos .
docker run -p 5173:80 frontend-pedidos
```

### Con Docker Compose (Recomendado)
```bash
cd ..
docker-compose up
```

Esto levantará:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Base de datos PostgreSQL

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y propietario.

## 👥 Autores

- **Equipo de Desarrollo** - Sistema de Pedidos Online

---

**Nota**: Asegúrate de tener el backend corriendo antes de iniciar el frontend en desarrollo.

import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
