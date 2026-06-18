# 🎓 SABERHUB - Plataforma LMS & Learning Platform

SABERHUB es una plataforma de gestión del aprendizaje (LMS) moderna y de alto rendimiento, diseñada para la educación en línea gratuita y respaldada por las mejores instituciones de Colombia.

Este proyecto está construido sobre el ecosistema **Next.js (App Router)** utilizando TypeScript, Tailwind CSS, Prisma ORM, PostgreSQL y sesiones personalizadas basadas en JWT cookies HttpOnly de alta seguridad.

---

## 🚀 Comenzando (Guía de Desarrollo Local)

Sigue estos pasos para levantar el entorno de desarrollo local en minutos:

### 1. Requisitos Previos

- **Node.js** (versión 18 o superior recomendada)
- **pnpm** (gestor de paquetes recomendado para este repositorio)
- **PostgreSQL** corriendo localmente

### 2. Instalación de Dependencias

Instala los paquetes necesarios definidos en el proyecto de forma limpia y bloqueada:

```bash
pnpm install
```

### 3. Configuración de Variables de Entorno

Crea o edita tu archivo `.env` en la raíz del proyecto agregando las variables de conexión y credenciales de seguridad:

```env
# Base de Datos (PostgreSQL local)
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/saberhub

# Llave secreta del token JWT de la plataforma (mínimo 32 caracteres)
JWT_SECRET=tu_secreto_seguro_para_firmar_cookies_de_sesion

# Configuración SMTP (Gmail + Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=tu_contrasena_de_aplicacion_de_google
SMTP_FROM="SaberHub <tu_correo@gmail.com>"

# Credenciales de Google OAuth 2.0 (SSO)
CLIENT_ID=tu_google_client_id.apps.googleusercontent.com
CLIENT_SECRET=tu_google_client_secret
```

### 4. Sincronización del Esquema y Base de Datos

Actualiza las tablas de PostgreSQL de acuerdo con el esquema actual de Prisma y regenera el cliente local de Prisma:

```bash
npx prisma db push
npx prisma generate
```

### 5. Iniciar Servidor de Desarrollo

Levanta el servidor local con soporte rápido de recarga en caliente:

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la plataforma SaberHub en funcionamiento.

---

## 🛡️ Módulo: Autenticación y Seguridad

SaberHub cuenta con un subsistema robusto de autenticación para mitigar ataques y asegurar las sesiones:

- **Complejidad de Contraseña**: Longitud mínima de 8 caracteres, al menos una mayúscula, una minúscula y un dígito numérico (validado en cliente y servidor).
- **Bloqueo por Fuerza Bruta**: Tras **5 intentos fallidos consecutivos**, la cuenta se bloquea por completo durante **15 minutos** asignando la marca temporal `bloqueadoHasta` en la base de datos.
- **Verificación de Correo**: Los nuevos registros inician con `verificado = false` y reciben un enlace único dinámico válido por 24 horas para activar su cuenta.
- **Recuperación de Contraseña**: Los usuarios pueden solicitar un enlace de restauración de contraseña que genera un token de un solo uso válido por exactamente 1 hora enviado por email.
- **Google Auth (SSO)**: Autenticación oficial e interactiva mediante Google OAuth 2.0. Al autorizar, el sistema registra e inicia sesión automáticamente al alumno con rol de estudiante y verificado por defecto.

---

## 📊 Módulo: Seguimiento y Reportes

Módulo administrativo de alta fidelidad diseñado para monitorear el progreso y la retención del estudiante:

- **Medición del Tiempo Conectado (Heartbeat)**: Un temporizador invisible en el cliente envía pings asíncronos cada 15 segundos al endpoint `/api/progreso/heartbeat` incrementando atómicamente el campo `tiempoConectado` de la inscripción.
- **Último Acceso**: Cada interacción significativa (completar lecciones, enviar respuestas de evaluaciones) actualiza dinámicamente el campo `ultimoAcceso` del alumno en el curso correspondiente.
- **Panel de Reportes (`/dashboard/reportes`)**: Interfaz premium para instructores/admins que muestra listas de alumnos filtrables por **Curso**, **Grupo**, **Rango de Fechas** e **Identificación**.
- **Exportadores de Alto Impacto**:
  - **Excel (.xlsx)**: Genera hojas de cálculo organizadas, tabuladas y autoajustables en ancho de celdas utilizando la librería `xlsx`.
  - **PDF (.pdf)**: Genera folios estructurados con banner institucional, tablas de contraste y algoritmo de paginación fluida mediante la librería `pdf-lib`.

---

## 🧪 Pruebas y Calidad de Código

Mantenemos estándares estrictos de mantenibilidad, formateo y validación de código:

### Formateo y Estilo de Código (Prettier + ESLint)

Para asegurar que todo el código mantenga el mismo estilo uniforme (comillas simples, punto y coma, tabulaciones de 2 espacios), puedes formatear el proyecto completo de forma automatizada:

```bash
pnpm run format
```

### Ejecutar Pruebas Unitarias

El proyecto cuenta con un set de pruebas unitarias nativas extremadamente rápidas y con cobertura completa en las ramificaciones lógicas de la validación de seguridad de contraseñas. Puedes correrlas con:

```bash
pnpm run test
```

### Pruebas de Carga (k6 Concurrencia)

Hemos configurado un script completo de simulación de estrés **[load-test.js](file:///c:/Users/Shonano/Desktop/lms-saberHub-sinIA/LMS/saberhub/scripts/load-test.js)** en la carpeta de scripts para modelar 500 usuarios concurrentes y medir umbrales p95 < 2s de respuesta.

```bash
# Instalar k6 y correr la prueba localmente
k6 run scripts/load-test.js
```

---

## 🤖 Configuración del Pipeline CI/CD

El repositorio cuenta con un flujo automatizado de Integración Continua y Despliegue Continuo (CI/CD) mediante **GitHub Actions** configurado en [.github/workflows/ci-cd.yml](file:///c:/Users/Shonano/Desktop/lms-saberHub-sinIA/LMS/saberhub/.github/workflows/ci-cd.yml):

1. **Integración Continua (En cada Push y PR)**:
   - Realiza el checkout del repositorio.
   - Configura Node.js e instala las dependencias usando la caché inteligente de lockfiles de `pnpm`.
   - Ejecuta el análisis estático de código (`eslint`).
   - Corre el set de pruebas unitarias y de integración.
   - Valida la construcción correcta de producción de Next.js (`npm run build`).
2. **Despliegue Continuo a Staging**:
   - Despliega de forma automatizada en el entorno de pruebas en cada merge exitoso a la rama `staging` o `main`.
3. **Despliegue a Producción (Aprobación Manual)**:
   - Al hacer merge a la rama principal (`main` o `master`), el pipeline se pausa y solicita una **Aprobación Manual** (mediante _GitHub Environments_) antes de desplegar físicamente en producción, garantizando que cada release sea supervisado y controlado.

---

## 📂 Documentación Adicional

- Para consultar diagramas detallados y el diseño de bajo nivel de la arquitectura técnica, consulta [docs/architecture.md](file:///c:/Users/Shonano/Desktop/lms-saberHub-sinIA/LMS/saberhub/docs/architecture.md).
