---
title: Endpoints — Certificados
description: Emisión, descarga, verificación y revocación de certificados en SaberHub.
---

## GET `/api/certificados`

Lista certificados del usuario autenticado.

**Auth:** Requerida

**Respuesta 200:**
```json
{
  "data": [
    {
      "id": "cm...",
      "codigoUnico": "SBHB-2026-A1B2C3",
      "estado": "emitido",
      "fechaEmision": "2026-05-20T10:00:00.000Z",
      "urlPdf": "https://res.cloudinary.com/...",
      "inscripcion": {
        "curso": {
          "titulo": "Introducción a la Ciberseguridad",
          "instructor": { "nombre": "Carlos Pérez" },
          "institucion": { "nombre": "MinTIC" }
        }
      }
    }
  ]
}
```

---

## GET `/api/certificados/verificar/[codigo]`

Verifica la autenticidad de un certificado por código único. **Endpoint público.**

**Auth:** Pública

**Respuestas:**

| Status | Descripción |
|---|---|
| `200` | Certificado válido con datos del titular |
| `404` | `CERTIFICADO_NO_ENCONTRADO` |
| `403` | `CERTIFICADO_REVOCADO` |

```json
// 200
{
  "valido": true,
  "codigoUnico": "SBHB-2026-A1B2C3",
  "titular": "Ana Torres",
  "curso": "Introducción a la Ciberseguridad",
  "institucion": "MinTIC",
  "instructor": "Carlos Pérez",
  "fechaEmision": "2026-05-20T10:00:00.000Z",
  "estado": "emitido"
}

// 403 revocado
{
  "valido": false,
  "error": "Este certificado ha sido revocado.",
  "codigo": "CERTIFICADO_REVOCADO"
}
```

---

## GET `/api/certificados/pdf/[codigo]`

Genera y devuelve el PDF de un certificado de curso.

**Auth:** Requerida (titular del certificado o admin)

**Respuesta:** `application/pdf` con el PDF generado por pdf-lib.

El PDF incluye:
- Nombre del titular
- Nombre del curso
- Institución y logo (si disponible)
- Nombre del instructor
- Fecha de emisión
- Código único de verificación
- URL de verificación

---

## GET `/api/certificados/ruta-pdf/[codigo]`

Genera y devuelve el PDF de un certificado de ruta de formación.

**Auth:** Requerida (titular o admin)

**Respuesta:** `application/pdf`

---

## POST `/api/certificados/[id]/revocar`

Revoca un certificado emitido.

**Auth:** Requerida (admin)

**Body:**
```json
{ "motivo": "Incumplimiento de política académica" }
```

**Respuestas:**

| Status | Descripción |
|---|---|
| `200` | Certificado revocado; estado actualizado a `revocado` |
| `400` | Certificado ya está revocado |
| `404` | Certificado no encontrado |

```json
// 200
{
  "ok": true,
  "codigoUnico": "SBHB-2026-A1B2C3",
  "estado": "revocado"
}
```

---

## Emisión automática de certificados

Los certificados **no se emiten manualmente** por la API — se emiten automáticamente cuando:

1. `POST /api/progreso/leccion` detecta `progreso = 100 %`
2. El curso tiene `otorgaCertificado = true`
3. Si `criterioEvalAprobadas = true`: todas las evaluaciones deben estar aprobadas
4. Si `criterioNotaGlobal` está definido: la nota global debe superar ese umbral

La lógica de emisión está en `lib/notificaciones.js` y es invocada desde el handler de progreso.
