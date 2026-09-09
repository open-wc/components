# Data Detail

`<owc-data-detail>` shows the details of a single record as a compact
label/value grid - the detail-view companion to `owc-table`. Columns are
arrays of items with a `label` and a `field` (dot paths and getters work),
and items can be formatted, click-editable, conditionally visible, or
expandable into arbitrary content such as a nested table.

## Usage

```js
import '@open-wc/components/define/owc-data-detail.js';
```

```js
html`<owc-data-detail
  .data=${{ firstName: 'Ada', lastName: 'Lovelace', dateOfBirth: '1815-12-10' }}
  .columns=${[
    [
      { label: 'First Name', field: 'firstName', type: 'editable' },
      { label: 'Born', field: 'dateOfBirth', formatter: 'date' },
    ],
    [{ label: 'Last Name', field: 'lastName' }],
  ]}
  .handleUpdate=${({ field, value, autoSetData }) => autoSetData()}
></owc-data-detail>`;
```

## Features

- Multi-column grid; each column is an independent list of rows
- Built-in formatters (`date`, `datetime`, `currency`, `number`, `percent`,
  `email`, `tickCross`, `checkbox`) with overridable `Intl` formatters, plus
  custom formatter functions
- Click-editable cells (input, textarea, autocomplete, checkbox) via the
  click-editable components, wired through `handleUpdate`
- Expandable rows (`type: 'expandable'`) with `contentExpanded`, single-open
  toggling via `openColumns`, and `labelBadge`/`contentSuffix` decorations
- Per-item visibility as boolean or function of the data (pure logic in
  [columnHelpers.js](./columnHelpers.js))
- Field resolution and content rendering shared with the table via
  `src/field-path-helper/getFieldPathContent.js`

## Docs & demos

See [OwcDataDetail.rocket.md](./OwcDataDetail.rocket.md) for live demos and the
full API reference; published on the docs site under `/data-detail/`.

## Files

- [OwcDataDetail.js](./OwcDataDetail.js) - the component
- [columnHelpers.js](./columnHelpers.js) - pure visibility/row-count/required-fields helpers
- [OwcDataDetail.types.ts](./OwcDataDetail.types.ts) - public types (`OwcDataDetailItem`, `OwcDataDetailColumns`, ...)
- [OwcDataDetail.test-browser.js](./OwcDataDetail.test-browser.js) - browser tests (`npx web-test-runner src/data-detail/OwcDataDetail.test-browser.js`)
- [columnHelpers.test.js](./columnHelpers.test.js) - logic tests (`node --test src/data-detail/`)
