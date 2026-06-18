---
title: Guía de Inicio para Desarrolladores
description: Aprende a clonar, configurar e iniciar SaberHub en tu entorno local paso a paso.
---

Esta guía te llevará desde cero hasta tener SaberHub corriendo en tu entorno local en pocos minutos.

## Requisitos Previos

Antes de clonar el repositorio, asegúrate de tener instalado:

| Herramienta | Versión mínima | Verificar con |
|---|---|---|
| **Node.js** | `>= 18.x` | `node --version` |
| **pnpm** | `>= 8.x` | `pnpm --version` |
| **PostgreSQL** | `>= 14.x` | `psql --version` |
| **Git** | cualquier versión reciente | `git --version` |

:::tip[¿No tienes pnpm?]
Instálalo globalmente con npm:
```bash
npm install -g pnpm
```
:::

---

## Paso 1 — Clonar el Repositorio

El proyecto está organizado como un monorepo. Clona el repositorio raíz:

```bash
git clone https://github.com/tu-org/lms-saberHub.git
cd lms-saberHub/LMS/saberhub
```

:::note
La carpeta `saberhub/` contiene la aplicación Next.js principal. La carpeta `docs/` que estás leyendo ahora es el sitio Starlight que vive junto a ella en el monorepo.
:::

---

## Paso 2 — Instalar Dependencias

Desde la carpeta `saberhub/`, instala todas las dependencias del proyecto usando el lockfile bloqueado:

```bash
pnpm install
```

Esto instalará todas las dependencias listadas en `package.json`, incluyendo:
- **Next.js 16**, **React 19** y **Tailwind CSS 4**
- **Prisma 7** con su adaptador para PostgreSQL
- Librerías de exportación como `pdf-lib` y `xlsx`
- Herramientas de desarrollo: TypeScript, ESLint y Prettier

---

## Paso 3 — Configurar Variables de Entorno

Crea un archivo `.env` en la raíz de `saberhub/` basado en el siguiente template:

```bash
# ─── Base de Datos ────────────────────────────────────────────
# Cadena de conexión a tu instancia local de PostgreSQL
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/saberhub"

# ─── Seguridad JWT ────────────────────────────────────────────
# Clave secreta para firmar los tokens. Debe tener mínimo 32 caracteres.
JWT_SECRET="reemplaza_esto_con_una_clave_segura_de_al_menos_32_chars"

# ─── Email (Nodemailer + Gmail SMTP) ─────────────────────────
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="tu_correo@gmail.com"
SMTP_PASS="tu_contraseña_de_aplicacion_google"
SMTP_FROM="SaberHub <tu_correo@gmail.com>"

# ─── Google OAuth 2.0 (SSO) ──────────────────────────────────
CLIENT_ID="tu_google_client_id.apps.googleusercontent.com"
CLIENT_SECRET="tu_google_client_secret"

# ─── Cloudinary (CDN de imágenes y videos) ───────────────────
CLOUDINARY_CLOUD_NAME="tu_cloud_name"
CLOUDINARY_API_KEY="tu_api_key"
CLOUDINARY_API_SECRET="tu_api_secret"
```

:::caution[Nunca subas el archivo .env]
El archivo `.env` está incluido en `.gitignore`. Nunca lo publiques en el repositorio. Comparte las variables de entorno de forma segura con tu equipo usando un gestor de secretos (1Password, Doppler, etc.).
:::

### Obtener credenciales de Google OAuth

