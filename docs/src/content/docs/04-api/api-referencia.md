---
title: Referencia de API
description: Referencia completa de los 90+ endpoints REST de la API de SaberHub organizados por módulo.
---

SaberHub expone **90+ endpoints REST** a través de Next.js Route Handlers. Todos los endpoints (excepto los públicos) requieren autenticación vía cookie JWT `HttpOnly`.

## Autenticación

Todos los endpoints protegidos leen la cookie `token` y la verifican con `jose`:

```javascript
const token = request.cookies.get('token')?.value;
const payload = await verifyToken(token);
// payload = { id, nombre, email, rol }
```

---

## 🔐 Auth — `/api/auth/`

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/auth/register` | Público | Registrar nuevo estudiante |
| `POST` | `/auth/login` | Público | Login con email/contraseña |
| `POST` | `/auth/logout` | Autenticado | Cerrar sesión |
| `GET` | `/auth/me` | Autenticado | Datos del usuario actual |
| `GET` | `/auth/google` | Público | Iniciar flujo Google OAuth |
| `GET` | `/auth/google/callback` | Google | Callback OAuth |
| `POST` | `/auth/forgot-password` | Público | Solicitar recuperación |
| `POST` | `/auth/reset-password` | Público | Resetear con token |
| `GET` | `/auth/verify` | Público | Verificar email con token |
| `POST` | `/auth/register-instructor` | Público | Registro con invitación institucional |

---

## 📚 Cursos — `/api/cursos/`

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/cursos` | Instructor, Admin | Crear curso |
| `GET` | `/cursos` | Instructor | Mis cursos creados |
| `GET` | `/cursos/catalogo` | Público | Catálogo de cursos publicados |
| `GET` | `/cursos/externos` | Autenticado | Cursos externos (scraping) |
| `GET` | `/cursos/[id]` | Autenticado | Detalle del curso |
| `PUT` | `/cursos/[id]` | Instructor dueño | Editar curso |
| `DELETE` | `/cursos/[id]` | Instructor, Admin | Eliminar curso |
| `GET` | `/cursos/[id]/contenido` | Inscrito | Módulos y lecciones |
| `GET` | `/cursos/[id]/foro` | Inscrito | Mensajes del foro |
| `POST` | `/cursos/[id]/foro` | Inscrito | Publicar en el foro |
| `POST` | `/cursos/[id]/foro/[msgId]/like` | Inscrito | Reaccionar a un mensaje |
| `PUT` | `/cursos/[id]/foro/[msgId]/mod` | Instructor | Fijar/bloquear mensaje |
| `GET` | `/cursos/[id]/sesiones` | Inscrito | Sesiones de videoconferencia |
| `POST` | `/cursos/[id]/sesiones` | Instructor | Programar sesión |

---

## 📝 Evaluaciones — `/api/evaluaciones/`

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/evaluaciones` | Autenticado | Listar evaluaciones (filtro por curso/módulo) |
| `POST` | `/evaluaciones` | Instructor, Admin | Crear evaluación con preguntas |
| `GET` | `/evaluaciones/[id]` | Autenticado | Detalle de evaluación |
| `PUT` | `/evaluaciones/[id]` | Instructor dueño | Editar evaluación |
| `DELETE` | `/evaluaciones/[id]` | Instructor dueño | Eliminar evaluación |
| `POST` | `/evaluaciones/[id]/intentos` | Estudiante | Iniciar intento de examen |

---

## 🎯 Intentos — `/api/intentos/`

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/intentos/[intentoId]` | Estudiante dueño, Instructor | Ver detalle del intento |
| `PUT` | `/intentos/[intentoId]` | Instructor | Calificar manualmente |
| `POST` | `/intentos/[intentoId]/enviar` | Estudiante | Enviar respuestas |

---

