# DESIGN.md — Presupuesto App

> Sistema de diseño para una app de finanzas personales. La dirección es **banca clara**: 
> interfaces precisas, datos legibles de un vistazo, sin decoración que distraiga. 
> Cada pantalla es una herramienta de trabajo, no un escaparate.

---

## 1. Filosofía

El diseño no compite con los datos — los sirve. Un saldo de $4.320.000 en Sora 700 
a 38px comunica más que cualquier ícono. La jerarquía viene del tamaño y el color, 
no de gradientes ni sombras. Las superficies se distinguen por un paso de tono; 
nada flota.

La app vive en mobile-first con un `max-width: 680px`. Cada pantalla es un flujo 
vertical de tarjetas. El usuario escanea de arriba abajo: balance → detalle → acción.

---

## 2. Colores

Dos mundos: **fondo claro** (uso cotidiano) y **fondo oscuro** (preferencia del sistema 
o clase `.dark`). El acento azul es el único color saturado en la UI; el verde y el 
naranja son exclusivos de datos financieros.

### 2.1 Tokens — Modo claro

| Token | Valor | Rol |
|-------|-------|-----|
| `--bg` | `#F3F5F8` | Fondo de página |
| `--surface` | `#FFFFFF` | Tarjetas, modales, inputs |
| `--surface2` | `#E8ECFB` | Tarjetas secundarias, chips, fondos de ítem |
| `--border` | `#E1E6ED` | Bordes visibles de tarjetas e inputs |
| `--border-soft` | `#EEF1F5` | Divisores y separadores sutiles |
| `--text` | `#0E1726` | Texto principal (tinta completa) |
| `--muted` | `#556274` | Labels, metadata, texto secundario |
| `--accent` | `#2346D1` | Botón primario, link, foco activo |
| `--accent-strong` | `#16309C` | Hover del acento |
| `--income` | `#0F7A5C` | Ingresos, estado positivo |
| `--income-soft` | `#E3F4EE` | Fondo de badge de ingreso |
| `--warning` | `#C76A12` | Sobre-presupuesto, advertencia |
| `--warning-text` | `#A85508` | Texto de advertencia sobre fondo claro |
| `--danger` | `#D93F3F` | Errores, eliminar, deuda crítica |
| `--navy` | `#0E1726` | Nav inferior, topbar oscuro |
| `--navy-2` | `#24314A` | Ítem activo en nav |
| `--navy-muted` | `#A9B4C6` | Íconos inactivos en nav |

### 2.2 Tokens — Modo oscuro

| Token | Valor |
|-------|-------|
| `--bg` | `#0B111C` |
| `--surface` | `#141C2B` |
| `--surface2` | `#1B2640` |
| `--border` | `#26314A` |
| `--border-soft` | `#1E2840` |
| `--text` | `#E9EEF6` |
| `--muted` | `#9AA7BC` |
| `--accent` | `#6F8BFF` |
| `--accent-strong` | `#93A8FF` |
| `--income` | `#4CC39A` |
| `--income-soft` | `#12302A` |
| `--warning` | `#F0A35A` |
| `--warning-text` | `#F0A35A` |
| `--danger` | `#E07070` |
| `--navy` | `#060A12` |
| `--navy-2` | `#1B2640` |
| `--navy-muted` | `#8794AA` |

### 2.3 Reglas de color

- `--accent` aparece en **un solo botón primario por pantalla**. Nowhere else.
- `--income` y `--warning` son **exclusivos de datos** (montos, barras de progreso, badges). No decorar con ellos.
- `--danger` es para acciones destructivas y errores. No usarlo como acento.
- Superficies se separan por tono (`--bg` → `--surface` → `--surface2`), nunca por sombras.
- Los textos sobre `--navy` usan siempre blanco o `--navy-muted`, nunca `--muted`.
- Los gastos en listas y en la tira "Este mes" van en `--text` con signo `−`; `--warning-text` se reserva para lo excedido (categoría pasada de tope, presupuesto superado). Los ingresos y el sobrante positivo van en `--income` con signo `+`.
- Un monto en `$0` dentro de una lista va en `--muted`; un valor que no aplica se muestra como `—`.

