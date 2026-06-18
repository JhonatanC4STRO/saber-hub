---
title: Historias de Usuario
description: Historias de usuario por sprint con criterios de aceptación para SaberHub.
---

## Sprint 1 — Autenticación y acceso

### US-001 · Registro de cuenta

> Como **estudiante**, quiero registrarme con mi correo y contraseña para acceder a la plataforma.

**Criterios de aceptación:**
- [ ] Formulario solicita nombre, apellido, email y contraseña (mín. 8 caracteres).
- [ ] Se envía email de verificación con token válido por 24 h.
- [ ] Cuenta queda en estado no verificada hasta confirmar email.
- [ ] Si el email ya existe, muestra error claro sin exponer datos.

---

### US-002 · Login con email

> Como **usuario registrado**, quiero iniciar sesión con mi email y contraseña para acceder a mi cuenta.

**Criterios de aceptación:**
- [ ] Login exitoso redirige al dashboard según el rol.
- [ ] Tras 5 intentos fallidos, la cuenta se bloquea 15 minutos.
- [ ] Mensaje de bloqueo informa el tiempo restante.
- [ ] Sesión persiste en cookie HttpOnly (maxAge 30 min, renovable).

---

### US-003 · Login con Google

> Como **estudiante nuevo**, quiero registrarme e iniciar sesión con mi cuenta de Google para no tener que crear otra contraseña.

**Criterios de aceptación:**
- [ ] Botón "Continuar con Google" visible en login y registro.
- [ ] Primera vez: auto-crea cuenta con rol estudiante y email verificado.
- [ ] Sesiones posteriores: autentica sin formulario adicional.

---

### US-004 · Recuperar contraseña

> Como **usuario**, quiero recuperar mi contraseña olvidada para no perder acceso a mi cuenta.

**Criterios de aceptación:**
- [ ] Formulario solicita email y envía link de restablecimiento.
- [ ] Token válido por 1 h y de un solo uso.
- [ ] Tras usar el token, queda inactivo inmediatamente.

---

## Sprint 2 — Catálogo y cursos

### US-005 · Explorar catálogo

> Como **visitante**, quiero explorar el catálogo de cursos sin registrarme para evaluar si la plataforma me conviene.

**Criterios de aceptación:**
- [ ] Catálogo visible sin autenticación.
- [ ] Filtros por categoría, institución y nivel funcionan combinados.
- [ ] Paginación muestra máximo 12 cursos por página.
- [ ] Vista previa de lección disponible sin inscripción.

---

### US-006 · Inscribirse a un curso

> Como **estudiante autenticado**, quiero inscribirme a un curso para comenzar a aprender.

**Criterios de aceptación:**
- [ ] Botón "Inscribirme" visible en la página del curso.
- [ ] Inscripción crea registro con `estado = activo` y `progreso = 0`.
- [ ] Acceso inmediato al contenido tras inscripción.
- [ ] Curso aparece en "Mis cursos" en el dashboard.

---

### US-007 · Crear curso

> Como **instructor aprobado**, quiero crear un curso con módulos y lecciones para enseñar a mis estudiantes.

**Criterios de aceptación:**
- [ ] Formulario con campos: título, descripción, categoría, nivel, institución, imagen.
- [ ] Módulos y lecciones creables y reordenables con drag & drop.
- [ ] Curso se crea en estado `borrador`; solo se publica explícitamente.
- [ ] Cada lección acepta múltiples recursos adjuntos (PDF, video, enlace, etc.).

---

### US-008 · Cargar contenido SCORM

> Como **instructor**, quiero subir un paquete SCORM para ofrecer simulaciones interactivas.

**Criterios de aceptación:**
- [ ] Acepta archivos ZIP hasta 100 MB.
- [ ] Extrae y valida el paquete antes de guardar.
- [ ] El visor SCORM registra progreso CMI en `ProgresoScorm`.
- [ ] Error claro si el ZIP no es un paquete SCORM válido.

---

## Sprint 3 — Progreso y consumo

### US-009 · Completar lección

> Como **estudiante**, quiero marcar una lección como completada para ver mi avance en el curso.

**Criterios de aceptación:**
- [ ] Botón "Marcar como completada" al final de cada lección.
- [ ] Progreso del curso se recalcula inmediatamente (%).
- [ ] Lección muestra indicador visual de completada en el índice.
- [ ] No se puede desmarcar una lección completada.

---

### US-010 · Seguimiento de tiempo

> Como **institución**, quiero conocer el tiempo que cada estudiante dedica a los cursos para generar reportes de dedicación.

**Criterios de aceptación:**
- [ ] Heartbeat enviado cada 15 s mientras el estudiante tiene la lección abierta.
- [ ] `tiempoConectado` se incrementa en segundos en el registro de inscripción.
- [ ] Reportes de progreso incluyen columna de tiempo total por estudiante.

---

## Sprint 4 — Evaluaciones

### US-011 · Crear evaluación

> Como **instructor**, quiero crear una evaluación con diferentes tipos de pregunta para medir el aprendizaje de mis estudiantes.

**Criterios de aceptación:**
- [ ] Soporta: opción múltiple, verdadero/falso, respuesta corta, desarrollo.
- [ ] Configurable: puntaje mínimo aprobatorio, intentos máximos, duración.
- [ ] Opción de aleatorizar orden de preguntas.
- [ ] Opción de mostrar respuestas correctas tras finalizar.