1. Ve a la [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un proyecto o selecciona uno existente.
3. Navega a **APIs & Services → Credenciales**.
4. Crea una credencial de tipo **"ID de cliente de OAuth 2.0"** para aplicación web.
5. Agrega `http://localhost:3000` como origen autorizado.
6. Agrega `http://localhost:3000/api/auth/google/callback` como URI de redirección autorizada.

---

## Paso 4 — Configurar la Base de Datos

### 4.1 Crear la base de datos PostgreSQL

Conéctate a PostgreSQL y crea la base de datos:

```sql
CREATE DATABASE saberhub;
```

O desde la terminal:

```bash
createdb saberhub
```

### 4.2 Sincronizar el esquema con Prisma

Aplica el esquema de Prisma a tu base de datos local. Esto creará todas las tablas definidas en `prisma/schema.prisma`:

```bash
npx prisma db push
```

### 4.3 Generar el cliente de Prisma

El cliente de Prisma se genera en `app/generated/prisma/`. Regenera después de cualquier cambio en el esquema:

```bash
npx prisma generate
```

:::note[Sobre el generador]
El proyecto usa `provider = "prisma-client"` con output hacia `app/generated/prisma`. Asegúrate de no usar el cliente global de `@prisma/client` — importa siempre desde `@/app/generated/prisma`.
:::

### 4.4 (Opcional) Ejecutar el Seeder del Catálogo

Para poblar la base de datos con datos de ejemplo (categorías, roles, instituciones demo):

```bash
node prisma/seed-catalogo.js
```

---

## Paso 5 — Iniciar el Servidor de Desarrollo

```bash
pnpm dev
```

El servidor arrancará en modo de desarrollo con HMR (Hot Module Replacement) habilitado. Abre tu navegador en:

```
http://localhost:3000
```

Deberías ver la página de inicio de SaberHub.

---

## Comandos Útiles

| Comando | Descripción |
|---|---|
| `pnpm dev` | Inicia el servidor de desarrollo con HMR |
| `pnpm build` | Construye la aplicación para producción |
| `pnpm start` | Sirve la build de producción |
| `pnpm lint` | Ejecuta ESLint en todo el proyecto |
| `pnpm run format` | Formatea el código con Prettier |
| `pnpm run test` | Corre el suite de pruebas unitarias |
| `npx prisma studio` | Abre el explorador visual de la BD |
| `npx prisma db push` | Sincroniza el esquema con la BD |
| `npx prisma generate` | Regenera el cliente de Prisma |

---

## Pruebas

### Pruebas Unitarias

El proyecto incluye pruebas nativas en `__tests__/` con cobertura sobre la validación de contraseñas y lógica de seguridad:

```bash
pnpm run test
```

### Pruebas de Carga (k6)

Hay un script de simulación de estrés en `scripts/load-test.js` que modela 500 usuarios concurrentes con umbral de respuesta p95 < 2s:

```bash
# Primero instala k6: https://k6.io/docs/get-started/installation/
k6 run scripts/load-test.js
```

---

## Estructura del Proyecto (vista rápida)

```
saberhub/
├── app/                    # Next.js App Router (páginas y API routes)
│   ├── (auth)/             # Rutas de autenticación (login, registro)
│   ├── api/                # 20+ grupos de endpoints REST
│   ├── dashboard/          # Panel principal (cursos, grupos, reportes...)
│   └── catalogo/           # Catálogo público de cursos
├── components/             # Componentes React reutilizables
├── lib/                    # Utilidades: jwt, prisma, email, alertas...
├── prisma/                 # Esquema, migraciones y seeders
├── docs/                   # Sitio de documentación Starlight (este sitio)
└── public/                 # Assets estáticos
```

:::tip[¿Quieres conocer la arquitectura completa?]
Consulta la [página de Arquitectura](/02-architecture/arquitectura/) para ver el diagrama de flujo del sistema, los patrones de seguridad y el diseño de la base de datos.
:::

---

## CI/CD con GitHub Actions

El repositorio incluye un pipeline en `.github/workflows/ci-cd.yml` que en cada push:

1. ✅ Instala dependencias con caché de `pnpm`
2. ✅ Ejecuta ESLint y pruebas unitarias
3. ✅ Valida la build de producción de Next.js
4. 🚀 Despliega automáticamente a **staging** en merges a `main`
5. 🔒 Requiere **aprobación manual** antes de desplegar a producción