---

## 3. Tipografía

Dos familias. Una sola regla: **Sora para cifras y titulares, Public Sans para todo lo demás**.

| Familia | Rol | Carga |
|---------|-----|-------|
| **Sora** 600/700 | Montos, nombre de la app, h2 de pantalla | `wght@600;700` |
| **Public Sans** 400/500/600/700 | Cuerpo, labels, botones, inputs, h3 | `wght@400;500;600;700` |

### 3.1 Escala tipográfica

| Token de uso | Familia | Tamaño | Peso | Tracking | Uso |
|---|---|---|---|---|---|
| Monto grande | Sora | 38px | 700 | -0.02em | Saldo total, cifra principal |
| Monto medio | Sora | 22–26px | 700 | -0.02em | Totales de tarjeta |
| Monto pequeño | Sora | 16–18px | 600 | -0.01em | Ítems de lista |
| Título de pantalla | Sora | 22px (26px en escritorio ≥ 900px) | 600 | -0.02em | `<h1>` de Inicio, `<h2>` en el resto |
| Cifra de tira | Sora | 18px | 700 | -0.01em | Valores de "Este mes" |
| Escala de barra | Public Sans | 12px | 500/600 | 0 | "Gastado $X", "72%", "Hoy, día 19" |
| Subtítulo / sección | Public Sans | 13px | 600 | +0.06em | `<h3>`, en mayúsculas |
| Cuerpo | Public Sans | 15px | 400 | 0 | Descripciones, párrafos |
| Label / form | Public Sans | 12px | 600 | +0.05em | Labels de input, en mayúsculas |
| Metadata / muted | Public Sans | 12–13px | 400/500 | 0 | Fechas, categorías, hint text |
| Botón primario | Public Sans | 15px | 600 | 0 | `.btn-primary` |
| Botón ghost | Public Sans | 14px | 500 | 0 | `.btn-ghost` |

### 3.2 Reglas tipográficas

- Cifras financieras van siempre en **Sora**, no en Public Sans.
- Los `<h3>` y `.label` van en **mayúsculas con tracking positivo** (+0.06em). Es la única excepción al sentence case.
- Texto corrido en tinta completa (`--text`). Nunca usar `--muted` para texto que el usuario necesita leer.
- Máximo **dos tamaños de fuente visibles por tarjeta**: el valor y su label.
- No mezclar ambas familias dentro de una misma línea de texto.

---

## 4. Espaciado y layout

La app usa un sistema de espaciado en múltiplos de **4px** con pasos nombrados:

| Nombre | Valor | Uso típico |
|--------|-------|------------|
| `xxs` | 4px | Gap entre badge e ícono |
| `xs` | 8px | Gap interno de chips, padding de badge |
| `sm` | 12px | Padding de `.card-sm`, gap entre items |
| `md` | 16px | Padding de form-group, gap estándar |
| `lg` | 20px | Padding de `.page`, padding de `.card` |
| `xl` | 28px | Separación entre secciones dentro de pantalla |
| `2xl` | 40px | Separación entre grupos de tarjetas |
| `section` | 40–56px | Estado vacío, padding de empty-state |

### 4.1 Layout

- **Ancho máximo**: `680px`, centrado.
- **Padding lateral de página**: `20px`.
- **Margen inferior del cuerpo**: `100px` (espacio para nav flotante).
- **Gap entre tarjetas**: `14px` (`.card` con `margin-bottom: 14px`).
- Cada pantalla empieza con un título que nombra lo que es (`<h1>` en Inicio). Sin eyebrows, sin chips encima del título.

### 4.2 Pantalla de inicio (`pages/dashboard.html`)

Una sola estructura para móvil y escritorio, dentro de `<main class="dash">`:

