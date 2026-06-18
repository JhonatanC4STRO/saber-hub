---
title: Modelos — Usuarios y Auth
description: Esquema de Usuario, Rol, tokens de seguridad y solicitudes de instructor en SaberHub.
---

## `Usuario` → tabla `usuarios`

Modelo central. Cada persona registrada en la plataforma tiene un único registro aquí.

| Campo | Tipo Prisma | Columna DB | Notas |
|---|---|---|---|
| `id` | `String` @id @cuid | `id` | PK generado con cuid() |
| `rolId` | `String` | `rol_id` | FK → `roles.id` (Restrict) |
| `institucionId` | `String?` @unique | `institucion_id` | FK → `instituciones.id` (SetNull); `@unique` = un admin por institución |
| `nombre` | `String` | `nombre` | Nombre completo |
| `email` | `String` @unique | `email` | Login principal |
| `documento` | `String` @unique | `documento` | Número de documento de identidad |
| `passwordHash` | `String` | `password_hash` | bcryptjs, cost factor 10 |
| `telefono` | `String?` @unique | `telefono` | Opcional |
| `imagen` | `String?` | `imagen` | URL avatar (Cloudinary) |
| `activo` | `Boolean` default true | `activo` | Desactivación lógica |
| `verificado` | `Boolean` default false | `verificado` | `true` tras confirmar email |
| `ultimoLogin` | `DateTime?` | `ultimo_login` | |
| `intentosFallidos` | `Int` default 0 | `intentos_fallidos` | Incrementa en cada login fallido; reset en login exitoso |
| `bloqueadoHasta` | `DateTime?` | `bloqueado_hasta` | `now() + 15min` tras 5 intentos fallidos |
| `fechaRegistro` | `DateTime` default now | `fecha_registro` | |
| `creado` | `DateTime` default now | `creado` | |
| `actualizado` | `DateTime` @updatedAt | `actualizado` | |

### Preferencias de notificación (16 campos boolean)

Formato: `pref{Email|InApp}{TipoNotificacion}` → `pref_email_inscripcion`, `pref_in_app_foro`, etc.

| Tipo | Email | In-App |
|---|---|---|
| inscripcion | `prefEmailInscripcion` | `prefInAppInscripcion` |
| evaluacion | `prefEmailEvaluacion` | `prefInAppEvaluacion` |
| certificado | `prefEmailCertificado` | `prefInAppCertificado` |
| foro | `prefEmailForo` | `prefInAppForo` |
| mensaje | `prefEmailMensaje` | `prefInAppMensaje` |
| sesion | `prefEmailSesion` | `prefInAppSesion` |
| solicitud | `prefEmailSolicitud` | `prefInAppSolicitud` |

Todos `default(true)`.

### Índices
```
@@index([rolId])
@@index([email])
@@index([institucionId])
```

### Relaciones salientes
| Relación | Tipo | Modelo destino |
|---|---|---|
| `rol` | N:1 | `Rol` |
| `institucion` | N:1? | `Institucion` (como admin) |
| `cursosCreados` | 1:N | `Curso` (InstructorCursos) |
| `inscripciones` | 1:N | `Inscripcion` |
| `intentosExamen` | 1:N | `IntentoExamen` |
| `progresoLecciones` | 1:N | `ProgresoLeccion` |
| `progresoScorm` | 1:N | `ProgresoScorm` |
| `solicitudesEnviadas` | 1:N | `SolicitudInstructor` (Solicitante) |
| `solicitudesRevisadas` | 1:N | `SolicitudInstructor` (Revisor) |
| `evaluacionesCreadas` | 1:N | `Evaluacion` |
| `mensajesForo` | 1:N | `MensajeForo` |
| `mensajesEnviados` | 1:N | `MensajeInterno` (Remitente) |
| `mensajesRecibidos` | 1:N | `MensajeInterno` (Destinatario) |
| `notificaciones` | 1:N | `Notificacion` |
| `sesionesCreadas` | 1:N | `SesionVideoconferencia` |
| `logsAuditoria` | 1:N | `LogAuditoria` |
| `gruposCreados` | 1:N | `Grupo` (GrupoCreador) |
| `gruposMiembro` | 1:N | `MiembroGrupo` |
| `rutasCreadas` | 1:N | `RutaFormacion` |
| `certificadosRuta` | 1:N | `CertificadoRuta` |
| `instructoresInvitados` | 1:N | `TokenInvitacionInstructor` (AdminInvitor) |
| `bancoCategorias` | 1:N | `CategoriaBanco` |
| `bancoPreguntas` | 1:N | `PreguntaBanco` |
| `avisosGrupo` | 1:N | `AvisoGrupo` |
| `archivosGrupo` | 1:N | `ArchivoGrupo` |

