# Loading Screen

`<owc-loading-screen>` is a centered full-area loading state: spinner,
percentage (capped at 99% so it never claims to be done), and an optional
logo. With `autofill` the progress advances on its own - useful when there is
no real progress signal.

## Usage

```js
import '@open-wc/components/define/owc-loading-screen.js';
```

```js
html`<owc-loading-screen autofill .logoSvg=${myLogoTemplate}></owc-loading-screen>`;
```

## Docs & demos

See [OwcLoadingScreen.rocket.md](./OwcLoadingScreen.rocket.md) for live demos
and the API reference; published on the docs site under `/loading-screen/`.

## Files

- [OwcLoadingScreen.js](./OwcLoadingScreen.js) - the component
- [OwcLoadingScreen.test-browser.js](./OwcLoadingScreen.test-browser.js) - browser tests (`npx web-test-runner src/loading-screen/OwcLoadingScreen.test-browser.js`)
