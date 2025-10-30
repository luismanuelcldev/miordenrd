# Sistema de Pedidos Online: MiOrdenRD

Repositorio que contiene el backend (NestJS + Prisma + PostgreSQL) y el frontend (React + Vite + Tailwind) para un e‑commerce completo: catálogo, carrito, checkout con PayPal, cuenta de usuario, panel administrativo, logística por zonas y módulo de repartidor. Preparado para desarrollo local y despliegue con Docker, e integra CI, análisis de dependencias y políticas de seguridad.

## Características

- Autenticación JWT con roles (Cliente, Administrador, Empleado, Repartidor)
- Catálogo de productos con filtros, inventario y categorías
- Carrito persistente y proceso de checkout
- Pagos con PayPal (frontend) y notificaciones por email (backend)
- Gestión de pedidos, estados y asignación de repartidor
- Logística por zonas con MapLibre + Draw (sin necesidad de token propietario)
- Panel de administración (productos, usuarios, reportes, configuración)
- Reportes con gráficos y exporte a PDF
- Docker Compose con healthchecks y Nginx opcional
- Pruebas unitarias (backend: Jest, frontend: Vitest/MSW)

## Estructura del monorepo

```
.
├─ backend/                  # API NestJS + Prisma
│  ├─ src/                  # Código fuente (application/domain/infrastructure)
│  ├─ prisma/               # schema.prisma, migraciones y seed
│  ├─ Dockerfile            # Build multi-stage
│  ├─ .env.example          # Variables requeridas y opcionales
│  └─ README.md             # Guía específica del backend
├─ frontend/                 # App React + Vite + Tailwind
│  ├─ src/                  # Páginas, componentes, servicios, hooks
│  ├─ public/               # Estáticos
│  ├─ Dockerfile            # Build multi-stage servido por Nginx
│  ├─ .env.example          # Variables VITE_ de referencia
│  └─ README.md             # Guía específica del frontend
├─ nginx/                    # Configuración Nginx (producción opcional)
├─ uploads/                  # Contenido subido (ignorado en git)
├─ docker-compose.yml        # Orquestación principal (parametrizada por env)
├─ docker-compose.dev.yml    # Orquestación de desarrollo
├─ start-dev.sh              # Script helper para levantar entorno dev
├─ build-local.sh            # Compilar backend localmente
├─ .github/                  # Workflows (CI, dependency review, CodeQL) y dependabot
├─ CONTRIBUTING.md           # Guía de contribuciones
├─ SECURITY.md               # Política de seguridad y reporte
└─ LICENSE                   # Licencia del proyecto
```

## Requisitos

- Node.js 20.x y npm 10+
- Docker y Docker Compose (opcional pero recomendado)
- PostgreSQL (si corres backend sin Docker)

## Variables de entorno

Los ejemplos están en `backend/.env.example` y `frontend/.env.example`.

- Backend (archivo `.env`):
	- `DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public`
	- `JWT_SECRET`, `JWT_EXPIRES_IN`
	- `REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRES_IN`
	- Opcionales: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SHIPPING_ORIGIN_LAT`, `SHIPPING_ORIGIN_LNG`

- Frontend (archivo `.env`):
	- `VITE_API_URL` (ej: `http://localhost:3000/api/v1`)
	- `VITE_PAYPAL_CLIENT_ID` (si habilitas PayPal en frontend)

Nota: En frontend, sólo variables prefijadas con `VITE_` quedan disponibles en el build. Nunca expongas secretos de backend.

## Desarrollo local 

Backend:
```bash
cd backend
cp .env.example .env
npm ci
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

Frontend:
```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```

## Desarrollo con Docker Compose

Desde la raíz del proyecto:
```bash
# Levantar DB, Redis y Backend para desarrollo
./start-dev.sh

# (o) usando directamente el compose de dev
docker-compose -f docker-compose.dev.yml up -d
```

Frontend en desarrollo (fuera de contenedor, recomendado por DX):
```bash
cd frontend
npm run dev
```

## Despliegue con Docker Compose

Variables sensibles se inyectan por entorno; `docker-compose.yml` está parametrizado y no contiene secretos.

```bash
# Producción (con perfil nginx opcional)
docker-compose --profile production up -d

# Ver logs
docker-compose logs -f backend

# Reiniciar servicios
docker-compose restart backend

# Detener y limpiar
docker-compose down -v
```

## Base de datos y Prisma

- Esquema en `backend/prisma/schema.prisma` y migraciones en `backend/prisma/migrations/`.
- `docker-compose.yml` ejecuta `prisma migrate deploy` y `prisma db seed` en el arranque del backend.
- Comandos útiles:

```bash
# Estado de migraciones
cd backend
npx prisma migrate status

# Crear migración de desarrollo
npx prisma migrate dev

# Seed de datos
npm run db:seed
```

## Pruebas

Backend:
```bash
cd backend
npm test
npm run test:cov
npm run test:e2e
```

Frontend:
```bash
cd frontend
npm test
npm run test:watch
npm run test:coverage
```

## CI/CD y seguridad

- CI: `.github/workflows/ci.yml` compila y prueba backend y frontend.
- Dependency Review: escaneo de dependencias en PRs (falla en severidad moderada+).
- CodeQL: análisis de seguridad semanal y en PRs.
- Dependabot: actualiza npm (backend/frontend) y GitHub Actions semanalmente.
- Política de seguridad: ver `SECURITY.md`.
- Guía de contribución: ver `CONTRIBUTING.md`.

## Buenas prácticas de secretos

- No commitear `.env` ni certificados; ya están ignorados en `.gitignore`.
- `docker-compose.yml` y `docker-compose.dev.yml` leen secretos desde el entorno.
- En GitHub Actions usar “Repository Secrets”.
- Certificados/llaves locales (nginx/ssl, `*.key`, `*.crt`, `*.pem`, `*.pfx`) no deben subirse.

## Enlaces útiles

- Backend: `backend/README.md`
- Frontend: `frontend/README.md`

## Licencia

Consulta el archivo `LICENSE` en la raíz del repositorio.

## Autor

- Luis Manuel De La Cruz Ledesma — Sistema de Pedidos Online (MiOrdenRD) 

