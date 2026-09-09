# Count Up

`<owc-count-up>` animates a number counting up to `end`, powered by
[countup.js](https://github.com/inorganik/countUp.js). By default the
animation starts when the element scrolls into view and runs only once.

## Usage

```js
import '@open-wc/components/define/owc-count-up.js';
```

```js
html`<owc-count-up end="1234567" duration="2" separator=","></owc-count-up>`;
```

## Features

- `start`, `end`, `duration`, and `separator` as simple attributes
- Any further countup.js option via the `options` property; explicit options
  win over the convenience attributes (merge logic in
  [mergeCountUpOptions.js](./mergeCountUpOptions.js))
- Scroll-triggered by default (`enableScrollSpy` + `scrollSpyOnce`)
- The countup.js instance is exposed as the read-only `countUp` property,
  e.g. for `reset()`

## Docs & demos

See [OwcCountUp.rocket.md](./OwcCountUp.rocket.md) for live demos and the
full API reference; published on the docs site under `/count-up/`.

## Files

- [OwcCountUp.js](./OwcCountUp.js) - the component
- [mergeCountUpOptions.js](./mergeCountUpOptions.js) - pure option-merge logic
- [OwcCountUp.test-browser.js](./OwcCountUp.test-browser.js) - browser tests (`npx web-test-runner src/count-up/OwcCountUp.test-browser.js`)
- [mergeCountUpOptions.test.js](./mergeCountUpOptions.test.js) - logic tests (`node --test src/count-up/mergeCountUpOptions.test.js`)
