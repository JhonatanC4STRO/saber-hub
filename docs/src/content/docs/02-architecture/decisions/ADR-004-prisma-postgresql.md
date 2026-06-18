---
title: "ADR-004: Prisma + PostgreSQL"
description: Decisión de usar Prisma ORM sobre PostgreSQL como capa de datos de SaberHub.
---

## Contexto

SaberHub requiere:
- 47 modelos con relaciones complejas (muchos-a-muchos, jerarquías, auto-referencias).
- Tipos TypeScript que coincidan con los modelos de BD sin declaración manual.
- Transacciones ACID para operaciones críticas (inscripción, certificación).
- JSON nativo para datos semiestructurados (SCORM CMI, auditoría).
- Migrations reproducibles en CI/CD.
- Compatibilidad con entornos de despliegue gestionados (Neon, Supabase, Railway, Vercel Postgres).

---

## Decisión

Usar **Prisma ORM 7.8** con **PostgreSQL 16** como base de datos principal.

Driver: `pg` 8.20 con `@prisma/adapter-pg` (adapter oficial Prisma para el driver nativo de Node.js).

Cliente generado en: `app/generated/prisma/` (no en `node_modules/@prisma/client`).

---

## Alternativas consideradas

### Drizzle ORM

**Ventajas:**
- Más ligero; SQL más explícito; mejor rendimiento en operaciones simples.
- Sin paso de generación de cliente.

**Descartado:**
- Menos maduro en migraciones complejas con relaciones profundas.
- El schema de SaberHub (47 modelos, 15+ enums) se beneficia del lenguaje declarativo de Prisma Schema Language.
- La generación de tipos automáticos de Prisma elimina tipos duplicados entre schema y TypeScript.

### Kyseloy / raw `pg`

**Ventajas:**
- Control total de SQL; sin overhead de ORM.

**Descartado:**
- 47 modelos con relaciones necesitan un sistema de migrations; gestionar SQL raw escala mal.
- Sin tipos automáticos: riesgo de divergencia entre schema y código TypeScript.

### MongoDB + Mongoose

**Ventajas:**
- Flexible para estructuras variables.

**Descartado:**
- SaberHub tiene un dominio fuertemente relacional (Inscripcion → Usuario + Curso + Grupo; Intento → Evaluacion + IntentoExamen + RespuestaAprendiz).
- Las relaciones muchos-a-muchos con datos adicionales (ej. `MiembroGrupo` con rol y fecha) son naturales en SQL e incómodas en documentos.
- Transacciones ACID menos robustas en MongoDB sin configuración adicional.

### SQLite (para desarrollo)

- Usado solo en pruebas locales ligeras; no en producción por limitaciones de concurrencia.

---

## Consecuencias

**Positivas:**
- `prisma.schema` es la fuente única de verdad: modelos, relaciones, enums y validaciones en un solo lugar.
- `prisma generate` produce tipos TypeScript exactos para cada modelo; el compilador detecta campos incorrectos en queries.
- `prisma db push` para desarrollo rápido; `prisma migrate dev` para producción con historial de migraciones.
- `prisma studio` permite inspeccionar datos en desarrollo sin acceso directo a BD.
- Compatibilidad con providers cloud: Neon (serverless), Supabase, Railway, Vercel Postgres.

**Negativas / tradeoffs:**
- `prisma generate` debe ejecutarse tras cada cambio de schema; fácil de olvidar.
- Cliente generado en `app/generated/prisma/` requiere import path específico; no se puede usar `@prisma/client` directamente.
- Prisma 7.x tiene cambios de API respecto a v5/v6; actualizar requiere revisar deprecaciones.
- Queries muy complejas (reportes con múltiples joins y agregaciones) a veces son más claras en SQL raw (`prisma.$queryRaw`).

**Patrón singleton (lib/prisma.ts):**

```ts
import { PrismaClient } from '@/app/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

El singleton evita múltiples instancias de `PrismaClient` durante HMR en desarrollo.
