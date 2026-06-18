---
title: Requerimientos No Funcionales
description: Rendimiento, seguridad, escalabilidad, accesibilidad y compatibilidad de SaberHub.
---

## Rendimiento

| RNF | Descripción | Valor objetivo |
|---|---|---|
| RNF-P01 | Tiempo de respuesta API (p95) bajo carga normal | < 500 ms |
| RNF-P02 | Tiempo de respuesta API (p95) bajo carga alta (500 usuarios concurrentes) | < 2 s |
| RNF-P03 | Tiempo de carga inicial de página (LCP) | < 2.5 s |
| RNF-P04 | Heartbeat de progreso (ping asíncrono) | Cada 15 s, sin bloquear UI |
| RNF-P05 | Generación de PDF de certificado | < 3 s |
| RNF-P06 | Exportación a Excel (hasta 5 000 registros) | < 5 s |
| RNF-P07 | Carga de paquete SCORM (hasta 100 MB) | Progreso visible, sin timeout |

**Prueba de referencia:** `scripts/load-test.js` (k6) simula 500 usuarios concurrentes con umbral p95 < 2 s.

---

## Seguridad

| RNF | Descripción | Implementación actual |
|---|---|---|
| RNF-S01 | Autenticación sin estado, resistente a XSS | JWT en cookie HttpOnly; no localStorage |
| RNF-S02 | Protección contra fuerza bruta | Bloqueo de cuenta 15 min tras 5 intentos fallidos (`bloqueadoHasta`) |
| RNF-S03 | Transmisión cifrada | HSTS forzado (max-age 2 años, includeSubDomains, preload) |
| RNF-S04 | Restricción de fuentes de contenido | CSP: self + googleapis, gstatic, unsplash, cloudinary, YouTube, Vimeo |
| RNF-S05 | Prevención de clickjacking | `X-Frame-Options: DENY` |
| RNF-S06 | Prevención de MIME sniffing | `X-Content-Type-Options: nosniff` |
| RNF-S07 | Control de información de referencia | `Referrer-Policy: strict-origin-when-cross-origin` |
| RNF-S08 | Hash seguro de contraseñas | bcryptjs (cost factor 10) |
| RNF-S09 | Verificación de webhooks | Firma HMAC-SHA256 en cada payload |
| RNF-S10 | Tokens de un solo uso | Password reset (1 h) y verificación email (24 h) con hash almacenado |
| RNF-S11 | Auditoría de acciones | Log inmutable con datos antes/después, IP y timestamp |
| RNF-S12 | Validación de scraper | Cumplimiento de `robots.txt` con robots-parser antes de cada petición |
| RNF-S13 | Secretos fuera del código | Variables de entorno obligatorias; `.env` en `.gitignore` |
| RNF-S14 | TTL de sesión | JWT válido 7 días; cookie maxAge 30 min (renovable con actividad) |

---

## Escalabilidad

| RNF | Descripción | Estrategia |
|---|---|---|
| RNF-E01 | Arquitectura sin estado | JWT permite escalar horizontalmente sin sesiones en memoria |
| RNF-E02 | Conexiones a BD | Prisma con pool de conexiones vía `adapter-pg`; compatible con PgBouncer |
| RNF-E03 | Almacenamiento de archivos | Cloudinary CDN; sin almacenamiento local en servidor |
| RNF-E04 | Paquetes SCORM | Extracción y servicio desde almacenamiento externo |
| RNF-E05 | Notificaciones | Cola asíncrona mediante webhooks y emails; sin WebSocket |
| RNF-E06 | Capacidad objetivo MVP | 10 000 usuarios activos / mes; 500 concurrentes |

---

## Accesibilidad (WCAG)

| RNF | Descripción | Nivel objetivo |
|---|---|---|
| RNF-AC01 | Contraste de color texto/fondo | WCAG 2.1 AA (ratio ≥ 4.5:1 texto normal) |
| RNF-AC02 | Navegación por teclado | Todos los controles accesibles sin ratón |
| RNF-AC03 | Etiquetas ARIA en formularios | `aria-label`, `aria-describedby` en campos críticos |
| RNF-AC04 | Textos alternativos en imágenes | `alt` descriptivo en todas las imágenes de contenido |
| RNF-AC05 | Estructura semántica de encabezados | Jerarquía correcta `h1 → h2 → h3` en cada página |
| RNF-AC06 | Feedback de errores de formulario | Mensajes de error asociados al campo por `aria-describedby` |
| RNF-AC07 | Compatibilidad con lectores de pantalla | Prueba con NVDA + Chrome y VoiceOver + Safari |

---

## Disponibilidad y SLA

| RNF | Descripción | Valor objetivo |
|---|---|---|
| RNF-D01 | Disponibilidad mensual | ≥ 99.5 % (downtime máx ~3.6 h/mes) |
| RNF-D02 | Ventana de mantenimiento | Domingos 02:00–04:00 UTC con aviso previo de 48 h |
| RNF-D03 | Tiempo de recuperación ante fallo (RTO) | < 1 h |
| RNF-D04 | Punto de recuperación ante fallo (RPO) | < 24 h (backup diario de BD) |
| RNF-D05 | Alertas de disponibilidad | Monitoreo externo con notificación al equipo en < 5 min |

---

## Compatibilidad

### Navegadores (escritorio)

| Navegador | Versión mínima |
|---|---|
| Google Chrome | 110+ |
| Mozilla Firefox | 110+ |
| Microsoft Edge | 110+ |
| Safari | 16+ |

### Dispositivos y resoluciones

| Tipo | Resolución mínima | Soporte |
|---|---|---|
| Escritorio | 1280 × 720 | Completo |
| Tablet | 768 × 1024 | Completo (responsive) |
| Móvil | 375 × 667 | Lectura y navegación básica (App móvil en Fase 2) |

### Conectividad

| RNF | Descripción |
|---|---|
| RNF-CO01 | Interfaz funcional con conexión de 5 Mbps o superior |
| RNF-CO02 | Videos HLS en Cloudinary con calidad adaptativa según ancho de banda |

---

## Internacionalización

| RNF | Descripción | Estado |
|---|---|---|
| RNF-I18N01 | Idioma principal de la plataforma | Español (es-CO) |
| RNF-I18N02 | Zona horaria de referencia | America/Bogota (UTC-5) |
| RNF-I18N03 | Formato de fechas | DD/MM/YYYY HH:mm |
| RNF-I18N04 | Soporte multiidioma futuro | Arquitectura preparada (Next.js i18n); inglés en Fase 3 |
| RNF-I18N05 | Moneda | No aplica (plataforma gratuita en MVP) |
