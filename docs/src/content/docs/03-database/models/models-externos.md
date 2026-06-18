---
title: Modelos — Cursos Externos y Scraping
description: CursoExterno, FuenteExterna y LogScraping en SaberHub.
---

## `FuenteExterna` → tabla `fuentes_externas`

Registro de plataformas externas desde las que se importan cursos.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `nombre` | `String` @unique | Ej.: `"SENA Sofia Plus"`, `"Coursera"` |
| `urlBase` | `String` | URL raíz de la plataforma |
| `tieneApi` | `Boolean` default false | Si la fuente expone API pública (vs solo scraping) |
| `bloqueado` | `Boolean` default false | Si `true`, el scraper omite esta fuente |
| `motivoBloqueo` | `String?` | Obligatorio si `bloqueado = true` |
| `fechaBloqueo` | `DateTime?` | |
| `creadoEn` | `DateTime` default now | |
| `actualizadoEn` | `DateTime` @updatedAt | |

**Nota:** `CursoExterno` referencia la fuente por `fuenteNombre` (String), no por FK. La lógica de bloqueo consulta esta tabla por nombre para filtrar el catálogo.

---

## `CursoExterno` → tabla `cursos_externos`

Metadata de un curso importado desde una plataforma externa. **No almacena contenido** (videos, PDFs, materiales) — solo referencia.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `titulo` | `String` | |
| `descripcion` | `String?` | |
| `fuenteUrl` | `String` | URL directa al curso en la plataforma original |
| `fuenteNombre` | `String` | `"SENA Sofia Plus"`, `"Coursera"`, etc. (join lógico con `FuenteExterna.nombre`) |
| `codigoExterno` | `String?` @unique | Código SENA u otro ID único en la fuente |
| `duracionHoras` | `Int?` | |
| `nivel` | `String?` | |
| `modalidad` | `String?` | Virtual, presencial, mixto |
| `idioma` | `String` default "es" | |
| `imagenUrl` | `String?` | |
| `fechaInicio` | `DateTime?` | |
| `fechaCierre` | `DateTime?` | |
| `estaActivo` | `Boolean` default true | Si el curso sigue activo en la fuente |
| `areaConocimiento` | `String?` | |
| `centroFormacion` | `String?` | Centro SENA u organización interna |
| `ciudad` | `String?` | |
| `departamento` | `String?` | |
| `estado` | `String` default "pendiente" | `pendiente` · `aprobado` · `rechazado` (string, no enum) |
| `motivoRechazo` | `String?` | |
| `revisadoPorId` | `String?` | ID del admin que revisó |
| `revisadoEn` | `DateTime?` | |
| `institucionId` | `String` | FK → `instituciones.id` (Restrict) |
| `cursoId` | `String?` | FK → `cursos.id` (SetNull); FK hacia curso interno cuando se aprueba y vincula |
| `creadoEn` | `DateTime` default now | |
| `actualizadoEn` | `DateTime` @updatedAt | |

**Índices:** `[fuenteNombre]`, `[institucionId]`, `[cursoId]`

**Flujo:**
```
Scraper crea CursoExterno con estado="pendiente"
  → Admin revisa en /dashboard/admin/cursos-externos
  → Aprueba: estado="aprobado", curso visible en catálogo externo
  → Rechaza: estado="rechazado", motivoRechazo requerido
```

---

## `LogScraping` → tabla `logs_scraping`

Log de cada ejecución del scraper, independientemente del resultado.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `fuente` | `String` | Nombre de la fuente (ej.: `"SENA Sofia Plus"`) |
| `fechaEjecucion` | `DateTime` default now | |
| `cursosEncontrados` | `Int` default 0 | Total de cursos encontrados en la fuente |
| `cursosNuevos` | `Int` default 0 | Cursos no existentes previamente en BD |
| `cursosActualizados` | `Int` default 0 | Cursos existentes con metadata actualizada |
| `errores` | `Int` default 0 | Conteo de errores durante la ejecución |
| `detalleErrores` | `String?` | JSON con mensajes de error individuales |
| `exitoso` | `Boolean` default true | `false` si el scraper terminó con error fatal |
| `duracionMs` | `Int?` | Tiempo de ejecución en milisegundos |

**Índices:** `[fuente]`, `[fechaEjecucion]`

**API:** `GET /api/admin/logs-scraping` devuelve el historial ordenado por `fechaEjecucion DESC`.
