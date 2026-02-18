# GMC Academy - Plan de Implementacion Frontend <-> Backend

Fecha: 2026-02-18  
Proyecto: `gmc-academy` (frontend) + `gmc-academy-backend` (NestJS)

## 1. Objetivo

Integrar el frontend actual (hoy mock) con el backend real, alineando autenticacion, contratos de datos y flujos de negocio para student/admin sin romper la UX existente.

## 2. Alcance

Incluido:

- Auth real con JWT (`login`, `refresh`, `logout`, `me`).
- Consumo real de materiales, examen, intentos, certificados y panel admin.
- Reemplazo de mocks en pantallas principales.
- Manejo de errores y estados de carga por pantalla.
- Actualizacion de documentacion del repo frontend.

No incluido:

- Cambios estructurales grandes de arquitectura.
- Rediseno visual mayor.
- Nuevos features fuera del contrato existente.

## 3. Decisiones Funcionales Cerradas

1. Materiales para estudiante: Opcion A.
- Se mantiene la logica backend actual: requiere acceso explicito por alumno y `published=true`.

2. Gestion de refresh token en frontend: Opcion A.
- Se almacenan `accessToken` y `refreshToken` en `localStorage` con refresh transparente.

3. Certificado PDF: Opcion A.
- Se genera on-demand con `POST /certificates/me/latest/generate-pdf`.

## 4. Contrato API a Implementar en Frontend

Base URL: `http://localhost:3000/api/v1`

