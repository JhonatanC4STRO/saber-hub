---
title: Endpoints — Inscripciones y Progreso
description: Inscripciones, progreso de lecciones, heartbeat y SCORM en SaberHub.
---

## POST `/api/inscripciones`

Inscribe al usuario autenticado en un curso.

**Auth:** Requerida

**Body:**
```json
{ "cursoId": "cm..." }
```

**Respuestas:**

| Status | Descripción |
|---|---|
| `201` | Inscripción creada con `estado = activo`, `progreso = 0` |
| `409` | `YA_INSCRITO` |
| `403` | `CURSO_NO_PUBLICADO` |

```json
// 201
{
  "id": "cm...",
  "cursoId": "cm...",
  "usuarioId": "cm...",
  "progreso": "0.00",
  "estado": "activo",
  "fechaInscripcion": "2026-05-20T10:00:00.000Z"
}
```

---

## GET `/api/inscripciones`

Lista inscripciones del usuario autenticado.

**Auth:** Requerida

**Query params:** `estado` (`activo`, `finalizado`, etc.)

**Respuesta 200:**
```json
{
  "data": [
    {
      "id": "cm...",
      "progreso": "45.50",
      "estado": "activo",
      "ultimoAcceso": "2026-05-20T09:15:00.000Z",
      "tiempoConectado": 3600,
      "curso": {
        "id": "cm...",
        "titulo": "Introducción a la Ciberseguridad",
        "imgPortada": "https://..."
      }
    }
  ]
}
```

---

## PUT `/api/inscripciones/[id]`

Actualiza el estado de una inscripción.

**Auth:** Requerida (admin o instructor del curso)

**Body:**
```json
{ "estado": "retirado" }
```

---

## POST `/api/inscripciones/importar`

Importa inscripciones en bloque desde CSV o Excel.

**Auth:** Requerida (admin)

**Body:** `multipart/form-data` con archivo `.csv` o `.xlsx`.

**Formato del archivo:**
```
email,cursoId
ana@ejemplo.com,cm...
luis@ejemplo.com,cm...
```

**Respuesta 200:**
```json
{
  "creadas": 45,
  "omitidas": 3,
  "errores": ["ana2@ejemplo.com: usuario no encontrado"]
}
```

---

## POST `/api/inscripciones/masiva-nuevos`

Crea usuarios nuevos e inscripciones en bloque en un solo paso.

**Auth:** Requerida (admin)

**Body:** `multipart/form-data` con archivo y `cursoId` adicional.

---

## POST `/api/progreso/leccion`

Marca una lección como completada y recalcula el progreso del curso.

**Auth:** Requerida

**Body:**
```json
{
  "leccionId": "cm...",
  "completada": true
}
```

**Respuesta 200:**
```json
{
  "completada": true,
  "progresoCurso": "66.67",
  "certificadoEmitido": false
}
```

Si `progresoCurso = 100` y el curso otorga certificado, `certificadoEmitido = true` e incluye `certificado.codigoUnico`.

---

## POST `/api/progreso/heartbeat`

Registra actividad del estudiante e incrementa `tiempoConectado` en 15 segundos.

**Auth:** Requerida

**Body:**
```json
{ "inscripcionId": "cm..." }
```

**Respuesta 200:**
```json
{ "ok": true }
```

Este endpoint es llamado automáticamente por `HeartbeatTracker.jsx` cada 15 segundos mientras el estudiante tiene una lección abierta.

---

## GET `/api/progreso/curso/[cursoId]`

Progreso detallado del usuario autenticado en un curso.

**Auth:** Requerida

**Respuesta 200:**
```json
{
  "progreso": "66.67",
  "tiempoConectado": 7200,
  "leccionesCompletadas": 4,
  "leccionesTotal": 6,
  "estado": "activo"
}
```

---

## GET `/api/progreso/grupo/[cursoId]`

Progreso grupal de todos los inscritos en un curso. Para instructores y admin.

**Auth:** Requerida (instructor del curso o admin)

**Respuesta 200:**
```json
{
  "data": [
    {
      "usuario": { "nombre": "Ana Torres", "email": "ana@..." },
      "progreso": "100.00",
      "tiempoConectado": 14400,
      "estado": "finalizado"
    }
  ]
}
```

---

## POST `/api/progreso/scorm`

Guarda el estado CMI de un paquete SCORM (llamado desde el visor SCORM).

**Auth:** Requerida

**Body:**
```json
{
  "leccionId": "cm...",
  "cmiData": "{\"cmi.core.lesson_status\":\"passed\",\"cmi.core.score.raw\":\"85\"}"
}
```
