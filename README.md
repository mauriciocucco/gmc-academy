# GMC Academy

Plataforma e-learning para Autoescuela GMC. MVP con autenticacion por rol, materiales, examen de practica y certificado de aprobacion.

## Stack

| Capa            | Tecnologia                                   |
| --------------- | -------------------------------------------- |
| Frontend        | React 19 + React Router v7 + Tailwind CSS v4 |
| Backend         | NestJS + JWT (proyecto separado)             |
| Base de datos   | PostgreSQL                                   |
| Runtime         | Node.js 22                                   |
| Package manager | pnpm                                         |

## Roles

| Rol       | Acceso                                                   |
| --------- | -------------------------------------------------------- |
| `student` | Inicio, Materiales, Examen, Certificado                  |
| `admin`   | Inicio con KPIs, Gestion de materiales, Tabla de alumnos |

## Estado actual

- [x] Shell navegable con rutas protegidas por rol
- [x] Login real contra backend (`POST /api/v1/auth/login`)
- [x] Sesion JWT persistida en `localStorage` con refresh transparente
- [x] Panel estudiante: materiales reales, examen con submit real, certificado PDF on-demand
- [x] Progreso del estudiante calculado en backend (`GET /api/v1/me/progress`)
- [x] Materiales marcados como vistos al abrirlos (`POST /api/v1/materials/:id/view`)
- [x] Panel admin: KPIs reales, tabla de alumnos real, CRUD de materiales real
- [ ] Backend NestJS + PostgreSQL (pendiente — proyecto separado)
- [ ] QA y despliegue (Fase 7 pendiente)

> Requiere el backend corriendo en `http://localhost:3000` (configurable via `VITE_API_BASE_URL`).

## Variables de entorno

```bash
VITE_API_BASE_URL=http://localhost:3000/api/v1   # default si no se define
```

## Scripts

```bash
pnpm dev        # servidor de desarrollo
pnpm build      # build de produccion
pnpm start      # sirve el build
pnpm typecheck  # validacion de tipos
```

## Estructura del proyecto

```text
app/
  components/     # componentes compartidos (AppShell, RouteGuards, WhatsAppButton)
  data/           # mock data temporal (no usado en rutas productivas)
  lib/
    auth.tsx      # AuthProvider con sesion JWT real
    api/          # capa de servicios tipados (client, types, errors, *.service)
  routes/         # paginas por rol (student.*, admin.*, login, index)
docs/
  plans/          # documentos de diseno y arquitectura
public/
  images/
```

## Arquitectura objetivo

Ver [docs/plans/2026-02-16-gmc-elearning-design.md](docs/plans/2026-02-16-gmc-elearning-design.md) para el plan completo de fases, API, esquema de datos y decisiones de diseno.

## Proximos pasos

**Fase 1 del backend** (proyecto NestJS separado):

1. Levantar NestJS con modulos `auth`, `users`, `materials`, `exams`, `certificates`.
2. Conexion PostgreSQL + migraciones + seed.
3. Exponer los endpoints documentados en [docs/plans/2026-02-18-frontend-backend-integration-implementation-plan.md](docs/plans/2026-02-18-frontend-backend-integration-implementation-plan.md).
