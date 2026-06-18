---
title: Códigos de Error
description: Tabla de códigos de error de la API SaberHub con mensajes estándar y cómo manejarlos.
---

## Tabla de códigos de error

| Código | HTTP | Mensaje estándar | Descripción |
|---|---|---|---|
| `CREDENCIALES_INVALIDAS` | 401 | Credenciales incorrectas | Email o contraseña no coinciden |
| `CUENTA_BLOQUEADA` | 401 | Cuenta bloqueada temporalmente | 5 intentos fallidos; incluye `bloqueadoHasta` en respuesta |
| `CUENTA_NO_VERIFICADA` | 401 | Verifica tu email antes de continuar | Email no confirmado |
| `TOKEN_INVALIDO` | 401 | Token inválido o expirado | JWT malformado, expirado o secreto incorrecto |
| `TOKEN_USADO` | 400 | Token ya utilizado | Token de reset o verificación de un solo uso ya consumido |
| `TOKEN_EXPIRADO` | 400 | Token expirado | Token de reset (>1h) o verificación (>24h) |
| `EMAIL_YA_REGISTRADO` | 409 | El email ya está registrado | Intento de registro con email existente |
| `DOCUMENTO_DUPLICADO` | 409 | El documento ya está registrado | Número de identificación ya en uso |
| `NO_AUTORIZADO` | 401 | No autorizado | Sin cookie JWT o token inválido |
| `SIN_PERMISOS` | 403 | No tienes permisos para realizar esta acción | Rol insuficiente |
| `NO_ENCONTRADO` | 404 | Recurso no encontrado | ID inexistente en la tabla |
| `CURSO_NO_PUBLICADO` | 403 | El curso no está publicado | Intento de inscribirse a borrador/archivado |
| `YA_INSCRITO` | 409 | Ya estás inscrito a este curso | Inscripción duplicada |
| `INTENTOS_AGOTADOS` | 403 | Has agotado el número de intentos permitidos | `intentosMaximos` alcanzado |
| `EVALUACION_EN_CURSO` | 409 | Ya tienes un intento en curso | Intento con `estado = en_curso` existente |
| `INTENTO_FINALIZADO` | 400 | El intento ya fue enviado | Intento con `estado != en_curso` |
| `CERTIFICADO_REVOCADO` | 403 | Este certificado ha sido revocado | Verificación de certificado con `estado = revocado` |
| `CERTIFICADO_NO_ENCONTRADO` | 404 | Certificado no encontrado | Código inválido en verificación pública |
| `ARCHIVO_DEMASIADO_GRANDE` | 400 | El archivo excede el tamaño máximo permitido | SCORM > 100MB u otros límites |
| `FORMATO_NO_VALIDO` | 400 | Formato de archivo no válido | SCORM sin `imsmanifest.xml`, imagen no válida, etc. |
| `FUENTE_BLOQUEADA` | 403 | La fuente está bloqueada | Intento de scrapear fuente con `bloqueado = true` |
| `CAMPO_REQUERIDO` | 400 | El campo `{campo}` es requerido | Validación de body faltante |
| `ERROR_INTERNO` | 500 | Error interno del servidor | Error no controlado; ver logs del servidor |

---

## Formato completo de error con código

```json
{
  "error": "Cuenta bloqueada temporalmente. Intenta en 15 minutos.",
  "codigo": "CUENTA_BLOQUEADA",
  "bloqueadoHasta": "2026-05-20T14:35:00.000Z"
}
```

Algunos errores incluyen campos adicionales según el contexto:
- `CUENTA_BLOQUEADA`: incluye `bloqueadoHasta` (ISO 8601)
- `CAMPO_REQUERIDO`: incluye `campo` con el nombre del campo faltante

---

## Cómo manejarlos en el frontend

### Patrón base

```ts
async function callApi(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  const data = await res.json();

  if (!res.ok) {
    // data.codigo está disponible para errores de negocio conocidos
    throw new ApiError(data.error, data.codigo, res.status, data);
  }

  return data;
}

class ApiError extends Error {
  constructor(
    message: string,
    public codigo?: string,
    public status?: number,
    public data?: unknown,
  ) {
    super(message);
  }
}
```

### Manejo por código

```ts
try {
  await callApi('/api/auth/login', { method: 'POST', body: JSON.stringify(creds) });
} catch (err) {
  if (err instanceof ApiError) {
    switch (err.codigo) {
      case 'CUENTA_BLOQUEADA':
        mostrarMensaje(`Bloqueada hasta: ${formatDate(err.data.bloqueadoHasta)}`);
        break;
      case 'CREDENCIALES_INVALIDAS':
        mostrarMensaje('Email o contraseña incorrectos');
        break;
      case 'CUENTA_NO_VERIFICADA':
        mostrarMensaje('Verifica tu email para continuar');
        break;
      default:
        mostrarMensaje(err.message);
    }
  }
}
```

### Redirección por 401

```ts
// En un wrapper global (middleware de fetch o interceptor)
if (err.status === 401) {
  // Sesión expirada → redirigir al login
  window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
}
```

### Errores de validación (400)

Los errores 400 sin `codigo` indican validación fallida. Mostrar `error` directamente al usuario:

```ts
if (err.status === 400) {
  setError(err.message); // "El campo titulo es requerido"
}
```
