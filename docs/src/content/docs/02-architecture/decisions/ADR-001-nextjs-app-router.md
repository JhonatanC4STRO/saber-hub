---
title: "ADR-001: Next.js App Router"
description: Decisión de usar Next.js App Router en lugar de Pages Router para SaberHub.
---

## Contexto

SaberHub necesita un framework web que soporte:
- Rutas protegidas con verificación de JWT antes de renderizar.
- API REST con 78 endpoints co-ubicados con el frontend.
- Mezcla de contenido estático (landing, catálogo) y dinámico (dashboard, progreso).
- Despliegue en un solo proceso sin separación frontend/backend.

El proyecto comenzó en 2024 cuando App Router ya era estable (Next.js 13.4+).

---

## Decisión

Usar **Next.js App Router** (Next.js 16.2.6) como framework principal.

---

## Alternativas consideradas

### Pages Router (Next.js clásico)
- Más documentación y ejemplos disponibles.
- `getServerSideProps` / `getStaticProps` conocidos.
- **Descartado:** modelo mental más complejo para mezclar SSR y CSR; no aprovecha Server Components; middleware de autenticación más verboso.

### Remix
- Excelente modelo de carga de datos por ruta.
- **Descartado:** menor adopción en el ecosistema colombiano; menos integraciones de terceros; curva de aprendizaje adicional sin ventaja clara para este caso.

### SvelteKit
- Rendimiento excelente, menos boilerplate.
- **Descartado:** equipo con experiencia en React/TypeScript; cambio de paradigma sin ROI claro en MVP.

---

## Consecuencias

**Positivas:**
- Server Components reducen JS enviado al cliente (catálogo, listados de cursos se renderizan en servidor).
- Middleware en `middleware.ts` verifica JWT antes de renderizar cualquier ruta protegida, sin código duplicado por página.
- API Routes en `app/api/` usan el mismo runtime y tipos que el resto del proyecto.
- Tipos generados por Prisma se comparten entre frontend y backend sin paquetes adicionales.

**Negativas / tradeoffs:**
- App Router tiene convenciones estrictas (`'use client'`, `'use server'`, layouts anidados) que requieren atención constante para no introducir regresiones de hidratación.
- La versión 16.x introduce cambios de API respecto a 14/15; actualizar requiere revisar breaking changes.
- Errores de hidratación son más difíciles de depurar que en Pages Router.

**Deuda técnica conocida:**
- Algunas páginas usan `'use client'` innecesariamente. Candidatas a convertirse en Server Components en refactor futuro.
