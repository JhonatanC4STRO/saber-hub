---
title: Endpoints — Auth
description: Registro, login, verificación, recuperación y OAuth de SaberHub.
---

## POST `/api/auth/register`

Crea una nueva cuenta de usuario y envía email de verificación.

**Auth:** Pública

**Body:**
```json
{
  "nombre": "Ana Torres",
  "email": "ana@ejemplo.com",
  "documento": "1234567890",
  "password": "miPassword123"
}
```

**Respuestas:**

| Status | Descripción |
|---|---|
| `201` | Usuario creado; email de verificación enviado |
| `400` | Campo requerido faltante |
| `409` | `EMAIL_YA_REGISTRADO` o `DOCUMENTO_DUPLICADO` |

```json
// 201
{ "mensaje": "Cuenta creada. Revisa tu email para verificar tu cuenta." }
```

---

## POST `/api/auth/login`

Autentica al usuario y emite JWT en cookie HttpOnly.

**Auth:** Pública

**Body:**
```json
{
  "email": "ana@ejemplo.com",
  "password": "miPassword123"
}
```

**Respuestas:**

| Status | Descripción |
|---|---|
| `200` | Login exitoso; cookie `token` establecida |
| `401` | `CREDENCIALES_INVALIDAS`, `CUENTA_BLOQUEADA`, o `CUENTA_NO_VERIFICADA` |

```json
// 200
{
  "usuario": {
    "id": "cm...",
    "nombre": "Ana Torres",
    "email": "ana@ejemplo.com",
    "rol": "estudiante",
    "verificado": true
  }
}

// 401 bloqueado
{
  "error": "Cuenta bloqueada temporalmente.",
  "codigo": "CUENTA_BLOQUEADA",
  "bloqueadoHasta": "2026-05-20T14:35:00.000Z"
}
```

---

## POST `/api/auth/logout`

Elimina la cookie de sesión.

**Auth:** Recomendado autenticado

**Body:** Vacío

**Respuesta:**
```json
// 200
{ "ok": true }
```

---

## GET `/api/auth/me`

Devuelve el perfil del usuario autenticado.

**Auth:** Requerida

**Respuesta:**
```json
// 200
{
  "id": "cm...",
  "nombre": "Ana Torres",
  "email": "ana@ejemplo.com",
  "rol": "estudiante",
  "institucionId": null,
  "verificado": true,
  "imagen": null
}
```

---

## GET `/api/auth/verify?token=<token>`

Verifica la dirección de email del usuario usando el token enviado al correo.

**Auth:** Pública

**Query params:**

| Param | Tipo | Descripción |
|---|---|---|
| `token` | `string` | Token del email de verificación |

**Respuestas:**

| Status | Descripción |
|---|---|
| `200` | Email verificado exitosamente |
| `400` | `TOKEN_INVALIDO`, `TOKEN_USADO`, o `TOKEN_EXPIRADO` |

---

## POST `/api/auth/forgot-password`

Envía email con link de restablecimiento de contraseña.

**Auth:** Pública

**Body:**
```json
{ "email": "ana@ejemplo.com" }
```

**Respuestas:**
- `200` siempre (no revela si el email existe — seguridad)

```json
{ "mensaje": "Si el email existe, recibirás un link en los próximos minutos." }
```

---

## POST `/api/auth/reset-password`

Restablece la contraseña usando el token del email.

**Auth:** Pública

**Body:**
```json
{
  "token": "<token-del-email>",
  "password": "nuevaPassword123"
}
```

**Respuestas:**

| Status | Descripción |
|---|---|
| `200` | Contraseña actualizada; token invalidado |
| `400` | `TOKEN_INVALIDO`, `TOKEN_USADO`, o `TOKEN_EXPIRADO` |

---

## GET `/api/auth/google/callback?code=<code>`

Callback de Google OAuth 2.0. Intercambia el `code` por tokens de Google, obtiene el perfil y crea o autentica al usuario.

**Auth:** Pública

**Query params:**

| Param | Tipo | Descripción |
|---|---|---|
| `code` | `string` | Código de autorización de Google |

**Comportamiento:**
- Si el email no existe: crea cuenta con rol `estudiante` y `verificado = true`.
- Si el email ya existe: autentica normalmente.
- Redirige a `/dashboard` con cookie establecida.

---

## POST `/api/auth/register-instructor`

Envía solicitud para convertirse en instructor, incluyendo datos de experiencia.

**Auth:** Requerida (rol `estudiante`)

**Body:**
```json
{
  "experiencia": "5 años en desarrollo web",
  "areasExperiencia": "JavaScript, Python, Ciberseguridad",
  "aniosExperiencia": 5,
  "motivacion": "Quiero compartir mi conocimiento...",
  "enlacePortafolio": "https://miportafolio.com"
}
```

**Respuestas:**

| Status | Descripción |
|---|---|
| `201` | Solicitud enviada; admin notificado |
| `409` | Ya existe solicitud pendiente o aprobada |
