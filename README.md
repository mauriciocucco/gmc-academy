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
| `admin`   | Inicio con KPIs y graficos, Configuracion del examen, Gestion de materiales, alta de alumnos y tabla de alumnos con ficha detallada |

## Estado actual

- [x] Shell navegable con rutas protegidas por rol
- [x] Login real contra backend (`POST /api/v1/auth/login`)
- [x] Cambio obligatorio de contraseña al primer ingreso cuando `mustChangePassword === true`
- [x] Sesion JWT persistida en `localStorage` con refresh transparente
- [x] Panel estudiante: materiales reales, examen con submit real, reintento habilitado y revision del ultimo intento via backend, certificado PDF on-demand
- [x] Progreso del estudiante calculado en backend (`GET /api/v1/me/progress`)
- [x] Materiales marcados/desmarcados como vistos por el alumno (`PATCH /api/v1/materials/:id/view`)
- [x] Admin puede desmarcar un material como visto para un alumno (`DELETE /api/v1/materials/:id/view/:studentId`)
- [x] Panel admin: KPIs reales, configuracion del examen activo, CRUD de materiales real, asignacion de materiales por alumno, CRUD de categorias y ficha de seguimiento por estudiante con nota interna y materiales vistos/pendientes
- [x] Alta de alumnos desde admin con pantalla dedicada y credencial temporal generada por backend
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

## Auth y primer ingreso

- `POST /api/v1/auth/login` y `GET /api/v1/me` deben devolver `mustChangePassword`.
- Si `mustChangePassword === true`, el frontend redirige a `/change-password` y bloquea el acceso al resto de rutas protegidas.
- La pantalla `/change-password` guarda la contraseña definitiva con `PATCH /api/v1/me/password` enviando `{"currentPassword":"...","newPassword":"..."}`.
- Luego del cambio exitoso, el backend debe devolver `mustChangePassword: false` en `GET /api/v1/me`.

## Materiales por alumno

- El admin crea materiales en la biblioteca global y luego define, por alumno, cuales quedan desbloqueados y en que orden se muestran.
- La vista `/admin/materials/categories` administra las categorias disponibles para el select de materiales.
- Si no existen categorias, `/admin/materials` bloquea el alta y redirige a la gestion de categorias.
- El frontend espera `GET /api/v1/admin/students/:id/material-assignments` para leer la asignacion actual del alumno.
- El frontend guarda cambios con `PATCH /api/v1/admin/students/:id/material-assignments` enviando `{"assignments":[{"materialId":"...","position":1}]}`.
- `GET /api/v1/materials` debe devolver al alumno solo los materiales desbloqueados para su usuario y ya ordenados por `position`.
- `GET /api/v1/me/progress` debe calcular `materialsTotal` y `materialsViewed` sobre los materiales desbloqueados para ese alumno.
- Las categorias nuevas usan el nombre devuelto por backend; si no tienen estilo visual dedicado en `student.materials.tsx`, caen en el esquema visual por defecto.

## Seguimiento admin por alumno

- La vista `/admin/students` consume `GET /api/v1/admin/students` para el listado base.
- La vista `/admin/students/new` permite crear un alumno con `POST /api/v1/admin/students`.
- El backend debe generar la contraseña temporal y devolverla solo en la respuesta del alta junto con `mustChangePassword`.
- Cada fila navega a `/admin/students/:id` para abrir la ficha completa del alumno.
- La ficha individual del alumno espera `GET /api/v1/admin/students/:id` con `email`, `phone`, `progress`, `stats` y `note`.
- La misma ficha guarda la nota interna con `PATCH /api/v1/admin/students/:id/note`.
- La misma ficha consulta `GET /api/v1/admin/students/:id/materials-progress` para listar materiales asignados, ordenados y separados por vistos/pedientes.
- El historial de examenes se obtiene con `GET /api/v1/admin/students/:id/attempts`.
- La revision de respuestas por intento se obtiene con `GET /api/v1/admin/students/:id/attempts/:attemptId`.
- Los botones de contacto usan `mailto:` y `wa.me`, por lo que el telefono debe llegar con prefijo internacional para abrir WhatsApp correctamente.
- La nota interna es exclusiva de `admin` y no debe exponerse en ningun endpoint de `student`.

## Configuracion del examen admin

- La vista `/admin/exam` consume `GET /api/v1/admin/exam` para leer el examen activo editable.
- La misma vista guarda cambios con `PATCH /api/v1/admin/exam`.
- El payload esperado incluye `title`, `description`, `passScore` y `questions`, donde cada pregunta envia `position` y `options` con `isCorrect`.
- El backend debe devolver `updatedAt` y `updatedByName` para mostrar trazabilidad de cambios.
- `GET /api/v1/exams/active` debe seguir entregando solo lo necesario para el alumno y nunca la opcion correcta.
- Los intentos historicos deben conservar el snapshot del examen rendido para que editar preguntas no cambie revisiones pasadas.

## Proximos pasos

**Fase 1 del backend** (proyecto NestJS separado):

1. Levantar NestJS con modulos `auth`, `users`, `materials`, `exams`, `certificates`.
2. Conexion PostgreSQL + migraciones + seed.
3. Exponer los endpoints documentados en [docs/plans/2026-02-18-frontend-backend-integration-implementation-plan.md](docs/plans/2026-02-18-frontend-backend-integration-implementation-plan.md).
