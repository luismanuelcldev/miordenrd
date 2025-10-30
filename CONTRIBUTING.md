# Contribuir al proyecto

¡Gracias por tu interés en contribuir! Este repositorio contiene un monorepo con un backend (NestJS) y un frontend (React + Vite). A continuación encontrarás cómo preparar el entorno, pautas de código y el flujo de contribuciones.

## Requisitos
- Node.js 20.x y npm 10+.
- Docker y Docker Compose (opcional para entorno completo).
- Git y una cuenta de GitHub.

## Preparación del entorno
```bash
git clone https://github.com/<owner>/<repo>.git
cd sistemapedidos

# Backend
cp backend/.env.example backend/.env
cd backend && npm ci && npm run start:dev

# Frontend
cp ../frontend/.env.example ../frontend/.env
cd ../frontend && npm ci && npm run dev
```

Con Docker Compose (opcional):
```bash
docker-compose -f docker-compose.dev.yml up -d
```

## Estándares de código
- TypeScript estricto donde sea posible; evita `any` sin justificar.
- Lint y formateo: `npm run lint` antes de abrir un PR.
- Arquitectura: seguir los patrones del repo (ports/use cases en backend; services/providers en frontend).
- UI: utiliza componentes `ui/` y Tailwind; evita CSS global salvo necesidad.

## Commits y ramas
- Convenciones de commit (Conventional Commits):
  - `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `perf:`, `ci:`
- Ramas:
  - `feature/<resumen-corto>`
  - `fix/<resumen-corto>`
  - `chore/<resumen-corto>`

## Pruebas
- Backend: `cd backend && npm test` (unitarias) y `npm run test:e2e` (e2e).
- Frontend: `cd frontend && npm test` (Vitest + MSW + Testing Library).

## Checklist para PRs
- [ ] Descripción clara del cambio y motivación.
- [ ] Sin secretos ni credenciales en cambios.
- [ ] Lint y tests pasan localmente.
- [ ] Documentación/README actualizados si aplica.
- [ ] Screenshots o GIFs si hay cambios de UI.

## Seguridad y secretos
- Nunca commit de `.env` ni certificados (ya están en `.gitignore`).
- Variables de entorno en frontend deben empezar con `VITE_`.
- Usa GitHub Secrets para CI/CD.

## Reporte de vulnerabilidades
No abras issues públicos para vulnerabilidades. Usa “Security > Report a vulnerability” en GitHub (ver `SECURITY.md`).

## Conducta
Sé respetuoso y profesional; feedback constructivo. Este proyecto adopta buenas prácticas de colaboración abierta.