| | Móvil (< 900px) | Escritorio (≥ 900px) |
|---|---|---|
| Ancho máximo | `680px`, centrado | `1240px`, centrado |
| Padding | `20px 20px 0` | `32px` |
| Columnas | 1 | `minmax(0, 7fr) minmax(0, 5fr)` |
| Gap (único, horizontal y vertical) | `14px` | `16px` |

Orden de bloques (es también el orden de lectura en móvil):

1. **Encabezado**: `h1` "Inicio" + selector de mes + "Nuevo movimiento" (este último solo en escritorio; en móvil la acción es el botón `+` de la nav). Ocupa toda la fila.
2. **Disponible** (columna 7fr): la respuesta de la pantalla, cuánto queda y si el ritmo va bien.
3. **Este mes** (columna 5fr): ingresos, gastos, presupuesto, te sobra.
4. **Categorías** (columna 7fr): todas las categorías con presupuesto, ordenadas por % usado de mayor a menor.
5. **Movimientos recientes** + **Cajitas** (columna 5fr, apiladas): 5 movimientos como máximo, todas las cajitas.

Las tarjetas de la fila 2 usan `align-self: start` para no estirarse con espacio vacío.

---

## 5. Radios de borde

| Token | Valor | Componente |
|-------|-------|------------|
| `pill` | `999px` | Nav inferior, toasts, month-selector, chips de filtro, topbar-btn |
| `xl` | `22px` | Nav inferior (`.bottom-nav`) |
| `lg` | `20px` | Tarjeta principal (`.card`) |
| `md` | `14px` | Tarjeta secundaria (`.card-sm`), nav-item activo |
| `sm` | `12px` | Inputs, botones primario y ghost |
| `xs` | `8px` | Botón de logout, badge de peligro |

Una sola familia de radios por pantalla. No mezclar `pill` y `sm` en el mismo componente.

---

## 6. Componentes

### 6.1 Tarjetas

**`.card`** — Tarjeta principal
```
background:    var(--surface)
border:        1px solid var(--border)
border-radius: 20px
padding:       20px
margin-bottom: 14px
```

**`.card-sm`** — Ítem secundario, fila dentro de una tarjeta
```
background:    var(--surface2)
border:        1px solid var(--border)
border-radius: 14px
padding:       14px 16px
```

Reglas:
- Cada tarjeta tiene un solo dato dominante (el monto o el nombre).
- El contenido secundario (categoría, fecha, porcentaje) va en `--muted` a 12–13px.
- No anidar `.card` dentro de `.card`. Usar `.card-sm` para ítems dentro de una `.card`.
- No agregar `box-shadow`. La separación del fondo (`--bg` vs `--surface`) es suficiente.

---

### 6.2 Botones

**`.btn-primary`** — Acción principal de la pantalla
```
background:    var(--accent)
color:         #ffffff
border:        none
border-radius: 12px
padding:       14px
min-height:    44px
font:          Public Sans 600 15px
width:         100%

:hover  → background: var(--accent-strong)
:active → transform: scale(0.99)
:disabled → opacity: 0.4, cursor: not-allowed
```

**`.btn-ghost`** — Acción secundaria o cancelar
```
background:    none
border:        1px solid var(--border)
color:         var(--muted)
border-radius: 12px
padding:       10px 16px
min-height:    44px
font:          Public Sans 500 14px

:hover → border-color: var(--text), color: var(--text)
```

**`.btn-danger`** — Eliminar, acción destructiva
```
background:    none
border:        1px solid rgba(217,63,63,0.3)
color:         var(--danger)
border-radius: 8px
padding:       6px 10px
font:          Public Sans 400 12px

:hover → background: rgba(217,63,63,0.1)
```

**`.topbar-btn`** — Acción contextual en topbar (filtros, exportar)
```
background:    none
border:        1px solid var(--border)
color:         var(--muted)
border-radius: 999px
height:        36px
padding:       0 14px
font:          Public Sans 600 13px

:hover → border-color: var(--accent), color: var(--accent)
```

Reglas:
- Un solo `.btn-primary` por pantalla visible.
- Los botones de ancho completo son solo para modales y formularios de creación.
- Tamaño mínimo de touch target: **44px alto × 44px ancho**.
- No usar gradientes ni sombras en botones.

