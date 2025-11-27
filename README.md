# MiOrdenRD – Sistema de Pedidos Online

[![CI](https://github.com/luismanuelcldev/miordenrd/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/luismanuelcldev/miordenrd/actions/workflows/ci.yml)

## Descripción general

Construí **MiOrdenRD** para ofrecer un e-commerce completo y operable en producción. Desde la captura del pedido hasta la logística de entrega, el sistema cubre todas las aristas que necesitaba: catálogo administrable, Pagos con PayPal, control de inventario, zonas de reparto editables y un panel para el equipo interno. Mantengo el proyecto en dos capas principales (backend NestJS y frontend React) dentro de un mismo monorepo, con despliegues automatizados en Railway y Vercel.

## Tabla de contenidos
- [Descripción general](#descripción-general)
- [Características principales](#características-principales)
- [Arquitectura](#arquitectura)
- [Tecnologías y herramientas](#tecnologías-y-herramientas)
- [Requisitos previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración del entorno](#configuración-del-entorno)
- [Ejecución](#ejecución)
- [Estructura del código](#estructura-del-código)
- [API principal](#api-principal)
- [Pruebas](#pruebas)
- [Despliegue](#despliegue)
- [Contribuciones](#contribuciones)
- [Licencia](#licencia)
- [Autor y contacto](#autor-y-contacto)

## Características principales
- Autenticación por JWT con roles (cliente, administrador, empleado y repartidor) y gestión de sesiones cortas (`15m`) más refresh tokens.
- Catálogo con filtros avanzados, categorías, inventario dinámico y control de precios/promociones.
- Carrito persistente, checkout guiado y pagos con **PayPal** integrados desde el frontend.
- Gestión de pedidos en tiempo real: estados, asignación de repartidor, historial y notificaciones.
- Logística basada en zonas dibujadas sobre **MapLibre GL**, sin depender de tokens comerciales.
- Panel administrativo con reportes exportables, auditoría de acciones y herramientas de seguridad (cambio de contraseña, bloqueo de auto-eliminación).
- API documentada y versionada (`/api/v1`), basada en casos de uso y repositorios de dominio.
- Pruebas automáticas (Jest en backend, Vitest/MSW en frontend) y pipelines CI en GitHub Actions.

## Arquitectura
- **Monorepo**: backend (`/backend`) y frontend (`/frontend`) conviven con infraestructura común (`/docker-compose`, `/nginx`, scripts).
- **Backend (Hexagonal/Limpia)**: separé `domain`, `application` (casos de uso y puertos) y `infraestructure` (HTTP, seguridad y persistencia Prisma). Los controladores NestJS sólo orquestan.
- **Frontend (SPA React)**: uso Vite, React Router y providers (`/lib`) para auth, carrito y favoritos. Los servicios centralizan peticiones HTTP con Axios.
- **Persistencia**: PostgreSQL gestionado con Prisma y migraciones versionadas. Semillas preparadas para ambientes nuevos.
- **Infraestructura**: Docker multi-stage para backend y frontend, Nginx como reverse proxy opcional, despliegue automatizado en Railway (API) y Vercel (SPA).

## Tecnologías y herramientas
- **Backend**: NestJS, TypeScript, Prisma ORM, PostgreSQL, Passport/JWT, Nodemailer, class-validator, Docker.
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Radix UI/shadcn, React Router 7, Axios, MapLibre GL + Draw, Recharts, html2canvas + jsPDF.
- **Testing**: Jest + Supertest (backend), Vitest + Testing Library + MSW (frontend).
- **DevOps**: GitHub Actions (CI, CodeQL, Dependency Review), Dependabot, Railway, Vercel, Docker Compose.

## Requisitos previos
- Node.js 20.x y npm 10+
- Docker y Docker Compose (recomendados para orquestación)
- PostgreSQL 14+ (si prefieres ejecutarlo fuera de Docker)

## Instalación
```bash
# Clonar el monorepo
git clone https://github.com/luismanuelcldev/miordenrd.git
cd miordenrd

# Instalar dependencias de backend
cd backend
npm ci

# Instalar dependencias de frontend
cd ../frontend
npm ci
```

## Configuración del entorno
### Backend (`backend/.env`)
```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public
JWT_SECRET=changeme
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=changeme-too
REFRESH_TOKEN_EXPIRES_IN=30d
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=Mi Orden RD <notificaciones@miordenrd.com>
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
SHIPPING_ORIGIN_LAT=18.4861
SHIPPING_ORIGIN_LNG=-69.9312
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:3000/api/v1
VITE_PAYPAL_CLIENT_ID=PAYPAL_TEST_ID
```
Las variables del frontend deben comenzar con `VITE_` para exponerse en el build. Nunca expongo secretos de backend en esta capa.

## Ejecución
Cuando trabajo en local suelo elegir entre dos rutas:

### Desarrollo asistido por Docker
```bash
# Levanto PostgreSQL, Redis y el backend
./start-dev.sh

# En otra terminal arranco el frontend
cd frontend
npm run dev
```
Este enfoque crea toda la base necesaria en contenedores y deja el backend en `http://localhost:3000` y el frontend en `http://localhost:5173`.

### Desarrollo sin contenedores
```bash
# PostgreSQL debe estar ejecutándose (local o remoto)

cd backend
npx prisma migrate dev
npm run db:seed
npm run start:dev

cd ../frontend
npm run dev
```
Uso `npm run start:dev` para recarga en caliente del backend y Vite para el frontend. Redis es opcional en local; si lo necesito, lo lanzo con `docker run redis:7-alpine` o usando el compose.

### Producción local
```bash
# Construyo e inicio los servicios con perfiles de producción
docker-compose --profile production up -d --build

# O enfoco cada paquete
cd backend && npm run build && npm run start:prod
cd ../frontend && npm run build && npm run preview
```
El compose ejecuta migraciones, genera Prisma Client y sirve la SPA detrás de Nginx. Para entornos reales sólo sustituyo las variables de entorno por valores seguros.

## Estructura del código
Mantengo el monorepo organizado por capas para localizar rápidamente cada responsabilidad.

```text
backend/
	src/
		main.ts                # Bootstrap NestJS, CORS, Swagger y seguridad
		app.module.ts          # Inyección de dependencias y módulos globales
		domain/                # Entidades y modelos ricos del dominio
		application/
			useCases/            # Casos de uso (comandos y consultas)
			ports/               # Interfaces que abstraen infraestructura
		infraestructure/
			http/                # Controladores, DTOs, guards y validaciones
			persistence/         # Adaptadores Prisma + repositorios
			security/            # Servicios de autenticación y estrategias JWT
		common/                # Filtros, interceptores y utilidades compartidas

frontend/
	src/
		main.tsx               # Bootstrap React y providers globales
		router.tsx             # Rutas públicas y protegidas
		layouts/               # Layouts específicos (público, dashboard)
		components/
			ui/                  # Componentes reutilizables con Tailwind/Radix
			layout/              # Shells, barras laterales, headers
		lib/                   # Providers de auth, carrito, favoritos
		services/              # Clientes HTTP centralizados (Axios)
		hooks/                 # Hooks personalizados (analytics, auth)
		pages/                 # Vistas por dominio (productos, checkout, admin)
```
El resto del repositorio agrupa infraestructura (`docker-compose*`, `nginx/`), migraciones Prisma (`backend/prisma/`) y scripts de automatización.

## API principal
📌 Documenté la API con Swagger en `http://localhost:3000/api/docs` y versioné todo bajo `api/v1`. Estos son los endpoints que más utilizo:

| Método | Endpoint | Descripción | Autenticación |
| --- | --- | --- | --- |
| GET | `/api/v1/health` | Salud de la API para Docker/monitorización | No |
| POST | `/api/v1/auth/login` | Iniciar sesión y obtener tokens | No |
| POST | `/api/v1/auth/register` | Registrar cliente con validaciones | No |
| GET | `/api/v1/auth/me` | Perfil del usuario autenticado | Bearer JWT |
| GET | `/api/v1/productos` | Catálogo con filtros avanzados | No |
| POST | `/api/v1/productos` | Crear producto (admin/empleado) | Bearer + rol |
| POST | `/api/v1/checkout` | Orquestar compra del carrito actual | Bearer JWT |
| GET | `/api/v1/pedidos` | Pedidos filtrados por estado/fecha | Bearer + rol |
| PATCH | `/api/v1/pedidos/:id/estado` | Actualizar estado de pedido | Bearer + rol |
| GET | `/api/v1/reportes/dashboard` | Analítica para dashboard admin | Bearer + rol |

Los controladores siguen un patrón claro: DTOs con `class-validator`, guards para JWT + roles y casos de uso en la capa `application`. Para más detalle siempre puedo entrar al Swagger o leer `backend/src/infraestructure/http/controllers`.

## Pruebas
🧪 Separé las suites por tipo de capa:

- **Backend**
	- Unitarias: `cd backend && npm test`
	- Cobertura: `cd backend && npm run test:cov`
	- End-to-end (HTTP sobre servidor Nest real): `cd backend && npm run test:e2e`
	- Semillas antes de e2e: `npm run db:seed`
- **Frontend**
	- Unitarias/componentes: `cd frontend && npm test`
	- Watch mode: `npm run test:watch`
	- Cobertura y reporting: `npm run test:coverage`

La CI en GitHub Actions ejecuta lint y pruebas críticas en cada push a `master`, lo que me ayuda a mantener la base estable.

## Despliegue
Automatizo los despliegues con pipelines simples:

- **Backend (Railway)**: cada merge a `master` dispara un deploy que construye el Dockerfile del backend, aplica `prisma migrate deploy` y arranca la app. Sólo necesito configurar variables (`DATABASE_URL`, `JWT_SECRET`, `SMTP_*`, `PAYPAL_*`, `FRONTEND_URL`).
- **Frontend (Vercel)**: Vercel detecta el paquete `frontend`, ejecuta `npm install` + `npm run build` y publica la SPA. Las variables `VITE_API_URL` y `VITE_PAYPAL_CLIENT_ID` se definen en el dashboard de Vercel.
- **Infraestructura opcional**: cuando quiero auto-hospedar uso `docker-compose.yml` con Nginx como reverse proxy. El tráfico público entra por Nginx, que enruta a la SPA y la API (`/api`).

Antes de desplegar reviso migraciones (`prisma migrate status`) y ejecuto `npm run build` en ambos paquetes para asegurarme de que no existen errores de compilación.

## Contribuciones
Estoy abierto a contribuciones. El flujo propuesto está documentado en `CONTRIBUTING.md`, pero en resumen:

1. Crea una rama desde `master` siguiendo Conventional Commits (`feat/`, `fix/`, etc.).
2. Alinea tu entorno (`cp backend/.env.example backend/.env` y `cp frontend/.env.example frontend/.env`).
3. Ejecuta lint y pruebas antes de abrir el PR (`npm run lint`, `npm test`).
4. Describe claramente el cambio, adjunta evidencia visual si afecta a la UI y verifica que no incluyes secretos.

Si detectas vulnerabilidades, utiliza el flujo privado descrito en `SECURITY.md`.

## Licencia
El proyecto está licenciado bajo **Apache License 2.0**. Puedes revisar los términos completos en `LICENSE`.

## Autor y contacto
👤 Soy **Luis Manuel De La Cruz Ledesma** (`@luismanuelcldev`). Si quieres ponerte en contacto conmigo:
- Abre un issue en GitHub para bugs, preguntas o nuevas ideas.
- Para conversaciones directas, envía un mensaje privado desde mi perfil de GitHub.

Estoy activo en el repositorio y doy seguimiento continuo a feedback y mejoras.

