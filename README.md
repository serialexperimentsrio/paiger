> [!WARNING]
> Despite the repository description (About), this library is still in active development. Components may exhibit bugs or unintended behavior and are not yet recommended for production use.

# ricebowl

**ricebowl** is a React component library with custom property theming.

## Installation

```bash
npm install ricebowl
```

## Usage

Import the components and the stylesheet:

```ts
import { Button, Tooltip, setModal, toast } from 'ricebowl'
import 'ricebowl/styles.css'
```

The stylesheet includes both component styles and default theme values. Import it once at the root of your app.

## Components

| Component | Description |
|---|---|
| `Box` | Container with optional background image and icon |
| `Button` | Button with built-in async loading state |
| `Dropdown` | Popover-based dropdown menu |
| `Icon` | Lightweight image-based icon |
| `IconButton` | Button variant with an icon |
| `Loading` | Animated loading indicator |
| `Panel` | Styled panel container |
| `Popover` | Smart-positioned popover with open/close animations |
| `Select` | Dropdown-based select input |
| `Tooltip` | Hover tooltip with directional positioning |
| `Modal` / `ModalBox` | Global modal system |
| `Toast` / `ToastBox` | Global toast notification system |

## Theming

All visual properties are driven by CSS custom properties. The defaults shipped in `ricebowl/styles.css` are:

```css
:root {
  --rb-color-main: #141414;     /* component backgrounds */
  --rb-color-accent: #444444;   /* borders, hover states */
  --rb-color-bright: #f0f0f0;   /* primary text */
  --rb-color-dim: #888888;      /* muted/disabled text */
  --rb-color-danger: rgba(255, 133, 133, 0.16);  /* danger tint */
  --rb-color-warning: rgba(255, 200, 0, 0.16);   /* warning tint */
  --rb-color-success: rgba(0, 200, 100, 0.16);   /* success tint */
  --rb-color-backdrop: rgba(0, 0, 0, 0.3);       /* modal overlay */

  --rb-border-width: 2px;
  --rb-radius: 0px;             /* corner radius of every surface */
  --rb-shadow: 0 0 #0000;       /* drop shadow of every surface */
  --rb-font: inherit;           /* font of every component */

  --rb-z-popover: 1000;
  --rb-z-modal: 2000;
  --rb-z-tooltip: 3000;
  --rb-z-toast: 4000;

  --rb-transition-fast: 0.12s ease;
  --rb-transition-base: 0.24s ease;
}
```

Components use the page's font. To override any variable, redefine it on `:root` (or any element) in your own CSS. The defaults have zero specificity, so your values win regardless of load order:

```css
:root {
  --rb-color-main: #1a1a2e;
  --rb-color-accent: #2a2a4a;
  --rb-color-bright: #ffffff;
}
```

You can also scope overrides to a specific part of your app:

```css
.sidebar {
  --rb-color-main: #0d0d0d;
}
```

`--rb-shadow` must stay a valid shadow (use `0 0 #0000` rather than `none`), because the modal combines it with its border.

## Styling components

Tokens cover colours and shape. For anything else, write ordinary CSS against the stable class names below.

All of ricebowl's CSS lives in a cascade layer called `ricebowl`, so your own unlayered CSS always wins. You don't need `!important` or extra specificity, and load order doesn't matter:

```css
.rb-button {
  border-radius: 999px;
  background: linear-gradient(#ffffff, #dde8f0);
}

.rb-button:hover {
  background: linear-gradient(#eaf6fd, #a7d9f5);
}

.rb-button[data-loading] {
  opacity: 0.6;
}
```

If your own CSS is in layers too (Tailwind v4 is), declare ricebowl's layer first so yours stay on top:

```css
@layer ricebowl, theme, base, components, utilities;
```

| Class | Element | State attributes |
|---|---|---|
| `rb-box` | `Box`, and the surface of `Panel`, `ModalBox` and toasts | |
| `rb-box-image`, `rb-box-icon` | `Box` background image and corner icon | |
| `rb-button` | `Button` and `IconButton` | `data-loading`, `data-danger`, `disabled` |
| `rb-icon-button` | `IconButton` | |
| `rb-icon` | `Icon` | |
| `rb-loading` | `Loading` | |
| `rb-panel`, `rb-panel-title`, `rb-panel-box` | `Panel` wrapper, title row and body | |
| `rb-popover`, `rb-popover-content` | `Popover` layer and its content wrapper | |
| `rb-dropdown`, `rb-dropdown-item` | `Dropdown` menu and each item | `data-loading` on the item |
| `rb-select`, `rb-select-arrow` | `Select` trigger and its arrow | `aria-expanded` |
| `rb-tooltip`, `rb-tooltip-text` | `Tooltip` box and text | |
| `rb-modal`, `rb-modal-content`, `rb-modal-backdrop` | `ModalBox` frame, its content, and the backdrop | `data-active` on the backdrop |
| `rb-toast`, `rb-toast-container` | Each toast and the stack | `data-type`, `data-closing` |

`Box`, `Button`, `IconButton`, `Icon`, `Loading`, `Panel`, `Select` and `ModalBox` also accept a `className`, which is added alongside these.

## Upgrading

### From 0.2.x

0.3.0 renames the package from `ricebag` to `ricebowl`. Swap the dependency, then change `from 'ricebag'` to `from 'ricebowl'` and `ricebag/styles.css` to `ricebowl/styles.css`. The cascade layer is now `ricebowl` too, so update any `@layer ricebag, …` order declaration. The `--rb-*` variables and `rb-*` class names are unchanged.

### From 0.1.x

0.2.0 prefixes every variable with `rb-` so ricebowl's names can't collide with your app's own. Rename `--color-*`, `--z-*` and `--transition-*` to `--rb-color-*`, `--rb-z-*` and `--rb-transition-*`. `--z-box-content` and `--transition-slow` were removed.

## Browser Requirements

ricebowl uses the [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API) and the [HTML Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API). No polyfills are included.

Minimum supported browsers: Chrome 114+, Safari 17+, Firefox 125+.

## License

Copyright 2026 Rio

Licensed under the GNU Lesser General Public License v3.0 or later. See [LICENSE](LICENSE) for details.
