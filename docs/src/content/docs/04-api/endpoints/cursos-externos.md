---
title: Endpoints — Cursos Externos y Scraping
description: Gestión de cursos externos, fuentes y ejecución del scraper.
---

## GET `/api/cursos/externos`

Lista cursos externos aprobados. Visible en el catálogo público.

**Auth:** Pública

**Query params:** `fuente`, `nivel`, `idioma`, `q`, `pagina`, `porPagina`

**Respuesta 200:**
```json
{
  "data": [
    {
      "id": "cm...",
      "titulo": "Programación en Python — SENA",
      "descripcion": "...",
      "fuenteUrl": "https://sofia.sena.edu.co/...",
      "fuenteNombre": "SENA Sofia Plus",
      "duracionHoras": 40,
      "nivel": "Básico",
      "modalidad": "Virtual",
      "imagenUrl": "https://...",
      "areaConocimiento": "Tecnología",
      "centroFormacion": "Centro de Servicios y Gestión Empresarial"
    }
  ],
  "total": 127
}
```

---

## GET `/api/admin/cursos-externos`

Lista cursos externos incluyendo pendientes y rechazados. Solo admin.

**Auth:** Requerida (admin)

**Query params:** `estado` (`pendiente`, `aprobado`, `rechazado`), `fuente`, `pagina`

---

## PUT `/api/admin/cursos-externos/[id]`

Aprueba o rechaza un curso externo scrapeado.

**Auth:** Requerida (admin)

**Body:**
```json
{ "estado": "aprobado" }
// o
{ "estado": "rechazado", "motivoRechazo": "Contenido duplicado" }
```

---

## POST `/api/admin/cursos-externos/aprobar-bulk`

Aprueba múltiples cursos externos en una sola operación.

**Auth:** Requerida (admin)

**Body:**
```json
{ "ids": ["cm...", "cm...", "cm..."] }
```

**Respuesta 200:**
```json
{ "aprobados": 12, "errores": 0 }
```

---

## GET `/api/admin/fuentes`

Lista fuentes externas registradas con su estado.

**Auth:** Requerida (admin)

**Respuesta 200:**
```json
{
  "data": [
    {
      "id": "cm...",
      "nombre": "SENA Sofia Plus",
      "urlBase": "https://oferta.senasofiaplus.edu.co",
      "tieneApi": false,
      "bloqueado": false,
      "fechaBloqueo": null
    }
  ]
}
```

---

## PUT `/api/admin/fuentes/[id]`

Bloquea o habilita una fuente externa.

**Auth:** Requerida (admin)

**Body para bloquear:**
```json
{
  "bloqueado": true,
  "motivoBloqueo": "Sitio no respeta robots.txt — pendiente revisión legal"
}
```

**Body para habilitar:**
```json
{ "bloqueado": false }
```

---

## GET `/api/admin/logs-scraping`

Historial de ejecuciones del scraper.

**Auth:** Requerida (admin)

**Query params:** `fuente`, `exitoso`, `pagina`, `porPagina`

**Respuesta 200:**
```json
{
  "data": [
    {
      "id": "cm...",
      "fuente": "SENA Sofia Plus",
      "fechaEjecucion": "2026-05-20T02:00:00.000Z",
      "cursosEncontrados": 284,
      "cursosNuevos": 12,
      "cursosActualizados": 45,
      "errores": 0,
      "exitoso": true,
      "duracionMs": 45230
    }
  ]
}
```

---

## POST `/api/admin/scrapers/run`

Ejecuta el scraper manualmente para una fuente específica.

**Auth:** Requerida (admin)

**Body:**
```json
{ "fuente": "SENA Sofia Plus" }
```

**Respuesta 202 Accepted:**
```json
{
  "ok": true,
  "mensaje": "Scraper iniciado. Consulta /api/admin/scrapers/status para el resultado."
}
```

El scraper corre de forma asíncrona. La respuesta es inmediata; el resultado se consulta en el siguiente endpoint.

---

## GET `/api/admin/scrapers/status`

Estado del último scraper ejecutado.

**Auth:** Requerida (admin)

**Respuesta 200:**
```json
{
  "estado": "completado",
  "fuente": "SENA Sofia Plus",
  "fechaEjecucion": "2026-05-20T10:05:00.000Z",
  "cursosNuevos": 8,
  "errores": 0,
  "duracionMs": 38200
}
```

**`estado`:** `en_ejecucion` | `completado` | `fallido`

---

## Programación automática del scraper

El scraper puede ejecutarse con cron jobs en `/api/cron/alertas`. La ejecución automática respeta:

1. `robots.txt` verificado con `robots-parser` antes de cada petición.
2. Fuentes con `bloqueado = true` omitidas.
3. Log de ejecución registrado en `LogScraping` independientemente del resultado.
