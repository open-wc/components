# Icon Button

`<owc-icon-button>` is a borderless icon-only button that renders as an
anchor when `href` is set - used across the package (autocomplete, file
upload, table, ...) for compact actions.

## Usage

```js
import '@open-wc/components/define/owc-icon-button.js';
```

```js
html`<owc-icon-button name="gear" label="Settings" @click=${openSettings}></owc-icon-button>`;
```

## Features

- Button or link from one tag: set `href` for navigation, `target` for a new
  tab (adds `rel="noreferrer noopener"`), `download` for file downloads (link
  attribute handling in [linkHelpers.js](./linkHelpers.js))
- `label` becomes the accessible name; without it no empty `aria-label` is
  rendered
- `disabled` blocks clicks and leaves the tab order - for links too
- `click()`, `focus()`, and `blur()` delegate to the inner control

## Docs & demos

See [OwcIconButton.rocket.md](./OwcIconButton.rocket.md) for live demos and
the full API reference; published on the docs site under `/icon-button/`.

## Files

- [OwcIconButton.js](./OwcIconButton.js) - the component
- [linkHelpers.js](./linkHelpers.js) - pure link-attribute logic
- [OwcIconButton.test-browser.js](./OwcIconButton.test-browser.js) - browser tests (`npx web-test-runner src/icon-button/OwcIconButton.test-browser.js`)
- [linkHelpers.test.js](./linkHelpers.test.js) - logic tests (`node --test src/icon-button/linkHelpers.test.js`)
