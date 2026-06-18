---
title: Stack Tecnológico
description: Frontend, backend, base de datos y servicios externos de SaberHub con justificación de cada elección.
---

## Frontend

### Next.js 16.2.6 (App Router)

**Rol:** Framework principal — enrutamiento, SSR, RSC, middleware, API routes.

**Por qué:** App Router permite mezclar Server Components (sin JS en cliente) con Client Components solo donde hace falta interactividad. El routing por carpetas elimina configuración manual. La co-ubicación de API routes en el mismo proyecto simplifica el desarrollo y despliegue.

**Configuración relevante:**
- `output: 'standalone'` en `next.config.ts` para despliegue en contenedor.
- Headers de seguridad (HSTS, CSP, X-Frame-Options) configurados en `next.config.ts`.
- Directorio de salida del cliente Prisma: `app/generated/prisma/` (no `node_modules/@prisma/client`).

---

### React 19.2.4

**Rol:** Librería de UI para componentes interactivos.

**Por qué:** Requerido por Next.js 16. React 19 introduce mejoras en el modelo de concurrencia y acciones de formulario. No se usan Server Actions (ver ADR-003).

---

### TypeScript 5.9.3

**Rol:** Tipado estático en todo el proyecto (front, back, lib/).

**Por qué:** El esquema Prisma genera tipos TypeScript automáticamente para todos los modelos. Esto garantiza que los tipos de BD coincidan con los contratos de los API routes sin declaración manual. Atrapa errores de integración en tiempo de compilación.

**Configuración:** `tsconfig.json` con `strict: true`, paths alias `@/` apuntando a la raíz.

---

### Tailwind CSS 4

**Rol:** Framework de estilos utility-first.

**Por qué:** Tailwind 4 elimina el archivo `tailwind.config.js` y usa detección automática de clases. Genera CSS mínimo en build (solo clases usadas). Coherente con el ecosistema Next.js moderno.

**Nota:** No se usa shadcn/ui como dependencia de paquete. Los componentes reutilizables se construyen manualmente con Tailwind + Lucide React para mantener control total sobre estilos y evitar overhead de una librería completa.

---

### Lucide React 1.16+

**Rol:** Iconografía consistente en toda la UI.

**Por qué:** Íconos SVG tree-shakeable; solo se importa lo que se usa. API simple (`<Icon size={20} />`).

---

### @dnd-kit 6.3.1

**Rol:** Drag & drop para reordenar módulos y lecciones en el editor de cursos.

**Por qué:** Accesible por defecto (keyboard navigation), sin dependencias de DOM nativas, funciona en SSR. Alternativa más ligera que `react-beautiful-dnd` (no mantenido).

---

## Backend

### Next.js Route Handlers (API Routes)

**Rol:** 78 endpoints REST organizados en `app/api/`.

**Por qué:** Ver [ADR-003](/02-architecture/decisions/adr-003-api-routes-vs-server-actions). Co-ubicados con el frontend, misma instancia de despliegue, tipado compartido.

**Patrón:**
```ts
// app/api/cursos/route.ts
export async function GET(req: Request) { ... }
export async function POST(req: Request) { ... }
```

---

### Prisma ORM 7.8.0

**Rol:** Capa de acceso a datos. ORM con schema declarativo y cliente tipado.

**Por qué:** Ver [ADR-004](/02-architecture/decisions/adr-004-prisma-postgresql). El cliente se genera en `app/generated/prisma/` y se importa como:

```ts
import { prisma } from '@/lib/prisma';
```

`lib/prisma.ts` implementa el patrón singleton para evitar múltiples instancias en desarrollo con HMR.

---

### jose 6.2.3

**Rol:** Firma y verificación de JWT en Edge-compatible (Web Crypto API).

**Por qué:** `jsonwebtoken` usa APIs de Node.js no disponibles en Edge. `jose` usa Web Crypto y funciona en cualquier runtime. Ver [ADR-002](/02-architecture/decisions/adr-002-jwt-sin-nextauth).

```ts
// TTL: 7 días · Algoritmo: HS256
const token = await signJWT({ userId, rol }, JWT_SECRET);
```

---

### bcryptjs 3.0.3

**Rol:** Hash de contraseñas en registro y comparación en login.

**Por qué:** Implementación pura en JS (sin binarios nativos); compatible con cualquier entorno de despliegue. Cost factor 10 (balance seguridad/rendimiento: ~100ms por hash en hardware moderno).

---

### Nodemailer 8.0.7

**Rol:** Envío de emails transaccionales vía SMTP.

**Por qué:** Sin dependencia de servicio externo de pago para MVP. Configurado con Gmail SMTP (App Password). `SMTP_BLOCK_DEMO_EMAILS=true` previene rebotes en desarrollo. `SMTP_REDIRECT_TARGET` redirige todos los emails a una dirección de prueba.

---

### Puppeteer 24.0.0

**Rol:** Scraping de cursos externos (SENA Sofia Plus, Coursera).

**Por qué:** Necesario para páginas con JavaScript dinámico que no pueden scrapearse con `fetch` + HTML parser. `robots-parser` garantiza cumplimiento de `robots.txt` antes de cada petición.

---

## Base de datos

### PostgreSQL 16+

**Rol:** Base de datos relacional principal. 47 tablas, relaciones complejas, ACID.

**Por qué:** Ver [ADR-004](/02-architecture/decisions/adr-004-prisma-postgresql).

**Driver:** `pg` 8.20 con `@prisma/adapter-pg` 7.8 (adapter oficial Prisma para el driver nativo pg).

**Características usadas:**
- Transacciones en operaciones críticas (emisión de certificado, inscripción).
- JSON nativo en `cmi_data` (SCORM) y `datos_antes`/`datos_despues` (auditoría).
- `timestamp` con timezone en todos los modelos (`createdAt`, `updatedAt`).

---

## Servicios externos

### Cloudinary 2.10.0

**Rol:** CDN para imágenes de cursos, videos HLS, archivos de grupos y recursos de lecciones.

**Por qué:** Sin infraestructura propia de storage. Transformaciones on-the-fly (resize, crop, quality). HLS adaptativo para videos según ancho de banda.

**Integración:** `CLOUDINARY_URL` como variable de entorno. SDK oficial para carga desde servidor.

---

### Gmail SMTP (via Nodemailer)

**Rol:** Emails transaccionales: verificación, reset, notificaciones de inscripción/certificado/evaluación.

**Por qué:** Gratuito para volúmenes de MVP. Migración a Resend o SendGrid planificada para Fase 2 sin cambios en la interfaz de `lib/email.js`.

---

### Google OAuth 2.0

**Rol:** SSO para login/registro sin contraseña.

**Por qué:** Reduce fricción en el onboarding. Ampliamente conocido en el público objetivo colombiano. Implementado manualmente (ver ADR-002) sin librerías de OAuth de terceros.

---

## Librerías de utilidad

| Librería | Versión | Uso |
|---|---|---|
| pdf-lib | 1.17.1 | Generación de PDFs de certificados sin deps nativas |
| xlsx (SheetJS) | 0.18.5 | Exportación de reportes a Excel |
| adm-zip | 0.5.17 | Extracción de paquetes SCORM (ZIP) |
| dotenv | 17.4.2 | Variables de entorno en scripts y seed |
| robots-parser | 3.0.1 | Cumplimiento de robots.txt en scraper |
