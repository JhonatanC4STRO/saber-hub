---
title: Endpoints — Instituciones
description: Gestión de instituciones, solicitudes de vinculación e invitaciones.
---

## GET `/api/instituciones`

Lista instituciones activas.

**Auth:** Pública

**Respuesta 200:**
```json
{
  "data": [
    {
      "id": "cm...",
      "nombre": "SENA",
      "slug": "sena",
      "descripcion": "Servicio Nacional de Aprendizaje...",
      "logoUrl": "https://...",
      "url": "https://www.sena.edu.co",
      "_count": { "cursos": 3 }
    }
  ]
}
```

---

## GET `/api/instituciones/[id]`

Detalle de una institución.

**Auth:** Pública

---

## PUT `/api/instituciones/[id]/configurar`

Actualiza configuración de una institución.

**Auth:** Requerida (admin institucional de esa institución o admin global)

**Body:**
```json
{
  "nombre": "SENA — Sede Nacional",
  "descripcion": "...",
  "url": "https://www.sena.edu.co",
  "logoUrl": "https://res.cloudinary.com/...",
  "correoAdmin": "admin@sena.edu.co",
  "telefono": "3101234567"
}
```

---

## GET `/api/instituciones/[id]/cursos`

Cursos publicados de una institución.

**Auth:** Pública

---

## POST `/api/instituciones/[id]/invitar-instructor`

Envía invitación por email a un instructor para unirse a la institución.

**Auth:** Requerida (admin institucional o admin global)

**Body:**
```json
{ "correo": "instructor@ejemplo.com" }
```

**Respuesta 200:**
```json
{ "ok": true, "mensaje": "Invitación enviada a instructor@ejemplo.com" }
```

---

## PUT `/api/instituciones/admin/configurar`

Configuración administrativa global de una institución (solo admin global).

**Auth:** Requerida (admin)

---

## POST `/api/instituciones/solicitud`

Envía solicitud de vinculación de una institución nueva.

**Auth:** Pública (cualquier persona puede solicitar vinculación)

**Body:**
```json
{
  "nombreLegal": "Universidad Distrital Francisco José de Caldas",
  "nit": "899999230-7",
  "descripcion": "Universidad pública de Bogotá...",
  "sitioWeb": "https://www.udistrital.edu.co",
  "correoInstitucional": "rectoria@udistrital.edu.co",
  "nombreRepresentante": "Dr. Ricardo García",
  "telefono": "6013238400"
}
```

**Respuesta 201:**
```json
{
  "id": "cm...",
  "estado": "pendiente",
  "fechaSolicitud": "2026-05-20T10:00:00.000Z",
  "mensaje": "Tu solicitud fue recibida. Recibirás respuesta en máximo 5 días hábiles."
}
```

---

## GET `/api/admin/instituciones/solicitudes`

Lista solicitudes de institución. Solo admin.

**Auth:** Requerida (admin)

**Query params:** `estado` (`pendiente`, `en_revision`, `aprobada`, `rechazada`)

---

## PUT `/api/admin/instituciones/solicitudes/[id]`

Actualiza estado de una solicitud de institución.

**Auth:** Requerida (admin)

**Body:**
```json
{
  "estado": "aprobada"
}
```

O para rechazo:
```json
{
  "estado": "rechazada",
  "motivoRechazo": "Documentación incompleta"
}
```

**Estados válidos:** `en_revision`, `pendiente_informacion`, `aprobada`, `rechazada`

Cuando `estado = aprobada`:
1. Se crea el registro en `Institucion`.
2. Se envía email de bienvenida.
3. Se genera token de invitación de admin institucional.
