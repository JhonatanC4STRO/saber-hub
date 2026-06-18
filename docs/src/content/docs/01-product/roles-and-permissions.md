---
title: Roles y Permisos
description: Matriz de roles vs permisos, descripción de cada rol y acceso por pantalla en SaberHub.
---

## Descripción de roles

| Rol | Cómo se obtiene | Descripción |
|---|---|---|
| **estudiante** | Auto-asignado en registro / OAuth | Usuario que consume cursos, rinde evaluaciones y obtiene certificados. Rol por defecto. |
| **instructor** | Solicitud aprobada por admin | Crea y publica cursos, gestiona evaluaciones y hace seguimiento de aprendices. |
| **admin** | Asignado manualmente por otro admin | Control total de la plataforma. Sin restricciones de lectura ni escritura. |

> Los roles se almacenan en la tabla `Rol` y se vinculan mediante `UsuarioRol`. Un usuario puede tener múltiples roles (ej. instructor + admin).

---

## Matriz de permisos por módulo

**Leyenda:** `✅` = permitido · `🚫` = denegado · `👁️` = solo lectura · `⚙️` = según asignación

### Autenticación

| Acción | Estudiante | Instructor | Admin |
|---|---|---|---|
| Registrarse | ✅ | ✅ | ✅ |
| Iniciar sesión | ✅ | ✅ | ✅ |
| Recuperar contraseña | ✅ | ✅ | ✅ |
| Ver perfil propio | ✅ | ✅ | ✅ |
| Editar perfil propio | ✅ | ✅ | ✅ |
| Ver perfil de otro usuario | 🚫 | 🚫 | ✅ |
| Editar usuario de otro | 🚫 | 🚫 | ✅ |
| Cambiar rol de usuario | 🚫 | 🚫 | ✅ |
| Desactivar cuenta | 🚫 | 🚫 | ✅ |

### Catálogo y Cursos

| Acción | Estudiante | Instructor | Admin |
|---|---|---|---|
| Ver catálogo público | ✅ | ✅ | ✅ |
| Ver lección en modo vista previa | ✅ | ✅ | ✅ |
| Inscribirse a un curso | ✅ | ✅ | ✅ |
| Ver contenido de curso (inscrito) | ✅ | ✅ | ✅ |
| Crear curso | 🚫 | ✅ | ✅ |
| Editar curso propio | 🚫 | ✅ | ✅ |
| Editar curso ajeno | 🚫 | 🚫 | ✅ |
| Publicar curso | 🚫 | ✅ (propio) | ✅ |
| Archivar curso | 🚫 | ✅ (propio) | ✅ |
| Eliminar curso | 🚫 | 🚫 | ✅ |
| Crear módulo / lección | 🚫 | ✅ (propio) | ✅ |
| Cargar SCORM | 🚫 | ✅ | ✅ |

### Evaluaciones

| Acción | Estudiante | Instructor | Admin |
|---|---|---|---|
| Ver evaluaciones del curso inscrito | ✅ | ✅ | ✅ |
| Rendir evaluación | ✅ | 🚫 | 🚫 |
| Crear evaluación | 🚫 | ✅ (propio) | ✅ |
| Editar evaluación | 🚫 | ✅ (propio) | ✅ |
| Calificar respuestas de desarrollo | 🚫 | ✅ (propio) | ✅ |
| Ver intentos de sus estudiantes | 🚫 | ✅ (propio) | ✅ |
| Ver banco de preguntas | 🚫 | ✅ (propio) | ✅ |
| Importar preguntas en bloque | 🚫 | ✅ | ✅ |

### Progreso y Reportes

| Acción | Estudiante | Instructor | Admin |
|---|---|---|---|
| Ver su propio progreso | ✅ | ✅ | ✅ |
| Ver progreso de sus estudiantes | 🚫 | ✅ (propio) | ✅ |
| Ver progreso grupal | 🚫 | ✅ (propio) | ✅ |
| Exportar reporte Excel / PDF | 🚫 | ✅ (propio) | ✅ |

### Certificados

| Acción | Estudiante | Instructor | Admin |
|---|---|---|---|
| Obtener certificado (al completar) | ✅ | ✅ | ✅ |
| Descargar PDF propio | ✅ | ✅ | ✅ |
| Verificar certificado (público) | ✅ | ✅ | ✅ |
| Revocar certificado ajeno | 🚫 | 🚫 | ✅ |

### Grupos y Cohortes

| Acción | Estudiante | Instructor | Admin |
|---|---|---|---|
| Ver grupos a los que pertenece | ✅ | ✅ | ✅ |
| Ver avisos del grupo | ✅ | ✅ | ✅ |
| Ver archivos del grupo | ✅ | ✅ | ✅ |
| Crear aviso en grupo | 🚫 | ⚙️ (asignado) | ✅ |
| Subir archivo al grupo | 🚫 | ⚙️ (asignado) | ✅ |
| Crear grupo | 🚫 | 🚫 | ✅ |
| Asignar estudiantes a grupo | 🚫 | 🚫 | ✅ |
| Asignar cursos a grupo | 🚫 | 🚫 | ✅ |

