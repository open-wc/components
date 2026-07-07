# Card List

`<owc-card-list>` renders rows as a horizontal strip of up to 10 `owc-card`s
with a title and an optional "view all" link. Card content is described
declaratively via `fields` (body, header, footer, image, style); cards can
link somewhere via `getCardLinkSettings`.

## Usage

```js
import '@open-wc/components/define/owc-card-list.js';
```

```js
html`<owc-card-list
  title="News"
  viewAllUrl="/news"
  .data=${articles}
  .sorter=${(a, b) => b.date - a.date}
  .fields=${{
    header: row => row.title,
    body: row => row.teaser,
    image: { src: row => row.cover, alt: row => row.title },
  }}
  .getCardLinkSettings=${row => ({ href: `/news/${row.id}` })}
></owc-card-list>`;
```

## Features

- Sorting happens on a copy - the `data` array is never mutated
- Images render into the card's `media` slot
- Field types importable from `@open-wc/components/OwcCardList.types.js`

## Docs & demos

See [OwcCardList.rocket.md](./OwcCardList.rocket.md) for live demos and the
API reference; published on the docs site under `/card-list/`.

## Files

- [OwcCardList.js](./OwcCardList.js) - the component
- [CardListTypes.ts](./CardListTypes.ts) - public field types
- [OwcCardList.test-browser.js](./OwcCardList.test-browser.js) - browser tests (`npx web-test-runner src/card-list/OwcCardList.test-browser.js`)
