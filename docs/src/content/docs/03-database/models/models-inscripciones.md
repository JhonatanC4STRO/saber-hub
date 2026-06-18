---
title: Modelos — Inscripciones y Progreso
description: Esquema de Inscripcion, ProgresoLeccion, ProgresoScorm, Certificacion y CertificadoRuta.
---

## `Inscripcion` → tabla `inscripciones`

Vínculo entre un estudiante y un curso. Registra todo el estado de avance.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `usuarioId` | `String` | FK → `usuarios.id` (Cascade) |
| `cursoId` | `String` | FK → `cursos.id` (Cascade) |
| `progreso` | `Decimal` default 0 @db.Decimal(5,2) | 0.00 – 100.00; recalculado en cada `ProgresoLeccion` upsert |
| `estado` | `EstadoInscripcion` default activo | `activo` · `inactivo` · `finalizado` · `retirado` |
| `fechaInscripcion` | `DateTime` default now | |
| `ultimoAcceso` | `DateTime?` | Actualizado por el heartbeat |
| `tiempoConectado` | `Int` default 0 | Segundos acumulados; incrementado por heartbeat cada 15 s |

**Restricción única:** `@@unique([usuarioId, cursoId])` — un estudiante solo puede inscribirse una vez por curso.

**Índices:** `[usuarioId]`, `[cursoId]`

**Relación:** `certificacion` 1:0..1 → `Certificacion` (FK en Certificacion)

---

## `ProgresoLeccion` → tabla `progreso_leccion`

Flag de completitud por lección por usuario. Se hace upsert en `POST /api/progreso/leccion`.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `usuarioId` | `String` | FK → `usuarios.id` (Cascade) |
| `leccionId` | `String` | FK → `lecciones.id` (Cascade) |
| `completada` | `Boolean` default false | |
| `fechaCompletada` | `DateTime?` | Se establece al marcar como completada |

**Restricción única:** `@@unique([usuarioId, leccionId])` — un registro por usuario por lección.

**Índices:** `[usuarioId]`, `[leccionId]`

**Flujo de progreso:**
```
POST /api/progreso/leccion
  → upsert ProgresoLeccion (completada=true)
  → SELECT COUNT lecciones completadas / total lecciones del curso
  → UPDATE inscripcion.progreso = (completadas / total) * 100
  → IF progreso = 100 AND curso.otorgaCertificado → INSERT Certificacion
```

---

## `ProgresoScorm` → tabla `progreso_scorm`

Variables CMI del SCORM 1.2/2004 player. Almacena el estado completo del paquete SCORM como JSON serializado.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `usuarioId` | `String` | FK → `usuarios.id` (Cascade) |
| `leccionId` | `String` | FK → `lecciones.id` (Cascade) |
| `cmiData` | `String` | JSON serializado con variables CMI (`cmi.core.lesson_status`, `cmi.core.score.raw`, etc.) |
| `creado` | `DateTime` default now | |
| `actualizado` | `DateTime` @updatedAt | |

**Restricción única:** `@@unique([usuarioId, leccionId])`

---

## `Certificacion` → tabla `certificaciones`

Certificado de completitud de un curso específico.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `inscripcionId` | `String` @unique | FK → `inscripciones.id` (Cascade); 1:1 con inscripción |
| `codigoUnico` | `String` @unique | Generado al emitir; se expone públicamente para verificación |
| `hashVerificacion` | `String` | Hash del certificado (integridad) |
| `urlPdf` | `String?` | Cloudinary URL del PDF generado |
| `estado` | `EstadoCertificado` default emitido | `emitido` · `revocado` |
| `motivoRevocacion` | `String?` | Obligatorio si `estado = revocado` |
| `fechaEmision` | `DateTime` default now | |

**Índices:** `[codigoUnico]`

**Endpoint de verificación pública:** `GET /api/certificados/verificar/[codigo]` — no requiere autenticación.

---

## `CertificadoRuta` → tabla `certificados_ruta`

Certificado de completitud de una ruta de formación completa.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `usuarioId` | `String` | FK → `usuarios.id` (Cascade) |
| `rutaId` | `String` | FK → `rutas_formacion.id` (Cascade) |
| `codigoUnico` | `String` @unique | |
| `hashVerificacion` | `String` | |
| `urlPdf` | `String?` | |
| `fechaEmision` | `DateTime` default now | |

**Restricción única:** `@@unique([usuarioId, rutaId])` — un estudiante obtiene el certificado de ruta una sola vez.

**Índices:** `[codigoUnico]`
