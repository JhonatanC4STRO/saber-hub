---
title: "ADR-002: JWT custom sin NextAuth"
description: Decisión de implementar autenticación JWT propia en lugar de usar NextAuth.js / Auth.js.
---

## Contexto

SaberHub requiere autenticación con:
- Email + contraseña con bloqueo por intentos fallidos (5 intentos → 15 min).
- Google OAuth 2.0.
- Verificación de email con token de un solo uso (24 h).
- Recuperación de contraseña con token de un solo uso (1 h).
- JWT almacenado en cookie HttpOnly (no localStorage).
- Control total sobre el payload del JWT (userId, rol, institución).
- Compatibilidad con API routes que usan el token para autorización.

---

## Decisión

Implementar **JWT custom** usando:
- `jose` 6.2.3 para firmar/verificar tokens (Web Crypto API, Edge-compatible).
- `bcryptjs` 3.0.3 para hash de contraseñas.
- Google OAuth 2.0 implementado manualmente (callback en `/api/auth/google/callback`).
- Tokens de verificación/reset almacenados en tablas `VerificationToken` y `PasswordResetToken` en PostgreSQL.

---

## Alternativas consideradas

### NextAuth.js / Auth.js v5
- Provee OAuth, email, credenciales out-of-the-box.
- Gran ecosistema de providers.
- **Descartado por:**
  - Abstrae demasiado el manejo de sesiones; dificulta lógica de bloqueo por intentos.
  - El modelo de sesión de NextAuth no se adapta bien a roles custom con múltiples asignaciones (`UsuarioRol`).
  - El callback `jwt()` y `session()` de NextAuth añaden complejidad para casos como bloqueo temporal de cuenta.
  - Dependencia pesada que controla el flujo de auth; preferimos control explícito sobre tokens.

### Lucia Auth
- Más ligero que NextAuth, control de sesiones en BD.
- **Descartado:** menor adopción, documentación menos madura al momento de la decisión.

### Clerk / Auth0 (SaaS)
- Solución completa gestionada externamente.
- **Descartado:** costo mensual incompatible con modelo 100 % gratuito; datos de usuarios en terceros; dependencia de servicio externo.

---

## Consecuencias

**Positivas:**
- Control total sobre el payload JWT; se incluye `userId`, `rol`, `institucionId` según necesidad.
- Lógica de bloqueo por intentos (`intentosFallidos`, `bloqueadoHasta`) implementada directamente en el route handler de login.
- Tokens de verificación/reset con hash SHA-256 en BD; invalidados inmediatamente tras uso.
- Sin overhead de dependencias adicionales de NextAuth.

**Negativas / tradeoffs:**
- Mayor código a mantener (6 route handlers de auth vs. configuración declarativa).
- Responsabilidad propia sobre actualizaciones de seguridad en la implementación.
- No hay UI de login pre-construida; todo es custom.

**Implementación:**

```
lib/jwt.ts       → signToken(payload, secret) / verifyToken(token, secret)
lib/password.js  → hashPassword(plain) / verifyPassword(plain, hash)
app/api/auth/
  login/         → verifica credenciales, bloqueo, emite JWT en cookie
  register/      → crea usuario, envía email de verificación
  verify/        → valida token 24h, marca cuenta verificada
  forgot-password/ → emite token 1h, envía email
  reset-password/  → valida token, actualiza hash, invalida token
  google/callback/ → intercambia code → tokens → upsert usuario
  logout/        → elimina cookie
```
