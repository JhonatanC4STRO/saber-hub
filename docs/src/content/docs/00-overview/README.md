---
title: SaberHub — Descripción General
description: Nombre, stack, estructura y punto de entrada al proyecto SaberHub LMS.
---

# SaberHub

![Build](https://img.shields.io/github/actions/workflow/status/tu-org/lms-saberHub/ci.yml?branch=main&label=build)
![Licencia](https://img.shields.io/badge/licencia-MIT-blue)
![Versión](https://img.shields.io/badge/versión-0.1.0-informational)
![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)

---

## ¿Qué es SaberHub?

SaberHub es una **plataforma colombiana de aprendizaje en línea, completamente gratuita**, enfocada en programación, ciberseguridad, redes e inteligencia artificial. Permite a estudiantes, instructores e instituciones educativas gestionar cursos, evaluaciones, certificados y rutas de formación desde un solo lugar.

La plataforma nació para democratizar el acceso a educación técnica de calidad en Colombia, eliminando barreras económicas y de infraestructura: los laboratorios y simuladores corren en la nube, sin necesidad de hardware propio.

---

## Características principales

| Área | Capacidades |
|---|---|
| **Contenido** | Cursos, módulos, lecciones, recursos multimedia, paquetes SCORM |
| **Evaluaciones** | 4 tipos de pregunta, banco de preguntas, calificación automática y manual |
| **Certificados** | Códigos únicos verificables, PDF generado, rutas de formación |
| **Progreso** | Heartbeat cada 15 s, tiempo conectado, avance por lección y curso |
| **Comunicación** | Foros por curso (hilos, citas, reacciones), mensajería interna, notificaciones |
| **Grupos** | Cohortes con anuncios, archivos compartidos y progreso grupal |
| **Instituciones** | Workflow de solicitud, dashboard de administración, invitación de instructores |
| **Cursos externos** | Importación desde SENA Sofia Plus, Coursera y otras fuentes (con scraper) |
| **Reportes** | Exportación a Excel y PDF (inscripciones, notas, progreso) |
| **Seguridad** | JWT + HttpOnly cookie, bloqueo por intentos fallidos, HSTS, CSP estricto |

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router, TypeScript) | 16.2.6 |
| ORM / DB | Prisma + PostgreSQL (adapter-pg) | 7.8.0 |
| UI | React + Tailwind CSS | 19.2.4 / 4.x |
| Auth | JWT (jose) + bcryptjs | 6.2.3 / 3.0.3 |
| Almacenamiento | Cloudinary | 2.10.0 |
| Email | Nodemailer (SMTP Gmail) | 8.0.7 |
| PDF | pdf-lib | 1.17.1 |
| Excel | xlsx | 0.18.5 |
| Drag & Drop | DnD Kit | — |
| Scraping | Puppeteer + robots-parser | 24.0.0 / 3.0.1 |
| Compresión | adm-zip | 0.5.17 |
| Gestor de paquetes | pnpm | — |
| Runtime | Node.js | 18+ |

---

## Inicio rápido

Consulta la [Guía de Inicio](/00-overview/guia-inicio) para clonar el repositorio, configurar variables de entorno y levantar la base de datos localmente.

---

## Estructura del repositorio

```
saberhub/
├── app/                    # Next.js App Router (páginas, layouts, API routes)
│   ├── (auth)/             # Rutas de autenticación (login, registro, reset)
│   ├── api/                # 78 endpoints REST organizados por dominio
│   ├── catalogo/           # Catálogo público de cursos
│   ├── cursos/             # Vista de curso y lección para estudiantes
│   ├── dashboard/          # Panel del instructor y admin
│   ├── certificados/       # Verificación y descarga de certificados
│   ├── instituciones/      # Dashboard institucional
│   └── scorm/              # Visor de paquetes SCORM
├── components/             # Componentes React reutilizables
├── lib/                    # Utilidades (jwt, password, email, prisma, etc.)
├── prisma/                 # Esquema Prisma (47 modelos) y migraciones
├── scripts/                # Scripts de seed y utilidades
├── public/                 # Assets estáticos
├── docs/                   # Sitio de documentación (Astro Starlight)
└── cursos/                 # Archivos de cursos locales (SCORM, recursos)
```

---

## Cómo contribuir

Ver [Guía de Contribución](/09-development/contribucion) para convenciones de código, flujo de ramas y proceso de revisión.

---

## Licencia

MIT — ver `LICENSE` en la raíz del repositorio.

---

## Contacto / Equipo

- **Repositorio:** [github.com/tu-org/lms-saberHub](https://github.com/tu-org/lms-saberHub)
- **Email:** contacto@saberhub.co
- **Mantenedor:** [@JhonatanC4STRO](https://github.com/JhonatanC4STRO)
