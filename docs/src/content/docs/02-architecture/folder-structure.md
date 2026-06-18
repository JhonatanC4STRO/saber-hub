---
title: Estructura de Carpetas
description: Estructura completa del repositorio SaberHub, convenciones de nombres y dónde va cada tipo de archivo.
---

## Árbol completo

```
saberhub/                          ← Raíz de la aplicación Next.js
│
├── app/                           ← Next.js App Router (rutas, layouts, API)
│   ├── (auth)/                    ← Grupo de rutas de autenticación (sin segmento en URL)
│   │   ├── login/page.tsx
│   │   ├── registro/page.tsx
│   │   ├── recuperar-contrasena/page.tsx
│   │   └── restablecer-contrasena/page.tsx
│   │
│   ├── api/                       ← API Routes (78 endpoints)
│   │   ├── auth/                  ← login, register, logout, verify, forgot, reset, google/
│   │   ├── cursos/                ← CRUD cursos, catálogo, foro, sesiones, externos
│   │   ├── inscripciones/         ← inscripción, importar, masiva
│   │   ├── evaluaciones/          ← CRUD evaluaciones e intentos
│   │   ├── intentos/              ← intento detail, enviar, calificar
│   │   ├── progreso/              ← heartbeat, lección, curso, grupo, scorm
│   │   ├── certificados/          ← listar, revocar, pdf, ruta-pdf, verificar
│   │   ├── banco/                 ← banco preguntas: CRUD, categorías, importar
│   │   ├── grupos/                ← avisos, archivos, miembros
│   │   ├── mensajes/              ← mensajería interna, chat, contactos
│   │   ├── notificaciones/        ← preferencias
│   │   ├── reportes/              ← exportar Excel/PDF
│   │   ├── instituciones/         ← CRUD institución, invitar, solicitud
│   │   ├── sesiones/              ← videoconferencias
│   │   ├── webhooks/              ← CRUD webhooks
│   │   ├── upload/                ← upload general, scorm
│   │   ├── solicitudes-instructor/← solicitud, upload docs, download docs
│   │   ├── admin/                 ← usuarios, instructores, grupos, rutas, auditoria,
│   │   │                          ←   cursos-externos, fuentes, logs-scraping, scrapers/
│   │   ├── cron/                  ← alertas programadas
│   │   └── seed/                  ← seed de solicitudes
│   │
│   ├── catalogo/                  ← Catálogo público de cursos
│   ├── cursos/[id]/               ← Vista de curso e index de lecciones
│   │   └── leccion/[leccionId]/   ← Visor de lección
│   ├── dashboard/                 ← Panel principal (layouts por rol)
│   │   ├── cursos/                ← Gestión de cursos del instructor
│   │   ├── evaluaciones/          ← Gestión de evaluaciones
│   │   ├── grupos/                ← Gestión de grupos
│   │   ├── reportes/              ← Reportes y exportaciones
│   │   └── admin/                 ← Panel administrador
│   ├── certificados/              ← Mis certificados + verificación pública
│   ├── instituciones/             ← Dashboard institucional
│   ├── scorm/[cursoId]/[leccionId]/← Visor SCORM en iframe
│   ├── CrearCursos/               ← Wizard de creación de cursos
│   ├── docs/                      ← Documentación interna (páginas internas)
│   ├── privacidad/page.tsx        ← Política de privacidad
│   ├── terminos/page.tsx          ← Términos de uso
│   ├── generated/                 ← Cliente Prisma generado (no editar manualmente)
│   │   └── prisma/
│   ├── globals.css                ← Estilos globales (Tailwind @import)
│   ├── layout.tsx                 ← Root layout (html, body, providers)
│   └── page.tsx                   ← Home page (landing)
│
├── components/                    ← Componentes React reutilizables
│   ├── ui/                        ← Componentes de UI genéricos (Button, Modal, etc.)
│   ├── auth/                      ← Formularios de autenticación
│   ├── cursos/                    ← Cards, listas, editores de cursos
│   ├── evaluaciones/              ← Formularios de evaluación y preguntas
│   ├── certificados/              ← Vista y descarga de certificados
│   ├── dashboard/                 ← Sidebar, navbar, widgets del panel
│   └── shared/                    ← Componentes transversales (Spinner, ErrorBoundary)
│
├── lib/                           ← Utilidades y lógica de negocio pura
│   ├── prisma.ts                  ← Singleton de PrismaClient
│   ├── jwt.ts                     ← signToken / verifyToken (jose)
│   ├── password.js                ← hashPassword / verifyPassword (bcryptjs)
│   ├── email.js                   ← sendEmail (Nodemailer + SMTP)
│   ├── notificaciones.js          ← createNotificacion
│   ├── alertas.js                 ← lógica de alertas programadas
│   ├── webhooks.js                ← dispatchWebhook (HMAC-SHA256)
│   ├── slugify.js                 ← slugify(text)
│   └── robots-checker.ts         ← isAllowed(url) con robots-parser
│
├── prisma/                        ← Prisma: schema, migraciones, seed
│   ├── schema.prisma              ← Fuente única de verdad del modelo de datos
│   ├── migrations/                ← Historial de migraciones (no editar manualmente)
│   └── seed-catalogo.js           ← Seed de categorías, roles e instituciones demo
│
├── scripts/                       ← Scripts de utilidad fuera del runtime de Next.js
│   └── load-test.js               ← Test de carga con k6 (500 usuarios, p95 < 2s)
│
├── __tests__/                     ← Pruebas unitarias
│   └── password.test.ts           ← Tests de hash/verify de contraseñas
│
├── public/                        ← Assets estáticos servidos por Next.js
│   ├── openapi.json               ← Especificación OpenAPI de la API REST
│   └── evaluacion-instrucciones.html ← HTML estático de instrucciones de evaluación
│
├── cursos/                        ← Archivos de cursos locales (SCORM extraídos, recursos)
│
├── docs/                          ← Sitio de documentación (Astro Starlight) ← ESTE SITIO
│
├── .github/                       ← GitHub Actions CI/CD
│   └── workflows/
│       └── ci-cd.yml              ← Pipeline: lint → test → build → deploy staging/prod
│
├── .claude/                       ← Configuración de Claude Code (agente IA)
├── .prettierrc                    ← Configuración Prettier
├── eslint.config.mjs              ← Configuración ESLint
├── next.config.ts                 ← Configuración Next.js (headers seg., output, etc.)
├── prisma.config.ts               ← Configuración adicional Prisma
├── postcss.config.mjs             ← PostCSS para Tailwind CSS 4
├── tsconfig.json                  ← TypeScript (strict, paths @/)
├── package.json                   ← Dependencias y scripts
├── pnpm-lock.yaml                 ← Lockfile pnpm
└── .gitignore
```

