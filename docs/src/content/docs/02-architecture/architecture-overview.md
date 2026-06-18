---
title: Visión General de Arquitectura
description: Diagrama general, componentes, patrón de capas y flujo de petición en SaberHub.
---

## Diagrama de arquitectura general

```mermaid
graph TB
    subgraph Cliente["Cliente (Browser)"]
        UI[React 19 + Tailwind CSS 4]
        HB[Heartbeat 15s]
    end

    subgraph Vercel["Vercel / Next.js 16 App Router"]
        direction TB
        Pages[Pages & Layouts<br/>app/**/*.tsx]
        MW[Middleware<br/>JWT cookie check]
        API[API Routes<br/>app/api/**/*.ts]
        subgraph Lib["lib/"]
            JWT[jwt.ts]
            PW[password.js]
            EMAIL[email.js]
            NOTIF[notificaciones.js]
            WH[webhooks.js]
            SLUGIFY[slugify.js]
            ROBOTS[robots-checker.ts]
        end
    end

    subgraph Data["Capa de datos"]
        PRISMA[Prisma ORM 7.8<br/>adapter-pg]
        PG[(PostgreSQL 16)]
    end

    subgraph External["Servicios externos"]
        CDN[Cloudinary CDN<br/>imágenes · videos HLS]
        SMTP[Gmail SMTP<br/>Nodemailer 8]
        GOOGLE[Google OAuth 2.0]
        SCORM_EXT[Sofia Plus / Coursera<br/>scraping con Puppeteer]
    end

    UI -->|fetch / RSC| Pages
    UI -->|fetch| API
    HB -->|POST /api/progreso/heartbeat| API
    Pages --> MW
    MW -->|verifyToken| JWT
    API --> Lib
    Lib --> PRISMA
    PRISMA --> PG
    API -->|upload| CDN
    EMAIL --> SMTP
    API -->|OAuth callback| GOOGLE
    ROBOTS -->|check robots.txt| SCORM_EXT
    API -->|Puppeteer| SCORM_EXT
```

---

## Componentes del sistema

| Componente | Tecnología | Responsabilidad |
|---|---|---|
| **App Router** | Next.js 16 | Enrutamiento, layouts, Server Components, middleware |
| **API Routes** | Next.js Route Handlers | 78 endpoints REST organizados por dominio |
| **Middleware** | Next.js Middleware | Verificación de JWT en cookie antes de renderizar rutas protegidas |
| **ORM** | Prisma 7.8 + adapter-pg | Acceso tipado a BD; 47 modelos; sin SQL manual |
| **Base de datos** | PostgreSQL 16 | Persistencia principal; ACID; relaciones complejas |
| **Autenticación** | jose 6 + bcryptjs 3 | JWT HS256 en HttpOnly cookie; hash de contraseñas |
| **Almacenamiento** | Cloudinary 2 | CDN para imágenes, videos HLS y archivos de grupos |
| **Email** | Nodemailer 8 + SMTP Gmail | Verificación, recuperación de contraseña, notificaciones, alertas |
| **OAuth** | Google OAuth 2.0 | SSO; auto-registro de estudiantes |
| **Scraper** | Puppeteer 24 + robots-parser 3 | Extracción de cursos externos con cumplimiento de robots.txt |
| **PDF** | pdf-lib 1.17 | Generación de certificados sin dependencias nativas |
| **Excel** | SheetJS (xlsx) 0.18 | Exportación de reportes de progreso y calificaciones |
| **SCORM** | adm-zip 0.5 | Extracción de paquetes SCORM; tracking CMI en `ProgresoScorm` |
| **Webhooks** | crypto (Node.js) | Despacho de eventos firmados con HMAC-SHA256 |

---

## Decisiones de arquitectura (ADR resumidos)

| ADR | Decisión | Alternativa descartada |
|---|---|---|
| [ADR-001](/02-architecture/decisions/adr-001-nextjs-app-router) | Next.js App Router | Pages Router |
| [ADR-002](/02-architecture/decisions/adr-002-jwt-sin-nextauth) | JWT custom con jose | NextAuth.js / Auth.js |
| [ADR-003](/02-architecture/decisions/adr-003-api-routes-vs-server-actions) | API Routes REST | Server Actions |
| [ADR-004](/02-architecture/decisions/adr-004-prisma-postgresql) | Prisma + PostgreSQL | Drizzle / raw SQL / MongoDB |

---

## Patrón de capas

```
Browser
  │
  ▼
Next.js Middleware  ←── verifica JWT cookie, redirige si no autenticado
  │
  ▼
Page / Layout (RSC)  ←── fetch interno al API Route o Prisma directo
  │
  ▼
API Route (route.ts)  ←── valida body, extrae JWT, llama lib/
  │
  ▼
lib/ utilities  ←── lógica de negocio (jwt, email, webhooks, notificaciones)
  │
  ▼
Prisma Client  ←── queries tipadas, transacciones
  │
  ▼
PostgreSQL
```

**Regla de dependencia:** cada capa solo conoce la siguiente. Los componentes React no llaman a Prisma directamente desde el cliente; siempre pasan por un API Route.

---

## Flujo de una petición típica

**Ejemplo: estudiante marca lección como completada**

```mermaid
sequenceDiagram
    actor E as Estudiante
    participant UI as React Component
    participant MW as Middleware
    participant API as POST /api/progreso/leccion
    participant LIB as lib/
    participant PG as PostgreSQL

    E->>UI: Click "Marcar completada"
    UI->>API: fetch POST con leccionId en body
    Note over MW: verifica cookie JWT<br/>extrae userId
    API->>API: valida body (leccionId requerido)
    API->>PG: upsert ProgresoLeccion<br/>(completada=true, fechaCompletada=now)
    API->>PG: recalcular progreso inscripción<br/>(lecciones completadas / total * 100)
    API->>PG: SELECT COUNT lecciones totales
    alt progreso = 100%
        API->>LIB: emitirCertificado(inscripcionId)
        LIB->>PG: INSERT Certificacion
        LIB->>LIB: notificaciones.js → INSERT Notificacion
        LIB->>LIB: webhooks.js → POST externo firmado
    end
    API->>UI: 200 { progreso, completada }
    UI->>E: Actualiza barra de progreso
```
