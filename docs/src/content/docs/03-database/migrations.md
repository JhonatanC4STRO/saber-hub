---
title: Migraciones
description: Historial de migraciones, cómo crearlas y política de cambios de schema en SaberHub.
---

## Historial de migraciones

Las migraciones viven en `prisma/migrations/`. Cada carpeta representa un snapshot del schema en ese momento.

| Migración | Fecha | Cambios principales |
|---|---|---|
| `20260515012121_creacion` | 2026-05-15 | Schema inicial: todos los modelos base (usuarios, roles, cursos, módulos, lecciones, recursos, inscripciones, evaluaciones, certificaciones, foros, mensajes, notificaciones, grupos, rutas, externos, auditoría, webhooks) |
| `20260515013943_actualizacion` | 2026-05-15 | Ajustes y correcciones sobre el schema inicial |
| `20260516213956_agregue_el_campo_documento_a_usuarios` | 2026-05-16 | Agrega campo `documento` (`String @unique`) a `Usuario` |
| `20260517231709_evaluaciones_assessment_module` | 2026-05-17 | Módulo de evaluaciones completo: `Evaluacion`, `Pregunta`, `Opcion`, `IntentoExamen`, `RespuestaAprendiz` |
| `20260518003251_banco_preguntas_certificados_criterios` | 2026-05-18 | `CategoriaBanco`, `PreguntaBanco`, `OpcionBanco`; criterios de certificación en `Curso` (`otorgaCertificado`, `criterioLeccionesMin`, `criterioEvalAprobadas`, `criterioNotaGlobal`) |

---

## Cómo crear y aplicar migraciones

### Desarrollo (con historial)

```bash
# Después de editar prisma/schema.prisma
npx prisma migrate dev --name descripcion_del_cambio
```

Esto:
1. Detecta cambios en `schema.prisma` vs el último estado.
2. Genera SQL en `prisma/migrations/<timestamp>_<nombre>/migration.sql`.
3. Aplica la migración a la BD de desarrollo.
4. Regenera el cliente Prisma en `app/generated/prisma/`.

### Aplicar migraciones existentes (CI/CD o nuevo entorno)

```bash
# Solo aplica migraciones pendientes; NO genera nuevas
npx prisma migrate deploy
```

Usar en producción y en el pipeline de CI.

### Forzar sincronización sin historial (prototipado)

```bash
# Solo desarrollo; NUNCA en producción
npx prisma db push
```

Sincroniza el schema directamente sin crear archivos de migración. Útil para iterar rápidamente. Rompe el historial.

### Regenerar cliente después de cambios

```bash
npx prisma generate
```

Siempre ejecutar después de `migrate dev` o `db push`. El cliente generado va a `app/generated/prisma/`.

---

## Explorar la BD en desarrollo

```bash
npx prisma studio
```

Abre una UI web en `http://localhost:5555` para inspeccionar y editar datos directamente.

---

## Política de cambios de schema

### ✅ Cambios seguros (backwards-compatible)

| Tipo de cambio | Notas |
|---|---|
| Agregar columna opcional (`String?` o con `default`) | No rompe queries existentes |
| Agregar nuevo modelo / tabla | Sin impacto en tablas existentes |
| Agregar índice | Solo impacta performance |
| Agregar enum value | PostgreSQL lo soporta de forma aditiva |
| Cambiar `default` value | No afecta filas existentes |

### ⚠️ Cambios que requieren cuidado

| Tipo de cambio | Riesgo |
|---|---|
| Renombrar columna | Prisma genera DROP + ADD; se pierde data si no hay migración manual |
| Cambiar tipo de columna | Puede fallar si hay datos incompatibles |
| Hacer columna `NOT NULL` sin `default` | Falla si hay filas con `NULL` existentes |
| Eliminar columna | Irreversible; hacer backup primero |
| Eliminar enum value | Error si hay filas con ese valor |

### 🚫 Prohibido en producción sin plan de migración

- `prisma db push` en producción.
- Editar manualmente archivos en `prisma/migrations/` (Prisma verifica el hash).
- Eliminar la carpeta `prisma/migrations/`.

### Convención de nombres

```
<timestamp>_<descripcion_en_snake_case>
```

Ejemplos correctos:
- `20260520120000_agregar_slug_a_categoria`
- `20260521000000_notificaciones_email_preferencias`

Ejemplos incorrectos:
- `fix` (no descriptivo)
- `cambio` (demasiado vago)
- `20260520_migración` (caracteres especiales)
