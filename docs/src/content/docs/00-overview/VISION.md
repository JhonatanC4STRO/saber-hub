---
title: Visión del Proyecto
description: Problema, misión, público objetivo, propuesta de valor y roadmap de SaberHub.
---

# Visión del Proyecto

## Problema que resuelve

Colombia enfrenta una brecha profunda en educación técnica de calidad accesible:

- Los cursos especializados en programación, ciberseguridad, redes e IA tienen costos prohibitivos para gran parte de la población.
- Los laboratorios prácticos requieren hardware costoso que la mayoría de estudiantes no posee.
- Las plataformas gratuitas existentes (Coursera, edX) están en inglés y no están adaptadas al contexto colombiano ni a las certificaciones locales (SENA, MinTIC).
- Las instituciones educativas carecen de una herramienta unificada para gestionar cursos, grupos, evaluaciones y reportes.

**SaberHub elimina estas barreras** al ofrecer una plataforma 100 % gratuita, en español, con laboratorios virtuales en la nube y soporte institucional nativo.

---

## Misión y objetivos

**Misión:** Democratizar el acceso a educación técnica de calidad en Colombia, sin costo para el estudiante, mediante una plataforma moderna que conecta aprendices, instructores e instituciones.

**Objetivos estratégicos:**

1. Ofrecer formación práctica en las áreas de mayor demanda laboral: programación, ciberseguridad, redes e inteligencia artificial.
2. Integrar el catálogo oficial del SENA (Sofia Plus) y MinTIC para ampliar la oferta sin duplicar esfuerzos.
3. Proveer a las instituciones educativas una herramienta gratuita de gestión de aprendizaje (LMS) con reporte y certificación.
4. Certificar competencias de forma verificable con códigos únicos y PDF descargable.
5. Construir una comunidad de aprendizaje colaborativa mediante foros, grupos y rutas de formación.

---

## Público objetivo

| Rol | Descripción |
|---|---|
| **Estudiante** | Persona que se inscribe a cursos, completa lecciones, rinde evaluaciones y obtiene certificados. Puede ser autodidacta o pertenecer a un grupo institucional. |
| **Instructor** | Profesional que crea y publica cursos, módulos, lecciones y evaluaciones. Gestiona foros, reportes de progreso y calificaciones manuales (desarrollo). |
| **Tutor / Facilitador** | Acompaña grupos de estudiantes en rutas de formación, gestiona avisos y archivos del grupo. *(Rol en evolución según roadmap.)* |
| **Administrador** | Gestiona la plataforma completa: usuarios, instituciones, instructores, cursos externos, scraper, webhooks y auditoría. |
| **Institución** | Entidad educativa (universidad, SENA, MinTIC, empresa) que se vincula a SaberHub para ofrecer sus cursos y gestionar sus aprendices. El proceso de vinculación es gratuito y tarda máximo 5 días hábiles. |

---

## Propuesta de valor

| Para | Valor |
|---|---|
| **Estudiante** | Acceso gratuito a cursos técnicos, laboratorios sin hardware, certificados verificables, comunidad de aprendizaje. |
| **Instructor** | Herramienta profesional de creación de contenido (SCORM, video, PDF, evaluaciones), banco de preguntas reutilizable, reportes de progreso en tiempo real. |
| **Institución** | LMS gratuito con branding propio, gestión de grupos y cohortes, exportación de reportes, integración de catálogo externo (Sofia Plus). |
| **Ecosistema** | Centralización del catálogo técnico colombiano (SENA, MinTIC, aliados) en un solo punto de acceso verificado. |

---

## Modelo gratuito y alianzas institucionales

SaberHub es **gratuito para estudiantes e instituciones**. El modelo se sostiene mediante:

- **Alianzas institucionales:** El SENA, MinTIC, universidades y empresas pueden vincular sus cursos y llegar a más aprendices sin costo.
- **Proceso de solicitud transparente:** Cualquier institución puede solicitar vinculación desde la plataforma. El equipo de SaberHub revisa y aprueba en máximo 5 días hábiles.
- **Cursos externos integrados:** El scraper extrae metadata de fuentes oficiales (Sofia Plus, etc.) con respeto a `robots.txt` y previa autorización, ampliando el catálogo sin duplicar trabajo.

---

## Roadmap general por fases

### MVP — Fase actual (v0.1.x)

- [x] Autenticación (email/password + Google OAuth)
- [x] Creación y publicación de cursos (módulos, lecciones, recursos)
- [x] SCORM player
- [x] Evaluaciones (4 tipos de pregunta, banco, calificación automática)
- [x] Inscripciones y seguimiento de progreso (heartbeat, tiempo conectado)
- [x] Certificados verificables (PDF, código único)
- [x] Grupos y cohortes
- [x] Rutas de formación
- [x] Foros por curso
- [x] Mensajería interna
- [x] Notificaciones (in-app + email)
- [x] Dashboard institucional
- [x] Cursos externos + scraper (SENA Sofia Plus)
- [x] Reportes (Excel / PDF)
- [x] Auditoría de acciones
- [x] Webhooks

### Fase 2 — Crecimiento

- [ ] Laboratorios virtuales en la nube (entornos sandbox por categoría)
- [ ] Sistema de mentorías y sesiones 1:1
- [ ] Videoclases en vivo mejoradas (integración Jitsi / BigBlueButton)
- [ ] Gamificación (puntos, insignias, tablas de líderes)
- [ ] App móvil (React Native)
- [ ] API pública para integraciones de terceros
- [ ] Módulo de prácticas empresariales

### Fase 3 — Consolidación

- [ ] Marketplace de cursos de pago (revenue share con instructores)
- [ ] IA generativa para creación de contenido asistido
- [ ] Análisis predictivo de deserción estudiantil
- [ ] Integración con plataformas de empleo (LinkedIn, GetOnBoard)
- [ ] Reconocimiento de logros en blockchain