---

### 6.3 Formularios

**`.form-input`** / **`.form-select`**
```
background:    var(--surface)
border:        1px solid var(--border)
border-radius: 12px
padding:       13px 16px
min-height:    44px
font:          Public Sans 400 15px
color:         var(--text)

:focus → border-color: var(--accent)
::placeholder → color: var(--muted), opacity: 0.6
```

**`.form-label`**
```
font:          Public Sans 600 12px
color:         var(--muted)
text-transform: uppercase
letter-spacing: 0.05em
margin-bottom: 7px
```

**`.form-group`**
```
margin-bottom: 16px
```

Reglas:
- Labels siempre en mayúsculas con tracking. Es el único caso de `text-transform: uppercase` en elementos de formulario.
- El borde en foco es `--accent`, no una sombra.
- Inputs de solo lectura o deshabilitados usan `opacity: 0.5`, no fondo diferente.

---

### 6.4 Navegación

**`.bottom-nav`** — Barra flotante móvil
```
background:    var(--navy)
border-radius: 22px
height:        68px
position:      fixed, bottom: 16px, left/right: 16px
grid:          5 columnas iguales
z-index:       100
```

**`.nav-item`**
```
color inactivo: var(--navy-muted)
border-radius:  14px
height:         48px
font:           Public Sans 500 10px

.active → background: var(--navy-2), color: #ffffff
:hover  → color: #ffffff
```

**`.nav-fab`**: botón `+` "Nuevo movimiento", posición central de la nav (en `assets/ui.js`). Es el botón primario de la pantalla en móvil.
```
size:          52 × 52px
background:    var(--accent)   #2346D1 / #6F8BFF
color:         #FFFFFF
border-radius: 16px
ícono:         24px, stroke 2.4

:hover  → background: var(--accent-strong)
:active → transform: scale(0.94)
```

**Sidebar desktop** (visible en `≥900px`, oculto en mobile):
```
background: var(--navy)
width:      220px
```

---

### 6.5 Badges

```
font:          Public Sans 600 11px
padding:       3px 8px
border-radius: 999px
letter-spacing: 0.02em
```

| Variante | Background | Color |
|----------|-----------|-------|
| `.badge.basico` | `rgba(27,111,194,0.12)` | `#1B6FC2` |
| `.badge.no-esencial` | `rgba(181,72,122,0.12)` | `#B5487A` |
| `.badge.ahorro` | `rgba(63,125,30,0.12)` | `#3F7D1E` |

---

### 6.6 Barra de progreso

```
height:        6px
background:    var(--surface2)
border-radius: 999px
overflow:      hidden

.progress-fill          → background: var(--accent)
.progress-fill.warn     → background: var(--warning)
.progress-fill.over     → background: var(--warning)
```

La barra no lleva número superpuesto. El porcentaje va en texto a la derecha, en `--muted`.

---

### 6.7 Toast / notificación

```
background:    var(--surface)
border:        1px solid var(--border)
border-radius: 999px
padding:       10px 20px
font:          Public Sans 500 13px
box-shadow:    0 4px 16px rgba(0,0,0,0.12)
position:      fixed, bottom: 96px, centrado
```

| Variante | Border | Color |
|----------|--------|-------|
| default | `--border` | `--text` |
| `.success` | `--income` | `--income` |
| `.error` | `--danger` | `--danger` |

---

### 6.8 Estado vacío

```
text-align: center
padding:    40px 20px
color:      var(--muted)

p → font-size: 14px, margin-top: 8px
```

El ícono del estado vacío va en `--border` o `--muted`, sin color de acento. El texto describe qué hacer, no qué falta.

---

### 6.9 Skeleton / carga

```
background:  var(--border)
border-radius: 6px
animation:   shimmer 1.4s ease-in-out infinite
             (opacity 0.4 → 0.8 → 0.4)
```

---

### 6.10 Encabezado de pantalla (`.dash-head`)

