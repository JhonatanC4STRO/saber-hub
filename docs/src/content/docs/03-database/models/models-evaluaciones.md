---
title: Modelos — Evaluaciones
description: Esquema de Evaluacion, Pregunta, Opcion, IntentoExamen, RespuestaAprendiz y Banco de Preguntas.
---

## `Evaluacion` → tabla `evaluaciones`

Instrumento de medición del aprendizaje asociado a un curso o módulo.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `cursoId` | `String?` | FK → `cursos.id` (Cascade) |
| `moduloId` | `String?` | FK → `modulos.id` (Cascade) |
| `creadorId` | `String` | FK → `usuarios.id` (Restrict) |
| `titulo` | `String` | |
| `descripcion` | `String?` | |
| `puntajeMinimo` | `Int` default 70 | Porcentaje mínimo para aprobar (0–100) |
| `duracionMinutos` | `Int?` | `null` = sin límite de tiempo |
| `intentosMaximos` | `Int` default 1 | |
| `ordenAleatorio` | `Boolean` default false | Aleatoriza orden de preguntas por intento |
| `mostrarRespuestas` | `Boolean` default false | Muestra respuestas correctas al finalizar |
| `fechaCreacion` | `DateTime` default now | |
| `fechaActualizacion` | `DateTime` @updatedAt | |

**Regla de negocio:** exactamente uno de `cursoId` o `moduloId` debe estar presente. La validación se hace en la capa de aplicación.

**Índices:** `[cursoId]`, `[moduloId]`

---

## `Pregunta` → tabla `preguntas`

Ítem individual de una evaluación.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `evaluacionId` | `String` | FK → `evaluaciones.id` (Cascade) |
| `pregunta` | `String` | Enunciado |
| `tipo` | `TipoPregunta` | `opcion_multiple` · `verdadero_falso` · `respuesta_corta` · `desarrollo` |
| `puntos` | `Int` default 1 | Peso en el puntaje total |
| `orden` | `Int` default 1 | Posición en la evaluación |
| `respuestaCorrecta` | `String?` | Usado en `respuesta_corta` (texto exacto o flexible) |
| `patronRegex` | `String?` | Regex alternativo para validar `respuesta_corta` |

**Índices:** `[evaluacionId]`

---

## `Opcion` → tabla `opciones`

Alternativa de respuesta para preguntas de tipo `opcion_multiple` o `verdadero_falso`.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `preguntaId` | `String` | FK → `preguntas.id` (Cascade) |
| `textoOpcion` | `String` | Texto mostrado al estudiante |
| `esCorrecta` | `Boolean` default false | Una o más opciones pueden ser correctas |

**Índices:** `[preguntaId]`

---

## `IntentoExamen` → tabla `intentos_examen`

Registro de cada vez que un estudiante inicia una evaluación.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `usuarioId` | `String` | FK → `usuarios.id` (Cascade) |
| `evaluacionId` | `String` | FK → `evaluaciones.id` (Cascade) |
| `estado` | `EstadoIntento` default en_curso | `en_curso` → `finalizado` / `expirado` → `calificado` |
| `puntaje` | `Decimal?` @db.Decimal(5,2) | `null` mientras hay preguntas de desarrollo pendientes |
| `fechaInicio` | `DateTime` default now | |
| `fechaFin` | `DateTime?` | Se establece al enviar o expirar |

**Índices:** `[usuarioId]`, `[evaluacionId]`

---

## `RespuestaAprendiz` → tabla `respuestas_aprendiz`

Respuesta individual por pregunta dentro de un intento.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `intentoId` | `String` | FK → `intentos_examen.id` (Cascade) |
| `preguntaId` | `String` | FK → `preguntas.id` (Cascade) |
| `textoRespuesta` | `String?` | Para `respuesta_corta` y `desarrollo` |
| `opcionId` | `String?` | FK → `opciones.id` (SetNull); para `opcion_multiple` y `verdadero_falso` |
| `calificacion` | `Decimal?` @db.Decimal(5,2) | Puntaje parcial asignado (auto o manual) |
| `pendienteRevision` | `Boolean` default false | `true` cuando `tipo = desarrollo` hasta que el instructor califique |
| `feedbackInstructor` | `String?` | Comentario del instructor al calificar `desarrollo` |

**Índices:** `[intentoId]`, `[preguntaId]`

---

## `CategoriaBanco` → tabla `categorias_banco`

Organización temática del banco de preguntas de un instructor.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `nombre` | `String` | |
| `creadorId` | `String` | FK → `usuarios.id` (Cascade) |
| `creadoEn` | `DateTime` default now | |

**Índices:** `[creadorId]`

---

## `PreguntaBanco` → tabla `preguntas_banco`

Pregunta reutilizable almacenada en el banco de un instructor.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `creadorId` | `String` | FK → `usuarios.id` (Cascade) |
| `categoriaId` | `String?` | FK → `categorias_banco.id` (SetNull) |
| `pregunta` | `String` | Enunciado |
| `tipo` | `TipoPregunta` | Mismo enum que `Pregunta` |
| `puntos` | `Int` default 1 | |
| `respuestaCorrecta` | `String?` | Para `respuesta_corta` |
| `patronRegex` | `String?` | Regex alternativo |
| `creadoEn` | `DateTime` default now | |
| `actualizadoEn` | `DateTime` @updatedAt | |

**Índices:** `[creadorId]`, `[categoriaId]`

---

## `OpcionBanco` → tabla `opciones_banco`

Opción de una pregunta del banco de preguntas.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `preguntaId` | `String` | FK → `preguntas_banco.id` (Cascade) |
| `textoOpcion` | `String` | |
| `esCorrecta` | `Boolean` default false | |

**Índices:** `[preguntaId]`
