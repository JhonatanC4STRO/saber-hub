---
title: Glosario
description: Términos del dominio, roles, estados y siglas usadas en SaberHub.
---

# Glosario

---

## Términos del dominio

### Curso (`Curso`)
Unidad principal de contenido educativo. Contiene módulos ordenados, tiene un instructor responsable, puede pertenecer a una institución y una categoría. Pasa por estados `borrador → publicado → archivado`.

### Módulo (`Modulo`)
Agrupación temática de lecciones dentro de un curso. Tiene un orden explícito y puede estar `activo` u `oculto`.

### Lección (`Leccion`)
Unidad mínima de contenido dentro de un módulo. Puede ser texto, video, audio, SCORM u otro tipo. Soporta modo vista previa sin inscripción, duración estimada y seguimiento de completitud.

### Recurso (`Recurso`)
Archivo adjunto a una lección. Tipos: `pdf`, `video`, `audio`, `imagen`, `presentacion`, `enlace`, `otro`. Se almacena en Cloudinary.

### Inscripción (`Inscripcion`)
Vínculo entre un estudiante y un curso. Registra progreso (0–100 %), tiempo conectado en segundos, último acceso y estado.

### Progreso de Lección (`ProgresoLeccion`)
Registro de si un estudiante completó una lección específica, con timestamp de completitud.

### Certificado (`Certificacion`)
Constancia de que un estudiante completó un curso. Incluye código único, hash de verificación, URL del PDF y estado (`emitido` / `revocado`).

### Ruta de Formación (`RutaFormacion`)
Secuencia ordenada de cursos que, al completarse, otorga un certificado de ruta. Puede ser lineal (orden obligatorio) o flexible.

### Evaluación (`Evaluacion`)
Instrumento de medición del aprendizaje. Puede tener puntaje mínimo aprobatorio (por defecto 70), número máximo de intentos (por defecto 1), duración en minutos, orden aleatorio de preguntas y configuración de mostrar respuestas.

### Intento de Examen (`IntentoExamen`)
Cada vez que un estudiante inicia una evaluación. Registra respuestas, puntaje obtenido y estado.

### Pregunta (`Pregunta`)
Ítem de una evaluación. Tiene tipo, puntaje y puede ser reutilizada desde el banco.

### Banco de Preguntas (`PreguntaBanco`)
Repositorio de preguntas reutilizables organizadas por categoría. Permite importar preguntas en bloque a cualquier evaluación.

### Grupo (`Grupo`)
Cohorte o salón de clase. Agrupa estudiantes, tiene fechas de inicio y fin, y puede tener cursos asignados. Soporta avisos y archivos compartidos.

### Sesión de Videoconferencia (`SesionVideoconferencia`)
Clase en vivo programada dentro de un curso. Registra URL de reunión, URL de grabación y estado.

### Foro (`Foro`)
Espacio de discusión asociado a un curso. Los mensajes soportan hilos (padre/hijo), citas y reacciones emoji.

### Institución (`Institucion`)
Entidad educativa vinculada a SaberHub. Puede ser pública (SENA, universidad) o privada. Gestiona sus propios cursos, instructores e invitaciones.

### Solicitud de Institución (`SolicitudInstitucion`)
Proceso de onboarding de una institución. Fluye por estados: `pendiente → en_revision → pendiente_informacion → aprobada / rechazada`.

### Curso Externo (`CursoExterno`)
Registro de metadata de un curso publicado en una plataforma externa (ej. SENA Sofia Plus). No almacena contenido, solo referencia.

### Fuente Externa (`FuenteExterna`)
Plataforma de origen de cursos externos (ej. Sofia Plus, Coursera). Puede ser bloqueada por el administrador con registro de motivo.

### Webhook (`Webhook`)
Suscripción a eventos de la plataforma vía HTTP. Usa firma HMAC-SHA256 para verificar autenticidad del payload.

### Log de Auditoría (`LogAuditoria`)
Registro inmutable de cada acción relevante: quién la hizo, sobre qué tabla y registro, datos antes/después, IP y timestamp.

---

## Roles

| Rol | Descripción |
|---|---|
| `admin` | Acceso total a la plataforma. Gestiona usuarios, instituciones, scraper, auditoría, webhooks y configuración global. |
| `instructor` | Crea y publica cursos, módulos, lecciones y evaluaciones. Ve reportes de sus aprendices. Puede pertenecer a una institución. |
| `estudiante` | Se inscribe a cursos, consume contenido, rinde evaluaciones y obtiene certificados. |

> Los roles se almacenan en la tabla `Rol` y se asignan a usuarios mediante la relación `UsuarioRol`. Un usuario puede tener múltiples roles.

---

## Estados

### `EstadoCurso`
| Valor | Significado |
|---|---|
| `borrador` | Curso en edición, no visible en el catálogo público. |
| `publicado` | Disponible para inscripción y consulta pública. |
| `archivado` | Retirado del catálogo; preservado para consulta interna. |

