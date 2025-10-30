# Sistema de pedidos — Backend

Backend desarrollado con NestJS y Prisma sobre PostgreSQL. Expone APIs para autenticación, gestión de productos, pedidos, usuarios y operaciones auxiliares (carrito, zonas de entrega, reportes, configuración). Está preparado para desarrollo local y despliegue en Docker, con pruebas unitarias y e2e listas.

## Requirements
Para ejecutar y mantener el servicio en condiciones productivas, necesito:

● Node.js 20.x y npm 10+ (para desarrollo y build).

● PostgreSQL 14+ accesible vía `DATABASE_URL`.

● Variables JWT definidas en `.env` (ver sección Variables de entorno).

● Opcional: Docker Engine + BuildKit si quieres contenedores reproducibles.

Tu tarea al operar este backend es mantener la base de datos migrada, los secretos seguros y las imágenes actualizadas. Incluyo más abajo comandos y notas de operación.

## Tecnologías seleccionadas
- NestJS como framework HTTP modular orientado a arquitectura limpia.
- Prisma como ORM tipado y generador de cliente para PostgreSQL.
- Passport + JWT para autenticación y control de acceso por roles.
- class-validator / class-transformer para validaciones en DTOs.
- Jest y Supertest para pruebas unitarias y end-to-end.
- Docker multi-stage para builds repetibles y ejecución en producción.

## Justificación general
- NestJS me da módulos, inyección de dependencias y capas bien separadas (domain/application/infra) que facilitan testeo y mantenimiento.
- Prisma ofrece tipos en tiempo de compilación y migraciones versionadas, reduciendo errores en consultas.
- JWT simplifica sesiones stateless y, junto con guards/decorators, habilita políticas por rol.
- La estrategia de puertos (interfaces) desacopla casos de uso de la persistencia; puedo sustituir la implementación Prisma sin tocar la aplicación.

## Estructura del proyecto
```
backend/
├─ Dockerfile                          # Build multi-stage (compila a build/)
├─ package.json                        # Scripts: build, start, test, prisma seed
├─ nest-cli.json                       # outDir=build, builder=tsc
├─ tsconfig.json                       # paths @/application, @/domain, @/infraestructure
├─ tsconfig.build.json                 # excluye test y salidas del build
├─ .env.example                        # variables requeridas y opcionales
├─ prisma/
│  ├─ schema.prisma                    # modelos y relaciones
│  ├─ seed.js                          # datos iniciales (admin/cliente/repartidor, zonas, config)
│  ├─ migrations/                      # historial de migraciones
│  └─ README.md                        # guía de migraciones y notas
└─ src/
   ├─ main.ts                          # bootstrap Nest
   ├─ app.module.ts                    # módulo raíz
   ├─ common/                          # filters, interceptors, utils
   ├─ domain/                          # entidades de dominio (Usuario, Producto, Pedido, ...)
   ├─ application/                     # puertos y casos de uso
   │  ├─ ports/                        # contratos (repositorios y queries)
   │  └─ useCases/                     # orquestadores de negocio (crear, listar, checkout, ...)
   └─ infraestructure/
      ├─ http/                         # controladores, DTOs, guards, servicios
      ├─ persistence/prisma/           # mappers y repositorios Prisma
      └─ security/                     # auth.module, jwt.strategy, etc.
```

## Arquitectura y capas
- Domain: entidades puras (Producto, Pedido, Usuario, etc.) con invariantes y comportamientos.
- Application: casos de uso que orquestan reglas de negocio contra puertos (interfaces) sin conocer la persistencia.
- Infrastructure: adaptadores HTTP (controllers/DTOs) y persistencia Prisma (repositorios/mappers) que implementan los puertos.
- Common: filtros (HttpException), interceptores (logging) y utilidades.

Diagrama general (conceptual): Domain ⇄ Application ⇄ Ports ⇄ Infrastructure (HTTP/Prisma).

## Componentes y responsabilidades
- Autenticación (JWT): registro (`POST /auth/register`), login (`POST /auth/login`), perfil (`GET /auth/me`).
- Productos: CRUD protegido por rol administrador; listado y detalle públicos.
- Pedidos: checkout desde carrito, cambio de estado y asignación de repartidor con notificaciones.
- Usuarios: gestión administrativa de cuentas (alta, actualización selectiva).
- Carrito y stock: actualización de stock al crear/editar productos y al confirmar pedidos.
- Configuración del sistema y zonas de entrega: parámetros operativos y geográficos usados por el negocio.

