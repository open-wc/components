# Tabs

`<owc-tabs>` renders a row of tab buttons with a shared content area below.
Clicking a tab shows its content; clicking the active tab again closes the
content area entirely (unlike classic tabs, no tab has to be open).

## Usage

```js
import '@open-wc/components/define/owc-tabs.js';
```

```js
html`<owc-tabs
  active="general"
  @active-changed=${ev => console.log(ev.target.active)}
  .tabs=${{
    general: { label: 'General', content: () => html`<p>General content</p>` },
    other: { label: 'Other', content: () => html`<p>Other content</p>` },
  }}
></owc-tabs>`;
```

Tabs are defined as an object keyed by tab id. Each tab configures `label` and
`content`, and optionally `visible` (boolean or function of the render
options), `order`, `labelPrefix` and `labelSuffix` - see
[OwcTabs.types.ts](./OwcTabs.types.ts), importable from
`@open-wc/components/OwcTabs.types.js`.

## Features

- Content functions receive the options from `.getRenderOptions` plus an
  `open` flag, so heavy content can render lazily
- Conditional visibility and ordering per tab (pure logic in
  [getTabList.js](./getTabList.js))
- `active-changed` event (not fired for the initial value) and a reflected
  `active` attribute
- `tab-list-prefix` slot for content before the buttons, `customStyles`
  property for styling tab content from outside
- Used by `OwcTableInfo` for the table action tabs

## Docs & demos

See [OwcTabs.rocket.md](./OwcTabs.rocket.md) for live demos and the full API
reference. It is published on the docs site under `/tabs/`.

## Files

- [OwcTabs.js](./OwcTabs.js) - the component
- [getTabList.js](./getTabList.js) - pure visibility/order helper
- [OwcTabs.types.ts](./OwcTabs.types.ts) - public types (`Tab`, `Tabs`, `OwcTabsOptions`)
- [OwcTabs.test-browser.js](./OwcTabs.test-browser.js) - browser tests (`npx web-test-runner src/tabs/OwcTabs.test-browser.js`)
- [getTabList.test.js](./getTabList.test.js) - logic tests (`node --test src/tabs/`)
