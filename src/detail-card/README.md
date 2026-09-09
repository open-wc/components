# Detail Card

`<owc-detail-card>` is a compact expandable card with an accent rail: a
summary row (icon, text, right-aligned detail like a price) that expands to
detail content on click. Filled slots are detected automatically; the `open`
state stays in sync in both directions.

## Usage

```js
import '@open-wc/components/define/owc-detail-card.js';
```

```js
html`<owc-detail-card accent-color="#2563eb">
  <wa-icon slot="icon" name="shield"></wa-icon>
  <div slot="text">Liability insurance</div>
  <div slot="detail">€ 12,50 / month</div>
  Full contract details ...
</owc-detail-card>`;
```

## Docs & demos

See [OwcDetailCard.rocket.md](./OwcDetailCard.rocket.md) for live demos and
the API reference; published on the docs site under `/detail-card/`.

## Files

- [OwcDetailCard.js](./OwcDetailCard.js) - the component
- [OwcDetailCard.test-browser.js](./OwcDetailCard.test-browser.js) - browser tests (`npx web-test-runner src/detail-card/OwcDetailCard.test-browser.js`)