```
display:        flex, space-between, align-items: center, wrap
gap:            12px
h1:             Sora 600 22px (26px ≥ 900px), tracking -0.02em, color var(--text)
acciones:       flex, gap 12px → selector de mes + .btn-primary.dash-new
```

El botón primario del encabezado es `.btn-primary` con `width: auto; height: 44px; padding: 0 18px` (fondo `--accent` `#2346D1`, hover `--accent-strong` `#16309C`). Se oculta en móvil (`display: none`) porque ahí la acción primaria es el botón `+` de la nav.

### 6.11 Selector de mes (`.ms-wrap`, en `assets/ui.js`)

```
background:    var(--surface)          #FFFFFF / #141C2B
border:        1px solid var(--border) #E1E6ED / #26314A
border-radius: 999px
padding:       4px 6px
gap:           4px

.ms-arrow  → 30×30px, círculo, sin fondo, color var(--muted)
             :hover → background var(--surface2), color var(--accent)
             :disabled → opacity 0.3
.ms-label  → Public Sans 600 14px, var(--text), min-width 130px, centrado
```

El texto del mes se capitaliza en JS ("Octubre de 2026"), no con `text-transform: capitalize` (que produciría "Octubre De 2026").

### 6.12 Encabezado de sección dentro de tarjeta (`.sect-hdr`)

```
display:     flex, space-between, align-items: center
min-height:  24px
gap:         12px
h2:          Public Sans 600 13px, uppercase, tracking +0.06em, color var(--muted)
```

**`.sect-link`**: enlace de sección ("Comparativo", "Ver todos", "Ver cajitas")
```
font:           Public Sans 600 14px
color:          var(--text)               (nunca --accent: el acento es del botón primario)
padding:        4px 0
border-bottom:  1px solid var(--border)
:hover → border-color: var(--text)
```

### 6.13 Filas de lista (`.rows` / `.row`)

Para categorías, movimientos y cajitas. Las filas viven dentro de una `.card`, sin tarjeta propia.

```
.rows       → list-style none, margin-top 8px
.row        → padding 14px 0, border-top 1px solid var(--border-soft) (#EEF1F5 / #1E2840)
              la primera fila no lleva borde
.row-line   → flex, space-between, align-items: baseline, gap 12px
.row-name   → Public Sans 600 15px, var(--text), una línea con ellipsis
.row-amt    → Sora 600 16px, var(--text), tabular-nums, sin cortar
              .zero → var(--muted)
.row-meta   → Public Sans 400 13px, var(--muted), margin-top 4px, una línea con ellipsis
              en Sora 600 cuando contiene un monto (".num.row-meta")
.rows-foot  → total al pie: flex space-between, padding-top 14px,
              border-top 1px solid var(--border) (un paso más fuerte que los divisores)
```

Variantes:
- **Categoría**: línea 1 nombre + gastado; `.progress-bar` (margin `10px 0 8px`); línea 3 "de $tope" + "Quedan $X" / "Completo" / "Excedido $X" (`--warning-text`, barra `.over`).
- **Movimiento**: línea 1 descripción + "−$monto"; línea 2 "18 oct · Categoría · Cajita".
- **Cajita**: línea 1 nombre + saldo (tarjetas de crédito con `−`); línea 2 tipo ("Cuenta de ahorro", "Billetera", "Tarjeta de crédito · cupo $X"). Pie: "Total en cuentas" (suma sin tarjetas de crédito).

### 6.14 Tira de cifras (`.month-grid` / `.month-cell`)

Varias cifras hermanas en una sola tarjeta, separadas por divisores. No una tarjeta por cifra.

```
móvil      → grid 2×2; celda padding 14px 0, border-top 1px var(--border-soft);
             columna derecha con border-left 1px var(--border-soft) y padding-left 14px
escritorio → 1 columna; cada celda flex space-between (label izquierda, valor derecha),
             padding 13px 0
label      → .label (Public Sans 600 12px, uppercase, +0.06em, var(--muted))
valor      → Sora 700 18px, tabular-nums; var(--text), o var(--income) con "+" si es positivo
```

