# GMC Academy Frontend

Frontend MVP para el e-learning de Autoescuela GMC.

## Stack

- React 19
- React Router v7
- TypeScript
- Tailwind CSS v4

## Estado actual

- Login por rol (demo local): `student` y `admin`
- Rutas protegidas por rol
- Panel estudiante:
  - Inicio
  - Materiales
  - Examen de practica
  - Certificado (placeholder)
- Panel admin:
  - Inicio con metricas
  - Gestion de materiales (mock)
  - Tabla de alumnos (mock)

Nota: por ahora no hay backend conectado. La sesion y datos de ejemplo son locales.

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm typecheck
```

## Estructura principal

```text
app/
  components/
  data/
  lib/
  routes/
docs/plans/
```

## Siguiente paso

Conectar este frontend a API NestJS + PostgreSQL (TypeORM) para reemplazar auth y datos mock.
