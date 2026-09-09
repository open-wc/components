# Separator

`<owc-separator>` separates content with a line and an optional in-between
note ("or", a date, ...) - horizontal by default, vertical via the `vertical`
attribute. Announces itself as `role="separator"` with the matching
`aria-orientation`.

## Usage

```js
import '@open-wc/components/define/owc-separator.js';
```

```js
html`<owc-separator>or</owc-separator>`;
```

## Docs & demos

See [OwcSeparator.rocket.md](./OwcSeparator.rocket.md) for live demos and the
API reference; published on the docs site under `/separator/`.

## Files

- [OwcSeparator.js](./OwcSeparator.js) - the component
- [OwcSeparator.test-browser.js](./OwcSeparator.test-browser.js) - browser tests (`npx web-test-runner src/separator/OwcSeparator.test-browser.js`)
