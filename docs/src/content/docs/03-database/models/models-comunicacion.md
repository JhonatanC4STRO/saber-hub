---
title: Modelos — Comunicación y Grupos
description: Foros, mensajería, notificaciones, sesiones, grupos, auditoría y webhooks en SaberHub.
---

## `Foro` → tabla `foros`

Espacio de discusión asociado a un curso.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `cursoId` | `String` | FK → `cursos.id` (Cascade) |
| `titulo` | `String` | |
| `descripcion` | `String?` | |
| `creado` | `DateTime` default now | |

**Índices:** `[cursoId]`

---

## `MensajeForo` → tabla `mensajes_foro`

Mensaje dentro de un foro. Soporta hilos (padre/hijo) y citas.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `foroId` | `String` | FK → `foros.id` (Cascade) |
| `usuarioId` | `String` | FK → `usuarios.id` (Cascade) |
| `padreId` | `String?` | FK → `mensajes_foro.id` (Cascade); auto-referencia para hilos |
| `citaId` | `String?` | FK → `mensajes_foro.id` (SetNull); cita de otro mensaje |
| `titulo` | `String?` | Solo en mensajes raíz |
| `contenido` | `String` | |
| `fijado` | `Boolean` default false | Solo instructores/admin pueden fijar |
| `bloqueado` | `Boolean` default false | Mensaje bloqueado no acepta respuestas |
| `creado` | `DateTime` default now | |
| `actualizado` | `DateTime` @updatedAt | |

**Índices:** `[foroId]`, `[usuarioId]`

---

## `ReaccionForo` → tabla `reacciones_foro`

Reacción emoji de un usuario a un mensaje del foro.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `mensajeId` | `String` | FK → `mensajes_foro.id` (Cascade) |
| `usuarioId` | `String` | FK → `usuarios.id` (Cascade) |
| `creado` | `DateTime` default now | |

**Restricción única:** `@@unique([mensajeId, usuarioId])` — un usuario solo puede reaccionar una vez por mensaje.

---

## `MensajeInterno` → tabla `mensajes_internos`

Mensaje directo entre usuarios o hacia un grupo.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `remitenteId` | `String` | FK → `usuarios.id` (Cascade) |
| `destinatarioId` | `String?` | FK → `usuarios.id` (Cascade); `null` si es mensaje grupal |
| `grupoId` | `String?` | FK → `grupos.id` (Cascade); `null` si es mensaje 1:1 |
| `asunto` | `String?` | |
| `contenido` | `String` | |
| `leido` | `Boolean` default false | Solo para mensajes 1:1 |
| `fechaEnvio` | `DateTime` default now | |
| `fechaLectura` | `DateTime?` | |

**Índices:** `[destinatarioId]`, `[remitenteId]`, `[grupoId]`

---

## `MensajeInternoLectura` → tabla `mensajes_internos_lectura`

Registro de lectura por usuario para mensajes grupales.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `mensajeId` | `String` | FK → `mensajes_internos.id` (Cascade) |
| `usuarioId` | `String` | FK → `usuarios.id` (Cascade) |
| `fechaLectura` | `DateTime` default now | |

**Restricción única:** `@@unique([mensajeId, usuarioId])`

---

## `Notificacion` → tabla `notificaciones`

Notificación in-app generada por eventos del sistema.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `usuarioId` | `String` | FK → `usuarios.id` (Cascade) |
| `tipo` | `TipoNotificacion` | `inscripcion` · `evaluacion` · `certificado` · `foro` · `mensaje` · `sistema` · `solicitud_instructor` · `sesion` |
| `titulo` | `String` | |
| `contenido` | `String?` | |
| `urlDestino` | `String?` | Ruta a la que redirige al hacer click |
| `leida` | `Boolean` default false | |
| `fechaEnvio` | `DateTime` default now | |

**Índices:** `[usuarioId]`, `[leida]`

---

## `SesionVideoconferencia` → tabla `sesiones_videoconferencia`

