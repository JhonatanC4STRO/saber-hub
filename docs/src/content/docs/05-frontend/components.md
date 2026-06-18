---
title: Inventario de Componentes
description: Los 43 componentes React de SaberHub organizados por dominio.
---

Todos los componentes son archivos `.jsx` ubicados en `components/`. Algunos del módulo de evaluaciones tienen su propio `.module.css` colocado junto al componente.

---

## `components/admin/`

| Componente | Descripción |
|---|---|
| `Auditoria.jsx` | Tabla de logs de auditoría con filtros por acción, tabla, usuario y fecha. Consume `GET /api/admin/auditoria`. |
| `CardSolicitudInstructor.jsx` | Tarjeta individual para lista de solicitudes de instructor con acciones aprobar/rechazar. |
| `CursoExternoDetalle.jsx` | Vista de detalle de un curso externo scrapeado con metadatos y acciones de moderación. |
| `CursosExternosPanel.jsx` | Panel principal de gestión de cursos externos: lista con filtros, aprobación bulk, gestión de fuentes. |
| `DetalleSolicitudInstitucion.jsx` | Modal/panel con información completa de una solicitud de institución y formulario de respuesta. |
| `InscripcionMasivaNuevos.jsx` | Formulario para inscribir un grupo de estudiantes a un curso de forma masiva. |
| `ModalDetalleInstructor.jsx` | Modal con perfil completo del instructor, portafolio y historial de cursos. |
| `SolicitudesInstituciones.jsx` | Lista de solicitudes de vinculación institucional con filtro por estado. |
| `SolicitudesInstructor.jsx` | Lista de solicitudes de instructor con paginación y filtros. |
| `crear-usuario.jsx` | Formulario de creación directa de usuarios por admin (sin flujo de verificación). |
| `eliminar-usuario.jsx` | Confirmación de baja/eliminación de usuario con campo de motivo. |

---

## `components/certificados/`

| Componente | Descripción |
|---|---|
| `AdminCertificados.jsx` | Panel admin: lista global de certificados emitidos con filtros y acción de revocación. |
| `MisCertificados.jsx` | Vista estudiante: lista de certificados propios con botón de descarga PDF y QR de verificación. |

---

## `components/common/`

| Componente | Descripción |
|---|---|
| `EmojiIcon.jsx` | Mapper bidireccional emoji ↔ ícono de `lucide-react`. Más de 60 mappings. Aplica color contextual automático según el emoji (verde para ✅, rojo para ❌, amarillo para ⚠️, etc.). Fallback al emoji crudo si no hay mapping. |

---

## `components/cursos/`

| Componente | Descripción |
|---|---|
| `ConfiguracionEditor.jsx` | Paso de configuración avanzada del curso: criterios de certificación, nota global, evaluaciones requeridas, SCORM. |
| `DetalleCurso.jsx` | Vista de detalle de un curso propio del instructor con tabs de contenido, evaluaciones y estadísticas. |
| `EvaluacionEditor.jsx` | Editor de evaluación embebido en el flujo de creación de curso (paso evaluaciones). |
| `GestorContenido.jsx` | Árbol de módulos y lecciones drag-and-drop (`@dnd-kit`). Permite reordenar, agregar y eliminar módulos/lecciones. |
| `HeartbeatTracker.jsx` | Componente invisible que emite `POST /api/inscripciones/heartbeat` cada 15 segundos mientras el estudiante tiene una lección abierta. Incrementa `tiempoConectado` en `Inscripcion`. |
| `LeccionEditor.jsx` | Editor de lección: tipo (video/texto/pdf/scorm), contenido, recursos adjuntos. |
| `MisCursos.jsx` | Vista instructor: lista de cursos propios con estado, métricas de inscripción y acceso rápido al editor. |
| `ModulosEditor.jsx` | Lista editable de módulos del curso con drag-and-drop y acceso al editor de lecciones. |
| `PublicarCurso.jsx` | Paso final de publicación: checklist de requisitos, previsualización y botón de publicar/despublicar. |
| `SeguimientoGrupal.jsx` | Panel del instructor para ver progreso de todos los estudiantes inscritos en un curso. |
| `crear-curso.jsx` | Formulario multi-paso de creación de curso (metadatos, categoría, institución, imagen). |
| `editar-curso.jsx` | Igual a `crear-curso.jsx` pero pre-poblado con datos existentes. |

---

## `components/estudiante/`

