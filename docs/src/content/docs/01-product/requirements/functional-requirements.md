---
title: Requerimientos Funcionales
description: Requerimientos funcionales de SaberHub por rol y módulo, con tabla de trazabilidad.
---

## Introducción y alcance

Este documento define los requerimientos funcionales (RF) de SaberHub v0.1.x. Cubre la totalidad de módulos implementados en el repositorio principal (`saberhub/`) y sirve como contrato entre producto, desarrollo y QA.

**Alcance:** Plataforma web LMS accesible desde navegador moderno. No cubre app móvil (Fase 2) ni marketplace de pago (Fase 3).

---

## Requerimientos por rol

### Alumno (Estudiante)

| ID | Requerimiento |
|---|---|
| RF-A01 | Registrarse con email y contraseña. |
| RF-A02 | Iniciar sesión con Google OAuth 2.0. |
| RF-A03 | Verificar cuenta mediante link enviado al correo (token 24 h). |
| RF-A04 | Recuperar contraseña mediante token de un solo uso (vigencia 1 h). |
| RF-A05 | Explorar el catálogo público de cursos con filtros por categoría, institución y nivel. |
| RF-A06 | Inscribirse a un curso gratuito. |
| RF-A07 | Consumir lecciones (texto, video, audio, SCORM, PDF). |
| RF-A08 | Marcar lecciones como completadas y ver progreso en tiempo real. |
| RF-A09 | Rendir evaluaciones con límite de intentos y tiempo opcional. |
| RF-A10 | Ver retroalimentación de evaluaciones (respuestas correctas si está habilitado). |
| RF-A11 | Obtener certificado de curso al alcanzar 100 % de progreso y aprobar evaluaciones requeridas. |
| RF-A12 | Descargar certificado en PDF y verificarlo por código único. |
| RF-A13 | Participar en foros del curso (crear mensaje, responder, citar, reaccionar). |
| RF-A14 | Enviar y recibir mensajes internos. |
| RF-A15 | Ver notificaciones in-app y configurar preferencias de email. |
| RF-A16 | Pertenecer a grupos/cohortes y acceder a sus avisos y archivos. |
| RF-A17 | Ver cursos externos recomendados (SENA Sofia Plus, Coursera). |
| RF-A18 | Acceder a rutas de formación y obtener certificado de ruta al completarlas. |

### Instructor

| ID | Requerimiento |
|---|---|
| RF-I01 | Solicitar rol de instructor adjuntando hoja de vida y portafolio. |
| RF-I02 | Crear cursos con título, descripción, categoría, nivel, imagen de portada e institución. |
| RF-I03 | Organizar cursos en módulos y módulos en lecciones con drag & drop. |
| RF-I04 | Cargar recursos por lección (PDF, video, audio, imagen, presentación, enlace externo). |
| RF-I05 | Cargar y reproducir paquetes SCORM en lecciones. |
| RF-I06 | Crear evaluaciones con múltiples tipos de pregunta y configurar puntaje mínimo, intentos y tiempo. |
| RF-I07 | Gestionar banco de preguntas reutilizable por categoría. |
| RF-I08 | Importar preguntas al banco en bloque. |
| RF-I09 | Calificar manualmente respuestas de tipo "desarrollo". |
| RF-I10 | Ver progreso individual y grupal de los inscritos en tiempo real. |
| RF-I11 | Exportar reportes de progreso y calificaciones a Excel y PDF. |
| RF-I12 | Programar y gestionar sesiones de videoconferencia (URL, duración, grabación). |
| RF-I13 | Moderar foros del curso (fijar, bloquear mensajes). |
| RF-I14 | Publicar, archivar y despublicar cursos propios. |
| RF-I15 | Invitar instructores a su institución mediante token de invitación. |

### Administrador

| ID | Requerimiento |
|---|---|
| RF-AD01 | Gestionar usuarios (crear, editar, desactivar, cambiar rol). |
| RF-AD02 | Aprobar o rechazar solicitudes de instructor con motivo. |
| RF-AD03 | Gestionar instituciones (aprobar solicitudes, configurar, ver dashboard). |
| RF-AD04 | Crear y administrar grupos/cohortes y asignar cursos a grupos. |
| RF-AD05 | Crear rutas de formación y asignar cursos con orden y prerrequisitos. |
| RF-AD06 | Revisar y aprobar cursos externos scrapeados antes de publicarlos. |
| RF-AD07 | Gestionar fuentes externas (habilitar/bloquear con motivo). |
| RF-AD08 | Ejecutar el scraper manualmente y ver logs de ejecución. |
| RF-AD09 | Consultar log de auditoría filtrable (usuario, acción, tabla, fecha, IP). |
| RF-AD10 | Configurar y gestionar webhooks de eventos con firma HMAC-SHA256. |
| RF-AD11 | Revocar certificados emitidos. |
| RF-AD12 | Importar inscripciones en bloque desde CSV/Excel. |
| RF-AD13 | Crear usuarios en bloque. |
| RF-AD14 | Configurar alertas programadas (inactividad, fechas límite). |

### Institución

| ID | Requerimiento |
|---|---|
| RF-IN01 | Solicitar vinculación a SaberHub desde formulario público. |
| RF-IN02 | Gestionar su perfil institucional (nombre, logo, descripción, contacto). |
| RF-IN03 | Ver dashboard con cursos activos, instructores e inscritos de su institución. |
| RF-IN04 | Invitar instructores mediante token de invitación por email. |
| RF-IN05 | Ver reportes de desempeño de sus cursos y grupos. |

---

## Requerimientos por módulo

### Módulo Auth

