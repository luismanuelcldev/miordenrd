# Sistema de Pedidos Online

Sistema completo de e-commerce desarrollado con **NestJS** (backend) y **React** (frontend), siguiendo principios de **Clean Architecture** y **Clean Code**.

## 🚀 Características Principales

### Backend (NestJS)
- ✅ **Autenticación JWT** con refresh tokens y bcrypt
- ✅ **Sistema de roles** (Cliente, Administrador, Empleado, Repartidor)
- ✅ **API RESTful** con documentación Swagger
- ✅ **Validación de datos** con class-validator
- ✅ **Base de datos PostgreSQL** con Prisma ORM
- ✅ **Paginación y filtros** avanzados
- ✅ **Rate limiting global y hardening con Helmet avanzado**
- ✅ **Interceptores y filtros personalizados para logging/errores**
- ✅ **Integración PayPal** para pagos
- ✅ **Sistema de notificaciones** por email
- ✅ **Manejo de inventario** con alertas de stock
- ✅ **Reportes y estadísticas**
- ✅ **Docker** con healthchecks

### Frontend (React + Vite)
- ✅ **Interfaz moderna** con Tailwind CSS
- ✅ **Catálogo de productos** con filtros y búsqueda
- ✅ **Carrito de compras** persistente
- ✅ **Proceso de checkout** completo
- ✅ **Gestión de cuenta** de usuario
- ✅ **Panel de administración**
- ✅ **Seguimiento de pedidos** en tiempo real
- ✅ **Integración PayPal** en frontend

## 🏗️ Arquitectura

### Backend (Clean Architecture)
```
backend/src/
├── application/          # Casos de uso
├── domain/              # Entidades y reglas de negocio
├── infraestructure/     # Implementaciones concretas
│   ├── http/           # Controladores, DTOs, Guards
│   ├── persistence/    # Prisma, Repositorios
│   └── security/       # JWT, Auth, Roles
└── main.ts             # Bootstrap de la aplicación
```

### Frontend (Component-Based)
```
frontend/src/
├── components/         # Componentes reutilizables
├── pages/             # Páginas de la aplicación
├── lib/               # Servicios y utilidades
├── hooks/             # Custom hooks
└── services/          # API calls
```

## 🛠️ Tecnologías

### Backend
- **NestJS** - Framework Node.js
- **PostgreSQL** - Base de datos
- **Prisma** - ORM
- **JWT** - Autenticación
- **bcrypt** - Hash de contraseñas
- **Helmet** - Seguridad HTTP
- **@nestjs/throttler** - Rate limiting
- **Nodemailer** - Envío de emails
- **PayPal API** - Pagos
- **Swagger** - Documentación API

### Frontend
- **React 18** - Biblioteca UI
- **Vite** - Build tool
- **Tailwind CSS** - Estilos
- **React Router** - Navegación
- **PayPal SDK** - Pagos
- **Axios** - HTTP client

### DevOps
- **Docker** - Contenedores
- **Docker Compose** - Orquestación
- **Nginx** - Reverse proxy (opcional)

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- Docker y Docker Compose
- Git

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd sistemapedidos
```

### 2. Configurar variables de entorno
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```
Edita cada archivo con tus credenciales locales (base de datos, claves JWT, etc.).

### 3. Levantar con Docker Compose
```bash
# Desarrollo
docker-compose up -d

# Producción
docker-compose --profile production up -d
```

### 4. Ejecutar migraciones
```bash
# El backend ejecuta automáticamente las migraciones al iniciar
# Pero puedes ejecutarlas manualmente si es necesario
docker-compose exec backend npx prisma migrate deploy

# Cargar datos iniciales
docker-compose exec backend npm run db:seed
```

> El seed crea un usuario administrador (`admin@sistemapedidos.com` / `Admin1234`) y datos de catálogo base.

## 📚 API Documentation

Una vez que el backend esté ejecutándose, puedes acceder a la documentación Swagger en:
- **Desarrollo**: http://localhost:3000/api/docs
- **Producción**: http://tu-dominio.com/api/docs

## 🔐 Autenticación

### Endpoints principales
- `POST /api/v1/auth/register` - Registro de usuario
- `POST /api/v1/auth/login` - Inicio de sesión
- `POST /api/v1/auth/refresh` - Renovar token
- `GET /api/v1/auth/me` - Perfil del usuario

### Roles disponibles
- **CLIENTE**: Ver productos, hacer pedidos, gestionar cuenta
- **ADMINISTRADOR**: Acceso completo al sistema
- **EMPLEADO**: Gestionar pedidos, consultar stock
- **REPARTIDOR**: Ver pedidos asignados, actualizar estado

## 💳 Pagos

