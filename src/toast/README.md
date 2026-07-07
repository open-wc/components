# Toast

`toast(options)` shows a temporary notification. It creates (and reuses) a
fixed-position container per screen position, stacks multiple toasts, renders
a progress bar counting down `duration` seconds, and removes the toast (and
an empty container) automatically.

## Usage

```js
import { toast } from '@open-wc/components/OwcToast.js';

toast({ title: 'Saved', text: 'Your changes have been saved.', variant: 'success' });
```

`toast()` returns the created `owc-toast-component` element - listen for its
`removed` event or call `remove()` to close it early.

## Features

- Six stacking positions (`top-center`, `top-start`, `top-end`, `bottom-center`,
  `bottom-start`, `bottom-end`); bottom positions stack upwards (pure logic in
  [toastHelpers.js](./toastHelpers.js))
- Variants (`brand`, `neutral`, `success`, `warning`, `danger`) with matching
  default icons, plus custom icons and Web Awesome callout appearances
- Auto-dismiss with a visible progress bar; hovering pauses the countdown
- Dismiss button (opt out with `dismissible: false`), multi-line text via `\n`
- `remove()` fades out, fires `removed` exactly once, and is safe to call
  repeatedly; timers are cleaned up when the element leaves the DOM

## Docs & demos

See [OwcToast.rocket.md](./OwcToast.rocket.md) for live demos and the full API
reference. It is published on the docs site under `/toast/`.

## Files

- [OwcToast.js](./OwcToast.js) - the `toast()` function and `OwcToastComponent`
- [toastHelpers.js](./toastHelpers.js) - pure container-style and default-icon helpers
- [OwcToast.test-browser.js](./OwcToast.test-browser.js) - browser tests (`npx web-test-runner src/toast/OwcToast.test-browser.js`)
- [toastHelpers.test.js](./toastHelpers.test.js) - logic tests (`node --test src/toast/`)
