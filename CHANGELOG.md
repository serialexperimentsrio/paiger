# Changelog

Until 1.0, a minor version may break things and a patch version won't. Each breaking release says what to change.

## 0.5.0

### Breaking

- **Renamed from `ricebowl` to `paiger`.** Swap the dependency, then change `from 'ricebowl'` to `from 'paiger'` and `ricebowl/styles.css` to `paiger/styles.css`. The prefixes changed with it: `--rb-*` variables are now `--pg-*`, `rb-*` classes are now `pg-*`, `data-rb-theme` is now `data-pg-theme`, and the cascade layer is now `paiger`.
- **Wrap your app in `PaigerProvider`.** Modals and toasts now render inside your React tree instead of a separate root, so their content can use your context. Put it once near the root, inside your other providers. Without it, `setModal()` and `toast()` log an error and do nothing.
- **`Tooltip`:** `text` is now `content` and takes any node. `above`, `left` and `right` are now `placement="top" | "left" | "right"` (`"bottom"` is the default). `forceShow` and `forceHide` are now one `open` prop: `true` keeps it shown, `false` keeps it hidden, and leaving it out shows it on hover and keyboard focus.
- **`Popover`:** `above`, `below`, `left` and `right` are now `placement`, and `smartPositions` is now `autoPlacements`. Positions are named `'top'`, `'bottom'`, `'left'` and `'right'`, and the type is `Placement` (was `PopoverPosition`). `noCloseOnClickOutside` is now `closeOnClickOutside={false}`.
- **`Dropdown`:** items' `onPick` is now `onSelect`. `above` and `smartPositions` became `placement` and `autoPlacements`, as for `Popover`. Busy items show the border sweep instead of `Loading`.
- **`Select`:** options are now `{ value, label }` (were `{ key, name, onPick?, default? }`). Use `value` and `onChange` to control it, or `defaultValue` to start it on something other than the first option. `name` submits the value with a form. The trigger is a `<button>` now.
- **`Button`:** `forceLoading` is now `loading`. `onClick` receives the click event, and the button no longer cancels it, so a `type="submit"` button submits its form. `type` now defaults to `"button"`, so a plain `Button` inside a form doesn't submit it.
- **`Loading`:** sits inline by default, and its `inline` prop is gone. Pass `center` where you relied on it centring itself. The dots are drawn boxes sized by `--pg-loading-size`; set `color` on `.pg-loading` to recolour them.
- **`Panel`:** `className`, `ref` and other attributes now go on the outer `.pg-panel`, not the inner box.
- **Modals:** `hideModal()` now runs the modal's `onClose` too. `onClose` runs once per modal, when it's gone for good: closed, left with `openPreviousModal()`, or cleared from the history when the modals close. `ModalBox` shows a × button (turn it off with `closeButton={false}`) and has `role="dialog"`; give it a `title` or an `aria-label`.
- **Toasts:** `ToastBox` is now a plain component (`type`, `action`, `onDismiss`, children) for notices that stay in place. Its old props are gone. Toasts show a × button.
- **Layers:** popovers, tooltips and toasts open in the browser's top layer, so `--pg-z-popover`, `--pg-z-tooltip` and `--pg-z-toast` are gone. `--pg-z-modal` still sets the modal's.
- **Exports:** `modalActive` is replaced by `isModalOpen()`. `registerCloseAnimation`, `isModalTransitioning` and the `ModalBoxComponent` type are no longer exported.

### Added

