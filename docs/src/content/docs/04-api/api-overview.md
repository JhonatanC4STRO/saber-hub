---
title: Visión General de la API
description: Convenciones REST, formato de respuestas, autenticación y rate limiting de la API SaberHub.
---

## Convenciones generales

La API de SaberHub sigue convenciones REST estándar. Todos los endpoints viven bajo `/api/` y son implementados como Next.js Route Handlers en `app/api/**/route.ts`.

### Métodos HTTP

| Método | Uso |
|---|---|
| `GET` | Leer recursos (sin efectos secundarios) |
| `POST` | Crear recurso o ejecutar acción |
| `PUT` | Reemplazar recurso completo |
| `PATCH` | Actualizar campos específicos |
| `DELETE` | Eliminar recurso |

### Códigos de estado

| Código | Significado |
|---|---|
| `200 OK` | Operación exitosa |
| `201 Created` | Recurso creado exitosamente |
| `204 No Content` | Operación exitosa sin cuerpo de respuesta |
| `400 Bad Request` | Parámetros inválidos o body malformado |
| `401 Unauthorized` | No autenticado (falta o token inválido) |
| `403 Forbidden` | Autenticado pero sin permisos para la acción |
| `404 Not Found` | Recurso no encontrado |
| `409 Conflict` | Conflicto: recurso ya existe (ej. email duplicado) |
| `422 Unprocessable Entity` | Validación fallida con datos semánticamente incorrectos |
| `429 Too Many Requests` | Rate limit excedido |
| `500 Internal Server Error` | Error inesperado del servidor |

---

## Formato de respuestas

### Éxito

```json
// Recurso único
{
  "id": "cm...",
  "titulo": "Introducción a la Ciberseguridad",
  "estado": "publicado"
}

// Colección
{
  "data": [...],
  "total": 45,
  "pagina": 1,
  "porPagina": 12
}

// Operación sin retorno de recurso
{
  "ok": true,
  "mensaje": "Certificado revocado exitosamente"
}
```

### Error

```json
{
  "error": "Mensaje descriptivo del error",
  "codigo": "EMAIL_YA_REGISTRADO"
}
```

El campo `codigo` es opcional pero presente en errores de negocio conocidos. Ver [Error Codes](/04-api/error-codes) para la tabla completa.

---

## Autenticación

La API usa **JWT en cookie HttpOnly**. El token se emite en `POST /api/auth/login` y se almacena automáticamente en el navegador.

### Cookie

| Parámetro | Valor |
|---|---|
| Nombre | `token` |
| HttpOnly | ✅ (no accesible desde JS) |
| Secure | ✅ en producción |
| SameSite | `Strict` |
| maxAge | 30 minutos (renovable con actividad) |
| TTL del JWT | 7 días (HS256) |

### Verificación en handlers

Todos los endpoints protegidos extraen y verifican el token al inicio:

```ts
const cookieHeader = req.headers.get('cookie');
const token = cookieHeader?.match(/token=([^;]+)/)?.[1];
const payload = await verifyToken(token, process.env.JWT_SECRET!);
if (!payload) return Response.json({ error: 'No autorizado' }, { status: 401 });
```

### Endpoints públicos (sin autenticación)

| Endpoint | Descripción |
|---|---|
| `GET /api/cursos/catalogo` | Catálogo público de cursos |
| `GET /api/cursos/externos` | Cursos externos aprobados |
| `GET /api/certificados/verificar/[codigo]` | Verificación de certificado |
| `POST /api/auth/login` | Login |
| `POST /api/auth/register` | Registro |
| `GET /api/auth/verify` | Verificación de email |
| `POST /api/auth/forgot-password` | Solicitar reset de contraseña |
| `POST /api/auth/reset-password` | Restablecer contraseña |

---

## Versionado

La API actualmente no usa prefijo de versión (`/api/v1/`). Todos los endpoints están bajo `/api/` directamente.

Para el futuro (Fase 2 cuando exista app móvil):
- Se introducirá versionado con prefijo `/api/v2/` para cambios breaking.
- La `v1` (actual) se mantendrá con soporte por mínimo 6 meses tras publicación de `v2`.

---

## Rate limiting

No hay rate limiting implementado en la capa de aplicación en el MVP. Se delega al proxy/CDN (Vercel Edge Network) en producción.

**Comportamiento en producción (Vercel):**
- Límite global de Vercel: 1 000 req/s por deployment.
- No hay throttling diferenciado por usuario o endpoint.

**Pendiente (Fase 2):** Implementar rate limiting con sliding window en Redis para endpoints sensibles (login, registro, scraper manual).

---

## Organización de endpoints

| Dominio | Prefijo | Documentación |
|---|---|---|
| Autenticación | `/api/auth/` | [auth.md](/04-api/endpoints/auth) |
| Usuarios | `/api/admin/usuarios` | [usuarios.md](/04-api/endpoints/usuarios) |
| Cursos | `/api/cursos/` | [cursos.md](/04-api/endpoints/cursos) |
| Inscripciones | `/api/inscripciones/` | [inscripciones.md](/04-api/endpoints/inscripciones) |
| Evaluaciones | `/api/evaluaciones/` | [evaluaciones.md](/04-api/endpoints/evaluaciones) |
| Certificados | `/api/certificados/` | [certificados.md](/04-api/endpoints/certificados) |
| Instituciones | `/api/instituciones/` | [instituciones.md](/04-api/endpoints/instituciones) |
| Cursos externos | `/api/cursos/externos` | [cursos-externos.md](/04-api/endpoints/cursos-externos) |

La especificación completa en formato OpenAPI está disponible en [`/openapi.json`](/openapi.json).
