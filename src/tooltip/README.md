# Tooltip

`<owc-tooltip>` wraps `wa-tooltip` with a slot-based API: put the target in
the `anchor` slot and the tooltip content in the default slot - no `id`
wiring needed.

## Usage

```js
import '@open-wc/components/define/owc-tooltip.js';
```

```js
html`<owc-tooltip>
  Settings
  <owc-icon-button slot="anchor" name="gear" label="Settings"></owc-icon-button>
</owc-tooltip>`;
```

## Features

- `placement`, `distance`, `skidding`, `trigger`, `open`, `disabled`,
  `without-arrow`, and `show-delay`/`hide-delay` forwarded to the underlying
  `wa-tooltip`

## Docs & demos

See [OwcTooltip.rocket.md](./OwcTooltip.rocket.md) for live demos and the API
reference; published on the docs site under `/tooltip/`.

## Files

- [OwcTooltip.js](./OwcTooltip.js) - the component
- [OwcTooltip.test-browser.js](./OwcTooltip.test-browser.js) - browser tests (`npx web-test-runner src/tooltip/OwcTooltip.test-browser.js`)