## 📊 Progreso — `/api/progreso/`

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/progreso/heartbeat` | Estudiante | Registrar tiempo de conexión (+15s) |
| `POST` | `/progreso/leccion` | Estudiante | Marcar lección completada |
| `GET` | `/progreso/curso/[cursoId]` | Estudiante, Instructor | Progreso individual |
| `GET` | `/progreso/grupo/[cursoId]` | Instructor, Admin | Progreso grupal |
| `POST` | `/progreso/scorm` | Estudiante | Registrar progreso SCORM |

---

## 📜 Certificados — `/api/certificados/`

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/certificados` | Autenticado | Listar certificados (propios o todos) |
| `GET` | `/certificados/pdf/[codigo]` | Público | Descargar PDF de certificado de curso |
| `GET` | `/certificados/ruta-pdf/[codigo]` | Público | PDF certificado de ruta |
| `GET` | `/certificados/verificar/[codigo]` | Público | Verificar autenticidad |
| `PUT` | `/certificados/[id]/revocar` | Admin | Revocar certificado |

---

## 📈 Reportes — `/api/reportes/`

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/reportes/exportar` | Instructor, Admin | Exportar reporte (Excel/PDF/JSON) |

---

## 📋 Inscripciones — `/api/inscripciones/`

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/inscripciones` | Estudiante | Auto-inscribirse en un curso |
| `GET` | `/inscripciones` | Estudiante | Mis inscripciones activas |
| `PUT` | `/inscripciones/[id]` | Instructor, Admin | Cambiar estado de inscripción |
| `POST` | `/inscripciones/importar` | Admin | Importar inscripciones desde Excel |
| `POST` | `/inscripciones/masiva-nuevos` | Admin | Inscripción masiva con creación de usuarios |

---

## 🏢 Instituciones — `/api/instituciones/`

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/instituciones` | Público | Listar instituciones registradas |
| `POST` | `/instituciones/solicitud` | Público | Enviar solicitud de registro institucional |
| `GET` | `/instituciones/[id]` | Autenticado | Detalle de institución |
| `PUT` | `/instituciones/[id]` | Admin institucional | Editar datos de la institución |
| `POST` | `/instituciones/[id]/configurar` | Admin institucional | Configuración inicial |
| `GET` | `/instituciones/[id]/cursos` | Autenticado | Cursos de la institución |
| `PUT` | `/instituciones/[id]/cursos/[cursoId]` | Admin institucional | Gestionar curso institucional |
| `POST` | `/instituciones/[id]/invitar-instructor` | Admin institucional | Enviar invitación a instructor |
| `POST` | `/instituciones/admin/configurar` | Admin | Configurar admin institucional |

---

## 🏛️ Admin — `/api/admin/`

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/admin/usuarios` | Admin | Listar todos los usuarios |
| `POST` | `/admin/crear-usuario` | Admin | Crear usuario manualmente |
| `GET/PUT/DELETE` | `/admin/usuarios/[id]` | Admin | Gestionar usuario individual |
| `GET` | `/admin/auditoria` | Admin | Logs de auditoría del sistema |
| `GET` | `/admin/instructores` | Admin | Listar instructores |
| `GET` | `/admin/solicitudes-instructor` | Admin | Solicitudes pendientes de instructor |
| `PUT` | `/admin/solicitudes-instructor/[id]` | Admin | Aprobar/rechazar solicitud |
| `GET` | `/admin/instituciones/solicitudes` | Admin | Solicitudes de instituciones |
| `PUT` | `/admin/instituciones/solicitudes/[id]` | Admin | Aprobar/rechazar institución |
| `GET/POST` | `/admin/grupos` | Admin | Gestión de grupos |
| `PUT/DELETE` | `/admin/grupos/[id]` | Admin | Editar/eliminar grupo |
| `GET/POST` | `/admin/grupos/[id]/alumnos` | Admin | Miembros del grupo |
| `DELETE` | `/admin/grupos/[id]/alumnos/[alumnoId]` | Admin | Remover alumno del grupo |
| `GET/POST` | `/admin/grupos/[id]/cursos` | Admin | Cursos asignados al grupo |
| `DELETE` | `/admin/grupos/[id]/cursos/[cursoId]` | Admin | Desasignar curso del grupo |
| `GET/POST` | `/admin/rutas` | Admin | Rutas de formación |
| `PUT/DELETE` | `/admin/rutas/[id]` | Admin | Gestionar ruta individual |
| `POST` | `/admin/cursos/prerrequisitos` | Admin | Definir prerrequisitos |
| `GET/POST` | `/admin/cursos-externos` | Admin | Gestión cursos externos |
| `POST` | `/admin/cursos-externos/bulk-approve` | Admin | Aprobación masiva |
| `POST` | `/admin/scrapers/run` | Admin | Ejecutar scraper de cursos |
| `GET` | `/admin/scrapers/status` | Admin | Estado del scraper |
| `GET` | `/admin/logs-scraping` | Admin | Logs de scraping |
| `GET/POST` | `/admin/fuentes` | Admin | Gestión de fuentes de scraping |

