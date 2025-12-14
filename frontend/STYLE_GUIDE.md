# Guía de Estilo — Role Manager (Frontend)

Esta guía resume el sistema de diseño existente (variables y componentes) que ya está definido en `src/styles/design-system.css` y propone ejemplos de uso junto con equivalencias útiles para Tailwind.

**Tokens principales**

- **Colores (brand y semantic)**
  - Primary: #8b5cf6 (hover #7c3aed, active #6d28d9)
  - Success: #10b981
  - Error: #ef4444
  - Warning: #f59e0b
  - Info: #3b82f6
  - Background: #0a0a0a / surface: #161616 / surface-hover: #1e1e1e

- **Texto**
  - Primary: #ffffff
  - Secondary: #a3a3a3
  - Tertiary: #737373

- **Tipografía**
  - Familia base: sistema (var(--font-family-base))
  - Tamaños: base 1rem (16px), sm 0.875rem, lg 1.125rem, xl 1.25rem, 2xl 1.5rem
  - Pesos: normal 400, medium 500, semibold 600, bold 700

- **Espaciado** (escala): 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px

- **Border radius**: md 8px, lg 12px, xl 16px, 2xl 24px, full

- **Sombras**: desde `--shadow-sm` hasta `--shadow-2xl` (valores en `design-system.css`).

**Componentes y clases disponibles**

- Botones
  - Clases: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`, `.btn-icon`
  - Uso (HTML):

```html
<button class="btn btn-primary">Guardar</button>
<button class="btn btn-secondary">Cancelar</button>
<button class="btn btn-ghost">Más</button>
```

- Inputs
  - Clase base: `.input` (placeholder, focus, hover ya estilados)

- Cards
  - Clase: `.card`, con `.card-header`, `.card-title`, `.card-description`

- Modals
  - Backdrop: `.modal-backdrop`
  - Contenedor: `.modal`, `.modal-header`, `.modal-body`, `.modal-footer`

- Toasts
  - Contenedor: `.toast-container`
  - Elementos: `.toast`, y variantes `.toast-success`, `.toast-error`, `.toast-warning`, `.toast-info`

**Tablas y listados**

Los componentes en `src/components` usan tablas y listados con clases propias; preferir las utilidades ya definidas y las variables para colores de fondo, borde y texto.

**Equivalencias y recomendaciones con Tailwind**

- Actualmente `tailwind.config.js` está vacío; recomendamos extend-er el tema con tokens usando las variables CSS para mantener coherencia. Ejemplo de mapping (sugerido):

```js
// tailwind.config.js (sugerencia)
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        surface: 'var(--color-surface)',
        'text-primary': 'var(--color-text-primary)'
      },
      fontFamily: {
        sans: ['var(--font-family-base)']
      }
    }
  }
}
```

- Ejemplo de uso de utilidades Tailwind manteniendo las variables:

```html
<button class="px-4 py-2 rounded-md bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]">
  Guardar
</button>
```

**Buenas prácticas**

- Preferir las clases atómicas de Tailwind para layout y espaciado, y las clases del design system (`.btn`, `.card`, `.modal`) para patrones de componente que requieren coherencia visual.
- Mantener las variables en `src/styles/design-system.css` como la fuente de verdad de los tokens.
- Actualizar `tailwind.config.js` para incluir `content` y mapear tokens al tema para autocompletado y usar utilidades con nombres semánticos.

**Ejemplos rápidos**

- Botón primario (clase del sistema): `<button class="btn btn-primary">Crear</button>`
- Input con helper y error:

```html
<label>
  <span class="text-secondary">Email</span>
  <input class="input" placeholder="nombre@ejemplo.com" />
</label>
```

- Modal (estructura mínima):

```html
<div class="modal-backdrop"></div>
<div class="modal">
  <div class="modal-header">
    <h3 class="modal-title">Título</h3>
  </div>
  <div class="modal-body">Contenido...</div>
  <div class="modal-footer">
    <button class="btn btn-ghost">Cerrar</button>
    <button class="btn btn-primary">Aceptar</button>
  </div>
</div>
```

**Dónde mirar en el código**

- Variables y estilos base: `src/styles/design-system.css`
- Entrada del estilo global: `src/main.ts` (importa el CSS)
- Componentes de UI: `src/components/*` (ej. `Toast.vue`, `PermissionModal.vue`, `RoleDetailsModal.vue`)

**Siguientes pasos recomendados**

- (Opcional) Extender `tailwind.config.js` con `content` y `theme.extend` para mapear tokens.
- Añadir ejemplos visuales en un Storybook o en un `docs/preview` para validación visual.
- Revisar componentes y migrar poco a poco patrones a utilidades Tailwind donde tenga sentido.

Si quieres, aplica ahora la configuración sugerida en `tailwind.config.js` y/o creo ejemplos de componentes listos para Tailwind.

***
Guía generada automáticamente a partir de `src/styles/design-system.css` — respeta las variables existentes.
