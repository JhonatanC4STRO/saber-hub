---
title: Endpoints — Evaluaciones e Intentos
description: CRUD de evaluaciones, intentos, calificación y banco de preguntas.
---

## GET `/api/evaluaciones`

Lista evaluaciones del usuario autenticado (instructor ve las suyas; admin ve todas).

**Auth:** Requerida

---

## POST `/api/evaluaciones`

Crea una nueva evaluación.

**Auth:** Requerida (instructor o admin)

**Body:**
```json
{
  "cursoId": "cm...",
  "titulo": "Evaluación final Módulo 2",
  "descripcion": "Evalúa los conceptos de criptografía.",
  "puntajeMinimo": 70,
  "duracionMinutos": 30,
  "intentosMaximos": 2,
  "ordenAleatorio": true,
  "mostrarRespuestas": false,
  "preguntas": [
    {
      "pregunta": "¿Cuál es el algoritmo de hash más usado?",
      "tipo": "opcion_multiple",
      "puntos": 2,
      "opciones": [
        { "textoOpcion": "MD5", "esCorrecta": false },
        { "textoOpcion": "SHA-256", "esCorrecta": true },
        { "textoOpcion": "BASE64", "esCorrecta": false }
      ]
    },
    {
      "pregunta": "JWT significa JSON Web Token.",
      "tipo": "verdadero_falso",
      "puntos": 1,
      "opciones": [
        { "textoOpcion": "Verdadero", "esCorrecta": true },
        { "textoOpcion": "Falso", "esCorrecta": false }
      ]
    }
  ]
}
```

**Respuesta 201:** Evaluación creada con preguntas y opciones.

---

## GET `/api/evaluaciones/[id]`

Detalle de una evaluación.

**Auth:** Requerida

**Comportamiento:** Si el usuario es estudiante y ya envió todos sus intentos, no muestra respuestas correctas a menos que `mostrarRespuestas = true`.

---

## GET `/api/evaluaciones/[id]/intentos`

Lista intentos de una evaluación.

**Auth:** Requerida (instructor ve todos; estudiante ve los suyos)

---

## POST `/api/intentos`

Inicia un nuevo intento de evaluación.

**Auth:** Requerida

**Body:**
```json
{ "evaluacionId": "cm..." }
```

**Respuestas:**

| Status | Descripción |
|---|---|
| `201` | Intento creado con `estado = en_curso` |
| `403` | `INTENTOS_AGOTADOS` |
| `409` | `EVALUACION_EN_CURSO` (ya hay un intento activo) |

```json
// 201
{
  "id": "cm...",
  "evaluacionId": "cm...",
  "estado": "en_curso",
  "fechaInicio": "2026-05-20T10:00:00.000Z",
  "preguntas": [
    {
      "id": "cm...",
      "pregunta": "¿Cuál es el algoritmo de hash más usado?",
      "tipo": "opcion_multiple",
      "puntos": 2,
      "opciones": [
        { "id": "cm...", "textoOpcion": "MD5" },
        { "id": "cm...", "textoOpcion": "SHA-256" },
        { "id": "cm...", "textoOpcion": "BASE64" }
      ]
    }
  ]
}
```

Las respuestas correctas (`esCorrecta`) **no se incluyen** en esta respuesta.

---

## GET `/api/intentos/[intentoId]`

Detalle de un intento con respuestas del estudiante.

**Auth:** Requerida (propietario del intento, instructor o admin)

---

## POST `/api/intentos/[intentoId]/enviar`

Envía el intento con las respuestas del estudiante. Calcula puntaje automáticamente.

**Auth:** Requerida (propietario del intento)

**Body:**
```json
{
  "respuestas": [
    { "preguntaId": "cm...", "opcionId": "cm..." },
    { "preguntaId": "cm...", "textoRespuesta": "SHA-256" },
    { "preguntaId": "cm...", "textoRespuesta": "Explicación detallada..." }
  ]
}
```

**Respuesta 200:**
```json
{
  "puntaje": 85.00,
  "aprobado": true,
  "estado": "calificado",
  "pendienteRevision": false,
  "respuestas": [
    {
      "preguntaId": "cm...",
      "correcta": true,
      "calificacion": 2.00
    }
  ]
}
```

Si hay preguntas de tipo `desarrollo`, `pendienteRevision = true` y `puntaje = null` hasta que el instructor califique.

---

## PUT `/api/intentos/[intentoId]`

Califica manualmente respuestas de tipo `desarrollo`.

**Auth:** Requerida (instructor del curso o admin)

**Body:**
```json
{
  "calificaciones": [
    {
      "respuestaId": "cm...",
      "calificacion": 1.5,
      "feedback": "Buen análisis, pero faltó mencionar el principio de confidencialidad."
    }
  ]
}
```

**Respuesta 200:**
```json
{
  "puntajeFinal": 78.50,
  "aprobado": true,
  "estado": "calificado"
}
```

---

## GET `/api/banco`

Lista preguntas del banco del instructor autenticado.

**Auth:** Requerida (instructor o admin)

**Query params:** `categoriaId`, `tipo`, `q`, `pagina`

---

## POST `/api/banco`

Crea pregunta en el banco.

**Auth:** Requerida (instructor o admin)

---

## GET `/api/banco/categorias`

Lista categorías del banco del instructor.

---

## POST `/api/banco/importar`

Importa preguntas al banco desde archivo Excel/CSV.

**Auth:** Requerida (instructor o admin)

**Formato esperado del archivo:**
```
pregunta,tipo,puntos,respuesta_correcta,opcion1,opcion2,opcion3,opcion4,correcta
¿Qué es SQL?,opcion_multiple,1,,DDL,DML,Lenguaje estructurado de consultas,DCL,3
```