---

## 💬 Comunicación

### Mensajes Internos — `/api/mensajes/`

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET/POST` | `/mensajes` | Autenticado | Bandeja de entrada / Enviar mensaje |
| `GET` | `/mensajes/chat` | Autenticado | Conversación con un usuario |
| `GET` | `/mensajes/contactos` | Autenticado | Lista de contactos disponibles |

### Notificaciones — `/api/notificaciones/`

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET/PUT` | `/notificaciones/preferencias` | Autenticado | Preferencias de notificación (email + in-app por tipo) |

### Grupos — `/api/grupos/`

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/grupos/miembros` | Autenticado | Miembros del grupo del usuario |
| `GET/POST` | `/grupos/[id]/archivos` | Miembro | Archivos compartidos del grupo |
| `GET/POST` | `/grupos/[id]/avisos` | Miembro | Avisos del espacio colaborativo |

---

## 🎥 Sesiones — `/api/sesiones/`

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/sesiones/[sesionId]` | Inscrito | Detalle de sesión de videoconferencia |
| `PUT` | `/sesiones/[sesionId]` | Instructor | Editar sesión |
| `DELETE` | `/sesiones/[sesionId]` | Instructor | Cancelar sesión |

---

## 👨‍🏫 Solicitudes de Instructor — `/api/solicitudes-instructor/`

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/solicitudes-instructor` | Estudiante | Enviar solicitud para ser instructor |
| `GET` | `/solicitudes-instructor` | Autenticado | Ver estado de mi solicitud |
| `POST` | `/solicitudes-instructor/upload` | Estudiante | Subir documentos de soporte |
| `GET` | `/solicitudes-instructor/documentos/[filename]` | Admin | Descargar documentos |

---

## 📁 Banco de Preguntas — `/api/banco/`

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET/POST` | `/banco` | Instructor | CRUD de preguntas reutilizables |
| `PUT/DELETE` | `/banco/[id]` | Instructor dueño | Editar/eliminar pregunta |
| `GET/POST` | `/banco/categorias` | Instructor | Categorías del banco |
| `POST` | `/banco/importar` | Instructor | Importar preguntas en lote |

---

## 🔧 Utilidades

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/upload` | Autenticado | Subir archivos a Cloudinary |
| `POST` | `/upload/scorm` | Instructor | Subir paquete SCORM (.zip) |
| `GET` | `/cron/alertas` | Sistema | Tarea programada de alertas automáticas |
| `GET/POST` | `/webhooks` | Admin | Gestionar webhooks |
| `PUT/DELETE` | `/webhooks/[id]` | Admin | Editar/eliminar webhook |

---

## Códigos de Respuesta

| Código | Significado |
|---|---|
| `200` | Operación exitosa |
| `201` | Recurso creado exitosamente |
| `400` | Error de validación (campos faltantes o inválidos) |
| `401` | No autenticado (falta cookie o token inválido) |
| `403` | Acceso denegado (rol insuficiente o cuenta bloqueada) |
| `404` | Recurso no encontrado |
| `500` | Error interno del servidor |