Auth y perfil:

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /me`

Student:

- `GET /materials`
- `GET /exams/active`
- `POST /exams/:id/submit`
- `GET /attempts/me`
- `GET /certificates/me/latest`
- `POST /certificates/me/latest/generate-pdf`

Admin:

- `GET /admin/stats`
- `GET /admin/students`
- `GET /admin/performance`
- `GET /materials`
- `GET /materials/categories`
- `POST /materials`
- `PATCH /materials/:id`
- `DELETE /materials/:id`
- `PATCH /materials/:id/access/:studentId`

## 5. Plan por Fases

### Fase 1 - Infra de Cliente API + Tipos

Objetivo: crear capa de integracion tipada y reusable.

Tareas:

- Crear `app/lib/api` (cliente fetch, tipos base, error normalizado).
- Definir `VITE_API_BASE_URL` y fallback.
- Implementar utilidades de headers auth (`Authorization: Bearer`).
- Crear servicios por feature:
  - `auth.service`
  - `materials.service`
  - `exams.service`
  - `attempts.service`
  - `certificates.service`
  - `admin.service`

Entregable:

- Capa API tipada funcionando con requests reales y manejo de errores.

### Fase 2 - Auth Real

Objetivo: reemplazar auth mock en frontend.

Tareas:

- Refactor de `app/lib/auth.tsx` para:
  - usar `login` real;
  - persistir `accessToken`, `refreshToken` y `user`;
  - hidratar sesion al iniciar via `GET /me`;
  - ejecutar `logout` real;
  - refrescar token cuando aplique.
- Actualizar `app/routes/login.tsx`:
  - eliminar logica de rol por email;
  - usar `email/password` reales;
  - mostrar errores de credenciales.
- Ajustar `app/components/app-shell.tsx` para `logout` real.

Entregable:

- Login/Logout/Session real y rutas protegidas por rol con backend.

### Fase 3 - Student: Materiales, Examen, Certificado

Objetivo: eliminar mocks en flujo student.

Tareas:

- `student.materials.tsx`:
  - consumir `GET /materials`;
  - adaptar render a `links[]` + `category`.
- `student.exam.tsx`:
  - consumir `GET /exams/active`;
  - mapear preguntas y opciones;
  - enviar `POST /exams/:id/submit`;
  - reflejar score/passed/certificateCode.
- `student.certificate.tsx`:
  - consumir `GET /certificates/me/latest`;
  - mostrar estado sin certificado;
  - habilitar descarga/generacion con `POST /certificates/me/latest/generate-pdf`.

Entregable:

- Flujo student completo contra backend real.

### Fase 4 - Admin: KPIs, Alumnos y Materiales

Objetivo: eliminar mocks en panel admin.

Tareas:

- `admin.home.tsx`:
  - usar `GET /admin/stats`;
  - opcional: sumar datos de `GET /admin/performance`.
- `admin.students.tsx`:
  - usar `GET /admin/students`;
  - contemplar `lastAttemptScore: null`.
- `admin.materials.tsx`:
  - usar `GET /materials` + `GET /materials/categories`;
  - crear/editar/eliminar material con endpoints reales;
  - mapear payload `categoryKey`, `links[]`, `published`;
  - si aplica, agregar UX para acceso por estudiante (`PATCH /materials/:id/access/:studentId`).

Entregable:

- Panel admin operativo con datos reales.

### Fase 5 - Hardening + QA

Objetivo: cerrar calidad para uso continuo.

Tareas:

- Estados de loading/error/empty consistentes.
- Manejo unificado de `401` (refresh o redirect a `/login`).
- Validaciones de formularios alineadas con DTO backend.
- Prueba end-to-end manual:
  - login student/admin
  - examen y submit
  - certificado
  - CRUD materiales admin
  - metricas admin.
- Ejecutar `pnpm typecheck`.

Entregable:

- Integracion estable y validada.

## 6. Mapeo de Tipos (Frontend necesario)

Auth:

- `AuthSession`: `accessToken`, `refreshToken`, `user { id, email, fullName, phone, role }`.

Material:

- `MaterialResponse`: `id`, `title`, `description`, `published`, `publishedAt`, `createdById`, `category { id, key, name }`, `links[]`.

Exam:

- `ActiveExamResponse`: `id`, `title`, `description`, `passScore`, `questions[]`.
- `SubmitExamDto`: `answers[]` con `questionId` y `optionId` (string).
- `SubmitExamResponse`: `attemptId`, `score`, `passed`, `correctAnswers`, `totalQuestions`, `certificateCode`.

Certificate:

- `LatestCertificateResponse`: objeto o `null`.
- `GeneratedCertificatePdfResponse`: `certificateId`, `pdfUrl`.

Admin:

- `AdminStats`, `AdminStudentItem`, `AdminPerformance`.

## 7. Archivos a Crear/Modificar (Checklist de Ejecucion)

Crear:

- `app/lib/api/client.ts`
- `app/lib/api/types.ts`
- `app/lib/api/errors.ts`
- `app/lib/api/auth.service.ts`
- `app/lib/api/materials.service.ts`
- `app/lib/api/exams.service.ts`
- `app/lib/api/attempts.service.ts`
- `app/lib/api/certificates.service.ts`
- `app/lib/api/admin.service.ts`

Modificar:

- `app/lib/auth.tsx`
- `app/routes/login.tsx`
- `app/routes/student.materials.tsx`
- `app/routes/student.exam.tsx`
- `app/routes/student.certificate.tsx`
- `app/routes/admin.home.tsx`
- `app/routes/admin.students.tsx`
- `app/routes/admin.materials.tsx`
- `app/components/app-shell.tsx`
- `AGENTS.md` (estado de backend, auth mock y reglas actualizadas)

## 8. Criterios de Aceptacion

1. No quedan referencias a `mockMaterials`, `mockStudents` ni examen hardcodeado en rutas productivas.
2. Login usa backend real y persiste sesion.
3. Acceso por rol sigue funcionando (`student`/`admin`).
4. Student puede ver materiales, rendir examen y gestionar certificado.
5. Admin puede ver KPIs, estudiantes y administrar materiales.
6. Frontend compila con `pnpm typecheck`.
7. Documentacion interna refleja el nuevo estado del proyecto.

## 9. Riesgos y Mitigaciones

- Riesgo: drift de contrato backend/frontend.
  Mitigacion: centralizar tipos API y mapear DTOs en servicios.

- Riesgo: expiracion de token durante navegacion.
  Mitigacion: estrategia de refresh centralizada y fallback a login.

- Riesgo: UX incompleta para acceso de materiales por alumno.
  Mitigacion: implementar UX minima de asignacion/revocacion por alumno en Fase 4.

- Riesgo: errores de datos nullable en admin.
  Mitigacion: tipado estricto + estados vacios/null en UI.

## 10. Orden Recomendado de Ejecucion

1. Fase 1 (infra API).  
2. Fase 2 (auth real).  
3. Fase 3 (student end-to-end).  
4. Fase 4 (admin end-to-end).  
5. Fase 5 (QA y hardening).

Este orden minimiza retrabajo: primero contrato y sesion, luego features.