### 6.15 Tarjeta "Disponible" y barra del plan (`.plan`)

La tarjeta principal de Inicio. Contenido, en orden:

```
.label            "Disponible en octubre" ("Excedido en …" si el saldo es negativo)
.amount-big       Sora 700 38px, -0.02em; .neutral (var(--text)) o .negative (var(--warning)) con "−"
.hero-sub         Sora 600 13px, var(--muted), margin-top 8px: "de $X presupuestados · quedan N días"
                  (cada tramo con white-space: nowrap; el "·" va al inicio del segundo)
.plan             margin-top 16px
.hero-finding     Public Sans 400 15px / 1.5, var(--text), margin-top 18px: el hallazgo del mes
                  en una frase; los montos excedidos en Sora 600 var(--warning-text)
```

**Barra del plan**
```
.plan-now     etiqueta "Hoy, día N" encima de la barra: Public Sans 600 12px, var(--text), alto 18px;
              centrada en la marca, anclada al borde si la marca está a < 12% o > 88%
.plan-track   alto 10px, radio 999px, fondo var(--surface2) (#E8ECFB / #1B2640)
.plan-fill    var(--accent) (#2346D1 / #6F8BFF); .warn → var(--warning) (#C76A12 / #F0A35A)
              transición width 0.6s ease
.plan-today   marca de hoy: 2px de ancho, sobresale 5px arriba y abajo, var(--text)
.plan-scale   Public Sans 500 12px, var(--muted): "Gastado $X" a la izquierda, "72%" a la derecha
```

La barra se pone en `.warn` cuando el gasto supera el presupuesto, o cuando el % gastado supera en más de 15 puntos al % del mes transcurrido. La marca y la etiqueta de "hoy" solo aparecen en el mes en curso.

### 6.16 Estados de Inicio

| Estado | Qué se muestra |
|---|---|
| Cargando | `.skeleton` con la forma final de cada bloque (alto real del monto, filas con su padding) |
| Mes sin presupuesto | Tarjeta principal: "Gastado en {mes}" + monto + frase + `.btn-ghost` "Crear presupuesto". Categorías: frase + `.btn-ghost` "Ir a presupuesto" |
| Sin movimientos / sin cajitas | `.empty-state` con una frase en `--text` (padding `28px 12px`) y, si aplica, un `.btn-ghost` |
| Error de carga | Tarjeta principal: frase + `.btn-ghost` "Reintentar". Tira de cifras con `—`; listas con "Sin datos por ahora." |

`prefers-reduced-motion: reduce` desactiva las transiciones de las barras y la animación del skeleton.

---

## 7. Montos y datos financieros

Los números son el producto. Tienen sus propias reglas:

| Estado | Color | Familia | Tamaño típico |
|--------|-------|---------|---------------|
| Positivo / ingreso | `--income` | Sora 700 | 38px (grande), 16–22px (lista) |
| Negativo / gasto | `--warning` | Sora 700 | 38px (grande), 16–22px (lista) |
| Neutro / total | `--text` | Sora 700 | 38px (grande) |
| Monto pequeño en lista | `--text` | Sora 600 | 15–16px |

- Los montos negativos llevan signo `−` (no guión `-`).
- Separador de miles: `.` (punto). Decimal: `,` (coma). Formato: `$1.234.567,89`.
- Sin espacio entre `$` y la cifra. `formatCOP` (de `Intl`, es-CO) devuelve `$ 1.234`; en Inicio se usa `formatCOP(v).replace(/\s/g, "")`.
- Las cifras llevan `font-variant-numeric: tabular-nums` y `white-space: nowrap` (clase `.num` en Inicio).
- Nunca mostrar un monto en Public Sans — siempre Sora.

---

## 8. Modo oscuro

El modo oscuro se activa por `prefers-color-scheme: dark` o por clase `.dark` en `<body>`. Los tokens cambian automáticamente.

