---
title: Inventario de Pantallas
description: Mapa completo de pantallas, rutas, roles y estado de implementación.
---

## Convenciones

- **Auth** — requiere cookie `token` válida (verificada por middleware)
- **Rol** — roles permitidos: `estudiante`, `instructor`, `admin_inst`, `admin`
- **Estado** — `✅ implementada` / `🚧 parcial` / `⬜ pendiente`

---

## Pantallas públicas

| Ruta | Componente principal | Descripción | Estado |
|---|---|---|---|
| `/` | `app/page.tsx` | Homepage: hero, cursos destacados, CTA | ✅ |
| `/catalogo` | `CatalogoCursos.jsx` | Catálogo público de cursos internos y externos con filtros | ✅ |
| `/cursos/[id]` | `DetalleCursoClient.jsx` | Detalle de curso, syllabus, CTA de inscripción | ✅ |
| `/instituciones/[slug]` | `app/instituciones/[slug]/page` | Perfil público de institución + cursos | ✅ |
| `/certificados/verificar/[codigo]` | Inline | Verificación pública de certificado por código único | ✅ |
| `/privacidad` | `app/privacidad/page` | Política de privacidad | ✅ |
| `/terminos` | `app/terminos/page` | Términos y condiciones | ✅ |
| `/docs` | `app/docs/page` | Enlace a esta documentación | ✅ |

---

## Pantallas de autenticación (`app/(auth)/`)

Route group — sin layout protegido. Redirigen al dashboard si ya hay sesión.

| Ruta | Descripción | Estado |
|---|---|---|
| `/login` | Login email-password en 2 pasos | ✅ |
| `/registro` | Registro de estudiante | ✅ |
| `/registro-instructor` | Formulario de solicitud de instructor | ✅ |
| `/recuperar-contrasena` | Solicitud de reset por email | ✅ |
| `/restablecer-contrasena` | Formulario de nueva contraseña (con token) | ✅ |
| `/verificar-cuenta` | Confirmación de email (con token) | ✅ |

---

## Dashboard principal (`app/dashboard/`)

**Auth:** Requerida — middleware redirige a `/login` si no hay token.

| Ruta | Rol | Componente | Descripción | Estado |
|---|---|---|---|---|
| `/dashboard` | Todos | `DashboardAdmin` / `DashboardInstructor` / `DashboardEstudiante` | Métricas según rol | ✅ |
| `/dashboard/cursos` | instructor, admin | `MisCursos.jsx` | Lista de cursos del instructor | ✅ |
| `/dashboard/cursos/[id]` | instructor, admin | `DetalleCurso.jsx` | Detalle y editor del curso | ✅ |
| `/dashboard/certificados` | estudiante, admin | `MisCertificados.jsx` / `AdminCertificados.jsx` | Certificados propios o todos | ✅ |
| `/dashboard/usuarios` | admin | `app/dashboard/usuarios/page` | Gestión de usuarios | ✅ |
| `/dashboard/solicitudes-instructor` | admin | `SolicitudesInstructor.jsx` | Solicitudes de instructor | ✅ |
| `/dashboard/solicitud-instructor` | estudiante | `app/dashboard/solicitud-instructor/page` | Enviar solicitud de instructor | ✅ |
| `/dashboard/instituciones` | admin | `SolicitudesInstituciones.jsx` | Gestión de instituciones | ✅ |
| `/dashboard/cursos-externos` | admin | `CursosExternosPanel.jsx` | Panel de cursos scrapeados | ✅ |
| `/dashboard/cursos-externos/[id]` | admin | `CursoExternoDetalle.jsx` | Detalle y moderación | ✅ |
| `/dashboard/cursos-externos/logs` | admin | `app/dashboard/cursos-externos/logs/page` | Historial de ejecuciones del scraper | ✅ |
| `/dashboard/grupos` | instructor, admin | `app/dashboard/grupos/page` | Gestión de grupos de aprendizaje | ✅ |
| `/dashboard/mensajes` | Todos | `app/dashboard/mensajes/page` | Mensajería interna | ✅ |
| `/dashboard/notificaciones` | Todos | `app/dashboard/notificaciones/page` | Centro de notificaciones | ✅ |
| `/dashboard/reportes` | instructor, admin | `app/dashboard/reportes/page` | Generación de reportes Excel/PDF | ✅ |
| `/dashboard/rutas` | Todos | `app/dashboard/rutas/page` | Rutas de formación | ✅ |
| `/dashboard/auditoria` | admin | `Auditoria.jsx` | Log de auditoría | ✅ |

---

## Creación y edición de cursos (`app/CrearCursos/`)

Flujo multi-paso de instructor/admin. Cada paso es una ruta independiente.

| Ruta | Componente | Paso | Estado |
|---|---|---|---|
| `/CrearCursos` | `crear-curso.jsx` | 1 — Metadatos básicos | ✅ |
| `/CrearCursos/modulos` | `ModulosEditor.jsx` + `GestorContenido.jsx` | 2 — Módulos y lecciones | ✅ |
| `/CrearCursos/leccion` | `LeccionEditor.jsx` | 2b — Editor de lección | ✅ |
| `/CrearCursos/evaluaciones` | `EvaluacionEditor.jsx` | 3 — Evaluaciones | ✅ |
| `/CrearCursos/configuracion` | `ConfiguracionEditor.jsx` | 4 — Criterios de certificación | ✅ |
| `/CrearCursos/publicar` | `PublicarCurso.jsx` | 5 — Publicar | ✅ |

---

## Visor de curso (`app/cursos/[id]/`)

**Auth:** Requerida — verificar inscripción activa.

| Ruta | Componente | Descripción | Estado |
|---|---|---|---|
| `/cursos/[id]` | `VisorCurso.jsx` | Shell con sidebar, lección activa, progreso | ✅ |
| `/cursos/[id]` (tab foro) | `ForoTab.jsx` | Foro del curso integrado | ✅ |
| `/cursos/[id]` (tab sesiones) | `SesionesTab.jsx` | Sesiones en vivo del curso | ✅ |

---

## Instituciones (`app/instituciones/`)

| Ruta | Rol | Descripción | Estado |
|---|---|---|---|
| `/instituciones` | Público | Lista de instituciones activas | ✅ |
| `/instituciones/[slug]` | Público | Perfil e institución + cursos | ✅ |
| `/instituciones/registro` | Público | Formulario de solicitud de vinculación | ✅ |
| `/instituciones/[id]/configurar` | admin_inst, admin | Editor de configuración institucional | ✅ |
| `/instituciones/[id]/cursos` | Público | Cursos de la institución | ✅ |
| `/instituciones/[id]/instructores` | admin_inst, admin | Instructores de la institución | ✅ |
| `/instituciones/[id]/perfil` | admin_inst | Perfil editable de la institución | ✅ |
| `/instituciones/[id]/dashboard` | admin_inst | Métricas institucionales | ✅ |
| `/instituciones/admin/configurar` | admin | Configuración global institucional | ✅ |

---

## Pantallas especiales

| Ruta | Descripción | Estado |
|---|---|---|
| `/scorm/player` | Visor de paquetes SCORM con iframe y tracking de progreso | ✅ |
| `/evaluacion-instrucciones` | Instrucciones pre-evaluación (archivo estático en `public/`) | ✅ |

---

## Resumen por tipo

| Tipo | Cantidad |
|---|---|
| Públicas | 8 |
| Autenticación | 6 |
| Dashboard | 17 |
| Creación de cursos | 6 |
| Visor de curso | 3 |
| Instituciones | 9 |
| Especiales | 2 |
| **Total** | **51** |
