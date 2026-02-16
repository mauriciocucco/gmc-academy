# GMC Academy E-Learning Design (MVP)

Fecha: 2026-02-16  
Proyecto: `gmc-academy` (React Router v7 + React 19)

## 1. Stack decidido

- Frontend: `React Router v7` + `React 19` + `Tailwind CSS v4`.
- Backend: `NestJS` (API REST).
- Base de datos: `PostgreSQL`.
- Materiales: enlaces de `Google Drive` cargados por admin.
- Certificados: PDF generado cuando el alumno aprueba.

## 2. Objetivo MVP

Plataforma e-learning para Autoescuela GMC con dos roles:

- `student`: login, bienvenida, materiales, examen, descarga de certificado si aprueba.
- `admin`: login, carga/publicacion de material, consulta de alumnos e intentos.

## 3. Linea visual (Frontend)

Referencia: repo `autoescuelagmc`.

- Color primario GMC: `#0066cc`.
- UI clara y profesional.
- Layout con tarjetas, jerarquia tipografica y buena legibilidad.
- Componentes responsive desde mobile.
- Implementacion visual en `Tailwind` con tokens CSS para colores/espaciado/radius.

## 4. Arquitectura objetivo

### Frontend (React Router + Tailwind)

- Rutas:
  - `/login`
  - `/student`
  - `/student/materials`
  - `/student/exam`
  - `/student/certificate`
  - `/admin`
  - `/admin/materials`
  - `/admin/students`
- `AuthProvider` para sesion + rol.
- Guardas de ruta: `RequireAuth` y `RequireRole`.
- Cliente API tipado para Nest (`fetch` + capa de servicios por feature).

### Backend (NestJS + PostgreSQL)

Modulos iniciales:

- `auth` (login, refresh, logout, JWT).
- `users` (perfil y rol).
- `materials` (CRUD admin, listado student).
- `exams` (preguntas, evaluacion, score).
- `attempts` (historial de examenes).
- `certificates` (emision y descarga PDF).
- `admin` (metricas y listados de gestion).

## 5. API inicial (v1)

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/me`
- `GET /api/v1/materials`
- `POST /api/v1/materials` (admin)
- `PATCH /api/v1/materials/:id` (admin)
- `DELETE /api/v1/materials/:id` (admin)
- `GET /api/v1/exams/active`
- `POST /api/v1/exams/:id/submit`
- `GET /api/v1/attempts/me`
- `GET /api/v1/certificates/me/latest`
- `GET /api/v1/admin/students` (admin)
- `GET /api/v1/admin/stats` (admin)

## 6. Esquema de datos (PostgreSQL)

Tablas MVP:

- `users`
  - `id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`
  - `email TEXT NOT NULL`
  - `password_hash TEXT NOT NULL`
  - `full_name TEXT NOT NULL`
  - `role TEXT NOT NULL CHECK (role IN ('admin','student'))`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
  - `UNIQUE (lower(email))`
- `materials`
  - `id`, `title`, `description`, `drive_url`, `published`, `created_by`, `created_at`
- `exams`
  - `id`, `title`, `description`, `pass_score`, `is_active`, `created_at`
- `exam_questions`
  - `id`, `exam_id`, `question_text`, `options_json`, `correct_option`, `position`
- `exam_attempts`
  - `id`, `exam_id`, `student_id`, `score`, `passed`, `answers_json`, `created_at`
- `certificates`
  - `id`, `student_id`, `exam_attempt_id`, `certificate_code`, `pdf_path`, `issued_at`

Indices requeridos:

- FK index en `materials.created_by`, `exam_questions.exam_id`, `exam_attempts.exam_id`, `exam_attempts.student_id`, `certificates.student_id`, `certificates.exam_attempt_id`.

## 7. Seguridad base

- JWT con expiracion corta + refresh token.
- Password hash con `argon2` o `bcrypt`.
- Guards en Nest:
  - `JwtAuthGuard`
  - `RolesGuard`
- Validacion de DTOs con `class-validator`.
- Rate limit en login.
- Regla de negocio:
  - `student` no administra materiales.
  - `admin` no altera historico de intentos.

## 8. Plan incremental paso a paso

### Fase 0 - Fundacion

- Definir carpetas frontend/backend.
- Configurar `Tailwind v4` y tokens GMC.
- Crear layout base y rutas placeholder.

Entrega: shell navegable y consistente con marca.

### Fase 1 - Backend base

- Levantar Nest con modulos `auth/users`.
- Conexion PostgreSQL + migraciones.
- Seed inicial: 1 admin + 1 student.

Entrega: API base funcionando con DB.

### Fase 2 - Login y roles

- Login real contra Nest.
- Persistencia de sesion en frontend.
- Proteccion de rutas por rol.
- Bienvenida diferenciada `student/admin`.

Entrega: acceso completo por rol.

### Fase 3 - Materiales

- CRUD admin para materiales.
- Listado student solo publicados.
- Validacion de URL de Google Drive.

Entrega: admin publica, student consume.

### Fase 4 - Examen

- API de examen activo.
- Render de preguntas, submit y score.
- Persistencia de intentos.

Entrega: examen funcional con aprobado/reprobado.

### Fase 5 - Certificado PDF

- Generar certificado al aprobar.
- Guardar metadata en DB.
- Descarga desde panel student.

Entrega: certificado descargable.

### Fase 6 - Panel admin

- KPIs: alumnos, intentos, aprobados.
- Tabla de alumnos con ultimo resultado.

Entrega: vista operativa de gestion.

### Fase 7 - QA y despliegue

- Tests unitarios y e2e de flujos criticos.
- Reglas CORS, errores, logs y hardening.
- Deploy frontend/backend + variables de entorno.

Entrega: MVP listo para uso real.

## 9. Documentacion y fuentes (Context7)

En esta sesion no hay servidor Context7 disponible (no se detectaron recursos MCP).  
Plan de documentacion cuando este habilitado:

- NestJS: auth, guards, validation, testing.
- PostgreSQL: modelado e indices.
- React Router: protected routes y data APIs.
- Tailwind v4: configuracion de tokens y theming.
- React best practices: rendimiento, estado y estructura por feature.

## 10. Siguiente sprint recomendado

Arrancar con **Fase 0 + Fase 1 + Fase 2** para cerrar:

- login real,
- redireccion por rol,
- bienvenida funcional,
- base backend estable para avanzar rapido con materiales/examen.