| ID | Descripción |
|---|---|
| RF-M-AUTH01 | Login con email + contraseña. Bloqueo tras 5 intentos fallidos (15 min). |
| RF-M-AUTH02 | Registro con verificación de email (token SHA-256, 24 h). |
| RF-M-AUTH03 | OAuth 2.0 con Google. Auto-registro como estudiante verificado. |
| RF-M-AUTH04 | Recuperación de contraseña con token de un solo uso (1 h). |
| RF-M-AUTH05 | Sesión mediante JWT HS256 (TTL 7 d) en cookie HttpOnly (maxAge 30 min). |
| RF-M-AUTH06 | Logout que invalida la cookie. |

### Módulo Cursos

| ID | Descripción |
|---|---|
| RF-M-CUR01 | CRUD completo de cursos, módulos, lecciones y recursos. |
| RF-M-CUR02 | Catálogo público filtrado por categoría, institución y nivel (paginado). |
| RF-M-CUR03 | Lecciones con modo vista previa (sin inscripción). |
| RF-M-CUR04 | Soporte de paquetes SCORM (carga ZIP, extracción, reproducción con tracking CMI). |
| RF-M-CUR05 | Heartbeat de progreso cada 15 s (ping asíncrono que incrementa `tiempoConectado`). |

### Módulo Evaluaciones

| ID | Descripción |
|---|---|
| RF-M-EVAL01 | 4 tipos de pregunta: opción múltiple, verdadero/falso, respuesta corta, desarrollo. |
| RF-M-EVAL02 | Calificación automática para opción múltiple, V/F y respuesta corta. |
| RF-M-EVAL03 | Calificación manual para preguntas de desarrollo. |
| RF-M-EVAL04 | Banco de preguntas reutilizable con categorías e importación masiva. |
| RF-M-EVAL05 | Configuración por evaluación: puntaje mínimo, intentos máximos, duración, aleatorizar, mostrar respuestas. |

### Módulo Certificados

| ID | Descripción |
|---|---|
| RF-M-CERT01 | Emisión automática al completar curso (progreso = 100 %). |
| RF-M-CERT02 | Código único + hash de verificación para cada certificado. |
| RF-M-CERT03 | Generación de PDF con pdf-lib (banner institucional). |
| RF-M-CERT04 | Endpoint público de verificación por código. |
| RF-M-CERT05 | Certificados de ruta de formación al completar todos los cursos de la ruta. |
| RF-M-CERT06 | Revocación por administrador con cambio de estado a `revocado`. |

### Módulo Instituciones

| ID | Descripción |
|---|---|
| RF-M-INST01 | Formulario público de solicitud de vinculación. |
| RF-M-INST02 | Workflow de aprobación: `pendiente → en_revision → aprobada/rechazada`. |
| RF-M-INST03 | Dashboard institucional con métricas de cursos, instructores y aprendices. |
| RF-M-INST04 | Tokens de invitación para instructores (email + token). |

### Módulo Scraping / Cursos Externos

| ID | Descripción |
|---|---|
| RF-M-SCRAP01 | Scraper con cumplimiento de `robots.txt` (robots-parser). |
| RF-M-SCRAP02 | Log de ejecución por scraper (cursos encontrados, nuevos, actualizados, errores, duración). |
| RF-M-SCRAP03 | Aprobación manual de cursos scrapeados antes de publicación. |
| RF-M-SCRAP04 | Bloqueo/habilitación de fuentes externas por admin. |

---

## Tabla de trazabilidad

| ID RF | Descripción corta | Ticket Jira | Pantalla / Ruta |
|---|---|---|---|
| RF-A01 | Registro email | SHB-001 | `/registro` |
| RF-A02 | Login Google | SHB-002 | `/login` |
| RF-A03 | Verificación email | SHB-003 | `/api/auth/verify` |
| RF-A04 | Recuperar contraseña | SHB-004 | `/recuperar-contrasena` |
| RF-A05 | Catálogo público | SHB-010 | `/catalogo` |
| RF-A06 | Inscripción a curso | SHB-011 | `/cursos/[id]` |
| RF-A07 | Consumo de lección | SHB-012 | `/cursos/[id]/leccion/[leccionId]` |
| RF-A08 | Marcar lección completa | SHB-013 | `/api/progreso/leccion` |
| RF-A09 | Rendir evaluación | SHB-020 | `/cursos/[id]/evaluacion/[evalId]` |
| RF-A11 | Obtener certificado | SHB-030 | `/api/certificados` |
| RF-A12 | Descargar PDF | SHB-031 | `/api/certificados/pdf/[codigo]` |
| RF-A13 | Foros | SHB-040 | `/cursos/[id]/foro` |
| RF-I02 | Crear curso | SHB-050 | `/dashboard/cursos/nuevo` |
| RF-I05 | Cargar SCORM | SHB-051 | `/api/upload/scorm` |
| RF-I06 | Crear evaluación | SHB-052 | `/dashboard/evaluaciones/nueva` |
| RF-I09 | Calificar desarrollo | SHB-053 | `/dashboard/intentos/[id]` |
| RF-I10 | Ver progreso | SHB-054 | `/dashboard/cursos/[id]/progreso` |
| RF-AD01 | Gestión usuarios | SHB-060 | `/dashboard/admin/usuarios` |
| RF-AD03 | Gestión instituciones | SHB-061 | `/instituciones` |
| RF-AD08 | Ejecutar scraper | SHB-070 | `/api/admin/scrapers/run` |
| RF-AD09 | Log auditoría | SHB-071 | `/dashboard/admin/auditoria` |
| RF-AD10 | Webhooks | SHB-072 | `/api/webhooks` |