---

### US-012 · Rendir evaluación

> Como **estudiante**, quiero rendir una evaluación para demostrar lo que aprendí y avanzar en el curso.

**Criterios de aceptación:**
- [ ] Timer visible si la evaluación tiene límite de tiempo.
- [ ] Auto-envío al agotarse el tiempo (estado `expirado`).
- [ ] Puntaje calculado y mostrado inmediatamente para preguntas automáticas.
- [ ] Preguntas de desarrollo quedan pendientes de calificación manual.
- [ ] Bloquea nuevo intento si se alcanzó el máximo.

---

### US-013 · Calificar desarrollo

> Como **instructor**, quiero calificar manualmente las respuestas de desarrollo para dar retroalimentación cualitativa.

**Criterios de aceptación:**
- [ ] Lista de intentos con preguntas de desarrollo pendientes visible en dashboard.
- [ ] Formulario para asignar puntaje parcial y comentario por respuesta.
- [ ] Puntaje final del intento se recalcula al guardar.
- [ ] Estudiante recibe notificación cuando su intento es calificado.

---

## Sprint 5 — Certificados

### US-014 · Obtener certificado de curso

> Como **estudiante**, quiero recibir un certificado al completar un curso para acreditar mis conocimientos.

**Criterios de aceptación:**
- [ ] Certificado emitido automáticamente al alcanzar 100 % de progreso.
- [ ] Incluye nombre del estudiante, curso, institución y fecha de emisión.
- [ ] Código único verificable en `/certificados/verificar/[codigo]`.
- [ ] PDF descargable desde "Mis certificados".

---

### US-015 · Verificar certificado

> Como **empleador o institución**, quiero verificar la autenticidad de un certificado de SaberHub para confirmar las credenciales de un candidato.

**Criterios de aceptación:**
- [ ] Página pública de verificación acepta código del certificado.
- [ ] Muestra nombre del titular, curso, fecha e institución si es válido.
- [ ] Muestra mensaje claro si el código no existe o el certificado fue revocado.
- [ ] No requiere autenticación para verificar.

---

## Sprint 6 — Grupos e instituciones

### US-016 · Gestionar grupo/cohorte

> Como **administrador**, quiero crear grupos de estudiantes y asignarles cursos para organizar la formación institucional.

**Criterios de aceptación:**
- [ ] Grupo con nombre, fechas de inicio/fin y estado activo.
- [ ] Agregar/remover estudiantes individualmente o en bloque (CSV).
- [ ] Asignar uno o varios cursos al grupo.
- [ ] Dashboard de progreso grupal por curso.

---

### US-017 · Solicitud de institución

> Como **representante institucional**, quiero solicitar la vinculación de mi organización a SaberHub para ofrecer nuestros cursos.

**Criterios de aceptación:**
- [ ] Formulario público con nombre, NIT, dirección, contacto y descripción.
- [ ] Solicitud pasa por estados: `pendiente → en_revision → aprobada/rechazada`.
- [ ] Admin puede solicitar información adicional (estado `pendiente_informacion`).
- [ ] Notificación por email en cada cambio de estado.
- [ ] Proceso tarda máximo 5 días hábiles.

---

## Sprint 7 — Herramientas de administración

### US-018 · Auditoría de acciones

> Como **administrador**, quiero consultar un log de todas las acciones realizadas en la plataforma para garantizar la trazabilidad y detectar anomalías.

**Criterios de aceptación:**
- [ ] Log muestra: usuario, acción, tabla, registro afectado, datos antes/después, IP, fecha.
- [ ] Filtrable por usuario, tipo de acción y rango de fechas.
- [ ] Exportable a Excel.
- [ ] Solo accesible por rol admin.

---

### US-019 · Webhooks de eventos

> Como **integrador técnico**, quiero configurar webhooks para recibir notificaciones de eventos de SaberHub en sistemas externos.

**Criterios de aceptación:**
- [ ] CRUD de webhooks con URL destino, eventos suscritos y estado activo/inactivo.
- [ ] Cada payload firmado con HMAC-SHA256 usando el secreto configurado.
- [ ] Eventos disponibles: inscripción, certificado, evaluación, solicitud, etc.
- [ ] Log de intentos de envío (éxito/fallo).

---

## Sprint 8 — Cursos externos y scraping

### US-020 · Ver cursos externos

> Como **estudiante**, quiero ver cursos del SENA y otras plataformas desde SaberHub para tener un catálogo centralizado.

**Criterios de aceptación:**
- [ ] Sección "Cursos externos" visible en el catálogo.
- [ ] Cada curso muestra fuente de origen, enlace directo y metadata (título, descripción, duración).
- [ ] Solo aparecen cursos aprobados por el administrador.

---

### US-021 · Gestionar fuentes externas

> Como **administrador**, quiero controlar qué fuentes de cursos externos se permiten para asegurar la calidad del catálogo.

**Criterios de aceptación:**
- [ ] Lista de fuentes con estado habilitado/bloqueado.
- [ ] Bloquear fuente requiere registrar motivo.
- [ ] Fuentes bloqueadas no son incluidas en el próximo ciclo de scraping.
- [ ] Scraper puede ejecutarse manualmente desde el panel admin.
