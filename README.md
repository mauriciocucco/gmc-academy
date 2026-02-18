# GMC Academy

Plataforma e-learning para Autoescuela GMC. MVP con autenticacion por rol, materiales, examen de practica y certificado de aprobacion.

## Stack

| Capa                        | Tecnologia                                   |
| --------------------------- | -------------------------------------------- |
| Frontend                    | React 19 + React Router v7 + Tailwind CSS v4 |
| Backend (planificado)       | NestJS + JWT                                 |
| Base de datos (planificada) | PostgreSQL                                   |
| Runtime                     | Node.js 22                                   |
| Package manager             | pnpm                                         |

## Roles

| Rol       | Acceso                                                   |
| --------- | -------------------------------------------------------- |
| `student` | Inicio, Materiales, Examen, Certificado                  |
| `admin`   | Inicio con KPIs, Gestion de materiales, Tabla de alumnos |

## Estado actual (Fase 0 completada)

- [x] Shell navegable con rutas protegidas por rol
- [x] Login demo local (`student` / `admin`)
- [x] Panel estudiante: inicio, materiales, examen, certificado (placeholder)
- [x] Panel admin: KPIs mock, gestion de materiales mock, tabla de alumnos mock
- [ ] Backend NestJS (Fase 1 pendiente)
- [ ] Login real contra API (Fase 2 pendiente)
- [ ] CRUD materiales real (Fase 3 pendiente)
- [ ] Examen con persistencia (Fase 4 pendiente)
- [ ] Generacion de certificado PDF (Fase 5 pendiente)

> Los datos de sesion y de ejemplo son locales hasta conectar el backend.

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
  data/           # mock data temporal
  lib/            # auth provider y utilidades
  routes/         # paginas por rol (student.*, admin.*, login, index)
docs/
  plans/          # documentos de diseno y arquitectura
public/
  images/
```

## Arquitectura objetivo

Ver [docs/plans/2026-02-16-gmc-elearning-design.md](docs/plans/2026-02-16-gmc-elearning-design.md) para el plan completo de fases, API, esquema de datos y decisiones de diseno.

## Proximos pasos

Arrancar **Fase 1 + Fase 2**:

1. Levantar NestJS con modulos `auth` y `users`.
2. Conexion PostgreSQL + migraciones + seed.
3. Reemplazar auth mock por login real con JWT.
4. Proteccion de rutas por rol contra API real.