---

## Convenciones de nombres

### Archivos y carpetas

| Tipo | Convención | Ejemplo |
|---|---|---|
| Páginas Next.js | `page.tsx` | `app/catalogo/page.tsx` |
| Layouts | `layout.tsx` | `app/dashboard/layout.tsx` |
| API Routes | `route.ts` | `app/api/cursos/route.ts` |
| Componentes React | PascalCase | `CursoCard.tsx` |
| Utilidades / lib | camelCase | `lib/jwt.ts` |
| Carpetas de rutas | kebab-case | `app/crear-curso/` |
| Carpetas de componentes | kebab-case | `components/curso-card/` |
| Modelos Prisma | PascalCase | `Usuario`, `Inscripcion` |
| Variables de entorno | SCREAMING_SNAKE_CASE | `DATABASE_URL`, `JWT_SECRET` |

### Rutas API

```
/api/{dominio}/               ← recurso colección (GET lista, POST crear)
/api/{dominio}/[id]/          ← recurso individual (GET, PUT, DELETE)
/api/{dominio}/[id]/accion    ← acción específica (POST /revocar, POST /enviar)
/api/admin/{dominio}/         ← rutas solo accesibles por admin
```

---

## Dónde va cada tipo de archivo

| Si necesitas... | Va en... |
|---|---|
| Una nueva página | `app/<ruta>/page.tsx` |
| Un nuevo endpoint | `app/api/<dominio>/route.ts` |
| Lógica reutilizable sin UI | `lib/<nombre>.ts` |
| Un componente React reutilizable | `components/<dominio>/<Nombre>.tsx` |
| Un nuevo modelo de BD | `prisma/schema.prisma` → `prisma generate` |
| Una migración de BD | `npx prisma migrate dev --name <descripcion>` |
| Un script de utilidad (no runtime) | `scripts/<nombre>.ts` |
| Un test | `__tests__/<nombre>.test.ts` |
| Un asset estático | `public/<nombre>` |
| Configuración de build | `next.config.ts` o `tsconfig.json` |