| Componente | Descripción |
|---|---|
| `CatalogoCursos.jsx` | Grid de cursos públicos con filtros de categoría, nivel, idioma, institución y búsqueda. Paginado. Soporta cursos internos y externos. |
| `DetalleCursoClient.jsx` | Client component del detalle de un curso: CTA de inscripción, syllabus, instructor y reseñas. |
| `ForoTab.jsx` | Tab de foro dentro del visor de curso: lista de temas, publicar pregunta, responder. |
| `MisCursosEstudiante.jsx` | Dashboard de cursos inscritos del estudiante con progreso visual y acceso rápido. |
| `SesionesTab.jsx` | Tab de sesiones en vivo dentro del visor de curso: próximas sesiones, acceso a sala y grabaciones. |
| `VisorCurso.jsx` | Shell principal del visor de curso: sidebar de contenido, player de lección, tabs de foro/sesiones, barra de progreso. |

---

## `components/evaluaciones/`

| Componente | Archivo CSS | Descripción |
|---|---|---|
| `BancoPreguntas.jsx` | `BancoPreguntas.module.css` | Gestión del banco de preguntas del instructor: lista, filtros por categoría/tipo, CRUD, importación CSV/Excel. |
| `CalificarManual.jsx` | `CalificarManual.module.css` | Formulario para calificar manualmente respuestas de tipo `desarrollo` con campo de feedback. |
| `CrearEvaluacion.jsx` | `CrearEvaluacion.module.css` | Wizard de creación de evaluación: metadatos, agregar/editar preguntas, ordenamiento. |
| `EditarEvaluacion.jsx` | — | Igual a `CrearEvaluacion.jsx` pre-poblado. |
| `GestionEvaluaciones.jsx` | `GestionEvaluaciones.module.css` | Lista de evaluaciones del curso con estado, intentos registrados y acceso al corrector. |
| `MisEvaluaciones.jsx` | `MisEvaluaciones.module.css` | Vista estudiante: evaluaciones disponibles, intentos usados, puntajes y estado (pendiente/aprobado). |
| `TomarEvaluacion.jsx` | `TomarEvaluacion.module.css` | Shell de toma de evaluación: temporizador, navegación entre preguntas, envío de respuestas. |

---

## `components/foro/`

| Componente | Descripción |
|---|---|
| `ForoClient.jsx` | Vista de foro independiente (fuera del visor): lista de temas, publicar, comentar, votar. |

---

## `components/sesiones/`

| Componente | Descripción |
|---|---|
| `SesionesClient.jsx` | Lista y gestión de sesiones en vivo: crear sesión (instructor), unirse (estudiante), ver grabaciones. |

---

## Raíz de `components/`

| Componente | Descripción |
|---|---|
| `AutoLogout.jsx` | Provider de cliente que detecta inactividad (timeout configurable). Muestra aviso antes de cerrar sesión y llama a `POST /api/auth/logout` al expirar. Montado en `app/layout.tsx`. |
| `Logout.jsx` | Botón/acción de cierre de sesión. Llama a `POST /api/auth/logout` y redirige al login. |

---

## Componentes del dashboard (`app/dashboard/components/`)

Estos componentes viven dentro del route group del dashboard, no en `components/`:

| Componente | Descripción |
|---|---|
| `HeaderAdmin.jsx` | Header del panel de administración con navegación principal, notificaciones y menú de usuario. |
| `FooterAdmin.jsx` | Footer del panel con links y versión. |
| `DashboardAdmin.jsx` | Métricas globales de administrador: usuarios totales, cursos publicados, inscripciones, ingresos. |
| `DashboardInstructor.jsx` | Métricas del instructor: cursos propios, estudiantes activos, evaluaciones pendientes de calificar. |
| `DashboardEstudiante.jsx` | Dashboard del estudiante: cursos en progreso, próximas evaluaciones, certificados recientes. |

---

## Resumen por dominio

| Carpeta | Archivos JSX | CSS Modules |
|---|---|---|
| `admin/` | 11 | 0 |
| `certificados/` | 2 | 0 |
| `common/` | 1 | 0 |
| `cursos/` | 12 | 0 |
| `estudiante/` | 6 | 0 |
| `evaluaciones/` | 7 | 6 |
| `foro/` | 1 | 0 |
| `sesiones/` | 1 | 0 |
| Raíz | 2 | 0 |
| `dashboard/components/` | 5 | 0 |
| **Total** | **48** | **6** |
