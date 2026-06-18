---
title: Flujos de Usuario
description: Flujos principales de SaberHub con diagramas Mermaid por actor y proceso.
---

## Flujo del Alumno

Desde el registro hasta la obtención del certificado.

```mermaid
flowchart TD
    A([Visitante]) --> B[Explorar catálogo público]
    B --> C{¿Tiene cuenta?}
    C -- No --> D[Registrarse con email o Google]
    D --> E{OAuth?}
    E -- Google --> F[Cuenta verificada automáticamente]
    E -- Email --> G[Verificar email - token 24h]
    G --> F
    C -- Sí --> H[Iniciar sesión]
    F --> H
    H --> I[Ver catálogo autenticado]
    I --> J[Seleccionar curso]
    J --> K[Inscribirse]
    K --> L[Acceder al contenido]
    L --> M[Consumir lección]
    M --> N[Heartbeat cada 15s]
    M --> O[Marcar lección completada]
    O --> P{¿Hay evaluación?}
    P -- Sí --> Q[Rendir evaluación]
    Q --> R{¿Aprobó?}
    R -- No, hay intentos --> Q
    R -- No, sin intentos --> S[Evaluación bloqueada]
    R -- Sí --> T{¿Progreso = 100%?}
    P -- No --> T
    T -- No --> M
    T -- Sí --> U[Certificado emitido automáticamente]
    U --> V[Descargar PDF]
    U --> W[Compartir código de verificación]
```

---

## Flujo del Instructor

Desde la solicitud de rol hasta la calificación de evaluaciones.

```mermaid
flowchart TD
    A([Usuario]) --> B[Solicitar rol instructor]
    B --> C[Subir hoja de vida y portafolio]
    C --> D{Admin revisa solicitud}
    D -- Rechazada --> E[Notificación de rechazo]
    D -- Aprobada --> F[Rol instructor activado]
    F --> G[Crear curso - estado borrador]
    G --> H[Agregar módulos con drag & drop]
    H --> I[Agregar lecciones a módulos]
    I --> J[Adjuntar recursos por lección]
    J --> K{¿Agregar evaluación?}
    K -- Sí --> L[Crear evaluación con banco de preguntas]
    L --> M[Configurar puntaje mínimo, intentos, tiempo]
    M --> N[Publicar curso]
    K -- No --> N
    N --> O[Curso visible en catálogo]
    O --> P[Estudiantes se inscriben]
    P --> Q[Instructor ve dashboard de progreso]
    Q --> R{¿Hay intentos de desarrollo pendientes?}
    R -- Sí --> S[Calificar respuestas manualmente]
    S --> T[Puntaje final calculado]
    T --> U[Estudiante notificado]
    R -- No --> V[Exportar reporte Excel/PDF]
```

---

## Flujo del Administrador

Gestión de usuarios, instituciones y solicitudes.

```mermaid
flowchart TD
    A([Admin]) --> B{¿Qué gestionar?}

    B --> C[Usuarios]
    C --> C1[Crear / editar / desactivar usuario]
    C1 --> C2[Asignar o cambiar rol]

    B --> D[Solicitudes de instructor]
    D --> D1{Revisar solicitud}
    D1 -- Aprobar --> D2[Instructor habilitado + notificación]
    D1 -- Rechazar --> D3[Motivo registrado + notificación]

    B --> E[Instituciones]
    E --> E1{Estado solicitud}
    E1 -- pendiente_informacion --> E2[Solicitar más datos]
    E1 -- Aprobar --> E3[Institución activa + dashboard creado]
    E1 -- Rechazar --> E4[Notificación con motivo]

    B --> F[Grupos / Cohortes]
    F --> F1[Crear grupo con fechas]
    F1 --> F2[Asignar estudiantes en bloque CSV]
    F2 --> F3[Asignar cursos al grupo]

    B --> G[Auditoría]
    G --> G1[Filtrar por usuario, acción, fecha]
    G1 --> G2[Exportar a Excel]

    B --> H[Cursos externos]
    H --> H1[Revisar cursos scrapeados]
    H1 -- Aprobar --> H2[Curso visible en catálogo]
    H1 -- Rechazar --> H3[Descartado]
    H --> H4[Bloquear / habilitar fuente]
```

---

## Flujo de Cursos Externos (Scraping)

Desde la ejecución del scraper hasta la publicación del curso.

```mermaid
flowchart TD
    A([Admin o Cron]) --> B[Ejecutar scraper]
    B --> C[Verificar robots.txt de la fuente]
    C --> D{¿Permitido?}
    D -- No --> E[Fuente bloqueada automáticamente]
    D -- Sí --> F[Puppeteer extrae cursos]
    F --> G[Comparar con cursos existentes en BD]
    G --> H[Guardar cursos nuevos como pendientes de revisión]
    G --> I[Actualizar metadata de cursos existentes]
    H --> J[Log de scraping guardado]
    J --> K{cursos_nuevos > 0?}
    K -- Sí --> L[Admin notificado]
    L --> M[Admin revisa cursos pendientes]
    M --> N{¿Aprobar?}
    N -- Sí --> O[CursoExterno aprobado - visible en catálogo]
    N -- No --> P[Descartado]
    K -- No --> Q[Log registrado sin acción adicional]
```

---

## Flujo de Videoconferencia

Programación y ejecución de sesión en vivo.

```mermaid
flowchart TD
    A([Instructor]) --> B[Crear sesión en curso]
    B --> C[Ingresar título, fecha, duración estimada, URL reunión]
    C --> D[Estado: programada]
    D --> E[Estudiantes inscritos notificados]
    E --> F{Llega la hora}
    F --> G[Instructor cambia estado a en_curso]
    G --> H[Estudiantes acceden a URL de reunión]
    H --> I[Sesión finaliza]
    I --> J[Instructor cambia estado a finalizada]
    J --> K{¿Hay grabación?}
    K -- Sí --> L[Instructor agrega URL de grabación]
    L --> M[Grabación accesible desde el curso]
    K -- No --> N[Sesión archivada sin grabación]
```

---

## Flujo de Ruta de Formación

Inscripción y certificación de ruta completa.

```mermaid
flowchart TD
    A([Estudiante]) --> B[Ver catálogo de rutas]
    B --> C[Seleccionar ruta de formación]
    C --> D{¿Ruta lineal o flexible?}
    D -- Lineal --> E[Completar cursos en orden obligatorio]
    D -- Flexible --> F[Completar cursos en cualquier orden]
    E --> G{¿Completó todos los cursos?}
    F --> G
    G -- No --> H[Continuar con siguiente curso disponible]
    H --> E
    G -- Sí --> I[Certificado de ruta emitido]
    I --> J[PDF de certificado de ruta descargable]
    I --> K[Código único verificable]
```
