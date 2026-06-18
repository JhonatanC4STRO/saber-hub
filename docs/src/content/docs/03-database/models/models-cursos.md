---
title: Modelos — Cursos y Contenido
description: Esquema de Curso, Modulo, Leccion, Recurso, Categoria, Institucion y Rutas en SaberHub.
---

## `Institucion` → tabla `instituciones`

Entidad educativa vinculada a SaberHub.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `nit` | `String?` @unique | NIT colombiano |
| `nombre` | `String` | |
| `descripcion` | `String?` | |
| `url` | `String?` | Sitio web oficial |
| `logoUrl` | `String?` | Cloudinary URL |
| `correoAdmin` | `String?` | |
| `telefono` | `String?` | |
| `solicitudId` | `String?` @unique | FK lógica a `solicitudes_institucion` |
| `fechaCreacion` | `DateTime` default now | |
| `slug` | `String?` @unique | URL-friendly: `sena`, `mintic`, etc. |

**Seed:** SENA, MinTIC, Universidad Nacional de Colombia, SABERHUB Academy.

---

## `SolicitudInstitucion` → tabla `solicitudes_institucion`

Proceso de onboarding de una institución nueva.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `nombreLegal` | `String` | |
| `nit` | `String` @unique | |
| `descripcion` | `String` | |
| `sitioWeb` | `String` | |
| `correoInstitucional` | `String` | |
| `nombreRepresentante` | `String` | |
| `telefono` | `String` | |
| `logoUrl` | `String?` | |
| `documentoUrl` | `String?` | Documento legal adjunto |
| `estado` | `EstadoSolicitudInstitucion` default pendiente | |
| `motivoRechazo` | `String?` | |
| `revisadoPorId` | `String?` | ID del admin revisor |
| `fechaSolicitud` | `DateTime` default now | |
| `fechaRevision` | `DateTime?` | |

---

## `Categoria` → tabla `categorias`

Clasificación temática de cursos.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `nombre` | `String` @unique | |
| `descripcion` | `String?` | |

**Seed (8 categorías):** Ciberseguridad · Programación · Inteligencia Artificial · Redes · Datos y Analítica · Marketing Digital · Diseño Digital · Habilidades Profesionales

---

## `Curso` → tabla `cursos`

Unidad principal de contenido educativo.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `institucionId` | `String?` | FK → `instituciones.id` (SetNull) |
| `categoriaId` | `String?` | FK → `categorias.id` (SetNull) |
| `instructorId` | `String` | FK → `usuarios.id` (Restrict) |
| `titulo` | `String` | |
| `descripcion` | `String?` | |
| `imgPortada` | `String?` | Cloudinary URL |
| `estado` | `EstadoCurso` default borrador | `borrador` → `publicado` → `archivado` |
| `otorgaCertificado` | `Boolean` default false | Si `true`, se emite `Certificacion` al completar |
| `criterioLeccionesMin` | `Int?` | Mínimo de lecciones completadas para certificar |
| `criterioEvalAprobadas` | `Boolean` default false | Si `true`, requiere aprobar todas las evaluaciones |
| `criterioNotaGlobal` | `Int?` | Nota mínima global (0–100) |
| `nivel` | `String?` | `General`, `Básico`, `Intermedio`, `Avanzado` |
| `creado` | `DateTime` default now | |
| `actualizado` | `DateTime` @updatedAt | |

**Índices:** `[instructorId]`, `[categoriaId]`, `[estado]`

---

## `Modulo` → tabla `modulos`

Agrupación temática dentro de un curso.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `cursoId` | `String` | FK → `cursos.id` (Cascade) |
| `orden` | `Int` | Posición dentro del curso (1-based) |
| `titulo` | `String` | |
| `descripcion` | `String?` | |
| `estado` | `EstadoModulo` default activo | `activo` u `oculto` |
| `creado` | `DateTime` default now | |

**Restricción única:** `@@unique([cursoId, orden])` — no puede haber dos módulos con el mismo orden en el mismo curso.

**Índices:** `[cursoId]`

---

## `Leccion` → tabla `lecciones`

Unidad mínima de contenido.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `moduloId` | `String` | FK → `modulos.id` (Cascade) |
| `orden` | `Int` | Posición dentro del módulo |
| `titulo` | `String` | |
| `contenidoTexto` | `String?` | Texto/HTML de la lección |
| `urlVideo` | `String?` | URL de video (Cloudinary HLS, YouTube, etc.) |
| `duracion` | `Int?` | Duración estimada en minutos |
| `esPreview` | `Boolean` default false | Si `true`, visible sin inscripción |
| `esScorm` | `Boolean` default false | Si `true`, mostrar visor SCORM |
| `scormUrl` | `String?` | URL del `imsmanifest.xml` extraído |
| `creado` | `DateTime` default now | |

**Restricción única:** `@@unique([moduloId, orden])`

**Índices:** `[moduloId]`

---

## `Recurso` → tabla `recursos`

Archivo adjunto a una lección.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `leccionId` | `String` | FK → `lecciones.id` (Cascade) |
| `titulo` | `String` | |
| `descripcion` | `String?` | |
| `tipo` | `TipoRecurso` | `pdf` · `video` · `audio` · `imagen` · `presentacion` · `enlace` · `otro` |
| `urlDocumento` | `String` | Cloudinary URL o enlace externo |
| `fechaCreacion` | `DateTime` default now | |

**Índices:** `[leccionId]`

---

## `PrerrequisitoCurso` → tabla `prerrequisitos_curso`

Relación self-join: un curso puede requerir otro como prerequisito.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `cursoId` | `String` | FK → `cursos.id` (Cascade); curso que tiene el prerequisito |
| `prerrequisitoId` | `String` | FK → `cursos.id` (Cascade); curso requerido |
| `creado` | `DateTime` default now | |

**Restricción única:** `@@unique([cursoId, prerrequisitoId])`

---

## `RutaFormacion` → tabla `rutas_formacion`

Itinerario formativo compuesto por varios cursos.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `nombre` | `String` | |
| `descripcion` | `String?` | |
| `imgPortada` | `String?` | Cloudinary URL |
| `lineal` | `Boolean` default true | `true` = orden obligatorio; `false` = flexible |
| `creadorId` | `String` | FK → `usuarios.id` (Cascade) |
| `creado` | `DateTime` default now | |
| `actualizado` | `DateTime` @updatedAt | |

---

## `CursoRuta` → tabla `cursos_ruta`

Posición de un curso dentro de una ruta de formación.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `rutaId` | `String` | FK → `rutas_formacion.id` (Cascade) |
| `cursoId` | `String` | FK → `cursos.id` (Cascade) |
| `orden` | `Int` | Posición en la secuencia (1-based) |

**Restricciones únicas:** `@@unique([rutaId, cursoId])`, `@@unique([rutaId, orden])`