### `EstadoModulo`
| Valor | Significado |
|---|---|
| `activo` | Visible para estudiantes inscritos. |
| `oculto` | Solo visible para el instructor; útil para contenido en preparación. |

### `EstadoInscripcion`
| Valor | Significado |
|---|---|
| `activo` | El estudiante está cursando activamente. |
| `inactivo` | Sin actividad reciente (puede reactivarse). |
| `finalizado` | Completó el curso (progreso = 100 %). |
| `retirado` | El estudiante se retiró o fue removido del curso. |

### `EstadoIntento`
| Valor | Significado |
|---|---|
| `en_curso` | El estudiante inició el intento y no lo ha enviado aún. |
| `finalizado` | Intento enviado; pendiente de calificación (si tiene desarrollo). |
| `expirado` | Se agotó el tiempo límite sin envío. |
| `calificado` | Intento con puntaje final asignado. |

### `EstadoCertificado`
| Valor | Significado |
|---|---|
| `emitido` | Certificado válido y verificable. |
| `revocado` | Certificado invalidado por el administrador. |

### `EstadoSesion`
| Valor | Significado |
|---|---|
| `programada` | Sesión agendada; aún no ha comenzado. |
| `en_curso` | Sesión activa en este momento. |
| `finalizada` | Sesión completada; puede tener grabación disponible. |
| `cancelada` | Sesión cancelada por el instructor o admin. |

### `EstadoSolicitud` (Instructor)
| Valor | Significado |
|---|---|
| `pendiente` | Solicitud recibida, sin revisar. |
| `en_revision` | Admin asignado revisando documentos. |
| `aprobada` | Instructor habilitado en la plataforma. |
| `rechazada` | Solicitud denegada con motivo registrado. |

### `EstadoSolicitudInstitucion`
| Valor | Significado |
|---|---|
| `pendiente` | Solicitud recibida. |
| `en_revision` | Equipo SaberHub revisando documentación. |
| `pendiente_informacion` | Se solicitó información adicional a la institución. |
| `aprobada` | Institución vinculada y activa. |
| `rechazada` | Solicitud denegada. |

---

## Tipos de pregunta (`TipoPregunta`)

| Valor | Descripción |
|---|---|
| `opcion_multiple` | Una o varias respuestas correctas entre opciones predefinidas. Calificación automática. |
| `verdadero_falso` | Binario V/F. Calificación automática. |
| `respuesta_corta` | Texto breve con respuesta esperada. Calificación automática por coincidencia exacta o flexible. |
| `desarrollo` | Respuesta abierta extensa. Requiere calificación manual por el instructor. |

---

## Tipos de recurso (`TipoRecurso`)

`pdf` · `video` · `audio` · `imagen` · `presentacion` · `enlace` · `otro`

---

## Tipos de notificación (`TipoNotificacion`)

`inscripcion` · `evaluacion` · `certificado` · `foro` · `mensaje` · `sistema` · `solicitud_instructor` · `sesion`

---

## Siglas

| Sigla | Significado |
|---|---|
| **LMS** | *Learning Management System* — Sistema de Gestión del Aprendizaje. SaberHub es un LMS. |
| **MOOC** | *Massive Open Online Course* — Curso en línea masivo y abierto. Formato de referencia para cursos públicos gratuitos. |
| **SCORM** | *Sharable Content Object Reference Model* — Estándar internacional para empaquetar contenido e-learning. SaberHub soporta carga y reproducción de paquetes SCORM. |
| **SENA** | *Servicio Nacional de Aprendizaje* — Principal institución de formación técnica y vocacional de Colombia. SaberHub integra su catálogo vía Sofia Plus. |
| **MinTIC** | *Ministerio de Tecnologías de la Información y las Comunicaciones de Colombia* — Ente gubernamental que impulsa la formación digital. Fuente de cursos externos integrados en SaberHub. |
| **Sofia Plus** | Sistema de información del SENA para gestión de formación. Es la fuente principal de cursos externos scrapeados por SaberHub. |
| **JWT** | *JSON Web Token* — Estándar de autenticación usado en SaberHub (HS256, TTL 7 días, HttpOnly cookie). |
| **CSP** | *Content Security Policy* — Cabecera HTTP de seguridad que restringe las fuentes de contenido cargadas por el navegador. |
| **HSTS** | *HTTP Strict Transport Security* — Cabecera que fuerza HTTPS. Configurada a 2 años con `includeSubDomains` y `preload`. |
| **HMAC** | *Hash-based Message Authentication Code* — Firma usada en webhooks de SaberHub para verificar autenticidad del payload (SHA-256). |
| **ORM** | *Object-Relational Mapper* — Capa de abstracción de base de datos. SaberHub usa Prisma ORM sobre PostgreSQL. |
| **PDF** | *Portable Document Format* — Formato de certificados generados por SaberHub con pdf-lib. |