### Foros y Comunicación

| Acción | Estudiante | Instructor | Admin |
|---|---|---|---|
| Leer mensajes del foro | ✅ | ✅ | ✅ |
| Escribir en el foro | ✅ | ✅ | ✅ |
| Citar mensaje | ✅ | ✅ | ✅ |
| Reaccionar a mensaje | ✅ | ✅ | ✅ |
| Fijar mensaje | 🚫 | ✅ | ✅ |
| Bloquear mensaje | 🚫 | ✅ | ✅ |
| Enviar mensaje interno | ✅ | ✅ | ✅ |
| Ver mensajes internos propios | ✅ | ✅ | ✅ |

### Notificaciones

| Acción | Estudiante | Instructor | Admin |
|---|---|---|---|
| Recibir notificaciones in-app | ✅ | ✅ | ✅ |
| Configurar preferencias de email | ✅ | ✅ | ✅ |
| Enviar notificación masiva | 🚫 | 🚫 | ✅ |

### Instituciones

| Acción | Estudiante | Instructor | Admin |
|---|---|---|---|
| Ver instituciones públicas | ✅ | ✅ | ✅ |
| Enviar solicitud de vinculación | 🚫 | 🚫 | ✅ (gestiona) |
| Gestionar solicitudes de institución | 🚫 | 🚫 | ✅ |
| Ver dashboard institucional | 🚫 | ⚙️ (vinculado) | ✅ |
| Invitar instructor a institución | 🚫 | ⚙️ (vinculado) | ✅ |

### Rutas de Formación

| Acción | Estudiante | Instructor | Admin |
|---|---|---|---|
| Ver rutas disponibles | ✅ | ✅ | ✅ |
| Seguir una ruta | ✅ | ✅ | ✅ |
| Crear ruta de formación | 🚫 | 🚫 | ✅ |
| Asignar cursos a ruta | 🚫 | 🚫 | ✅ |

### Solicitudes de Instructor

| Acción | Estudiante | Instructor | Admin |
|---|---|---|---|
| Enviar solicitud de instructor | ✅ | — | — |
| Subir documentos de solicitud | ✅ | — | — |
| Ver estado de propia solicitud | ✅ | — | — |
| Revisar y aprobar solicitudes | 🚫 | 🚫 | ✅ |

### Cursos Externos y Scraping

| Acción | Estudiante | Instructor | Admin |
|---|---|---|---|
| Ver cursos externos aprobados | ✅ | ✅ | ✅ |
| Revisar y aprobar cursos scrapeados | 🚫 | 🚫 | ✅ |
| Bloquear fuente externa | 🚫 | 🚫 | ✅ |
| Ejecutar scraper manualmente | 🚫 | 🚫 | ✅ |
| Ver logs de scraping | 🚫 | 🚫 | ✅ |

### Auditoría y Configuración

| Acción | Estudiante | Instructor | Admin |
|---|---|---|---|
| Ver log de auditoría | 🚫 | 🚫 | ✅ |
| Exportar auditoría | 🚫 | 🚫 | ✅ |
| Gestionar webhooks | 🚫 | 🚫 | ✅ |
| Crear usuarios en bloque | 🚫 | 🚫 | ✅ |
| Importar inscripciones en bloque | 🚫 | 🚫 | ✅ |

---

## Acceso por pantalla

| Ruta | Estudiante | Instructor | Admin | Sin auth |
|---|---|---|---|---|
| `/` (home) | ✅ | ✅ | ✅ | ✅ |
| `/catalogo` | ✅ | ✅ | ✅ | ✅ |
| `/cursos/[id]` | ✅ | ✅ | ✅ | 👁️ preview |
| `/cursos/[id]/leccion/[leccionId]` | ✅ inscrito | ✅ | ✅ | 🚫 |
| `/dashboard` | ✅ | ✅ | ✅ | 🚫 |
| `/dashboard/cursos/nuevo` | 🚫 | ✅ | ✅ | 🚫 |
| `/dashboard/admin/*` | 🚫 | 🚫 | ✅ | 🚫 |
| `/instituciones` | 👁️ | 👁️ | ✅ | ✅ |
| `/certificados/verificar/[codigo]` | ✅ | ✅ | ✅ | ✅ |
| `/scorm/[cursoId]/[leccionId]` | ✅ inscrito | ✅ | ✅ | 🚫 |
| `/privacidad` | ✅ | ✅ | ✅ | ✅ |
| `/terminos` | ✅ | ✅ | ✅ | ✅ |
