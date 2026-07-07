# Autocomplete

`<owc-autocomplete>` is a form control for selecting one or many options from a
(potentially large) list, with built-in search filtering, keyboard navigation,
virtualized rendering, tags for multi selection, and a paste-friendly "fill mode".

## Usage

```js
import '@open-wc/components/define/owc-autocomplete.js';
```

```js
html`<owc-autocomplete
  label="Insurer"
  @change=${ev => console.log(ev.currentTarget.value)}
  .data=${[
    { label: 'VAV', value: '100' },
    { label: 'Standard Life', value: '101' },
    { label: 'UNIQA', value: '102' },
  ]}
></owc-autocomplete>`;
```

Options are plain objects with a `label` (shown to the user) and a `value`
(reported via the `value` property). Use `getOptionValue` to read the value
from a different field. Every selection change fires a `change` event and the
element's `value` property always holds the current selection - a single value,
or an array of values when `multiple` is set.

## Features

- Search input that filters options by label (case-insensitive substring match,
  see [filterOptionsByLabel.js](./filterOptionsByLabel.js))
- Single and multi select; multi selections render as removable tags with a
  `+N` overflow tag (`max-options-visible`)
- Fill mode: paste space/comma/semicolon/tab/newline separated text or a JSON
  array and every matching option gets selected - matching Excel/CSV copy
  output (see [fillInput.js](./fillInput.js))
- Virtualized option list via `@lit-labs/virtualizer`, capped by
  `maxDropdownOptionsVisible` (default 200)
- Keyboard navigation: arrow keys, `Home`/`End`, `Enter` to select,
  `Escape`/`Tab` to close
- Select all / deselect all button for multi select (`hide-select-all` to hide)
- Form-control niceties: `label`, `hint`, `placeholder`, `required`,
  `with-clear`, `size`, accent bars per option (`accent-bar`)
- `fixed-trigger` mode to use arbitrary slotted content as the trigger

## Docs & demos

See [OwcAutocomplete.rocket.md](./OwcAutocomplete.rocket.md) for live demos and
the full API reference (attributes, properties, events, methods, slots). It is
published on the docs site under `/autocomplete/`.

## Files

- [OwcAutocomplete.js](./OwcAutocomplete.js) - the component
- [filterOptionsByLabel.js](./filterOptionsByLabel.js) - pure search filter helper
- [fillInput.js](./fillInput.js) - pure fill-mode paste parsing/matching helpers
- [HasSlotController.js](./HasSlotController.js) - reactive controller detecting slotted content
- `*.styles.js` - style modules
- [OwcAutocomplete.test-browser.js](./OwcAutocomplete.test-browser.js) - browser tests (`npx web-test-runner src/autocomplete/OwcAutocomplete.test-browser.js`)
- [filterOptionsByLabel.test.js](./filterOptionsByLabel.test.js), [fillInput.test.js](./fillInput.test.js) - logic tests (`node --test src/autocomplete/`)
