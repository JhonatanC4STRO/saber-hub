---
title: "ADR-003: API Routes vs Server Actions"
description: Decisión de usar API Routes REST en lugar de Server Actions para la lógica de negocio de SaberHub.
---

## Contexto

Next.js App Router ofrece dos mecanismos para ejecutar código de servidor desde el cliente:

1. **API Routes** (`app/api/**/route.ts`): endpoints HTTP explícitos con URL, método y respuesta JSON.
2. **Server Actions** (`'use server'`): funciones de servidor llamadas directamente desde componentes, sin URL expuesta.

SaberHub tiene 78 endpoints que cubren: auth, cursos, evaluaciones, inscripciones, certificados, grupos, instituciones, scraping, webhooks, reportes, y más.

---

## Decisión

Usar **API Routes REST** para toda la lógica de negocio.

---

## Alternativas consideradas

### Server Actions

**Ventajas de Server Actions:**
- No requieren `fetch` manual; se llaman como funciones async.
- Tipado end-to-end sin definir contratos JSON.
- Revalidación de cache automática con `revalidatePath` / `revalidateTag`.
- Menos código boilerplate para formularios simples.

**Por qué se descartaron:**

1. **Consumo externo:** Los webhooks, la app móvil futura (Fase 2) y las integraciones institucionales necesitan endpoints HTTP estables con URL fija. Las Server Actions no son consumibles desde fuera de Next.js.

2. **Documentación de API:** Se genera un `openapi.json` (`public/openapi.json`) para la API pública. Las Server Actions no tienen URL documentable.

3. **Testing:** Los API Routes se prueban con `fetch` estándar o herramientas como Thunder Client / Postman. Las Server Actions requieren un harness de test diferente.

4. **Granularidad de autorización:** Los API Routes verifican el JWT explícitamente al inicio de cada handler. La autorización es visible y auditable. En Server Actions, es fácil olvidar la verificación en una función anidada.

5. **Escala y separación futura:** Con 78 endpoints, eventualmente podría extraerse el backend a un servicio separado. API Routes facilitan esa separación; Server Actions están acopladas al frontend Next.js.

---

## Consecuencias

**Positivas:**
- API consumible desde cualquier cliente: web, móvil (Fase 2), integraciones externas.
- `public/openapi.json` documenta todos los endpoints.
- Lógica de autorización uniforme y auditable en cada handler.
- Pruebas de integración simples con fetch estándar.

**Negativas / tradeoffs:**
- Más código boilerplate que Server Actions para operaciones CRUD simples.
- Sin revalidación automática de cache; las páginas deben revalidar manualmente tras mutaciones o usar `router.refresh()`.
- `fetch` desde componentes cliente requiere gestionar estados de carga manualmente (sin el modelo de formulario de Server Actions).

**Patrón estándar de un handler:**

```ts
// app/api/cursos/route.ts
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  // 1. Autenticación
  const token = req.headers.get('cookie')?.match(/token=([^;]+)/)?.[1];
  const payload = await verifyToken(token, process.env.JWT_SECRET!);
  if (!payload) return Response.json({ error: 'No autorizado' }, { status: 401 });

  // 2. Validación del body
  const body = await req.json();
  if (!body.titulo) return Response.json({ error: 'titulo requerido' }, { status: 400 });

  // 3. Lógica de negocio / Prisma
  const curso = await prisma.curso.create({ data: { ...body, instructorId: payload.userId } });

  // 4. Efectos secundarios (notificaciones, webhooks)
  // ...

  return Response.json(curso, { status: 201 });
}
```
