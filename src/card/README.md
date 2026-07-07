# Card

`<owc-card>` is the basic content card with `media`, `header`, body, and
`footer` slots. Filled slots are detected automatically (and reflected as
`with-*` attributes for styling); with `href` the whole card becomes an
overlay link. Used by `owc-card-list`, `owc-pinboard`, and `owc-file-upload`.

## Usage

```js
import '@open-wc/components/define/owc-card.js';
```

```js
html`<owc-card href="/articles/42">
  <img slot="media" src="/cover.jpg" alt="" />
  <div slot="header">Title</div>
  Body text
  <div slot="footer">Footer</div>
</owc-card>`;
```

## Docs & demos

See [OwcCard.rocket.md](./OwcCard.rocket.md) for live demos and the API
reference; published on the docs site under `/card/`.

## Files

- [OwcCard.js](./OwcCard.js) - the component
- [card.styles.js](./card.styles.js) - styles
- [OwcCard.test-browser.js](./OwcCard.test-browser.js) - browser tests (`npx web-test-runner src/card/OwcCard.test-browser.js`)