### Métodos soportados
- **PayPal** - Integración completa con API
- **Tarjeta** - Simulación (en producción usar Stripe)
- **Transferencia** - Registro manual
- **Contra entrega** - Pago al recibir

## 📧 Notificaciones

El sistema envía notificaciones automáticas por email para:
- Confirmación de pedido
- Cambios de estado del pedido
- Alertas de stock bajo
- Notificaciones generales

## 📊 Reportes

### Disponibles para administradores
- Ventas por período
- Productos más vendidos
- Usuarios activos
- Estadísticas de pedidos
- Reportes de inventario

## 🐳 Docker

### Servicios incluidos
- **postgres**: Base de datos PostgreSQL
- **redis**: Cache (opcional)
- **backend**: API NestJS
- **frontend**: Aplicación React
- **nginx**: Reverse proxy (producción)

### Comandos útiles
```bash
# Ver logs
docker-compose logs -f backend

# Ejecutar comandos en contenedores
docker-compose exec backend npm run prisma:studio
docker-compose exec frontend npm run build

# Reiniciar servicios
docker-compose restart backend

# Limpiar todo
docker-compose down -v
```

## 🔒 Secretos y publicación pública

Para evitar exponer información sensible en este repositorio público:

- Nunca subas archivos `.env`. Ya están ignorados en `.gitignore`.
- Los archivos `docker-compose.yml` y `docker-compose.dev.yml` ahora usan variables de entorno para credenciales y claves (JWT, PayPal, SMTP, etc.). Define estos valores en tu entorno o en archivos `.env` locales.
- En CI/CD usa GitHub Secrets para inyectar variables como `DATABASE_URL`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `PAYPAL_CLIENT_ID` y `PAYPAL_CLIENT_SECRET`.
- Los ejemplos de variables están en `backend/.env.example` y `frontend/.env.example`.

Sugerencia opcional: utiliza una herramienta de escaneo de secretos (por ejemplo, Gitleaks) antes de hacer push a ramas públicas.

## 🧪 Testing

```bash
# Backend
cd backend
npm run test
npm run test:cov
npm run test:e2e

# Frontend
cd frontend
npm run test
```

## 📈 Monitoreo

### Health Checks
- **Backend**: http://localhost:3000/api/v1/health
- **Frontend**: http://localhost:5173

### Métricas disponibles
- Estado de la base de datos
- Tiempo de actividad
- Versión de la aplicación
- Estadísticas de notificaciones

## 🔧 Desarrollo

### Estructura del proyecto
```
sistemapedidos/
├── backend/                 # API NestJS
│   ├── src/
│   ├── prisma/
│   ├── Dockerfile
│   └── package.json
├── frontend/               # App React
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml      # Orquestación
├── nginx/                  # Configuración Nginx
└── scripts/               # Scripts de utilidad
```

### Comandos de desarrollo
```bash
# Backend
cd backend
npm run start:dev

# Frontend
cd frontend
npm run dev

# Base de datos
npx prisma studio
npx prisma migrate dev
```

## 🚀 Despliegue

### Producción
1. Configurar variables de entorno
2. Configurar SSL/TLS
3. Configurar dominio
4. Ejecutar con perfil de producción:
```bash
docker-compose --profile production up -d
```

### Base de datos en AWS RDS
1. **Crear instancia RDS PostgreSQL** con la misma versión que usas localmente.
2. **Habilitar acceso** desde tu IP o VPC y obtener el endpoint, puerto, usuario y contraseña.
3. **Exportar la base existente**:
   ```bash
   PGPASSWORD=tu_password pg_dump --format=custom --no-owner --no-privileges \
     --host=localhost --username=tu_usuario --dbname=tu_basedatos > backup.dump
   ```
4. **Restaurar en RDS**:
   ```bash
   PGPASSWORD=rds_password pg_restore --clean --if-exists --no-owner \
     --host=rds-endpoint --port=5432 --username=rds_user --dbname=rds_db backup.dump
   ```
5. **Actualizar `DATABASE_URL`** en `.env`, `docker-compose*.yml` o el servicio donde despliegues:
   ```
   DATABASE_URL=postgresql://rds_user:rds_password@rds-endpoint:5432/rds_db?schema=public
   ```
6. Ejecuta `npx prisma migrate deploy` (o `prisma generate` si sólo lees) para validar el esquema.

### Variables de entorno requeridas
```env
# Base de datos
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# Rate limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# PayPal
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# Email
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...

```

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Autores

- **Tu Nombre** - *Desarrollo inicial* - [GitHub](https://github.com/tu-usuario)

## 🙏 Agradecimientos

- NestJS por el excelente framework
- Prisma por el ORM intuitivo
- React por la librería de UI
- Tailwind CSS por el sistema de estilos
- PayPal por la API de pagos