Sesión de clase en vivo programada dentro de un curso.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `cursoId` | `String` | FK → `cursos.id` (Cascade) |
| `creadorId` | `String` | FK → `usuarios.id` (Restrict) |
| `titulo` | `String` | |
| `descripcion` | `String?` | |
| `urlReunion` | `String?` | Link de Zoom, Meet, Jitsi, etc. |
| `duracion` | `Int?` | Duración estimada en minutos (`duracion_estimada`) |
| `urlGrabacion` | `String?` | Link de grabación tras finalizar |
| `fechaInicio` | `DateTime` | |
| `fechaFin` | `DateTime?` | |
| `estado` | `EstadoSesion` default programada | `programada` → `en_curso` → `finalizada` / `cancelada` |
| `creado` | `DateTime` default now | |

**Índices:** `[cursoId]`, `[fechaInicio]`

---

## `Grupo` → tabla `grupos`

Cohorte o salón de clase que agrupa estudiantes y cursos.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `nombre` | `String` | |
| `descripcion` | `String?` | |
| `fechaInicio` | `DateTime` | |
| `fechaFin` | `DateTime?` | |
| `activo` | `Boolean` default true | |
| `creadorId` | `String` | FK → `usuarios.id` (Cascade) |
| `creado` | `DateTime` default now | |
| `actualizado` | `DateTime` @updatedAt | |

**Índices:** `[creadorId]`

---

## `MiembroGrupo` → tabla `miembros_grupo`

Membresía de un usuario en un grupo.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `grupoId` | `String` | FK → `grupos.id` (Cascade) |
| `usuarioId` | `String` | FK → `usuarios.id` (Cascade) |
| `creado` | `DateTime` default now | |

**Restricción única:** `@@unique([grupoId, usuarioId])`

---

## `AsignacionGrupoCurso` → tabla `asignaciones_grupo_curso`

Asignación de un curso a un grupo.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `grupoId` | `String` | FK → `grupos.id` (Cascade) |
| `cursoId` | `String` | FK → `cursos.id` (Cascade) |
| `creado` | `DateTime` default now | |

**Restricción única:** `@@unique([grupoId, cursoId])`

---

## `AvisoGrupo` → tabla `avisos_grupo`

Anuncio publicado en un grupo.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `grupoId` | `String` | FK → `grupos.id` (Cascade) |
| `autorId` | `String` | FK → `usuarios.id` (Cascade) |
| `titulo` | `String` | |
| `contenido` | `String` | |
| `creado` | `DateTime` default now | |

---

## `ArchivoGrupo` → tabla `archivos_grupo`

Archivo compartido en el espacio colaborativo de un grupo (almacenado en Cloudinary).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `grupoId` | `String` | FK → `grupos.id` (Cascade) |
| `autorId` | `String` | FK → `usuarios.id` (Cascade) |
| `nombre` | `String` | Nombre del archivo |
| `tipo` | `String` | `pdf`, `video`, `imagen`, `otro` (string libre) |
| `url` | `String` | Cloudinary URL |
| `peso` | `Int` | Tamaño en bytes |
| `version` | `Int` default 1 | Incrementa en cada resubida del mismo archivo |
| `creado` | `DateTime` default now | |

---

## `LogAuditoria` → tabla `logs_auditoria`

Registro inmutable de acciones relevantes en la plataforma.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `usuarioId` | `String?` | FK → `usuarios.id` (SetNull); `null` si acción de sistema |
| `accion` | `String` | Ej.: `LOGIN`, `CURSO_PUBLICADO`, `CERTIFICADO_REVOCADO` |
| `tabla` | `String?` | Nombre de la tabla afectada |
| `registroId` | `String?` | ID del registro afectado |
| `datosAntes` | `String?` | JSON serializado del estado previo |
| `datosDespues` | `String?` | JSON serializado del estado nuevo |
| `ip` | `String?` | IP del cliente |
| `fecha` | `DateTime` default now | |

**Índices:** `[usuarioId]`, `[fecha]`, `[accion]`

---

## `Webhook` → tabla `webhooks`

Suscripción a eventos del sistema con entrega HTTP firmada.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` @id @cuid | |
| `url` | `String` | Endpoint destino |
| `activo` | `Boolean` default true | |
| `eventos` | `String` | CSV de eventos suscritos: `"inscripcion.creada,certificacion.emitida"` |
| `secreto` | `String?` | Clave para firma HMAC-SHA256 del payload |
| `creado` | `DateTime` default now | |
| `actualizado` | `DateTime` @updatedAt | |
