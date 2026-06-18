---
title: Datos Semilla
description: Qué datos iniciales se cargan, cómo ejecutar el seed y datos de prueba para desarrollo.
---

## Qué datos carga el seed

El archivo `prisma/seed-catalogo.js` puebla la BD con datos de demostración estructurados en 3 bloques:

### 1. Categorías (8)

Upsert por `nombre` — seguro de ejecutar múltiples veces.

| Nombre | Descripción |
|---|---|
| Ciberseguridad | Seguridad informática, hacking ético y protección de datos. |
| Programación | Desarrollo de software, lenguajes y frameworks. |
| Inteligencia Artificial | Machine learning, deep learning y aplicaciones de IA. |
| Redes | Infraestructura de redes, protocolos y administración de sistemas. |
| Datos y Analítica | Análisis de datos, Business Intelligence y visualización. |
| Marketing Digital | Estrategias digitales, SEO, SEM y redes sociales. |
| Diseño Digital | Diseño UX/UI, gráfico y experiencia de usuario. |
| Habilidades Profesionales | Liderazgo, comunicación efectiva y desarrollo profesional. |

### 2. Instituciones (4)

Create — solo ejecutar una vez o vaciar la tabla antes de re-seed.

| Nombre | Slug | URL |
|---|---|---|
| SENA | `sena` | https://www.sena.edu.co |
| MinTIC | `mintic` | https://www.mintic.gov.co |
| Universidad Nacional de Colombia | `universidad-nacional` | https://unal.edu.co |
| SABERHUB Academy | `saberhub-academy` | https://saberhub.academy |

### 3. Cursos con módulos y lecciones (9 cursos, 23 módulos, 58 lecciones)

Todos en estado `publicado`. Asignados al instructor con ID fijo:

```
INSTRUCTOR_ID = 'cmpaeu2js000268uqi6coyput'
```

> **Importante:** Este ID debe existir en la tabla `usuarios` antes de correr el seed.

| # | Título | Institución | Categoría | Cert. |
|---|---|---|---|---|
| 1 | Introducción a la Ciberseguridad | MinTIC | Ciberseguridad | ✅ |
| 2 | Introducción a la IA Moderna | SENA | IA | ✅ |
| 3 | Fundamentos de Redes | SABERHUB Academy | Redes | ❌ |
| 4 | Programación en Python desde Cero | SENA | Programación | ✅ |
| 5 | Análisis de Datos con Excel y SQL | UNAL | Datos y Analítica | ✅ |
| 6 | Marketing Digital para Emprendedores | MinTIC | Marketing Digital | ❌ |
| 7 | Diseño de Experiencia de Usuario (UX/UI) | SABERHUB Academy | Diseño Digital | ✅ |
| 8 | Habilidades Blandas para el Éxito Profesional | UNAL | Habilidades Profesionales | ❌ |
| 9 | Ciberseguridad Avanzada en la Nube | MinTIC | Ciberseguridad | ✅ |

---

## Cómo ejecutar el seed

### Prerrequisitos

1. BD configurada y accesible (`DATABASE_URL` en `.env`).
2. Migraciones aplicadas: `npx prisma migrate deploy` o `npx prisma db push`.
3. Cliente Prisma generado: `npx prisma generate`.
4. Usuario instructor con ID `cmpaeu2js000268uqi6coyput` existente en BD, o cambiar el `INSTRUCTOR_ID` en `prisma/seed-catalogo.js` al ID de un instructor real.

### Ejecución

```bash
# Desde la carpeta saberhub/
node prisma/seed-catalogo.js
```

Salida esperada:

```
🌱 Iniciando seed del catálogo...

  ✅ Categoría: Ciberseguridad (cm...)
  ...
  🏛️  Institución: SENA (cm...)
  ...
  📚 Curso: Introducción a la Ciberseguridad
     📦 Módulo 1: Fundamentos de Seguridad
        📄 Lección 1: ¿Qué es la Ciberseguridad?
  ...

=======================================================
  🎉 Seed del catálogo completado exitosamente
=======================================================
  📂 Categorías:    8 (upsert)
  🏛️  Instituciones: 4 (creadas)
  📚 Cursos:        9
  📦 Módulos:       23
  📄 Lecciones:     58
=======================================================
```

### Script add-slugs

`prisma/add-slugs.js` agrega slugs a instituciones existentes si fueron creadas sin slug.

```bash
node prisma/add-slugs.js
```

---

## Datos de prueba para desarrollo

Para desarrollo completo necesitas además:

### Crear usuarios de prueba manualmente

Recomendado: usar `POST /api/auth/register` + verificar con `POST /api/auth/verify`.

| Rol | Sugerencia |
|---|---|
| Admin | Crear via `POST /api/admin/crear-usuario` con rol admin |
| Instructor | Registrarse + solicitar instructor + aprobar como admin; o insertar directo en BD |
| Estudiante | Registrarse normalmente desde `/registro` |

### Inscribir al estudiante de prueba

```bash
# POST /api/inscripciones con body:
{ "cursoId": "<id-de-cualquier-curso-publicado>" }
```

### Hacer progreso

```bash
# POST /api/progreso/leccion
{ "leccionId": "<id>", "completada": true }
```

### Verificar seed con Prisma Studio

```bash
npx prisma studio
# http://localhost:5555 → tablas categorias, instituciones, cursos
```