Guards/decorators destacados:
- `JwtAuthGuard` y `RolesGuard` aplican autenticación y autorización.
- Decorators `@Public()` y `@Roles(...)` controlan el acceso por endpoint.

## Variables de entorno
Archivo de referencia: `.env.example`.
- `DATABASE_URL`: cadena de conexión a PostgreSQL.
- `JWT_SECRET` y `JWT_EXPIRES_IN`: secreto y TTL del access token.
- `REFRESH_TOKEN_SECRET` y `REFRESH_TOKEN_EXPIRES_IN`: secreto y TTL del refresh token (si aplica).
- Opcionales: `UPLOADS_DIR`, `SHIPPING_ORIGIN_LAT`, `SHIPPING_ORIGIN_LNG`.

## Base de datos y migraciones (Prisma)
- Esquema: `prisma/schema.prisma` (modelos y enums documentados).
- Migraciones: `prisma/migrations` (no editar archivos ya generados para evitar drift).
- Seed: `prisma/seed.js` inserta usuarios base, zona nacional, tarifas, dirección de ejemplo y configuración del sistema.
Comandos útiles:

```bash
# Generar cliente Prisma
yarn prisma generate || npx prisma generate

# Ver estado de migraciones
npx prisma migrate status

# Aplicar migraciones de desarrollo
npx prisma migrate dev

# Ejecutar seed
npm run db:seed
```

## Desarrollo local
```bash
# 1) Instalar dependencias
npm ci

# 2) Generar cliente Prisma
npx prisma generate

# 3) Migrar BD (dev) y seed opcional
npx prisma migrate dev
npm run db:seed

# 4) Levantar en modo watch
npm run start:dev
```

## Docker
- `Dockerfile` multi-stage: compila en builder y ejecuta con dependencias de producción (salida en `build/`).
- Variante `Dockerfile.cache` para builds locales acelerados con cache mount.

Build y run:
```bash
# Construir imagen
docker build -t sistemapedidos-backend -f Dockerfile .

# Ejecutar con variables de entorno
docker run --env-file .env -p 3000:3000 sistemapedidos-backend
```

## Pruebas
```bash
# Unitarias
npm test

# Cobertura
npm run test:cov

# End-to-End
npm run test:e2e
```
Las pruebas e2e inician una app Nest real y usan Supertest contra rutas HTTP. Antes de cada suite se reinicia el estado de tablas con `TRUNCATE` (vía Prisma) para resultados deterministas.

## API rápida (endpoints clave)
- Autenticación: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`.
- Productos: `GET /productos`, `GET /productos/:id`, `POST /productos` (ADMIN), `PATCH /productos/:id` (ADMIN), `DELETE /productos/:id` (ADMIN).
- Usuarios: `POST /usuarios` (ADMIN), `PATCH /usuarios/:id` (ADMIN).
Nota: algunos endpoints requieren header `Authorization: Bearer <token>` y rol específico.

## Configuración del compilador y Nest
- `nest-cli.json`
  - `sourceRoot`: `src` como raíz del código.
  - `outDir`: `build` (consistente con `Dockerfile`).
  - `builder: tsc`: TypeScript nativo (sin webpack).

- `tsconfig.json`
  - Objetivo `ES2020`, decoradores habilitados, `paths` para alias (`@/application`, `@/domain`, `@/infraestructure`).
  - `outDir=./build` y `skipLibCheck` para acelerar typecheck.

- `tsconfig.build.json`
  - Extiende `tsconfig.json` y excluye pruebas y directorios de salida.

- `tsconfig.eslint.json`
  - Extiende `tsconfig.json` e incluye `src/**/*` y `test/**/*` para ESLint.

## Seguridad
- Mantener secretos JWT fuera del repositorio; usar `.env` locales y variables seguras en CI/CD.
- Endpoints protegidos por `JwtAuthGuard` y `RolesGuard`; usar `@Public()` solo cuando sea estrictamente necesario.
- Validaciones con DTOs evitan payloads inválidos; errores se canalizan por el `HttpExceptionFilter`.

## Operación y mantenimiento
- Para cambios de esquema: actualizar `schema.prisma`, generar cliente y crear migración; no editar migraciones ya aplicadas.
- Backups de BD recomendados antes de migraciones críticas.
- Revisar logs y métricas (si se integran) para detectar excepciones o degradaciones.

## Notas finales
- El directorio `uploads/products/` puede montarse en volumen persistente en producción.
- Si se requiere documentación OpenAPI, puede habilitarse con Swagger en el bootstrap (no incluido en este README).

