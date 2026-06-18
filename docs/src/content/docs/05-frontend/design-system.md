---
title: Design System
description: Paleta de colores, tipografía, espaciado y patrones visuales de SaberHub.
---

## Principios

SaberHub utiliza **Tailwind CSS 4** con configuración `@theme inline` directamente en `globals.css`. No existe `tailwind.config.js` — los tokens se definen como propiedades CSS inline en la directiva `@theme`.

---

## Colores

### Paleta principal

| Token | Hex | Uso |
|---|---|---|
| Primary | `#1E40AF` | Botones primarios, links, foco, acentos |
| Primary Hover | `#1A368F` | Estado hover de botones primarios |
| Dark Navy | `#0F172A` | Fondo hero, footer |
| Slate | `#111827` | Texto principal sobre fondo claro |
| Gray Border | `#E5E7EB` | Bordes de tarjetas, inputs |
| Background Light | `#F9FAFB` | Fondos de secciones alternas |
| White | `#FFFFFF` | Fondo base |

### Colores semánticos

| Estado | Fondo | Texto | Uso |
|---|---|---|---|
| Éxito | `#D1FAE5` | `#065F46` | Badges aprobado, inscripción activa |
| Error | `#FEE2E2` | `#991B1B` | Badges rechazado, error |
| Advertencia | `#FEF3C7` | `#92400E` | Badges pendiente, advertencias |
| Info | `#DBEAFE` | `#1E40AF` | Badges en revisión, info |

### Colores semánticos de acción (directos)

| Nombre | Hex | Uso |
|---|---|---|
| Success | `#10B981` | Íconos de éxito, barra de progreso completada |
| Error | `#EF4444` | Mensajes de error, validaciones |
| Warning | `#F59E0B` | Alertas, notificaciones |

---

## Tipografía

```
Font-sans:  Inter (cargada desde next/font/google)
Font-mono:  Geist Mono (cargada desde next/font/local)
```

| Elemento | Clase Tailwind | Tamaño / Peso |
|---|---|---|
| H1 (hero) | `text-4xl font-bold` | 36px / 700 |
| H2 (sección) | `text-2xl font-semibold` | 24px / 600 |
| H3 (card título) | `text-xl font-semibold` | 20px / 600 |
| Body | `text-base` | 16px / 400 |
| Small / label | `text-sm` | 14px / 400 |
| Código inline | `font-mono text-sm` | Geist Mono 14px |

---

## Variables CSS globales

Definidas en `app/globals.css`:

```css
:root {
  --background: #ffffff;
  --foreground: #171717;
  --font-sans: var(--font-inter);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  --background: #0a0a0a;
  --foreground: #ededed;
}
```

### Estilos de foco (WCAG 2.1 AA)

```css
:focus-visible {
  outline: 3px solid #1e40af;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(30, 64, 175, 0.45);
}
```

---

## Espaciado

Basado en la escala de Tailwind 4 (múltiplos de 4px):

| Token | px | Uso típico |
|---|---|---|
| `p-2` | 8px | Padding de badges, chips |
| `p-4` | 16px | Padding de cards |
| `p-6` | 24px | Padding de secciones |
| `gap-4` | 16px | Gap de grids de tarjetas |
| `gap-6` | 24px | Gap entre secciones |
| `max-w-[1180px]` | 1180px | Ancho máximo de contenido |

---

## Componentes base

### Botón primario

```html
<button class="bg-[#1E40AF] hover:bg-[#1A368F] text-white font-semibold py-2 px-4 rounded-lg transition-colors">
  Acción
</button>
```

### Botón secundario / outline

```html
<button class="border border-[#1E40AF] text-[#1E40AF] hover:bg-blue-50 font-semibold py-2 px-4 rounded-lg transition-colors">
  Cancelar
</button>
```

### Badge de estado

```jsx
// Valores de estado → clase CSS
const badgeStyles = {
  pendiente:          'bg-[#FEF3C7] text-[#92400E]',
  en_revision:        'bg-[#DBEAFE] text-[#1E40AF]',
  aprobado:           'bg-[#D1FAE5] text-[#065F46]',
  aprobada:           'bg-[#D1FAE5] text-[#065F46]',
  rechazado:          'bg-[#FEE2E2] text-[#991B1B]',
  rechazada:          'bg-[#FEE2E2] text-[#991B1B]',
  pendiente_informacion: 'bg-[#FEF3C7] text-[#92400E]',
};
```

```html
<span class="px-2 py-1 rounded-full text-xs font-medium bg-[#D1FAE5] text-[#065F46]">
  Aprobado
</span>
```

### Input de formulario

```html
<input
  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
  placeholder="..."
/>
```

### Tarjeta (Card)

```html
<div class="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
  <!-- contenido -->
</div>
```

---

## Íconos

Librería: **lucide-react 1.16.0**

`components/common/EmojiIcon.jsx` mapea emojis a íconos de Lucide con color contextual automático:

| Emoji | Ícono Lucide | Color |
|---|---|---|
| ✅ | `CheckCircle` | `#10B981` |
| ❌ | `XCircle` | `#EF4444` |
| ⚠️ | `AlertTriangle` | `#F59E0B` |
| 📚 | `BookOpen` | `#1E40AF` |
| 🎓 | `GraduationCap` | `#1E40AF` |
| 👤 | `User` | `#6B7280` |
| 🔒 | `Lock` | `#6B7280` |

---

## Accesibilidad

- Contraste de texto: ratio mínimo 4.5:1 para texto normal (WCAG AA)
- Foco visible en todos los elementos interactivos con anillo azul
- `@media (prefers-reduced-motion: reduce)` — animaciones desactivadas para usuarios con vestibular disorders
- Semántica HTML correcta: `<button>`, `<nav>`, `<main>`, `<header>`, `role="dialog"` en modales

---

## Modo oscuro

Soportado via `prefers-color-scheme: dark`. Variables CSS cambian automáticamente. No hay toggle manual implementado actualmente.
