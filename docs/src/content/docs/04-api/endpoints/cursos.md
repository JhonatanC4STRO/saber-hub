---
title: Endpoints — Cursos
description: CRUD de cursos, catálogo, progreso, foros y sesiones.
---

## GET `/api/cursos/catalogo`

Catálogo público de cursos publicados. No requiere autenticación.

**Auth:** Pública

**Query params:**

| Param | Tipo | Descripción |
|---|---|---|
| `categoria` | `string` | Nombre de categoría (ej. `Ciberseguridad`) |
| `institucion` | `string` | Slug de institución (ej. `sena`) |
| `nivel` | `string` | `Básico`, `Intermedio`, `Avanzado`, `General` |
| `q` | `string` | Búsqueda por texto en título/descripción |
| `pagina` | `number` | Default: 1 |
| `porPagina` | `number` | Default: 12 |

**Respuesta 200:**
```json
{
  "data": [
    {
      "id": "cm...",
      "titulo": "Introducción a la Ciberseguridad",
      "descripcion": "...",
      "imgPortada": "https://res.cloudinary.com/...",
      "nivel": "Básico",
      "estado": "publicado",
      "instructor": { "id": "cm...", "nombre": "Carlos Pérez" },
      "institucion": { "id": "cm...", "nombre": "MinTIC", "slug": "mintic" },
      "categoria": { "id": "cm...", "nombre": "Ciberseguridad" },
      "_count": { "inscripciones": 142, "modulos": 3 }
    }
  ],
  "total": 9,
  "pagina": 1,
  "porPagina": 12
}
```

---

## POST `/api/cursos`

Crea un nuevo curso en estado `borrador`.

**Auth:** Requerida (rol `instructor` o `admin`)

**Body:**
```json
{
  "titulo": "Mi nuevo curso",
  "descripcion": "Descripción del curso",
  "categoriaId": "cm...",
  "institucionId": "cm...",
  "nivel": "Intermedio",
  "imgPortada": "https://res.cloudinary.com/...",
  "otorgaCertificado": true,
  "criterioLeccionesMin": 5
}
```

**Respuesta 201:**
```json
{
  "id": "cm...",
  "titulo": "Mi nuevo curso",
  "estado": "borrador",
  "instructorId": "cm..."
}
```

---

## GET `/api/cursos/[id]`

Detalle de un curso por ID.

**Auth:** Pública para cursos publicados; requerida para borradores del instructor.

**Respuesta 200:** Objeto `Curso` completo con módulos, lecciones (sin contenido), instructor e institución.

---

## PUT `/api/cursos/[id]`

Actualiza un curso completo.

**Auth:** Requerida (instructor propietario o admin)

**Body:** Mismos campos que POST.

---

## GET `/api/cursos/[id]/contenido`

Módulos y lecciones del curso con contenido. Requiere inscripción activa.

**Auth:** Requerida (inscrito, instructor propietario o admin)

**Respuesta 200:**
```json
{
  "modulos": [
    {
      "id": "cm...",
      "orden": 1,
      "titulo": "Fundamentos de Seguridad",
      "estado": "activo",
      "lecciones": [
        {
          "id": "cm...",
          "orden": 1,
          "titulo": "¿Qué es la Ciberseguridad?",
          "duracion": 15,
          "esPreview": true,
          "esScorm": false,
          "completada": true
        }
      ]
    }
  ],
  "progreso": 45.50
}
```

---

## GET `/api/cursos/[id]/foro`

Lista de mensajes del foro de un curso.

**Auth:** Requerida (inscrito, instructor o admin)

**Query params:** `pagina`, `porPagina`

---

## POST `/api/cursos/[id]/foro`

Crea un mensaje en el foro del curso.

**Auth:** Requerida (inscrito, instructor o admin)

**Body:**
```json
{
  "contenido": "Mi pregunta sobre el módulo 2...",
  "padreId": null,
  "citaId": null
}
```

---

## POST `/api/cursos/[id]/foro/[msgId]/like`

Agrega o quita reacción a un mensaje del foro.

**Auth:** Requerida

---

## PUT `/api/cursos/[id]/foro/[msgId]/mod`

Fija o bloquea un mensaje del foro. Solo instructores y admin.

**Auth:** Requerida (instructor del curso o admin)

**Body:**
```json
{ "fijado": true, "bloqueado": false }
```

---

## GET `/api/cursos/[id]/sesiones`

Lista sesiones de videoconferencia del curso.

**Auth:** Requerida (inscrito, instructor o admin)

---

## POST `/api/cursos/[id]/sesiones`

Crea una sesión de videoconferencia.

**Auth:** Requerida (instructor del curso o admin)

**Body:**
```json
{
  "titulo": "Clase en vivo — Módulo 3",
  "descripcion": "Resolución de dudas",
  "urlReunion": "https://meet.google.com/abc-xyz",
  "fechaInicio": "2026-06-15T19:00:00Z",
  "duracion": 90
}
```

---

## GET `/api/cursos/externos`

Lista cursos externos aprobados visible en catálogo.

**Auth:** Pública

**Query params:** `fuente`, `categoria`, `q`, `pagina`, `porPagina`
