# AGENTS.md — GMC Academy

Guia para agentes de IA que trabajen en este repositorio.

## Descripcion del proyecto

Plataforma e-learning para Autoescuela GMC. Dos roles: `student` y `admin`.  
El frontend esta en este repositorio. El backend NestJS + PostgreSQL es un proyecto separado (aun no creado).

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

5. **No conectar** al backend real hasta que el proyecto NestJS exista y este documentado aqui.

## Estructura de rutas

```text
/login                  → login.tsx
/student                → student.home.tsx      (RequireAuth + RequireRole student)
/student/materials      → student.materials.tsx
/student/exam           → student.exam.tsx
/student/certificate    → student.certificate.tsx
/admin                  → admin.home.tsx         (RequireAuth + RequireRole admin)
/admin/materials        → admin.materials.tsx
/admin/students         → admin.students.tsx
```

## Convenciones de codigo

- **Componentes**: PascalCase, un componente por archivo.
- **Hooks y utilidades**: camelCase, prefijo `use` para hooks.
- **Archivos de ruta**: `rol.pagina.tsx` (ej. `student.home.tsx`).
- **Tailwind**: usar clases utilitarias directamente; no crear CSS custom salvo tokens en `app.css`.
- **Tipado**: siempre tipado explicito. Evitar `any`.
- **Guard clauses**: maximo 2 niveles de anidamiento; retorno temprano.

## Auth mock (estado actual)

El contexto de autenticacion esta en `app/lib/auth.tsx`. Usa estado local, sin backend.

Credenciales de prueba:

- `student` / cualquier password → rol `student`
- `admin` / cualquier password → rol `admin`

Para reemplazarlo por auth real: implementar llamadas a `POST /api/v1/auth/login` y persistir el JWT.

## Datos mock

Los datos de ejemplo estan en `app/data/mock-data.ts`. Se eliminaran cuando el backend este disponible.

## Fases del proyecto

| Fase | Descripcion                         | Estado     |
| ---- | ----------------------------------- | ---------- |
| 0    | Shell frontend con rutas y layout   | Completada |
| 1    | Backend NestJS base + PostgreSQL    | Pendiente  |
| 2    | Login real + sesion JWT             | Pendiente  |
| 3    | CRUD materiales real                | Pendiente  |
| 4    | Examen con persistencia de intentos | Pendiente  |
| 5    | Certificado PDF                     | Pendiente  |
| 6    | Panel admin con KPIs reales         | Pendiente  |
| 7    | QA y despliegue                     | Pendiente  |

## API objetivo (cuando el backend exista)

```
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/me
GET  /api/v1/materials
POST /api/v1/materials            (admin)
PATCH /api/v1/materials/:id       (admin)
DELETE /api/v1/materials/:id      (admin)
GET  /api/v1/exams/active
POST /api/v1/exams/:id/submit
GET  /api/v1/attempts/me
GET  /api/v1/certificates/me/latest
GET  /api/v1/admin/students       (admin)
GET  /api/v1/admin/stats          (admin)
```

## Seguridad (reglas de negocio)

- `student` no puede administrar materiales ni ver datos de otros alumnos.
- `admin` no puede alterar el historico de intentos de examenes.
- Las rutas de admin estan protegidas por `RequireRole` en el frontend y por `RolesGuard` en el backend.

## Documentacion de librerias

Antes de usar APIs de librerias/frameworks, consultar Context7:

- `resolve-library-id` → obtener el ID de la libreria.
- `get-library-docs` → obtener documentacion actualizada.

Librerias prioritarias: `react-router`, `nestjs`, `tailwindcss`, `postgresql`.
