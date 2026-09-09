# Multi Checkbox

`<owc-multi-checkbox>` renders a list of checkboxes as colored tags for
selecting multiple values, with optional groups that get a select-all checkbox
(including an indeterminate state). The selection lives in the `value`
property in JSON-filter-condition shape
(`{ value: [...], operator: 'equal', field: '...' }`) - it is the checkbox
filter UI used by `owc-table`.

## Usage

```js
import '@open-wc/components/define/owc-multi-checkbox.js';
```

```js
html`<owc-multi-checkbox
  @change=${ev => console.log(ev.target.value.value)}
  .options=${[
    [
      { value: 200, label: 'Aktiv', color: 'danger' },
      { value: 210, label: 'Premium' },
    ],
    { value: 300, label: 'Passiv' },
  ]}
></owc-multi-checkbox>`;
```

## Features

- Options as tags with configurable colors; labels default to the value
- Grouped options with select-all/indeterminate behavior (pure logic in
  [selectionHelpers.js](./selectionHelpers.js))
- Falsy option values (`0`, `false`, `''`) are fully supported
- The `value` object is replaced, never mutated - safe to pass shared filter
  objects by reference
- `change` event on every selection change

## Docs & demos

See [OwcMultiCheckbox.rocket.md](./OwcMultiCheckbox.rocket.md) for live demos
and the full API reference; published on the docs site under
`/multi-checkbox/`.

## Files

- [OwcMultiCheckbox.js](./OwcMultiCheckbox.js) - the component
- [selectionHelpers.js](./selectionHelpers.js) - pure group-state/toggle logic
- [OwcMultiCheckbox.types.ts](./OwcMultiCheckbox.types.ts) - option types
- [OwcMultiCheckbox.test-browser.js](./OwcMultiCheckbox.test-browser.js) - browser tests (`npx web-test-runner src/multi-checkbox/OwcMultiCheckbox.test-browser.js`)
- [selectionHelpers.test.js](./selectionHelpers.test.js) - logic tests (`node --test src/multi-checkbox/`)
