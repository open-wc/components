# Autocomplete

`<owc-autocomplete>` is a form control for selecting one or many options from a
(potentially large, e.g. 50,000 options) list, with built-in search filtering,
keyboard navigation, virtualized rendering, tags for multi selection, and a
paste-friendly "fill mode".

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
- Every matching option is listed. From 300 options on (`virtualizer-mode`:
  `auto`, `always`, `never`), only the options in and around the visible part of
  the list are rendered, by the package's private virtualizer
  ([src/virtualizer](../virtualizer/README.md), not exported). The option list
  (`#rows`) is the virtualizer's scroll container, and it grows with its options
  up to the popup's available height.
- Keyboard navigation: arrow keys, `Home`/`End`, `Enter` to select,
  `Escape`/`Tab` to close. The highlighted option is always scrolled into view,
  also when reopening and after a search. `Enter` only selects it while it is
  fully visible; otherwise it scrolls it into view first
- The dropdown is as wide as the widest label (measured once per `data` array,
  see [widestLabelWidth.js](./widestLabelWidth.js)), at least as wide as the
  control and at most 720px
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
- [widestLabelWidth.js](./widestLabelWidth.js) - pure helper finding the widest label quickly, for the dropdown width
- [HasSlotController.js](./HasSlotController.js) - reactive controller detecting slotted content
- `*.styles.js` - style modules
- [OwcAutocomplete.test-browser.js](./OwcAutocomplete.test-browser.js) - browser tests, including 50,000 options and an autocomplete in a table cell (`npx web-test-runner src/autocomplete/OwcAutocomplete.test-browser.js`)
- [filterOptionsByLabel.test.js](./filterOptionsByLabel.test.js), [fillInput.test.js](./fillInput.test.js), [widestLabelWidth.test.js](./widestLabelWidth.test.js) - logic tests (`node --test src/autocomplete/filterOptionsByLabel.test.js src/autocomplete/fillInput.test.js src/autocomplete/widestLabelWidth.test.js`)
