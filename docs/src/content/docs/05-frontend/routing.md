---
title: Routing y Protección de Rutas
description: Mapa de rutas del App Router, middleware de autenticación y protección por rol.
---

## Estructura del App Router

Next.js 16 App Router. Cada carpeta en `app/` con `page.tsx` / `page.jsx` es una ruta. Los route groups `(auth)` no añaden segmento a la URL.

```
app/
├── layout.tsx                    ← Root layout (fonts, AutoLogout, metadata)
├── page.tsx                      ← / (homepage pública)
├── globals.css
│
├── (auth)/                       ← Route group — no añade segmento URL
│   ├── login/page.jsx
│   ├── registro/page.jsx
│   ├── registro-instructor/page.jsx
│   ├── recuperar-contrasena/page.jsx
│   ├── restablecer-contrasena/page.jsx
│   └── verificar-cuenta/page.jsx
│
├── api/                          ← API Routes (no renderiza UI)
│   ├── admin/
│   ├── auth/
│   ├── banco/
│   ├── certificados/
│   ├── cron/
│   ├── cursos/
│   ├── evaluaciones/
│   ├── grupos/
│   ├── inscripciones/
│   ├── instituciones/
│   ├── intentos/
│   ├── mensajes/
│   ├── notificaciones/
│   ├── progreso/
│   ├── reportes/
│   ├── sesiones/
│   ├── solicitudes-instructor/
│   ├── upload/
│   └── webhooks/
│
├── catalogo/page.tsx
├── certificados/
│   └── verificar/[codigo]/page.tsx
│
├── cursos/
│   └── [id]/page.jsx             ← Visor de curso (auth requerida)
│
├── CrearCursos/                  ← Flujo creación (instructor/admin)
│   ├── page.jsx
│   ├── configuracion/page.jsx
│   ├── evaluaciones/page.jsx
│   ├── leccion/page.jsx
│   ├── modulos/page.jsx
│   └── publicar/page.jsx
│
├── dashboard/
│   ├── page.jsx                  ← Router por rol
│   ├── components/               ← Componentes del dashboard
│   ├── auditoria/page.jsx
│   ├── certificados/page.jsx
│   ├── cursos/
│   │   └── [id]/page.jsx
│   ├── cursos-externos/
│   │   ├── page.jsx
│   │   ├── [id]/page.jsx
│   │   └── logs/page.jsx
│   ├── grupos/page.jsx
│   ├── instituciones/page.jsx
│   ├── mensajes/page.jsx
│   ├── notificaciones/page.jsx
│   ├── reportes/page.jsx
│   ├── rutas/page.jsx
│   ├── solicitud-instructor/page.jsx
│   ├── solicitudes-instructor/page.jsx
│   └── usuarios/page.jsx
│
├── docs/page.jsx
│
├── instituciones/
│   ├── page.jsx
│   ├── [slug]/page.jsx
│   ├── registro/page.jsx
│   ├── [id]/
│   │   ├── configurar/page.jsx
│   │   ├── cursos/page.jsx
│   │   ├── dashboard/page.jsx
│   │   ├── instructores/page.jsx
│   │   └── perfil/page.jsx
│   └── admin/
│       └── configurar/page.jsx
│
├── privacidad/page.jsx
├── scorm/player/page.jsx
└── terminos/page.jsx
```

---

## Middleware de autenticación

Archivo: `middleware.ts` en la raíz del proyecto.

```
Rutas protegidas detectadas:
  /dashboard/*
  /cursos/[id]
  /CrearCursos/*
  /instituciones/*/configurar
  /instituciones/*/dashboard
  /instituciones/*/instructores
  /instituciones/*/perfil
  /instituciones/admin/*
```

El middleware:
1. Lee la cookie `token` (HttpOnly, no accesible desde JS)
2. Verifica el JWT con `jose` (sin llamada a DB)
3. Si inválido o ausente → `redirect('/login?redirect=<ruta-original>)`
4. Si válido → extrae `rol` del payload y verifica permisos por ruta
5. Rutas de admin → `rol === 'admin'`; rutas de instructor → `rol === 'instructor' || 'admin'`

---

## Rutas públicas (sin auth)

| Ruta | Nota |
|---|---|
| `/` | Homepage |
| `/catalogo` | Catálogo de cursos |
| `/cursos/[id]` (detalle, no visor) | Vista previa antes de inscribirse |
| `/instituciones` | Lista |
| `/instituciones/[slug]` | Perfil |
| `/instituciones/registro` | Solicitud de vinculación |
| `/certificados/verificar/[codigo]` | Verificación pública |
| `/(auth)/*` | Login, registro, recuperación |
| `/privacidad`, `/terminos`, `/docs` | Contenido estático |

---

## Rutas protegidas por rol

| Ruta | Roles permitidos |
|---|---|
| `/dashboard` | Todos (contenido varía por rol) |
| `/dashboard/usuarios` | `admin` |
| `/dashboard/solicitudes-instructor` | `admin` |
| `/dashboard/instituciones` | `admin` |
| `/dashboard/cursos-externos/*` | `admin` |
| `/dashboard/auditoria` | `admin` |
| `/dashboard/reportes` | `instructor`, `admin` |
| `/dashboard/cursos` | `instructor`, `admin` |
| `/CrearCursos/*` | `instructor`, `admin` |
| `/dashboard/solicitud-instructor` | `estudiante` |
| `/instituciones/*/configurar` | `admin_inst`, `admin` |
| `/instituciones/admin/*` | `admin` |

---

## Redirecciones

| Condición | Destino |
|---|---|
| Usuario autenticado accede a `/login` | `/dashboard` |
| Usuario no autenticado accede a ruta protegida | `/login?redirect=<ruta>` |
| Rol insuficiente para ruta | `/dashboard` (con mensaje de error) |
| Token expirado (detectado por `AutoLogout.jsx`) | `/login` |
| `GET /` con sesión activa | Permanece en `/` (homepage no redirige) |

---

## Route groups y layouts

| Group | Layout | Propósito |
|---|---|---|
| `(auth)/` | Sin layout extra | Páginas de auth con diseño limpio |
| `app/` (root) | `layout.tsx` + `AutoLogout` | Toda la app |
| `dashboard/` | `layout` del dashboard con Header/Footer admin | Panel protegido |

---

## Rutas de API

Ver sección **04 — API** para la documentación completa de endpoints. Las API routes siguen la misma estructura de carpetas bajo `app/api/`.

Ejemplos:
- `app/api/cursos/route.ts` → `GET /api/cursos`, `POST /api/cursos`
- `app/api/cursos/[id]/route.ts` → `GET /api/cursos/[id]`, `PUT ...`, `DELETE ...`
- `app/api/admin/usuarios/route.ts` → `GET /api/admin/usuarios`