Reglas adicionales en modo oscuro:
- El `--surface` oscuro (`#141C2B`) nunca usa sombras — el contraste de tono con `--bg` (`#0B111C`) es suficiente.
- Los colores semánticos (`--income`, `--warning`, `--danger`) se iluminan en el modo oscuro para mantener contraste legible.
- No invertir colores manualmente. Siempre referenciar tokens.

---

## 9. Qué evitar

### Visualmente prohibido

| Prohibido | Alternativa |
|-----------|-------------|
| Gradientes en fondos, botones o texto | Color plano de token |
| Sombras en tarjetas en reposo | Separación por tono de superficie |
| `border-radius` de 4–8px en tarjetas | Mínimo 14px (`.card-sm`) |
| Texto en `--muted` donde el usuario necesita leer | `--text` completo |
| Íconos en cuadros con fondo de color (feature cards) | Íconos inline, sin contenedor |
| Montos en Public Sans | Sora siempre para cifras |
| Múltiples `.btn-primary` en la misma vista | Un solo CTA primario por pantalla |
| Labels sin `text-transform: uppercase` | Aplicar el estilo de `.form-label` o `.label` |
| Números de índice (01, 02, 03) | Orden por posición |
| Chips o badges encima de un título principal | La información va en el título o debajo |
| Paleta de "asistente de IA": amarillo-crema, terracota, violeta | Los tokens del sistema |
| `font-family: monospace` fuera de código | Public Sans con `font-variant-numeric: tabular-nums` |

### Errores de layout

| Prohibido | Alternativa |
|-----------|-------------|
| Secciones centradas con lado opuesto vacío | Llenar el espacio o usar ancho completo |
| Tarjeta sin padding (contenido pegado al borde) | Mínimo `14px` de padding |
| Scroll horizontal accidental | `overflow-x: hidden` en `.page` y revisar inputs |
| Contenido debajo de la nav flotante | `padding-bottom: 100px` en `body` |
| Inputs menores a 44px de alto | `min-height: 44px` obligatorio |

### Patrones de datos que se evitan

- No inventar cifras de ejemplo en UI de producción.
- No mostrar el estado "cargando" con texto — usar `.skeleton`.
- No mostrar `NaN`, `undefined` o `null` al usuario — siempre un fallback (`$0`, `—`, `Sin nombre`).
- No truncar montos con `…` — siempre mostrar el número completo.

---

## 10. Animaciones

Mínimas y funcionales.

| Transición | Duración | Propiedad |
|------------|----------|-----------|
| Hover en botones, bordes | `0.2s ease` | `background`, `border-color`, `color` |
| Click en botón primario | `0.1s` | `transform: scale(0.99)` |
| Aparición de toast | `0.25s ease` | `opacity`, `transform: translateY` |
| Barra de progreso | `0.6s ease` | `width` |
| Shimmer de skeleton | `1.4s ease-in-out infinite` | `opacity` |

No hay animaciones de entrada de tarjetas ni stagger effects. La app carga datos y los muestra — no necesita ceremony.

`prefers-reduced-motion`: todas las transiciones deben colapsarse a `0s` o eliminarse si el usuario lo prefiere.

---

## Referencia rápida para Claude Code

Al generar o modificar UI de esta app:

1. **Importar** `assets/style.css` y `assets/ui.js` — tienen los tokens y los componentes base. Los componentes de Inicio (§6.10–6.16) viven por ahora en el `<style>` de `pages/dashboard.html`; si otra pantalla los necesita, moverlos a `style.css`.
2. **Estructura mínima de pantalla**: `<div class="topbar">` + `<main class="page">` + `<nav class="bottom-nav">`. Inicio usa `<main class="dash">` con su encabezado propio (§4.2).
3. **Monto financiero**: siempre `<span class="amount-big [positive|negative|neutral]">`.
4. **Tarjeta estándar**: `<div class="card">`. Para ítems dentro: `<div class="card-sm">`.
5. **Botón principal**: `<button class="btn-primary">`. Solo uno por pantalla.
6. **No crear nuevos colores** — usar los tokens de `:root`.
7. **No crear nuevas clases utilitarias** — extender los componentes existentes.
