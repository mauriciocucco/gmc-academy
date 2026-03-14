# AGENTS.md — GMC Academy

Guia para agentes de IA que trabajen en este repositorio.

> **Limite de este archivo: 200 lineas.** Antes de agregar contenido nuevo, elimina
> lo obsoleto o resumelo. Actualiza este archivo (y `README.md` si aplica) cada vez
> que agregues endpoints, servicios, reglas de negocio o cambios de arquitectura.

## Descripcion del proyecto

Plataforma e-learning para Autoescuela GMC. Dos roles: `student` y `admin`.  
El frontend esta en este repositorio. El backend NestJS + PostgreSQL es un proyecto separado.

## Stack y versiones

| Tecnologia      | Version |
| --------------- | ------- |
| React           | 19      |
| React Router    | 7       |
| TypeScript      | 5       |
| Tailwind CSS    | 4       |
| Vite            | 7       |
| Node.js         | 22      |
| Package manager | pnpm    |

## Instrucciones generales para el agente

1. **Leer primero** el documento de diseno completo antes de cualquier cambio estructural:  
   [`docs/plans/2026-02-16-gmc-elearning-design.md`](docs/plans/2026-02-16-gmc-elearning-design.md)

2. **Instalar dependencias** con `pnpm`, nunca con `npm` ni `yarn`.

3. **Verificar tipos** antes de dar una tarea por terminada:

   ```bash
   pnpm typecheck
   ```

4. **No modificar** la estructura de carpetas ni la arquitectura existente sin instruccion explicita.

5. **Actualizar documentacion** al terminar cada tarea: reflejar nuevos endpoints en la seccion "API", nuevos servicios en la tabla de "Capa API", y reglas de negocio en "Seguridad". Actualizar `README.md` si el estado del proyecto cambia.

6. **Marcar material como visto** al hacer click en cualquier link: llamar a `setMaterialViewed(id, true)` (fire-and-forget). El check en la card permite toggle.

## Estructura de rutas

```text
/login                  → login.tsx
/change-password        → change-password.tsx   (RequireAuth; forzado si `mustChangePassword === true`)
/student                → student.home.tsx      (RequireAuth + RequireRole student)
/student/materials      → student.materials.tsx
/student/exam           → student.exam.tsx
/student/certificate    → student.certificate.tsx
/student/profile        → student.profile.tsx
/admin                  → admin.home.tsx         (RequireAuth + RequireRole admin)
/admin/exam             → admin.exam.tsx
/admin/materials        → admin.materials.tsx
/admin/students         → admin.students.tsx
/admin/students/new     → admin.student-create.tsx
/admin/students/:id     → admin.student-detail.tsx
```

## Convenciones de codigo

- **Componentes**: PascalCase, un componente por archivo.
- **Hooks y utilidades**: camelCase, prefijo `use` para hooks.
- **Archivos de ruta**: `rol.pagina.tsx` (ej. `student.home.tsx`).
- **Tailwind**: usar clases utilitarias directamente; no crear CSS custom salvo tokens en `app.css`.
- **Tipado**: siempre tipado explicito. Evitar `any`.
- **Guard clauses**: maximo 2 niveles de anidamiento; retorno temprano.

## Auth

La autenticacion esta integrada con el backend real (`POST /api/v1/auth/login`).
Los tokens `accessToken` y `refreshToken` se persisten en `localStorage`.
Al iniciar la app se hidrata la sesion via `GET /api/v1/me`.
`login` y `me` deben devolver `mustChangePassword`; si llega en `true`, el frontend fuerza `/change-password` hasta completar `PATCH /api/v1/me/password`.

Credenciales de prueba: `student@gmc.com` / `password` · `admin@gmc.com` / `password`

Para cambiar de proveedor: modificar `app/lib/api/auth.service.ts` y `app/lib/api/client.ts`.

## Capa API

Los servicios tipados estan en `app/lib/api/`:

| Archivo                   | Descripcion                                                       |
| ------------------------- | ----------------------------------------------------------------- |
| `client.ts`               | Cliente fetch con auth, refresh transparente y manejo de 401      |
| `types.ts`                | Tipos compartidos (AuthSession, MaterialResponse, etc.)           |
| `errors.ts`               | ApiError normalizado                                              |
| `auth.service.ts`         | login, logout, getMe, getMyProgress, updateMe, uploadProfilePhoto, changePassword |
| `materials.service.ts`    | CRUD de materiales, setMaterialViewed, unmarkMaterialViewed       |
| `exams.service.ts`        | getActiveExam, submitExam                                         |
| `attempts.service.ts`     | getMyAttempts, getMyAttemptDetail                                 |
| `certificates.service.ts` | getLatestCertificate, generateCertificatePdf                      |
| `admin.service.ts`        | KPIs admin, alta de alumnos, detalle, notas, materials-progress, intentos, performance, material assignments y configuracion del examen |

Variable de entorno: `VITE_API_BASE_URL` (default: `http://localhost:3000/api/v1`)

## Fases del proyecto

| Fase | Descripcion                         | Estado     |
| ---- | ----------------------------------- | ---------- |
| 0    | Shell frontend con rutas y layout   | Completada |
| 1    | Backend NestJS base + PostgreSQL    | Pendiente  |
| 2    | Login real + sesion JWT             | Completada |
| 3    | CRUD materiales real                | Completada |
| 4    | Examen con persistencia de intentos | Completada |
| 5    | Certificado PDF                     | Completada |
| 6    | Panel admin con KPIs reales         | Completada |
| 7    | QA y despliegue                     | Pendiente  |