- `Button` `size` (`'small' | 'medium' | 'large'`) and `variant` (`'solid' | 'ghost'`).
- `toast(message, options)` with `type`, `duration` (ms, or `Infinity`) and `action`. It returns an id for `dismissToast(id)`. Messages can be any node.
- `openPreviousModal()` goes back through every earlier modal, not just one.
- Modals lock page scroll while open.
- Keyboard: `Tooltip` shows on keyboard focus. `Popover` closes on Escape and when you tab away, moves focus inside when it opens and back to the trigger when it closes. Menus support Home, End and type-to-jump.
- Menus use `menu` and `menuitem` roles; `Select` uses a `listbox` with `aria-selected`. Triggers get `aria-expanded` and `aria-controls`.
- Tooltips wrap at `--pg-tooltip-max-width` and keep line breaks.
- Sizing variables: `--pg-font-size`, `--pg-padding`, `--pg-control-padding-y`, `--pg-control-padding-x`, `--pg-tooltip-padding`, `--pg-tooltip-max-width`, `--pg-toast-width`, `--pg-modal-margin`.
- Animation length variables: `--pg-duration-modal`, `--pg-duration-popover` and `--pg-duration-tooltip`. Reduced motion now also stops the script-driven animations.
- Built-in light and dark palettes through `data-pg-theme="light" | "dark" | "auto"`.
- Prop types are exported: `ButtonProps`, `TooltipProps`, `SelectOption`, `DropdownItem`, `ToastOptions` and the rest.
- Works with React 18 as well as 19.
- The package is marked `'use client'` and side-effect free, so bundlers drop the components you don't import.
- Playwright tests (`bun run test`).
- Form controls: `Input`, `Textarea`, `Checkbox` (with `indeterminate`), `Radio` and `Switch`. They're the native elements, restyled, so forms, labels and the keyboard work as usual. New variable `--pg-check-size`.
- `Tabs`: a row of tabs and the selected panel, with arrow keys, Home and End, disabled tabs, and `value`/`defaultValue`/`onChange`.
- `Popover` takes `open` to control it from outside. Clicks, Escape and `close()` then ask through `onOpenChange` instead of acting.
- `Select` takes `id` (for a `<label htmlFor>`), `disabled`, and a `ref` to its trigger button.
- `Icon` `tint` draws the icon in the current text colour, so it follows the theme and hover states.
- `PaigerProvider` `labels` replaces the English text screen readers hear (`close`, `dismiss`, `loading`), e.g. to translate it.
- The page behind an open modal is `inert`, so neither clicks, Tab nor a screen reader can reach it. Toasts stay usable.

### Changed

- `Popover`, `Dropdown` and `Select` mount their content when they open and unmount it once closed, instead of keeping it in the page.
- Tooltips flip to the opposite side when the one asked for has no room, and work inside fixed headers.
- Toasts show in the top layer, so a new toast appears above an open popover.
- `Icon`'s ref type is `HTMLElement`, since a tinted icon is a `<span>`.
- `Box` sets its text to `--pg-color-bright`, to match its `--pg-color-main` background, instead of taking the page's text colour.
- Tooltips don't open on touch, where a tap would leave them stuck open, and Escape hides one that's hovered or focused.
- Error toasts are announced as alerts, ahead of anything else being read out.

### Fixed

- Escape inside a modal closes an open `Select`, `Dropdown` or `Popover` first, and only then the modal. With several popovers open, it closes the newest.
- The modal's focus trap no longer lets Tab out when its last control is a `Select`, `Dropdown` or `Popover` trigger. First focus also skips a `Select`'s hidden input.
- A toast with `duration: Infinity` no longer closes after the mouse leaves it. Toasts also wait while focus is on their action or ×.
- Tooltips stay inside the window at its left edge, not only at its right.
- Tooltips show above popovers. They now open in the top layer too.
- `Box` no longer gives its children `position: relative` and `z-index: 100`, which put Box content above an app's sticky headers. It isolates its own stacking instead.
- `Popover`'s `onOpenChange` no longer fires with `false` on mount.
- In menus and selects, a space typed mid-search is part of the search, so "new y" finds "New York" instead of picking.
- `IconButton` keeps its icon centred when the app resets button fonts with `font: inherit`.
- `ModalBox` with `icon` or `image` places them as `Box` does, instead of centring them like the content.
- A `Tooltip` with `open` no longer crashes server rendering.
- A toast hovered and focused at once waits until both have left before it fades.
- Modals fit mobile browsers' visible height, with their toolbars showing.

## 0.4.1

- Danger buttons and coloured toasts lay their tint over the background as an image, so hovering doesn't flash.
- Internal tidying in Modal, Popover and the build.

## 0.4.0

- The component CSS only comes from `ricebowl/styles.css`; nothing is injected at runtime. If you already import it, there's nothing to do.
- The unprefixed `boxbg`, `boxiconbg`, `loadingAnimation` and `outerModal` classes are gone; use the `rb-*` classes.
- The modal and toast layers are created when first used, not on import.

## 0.3.0

- Renamed from `ricebag` to `ricebowl`. Swap the dependency, then change `from 'ricebag'` to `from 'ricebowl'` and `ricebag/styles.css` to `ricebowl/styles.css`. The cascade layer is now `ricebowl` too, so update any `@layer ricebag, …` order. The `--rb-*` variables and `rb-*` class names are unchanged.

## 0.2.0

- Every variable is prefixed with `rb-`, so ricebowl's names can't collide with your app's. Rename `--color-*`, `--z-*` and `--transition-*` to `--rb-color-*`, `--rb-z-*` and `--rb-transition-*`. `--z-box-content` and `--transition-slow` were removed.