---

## `Rol` → tabla `roles`

Catálogo de roles asignables a usuarios.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | PK |
| `nombre` | `String` @unique | `admin`, `instructor`, `estudiante`, etc. |
| `descripcion` | `String?` | |

**Seed inicial:** `admin`, `instructor`, `estudiante` (creados por seed o manualmente).

---

## `PasswordResetToken` → tabla `password_reset_tokens`

Token de un solo uso para restablecer contraseña.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `token` | `String` @unique | Hash SHA-256 del token enviado al usuario |
| `usuarioId` | `String` | FK → `usuarios.id` (Cascade) |
| `expira` | `DateTime` | `now() + 1h` al crear |
| `usado` | `Boolean` default false | Se marca `true` inmediatamente al usarse |
| `creado` | `DateTime` default now | |

**Índices:** `[usuarioId]`, `[token]`

---

## `VerificationToken` → tabla `verification_tokens`

Token para verificar la dirección de email del usuario.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `token` | `String` @unique | |
| `usuarioId` | `String` | FK → `usuarios.id` (Cascade) |
| `expira` | `DateTime` | `now() + 24h` al crear |
| `usado` | `Boolean` default false | |
| `creado` | `DateTime` default now | |

**Índices:** `[usuarioId]`, `[token]`

---

## `SolicitudInstructor` → tabla `solicitudes_instructor`

Solicitud de un usuario para obtener el rol de instructor.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `usuarioId` | `String` | FK → `usuarios.id` (Cascade) |
| `estado` | `EstadoSolicitud` default pendiente | |
| `experiencia` | `String?` | Descripción libre |
| `areasExperiencia` | `String?` | Áreas técnicas |
| `aniosExperiencia` | `Int?` | |
| `motivacion` | `String?` | |
| `enlacePortafolio` | `String?` | URL |
| `urlCurriculum` | `String?` | Cloudinary URL del CV subido |
| `documentos` | `String?` | JSON con URLs adicionales |
| `motivoRechazo` | `String?` | Obligatorio si `estado = rechazada` |
| `fechaSolicitud` | `DateTime` default now | |
| `fechaRevision` | `DateTime?` | |
| `revisorId` | `String?` | FK → `usuarios.id` (SetNull); admin que revisó |

**Índices:** `[usuarioId]`, `[estado]`

---

## `TokenInvitacionInstructor` → tabla `tokens_invitacion_instructor`

Invitación enviada por un admin institucional para incorporar un instructor.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `token` | `String` @unique | |
| `institucionId` | `String` | FK → `instituciones.id` (Cascade) |
| `adminId` | `String` | FK → `usuarios.id` (Cascade); quien invitó |
| `correo` | `String` | Email del instructor invitado |
| `expira` | `DateTime` | |
| `usado` | `Boolean` default false | |
| `creado` | `DateTime` default now | |

---

## `TokenInvitacionAdmin` → tabla `tokens_invitacion_admin`

Invitación para asignar el rol de admin institucional.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `token` | `String` @unique | |
| `institucionId` | `String` | FK → `instituciones.id` (Cascade) |
| `correo` | `String` | |
| `expira` | `DateTime` | |
| `usado` | `Boolean` default false | |
| `creado` | `DateTime` default now | |