## API

```
POST /api/v1/auth/login
PATCH /api/v1/me/password    (auth, body: { currentPassword, newPassword })
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/me
PATCH /api/v1/me              (student, body: UpdateMeDto)
POST /api/v1/me/profile-photo (student, multipart file)
GET  /api/v1/materials
POST /api/v1/materials            (admin)
PATCH /api/v1/materials/:id       (admin)
DELETE /api/v1/materials/:id      (admin)
GET  /api/v1/admin/exam                              (admin)
PATCH /api/v1/admin/exam                             (admin, body: { title, description, passScore, questions: [{ id?, text, position, options: [{ id?, label, isCorrect }] }] })
POST /api/v1/admin/students                          (admin, body: { fullName, email, phone? }, response: { id, fullName, email, phone, temporaryPassword, mustChangePassword })
GET  /api/v1/admin/students/:id/material-assignments   (admin)
PATCH /api/v1/admin/students/:id/material-assignments  (admin, body: { assignments: [{ materialId, position }] })
GET  /api/v1/admin/students/:id                        (admin)
PATCH /api/v1/admin/students/:id/note                 (admin, body: { content: string | null })
GET  /api/v1/admin/students/:id/materials-progress    (admin)
GET  /api/v1/admin/students/:id/attempts               (admin)
GET  /api/v1/admin/students/:id/attempts/:attemptId    (admin)
GET  /api/v1/exams/active
POST /api/v1/exams/:id/submit
GET  /api/v1/attempts/me
GET  /api/v1/attempts/me/:id
GET  /api/v1/certificates/me/latest
GET  /api/v1/me/progress          (student)
PATCH /api/v1/materials/:id/view  (student, body: { viewed: boolean })
DELETE /api/v1/materials/:id/view/:studentId (admin)
GET  /api/v1/admin/students       (admin)
GET  /api/v1/admin/stats          (admin)
GET  /api/v1/admin/performance    (admin)
```

## Examen (frontend)

- La pantalla `/student/exam` consulta `GET /api/v1/attempts/me` para detectar si el alumno ya rindio o aprobo.
- El alumno puede volver a rendir aunque ya tenga un intento aprobado.
- La revision detallada se obtiene con `GET /api/v1/attempts/me/:id`, por lo que puede reabrirse aunque el intento haya sido hecho desde otro navegador o sesion.
- La pantalla `/admin/exam` consume `GET /api/v1/admin/exam` y guarda cambios con `PATCH /api/v1/admin/exam`.
- El backend debe devolver las opciones con `isCorrect` solo para admin; `GET /api/v1/exams/active` no debe exponer la respuesta correcta al alumno.

## Calculo de progreso del estudiante

El endpoint `GET /api/v1/me/progress` devuelve `{ materialsTotal, materialsViewed, examPassed, certificateIssued }`.
El porcentaje de progreso se calcula por tareas:

- Total de tareas: `materialsTotal + 2` (examen + certificado).
- Tareas completadas: `materialsViewed + (examPassed ? 1 : 0) + (certificateIssued ? 1 : 0)`.
- Porcentaje: `round((tareasCompletadas / tareasTotales) * 100)`.
- `materialsViewed` se limita al rango `0..materialsTotal` para evitar valores invalidos.

Las tarjetas de home mantienen el badge "Completado" por hito:
- Materiales: `materialsViewed >= materialsTotal && materialsTotal > 0`.
- Examen: `examPassed === true`.
- Certificado: `certificateIssued === true`.

Esta logica esta implementada en `app-shell.tsx` (mini-barra en el header) y en `student.home.tsx` (barra grande + badges por tarjeta).

## Seguridad (reglas de negocio)

- `student` no puede administrar materiales ni ver datos de otros alumnos.
- `student` solo puede listar y marcar como visto materiales que esten desbloqueados para su usuario.
- Si `mustChangePassword === true`, el usuario autenticado no puede acceder al campus hasta definir su contraseña definitiva.
- El orden de materiales visible para `student` lo define `admin` por alumno y debe respetarse en `GET /api/v1/materials`.
- El progreso del alumno debe contar solo los materiales desbloqueados para ese alumno.
- `admin` no puede alterar el historico de intentos de examenes.
- `admin` puede crear alumnos y el backend debe asignar siempre rol `student`.
- `admin` puede editar el examen activo y el porcentaje de aprobacion, pero cada intento debe conservar el snapshot de preguntas/respuestas usado al rendir.
- `admin` puede ver progreso, estadisticas, respuestas y datos de contacto del alumno solo desde endpoints protegidos de admin.
- La nota interna del alumno es solo para `admin` y nunca debe exponerse en endpoints de `student`.
- La contraseña temporal generada al crear un alumno debe devolverse solo en `POST /api/v1/admin/students` y no quedar expuesta en lecturas posteriores.
- Las rutas de admin estan protegidas por `RequireRole` en el frontend y por `RolesGuard` en el backend.

## Documentacion de librerias

Antes de usar APIs de librerias/frameworks, consultar Context7:

- `resolve-library-id` → obtener el ID de la libreria.
- `get-library-docs` → obtener documentacion actualizada.

Librerias prioritarias: `react-router`, `nestjs`, `tailwindcss`, `postgresql`.
