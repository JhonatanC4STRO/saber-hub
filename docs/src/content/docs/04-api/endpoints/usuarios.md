---
title: Endpoints — Usuarios (Admin)
description: Gestión de usuarios, instructores y reportes desde el panel de administración.
---

## GET `/api/admin/usuarios`

Lista todos los usuarios de la plataforma.

**Auth:** Requerida (admin)

**Query params:** `rol`, `q` (búsqueda por nombre/email), `activo`, `pagina`, `porPagina`

**Respuesta 200:**
```json
{
  "data": [
    {
      "id": "cm...",
      "nombre": "Ana Torres",
      "email": "ana@ejemplo.com",
      "rol": { "nombre": "estudiante" },
      "activo": true,
      "verificado": true,
      "fechaRegistro": "2026-05-15T10:00:00.000Z",
      "_count": { "inscripciones": 3 }
    }
  ],
  "total": 248
}
```

---

## PUT `/api/admin/usuarios/[id]`

Actualiza usuario (rol, estado activo, etc.).

**Auth:** Requerida (admin)

**Body:**
```json
{
  "rolId": "cm...",
  "activo": false,
  "nombre": "Ana Torres Actualizado"
}
```

---

## POST `/api/admin/crear-usuario`

Crea usuario directamente (sin flujo de registro/verificación).

**Auth:** Requerida (admin)

**Body:**
```json
{
  "nombre": "Luis Martínez",
  "email": "luis@ejemplo.com",
  "documento": "9876543210",
  "password": "tempPass123",
  "rolId": "cm...",
  "institucionId": "cm..."
}
```

---

## GET `/api/admin/instructores`

Lista instructores aprobados.

**Auth:** Requerida (admin)

---

## GET `/api/admin/solicitudes-instructor`

Lista solicitudes de instructor pendientes o en revisión.

**Auth:** Requerida (admin)

**Query params:** `estado`

---

## PUT `/api/admin/solicitudes-instructor/[id]`

Aprueba o rechaza solicitud de instructor.

**Auth:** Requerida (admin)

**Body:**
```json
{ "estado": "aprobada" }
// o
{ "estado": "rechazada", "motivoRechazo": "Portafolio insuficiente" }
```

Cuando `estado = aprobada`:
1. El rol del usuario cambia a `instructor`.
2. Se envía email de bienvenida.

---

## POST `/api/reportes/exportar`

Genera reporte Excel o PDF de progreso e inscripciones.

**Auth:** Requerida (instructor del curso o admin)

**Body:**
```json
{
  "tipo": "progreso",
  "cursoId": "cm...",
  "formato": "xlsx",
  "filtros": {
    "estado": "activo",
    "fechaDesde": "2026-01-01T00:00:00Z",
    "fechaHasta": "2026-12-31T23:59:59Z"
  }
}
```

**`tipo`:** `progreso` | `calificaciones` | `inscripciones` | `auditoria`

**`formato`:** `xlsx` | `pdf`

**Respuesta:** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (Excel) o `application/pdf`.

---

## GET `/api/admin/auditoria`

Consulta log de auditoría con filtros.

**Auth:** Requerida (admin)

**Query params:** `usuarioId`, `accion`, `tabla`, `fechaDesde`, `fechaHasta`, `pagina`, `porPagina`

**Respuesta 200:**
```json
{
  "data": [
    {
      "id": "cm...",
      "accion": "CURSO_PUBLICADO",
      "tabla": "cursos",
      "registroId": "cm...",
      "ip": "190.x.x.x",
      "fecha": "2026-05-20T10:00:00.000Z",
      "usuario": { "nombre": "Carlos Pérez", "email": "carlos@..." }
    }
  ],
  "total": 1540
}
```

---

## GET `/api/webhooks`

Lista webhooks configurados.

**Auth:** Requerida (admin)

---

## POST `/api/webhooks`

Crea webhook de eventos.

**Auth:** Requerida (admin)

**Body:**
```json
{
  "url": "https://mi-sistema.com/webhooks/saberhub",
  "eventos": "inscripcion.creada,certificacion.emitida,evaluacion.aprobada",
  "secreto": "mi-secreto-hmac-256"
}
```

**Eventos disponibles:** `inscripcion.creada`, `inscripcion.finalizada`, `certificacion.emitida`, `certificacion.revocada`, `evaluacion.aprobada`, `evaluacion.reprobada`, `solicitud_instructor.aprobada`
