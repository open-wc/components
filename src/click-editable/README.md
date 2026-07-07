# Click Editable

A family of inline-edit fields: they render as plain text until the user
double clicks (or presses Enter/Space on the focused text), then turn into a
form control in place. Enter or blur submits, Escape cancels and restores the
previous value.

Four variants share the [OwcClickEditable.js](./OwcClickEditable.js) base class:

| Element                             | Edits with            | Source                                                                 |
| ----------------------------------- | --------------------- | ---------------------------------------------------------------------- |
| `owc-click-editable-input`          | `wa-input` (any type) | [OwcClickEditableInput.js](./OwcClickEditableInput.js)                 |
| `owc-click-editable-textarea`       | `wa-textarea`         | [OwcClickEditableTextarea.js](./OwcClickEditableTextarea.js)           |
| `owc-click-editable-autocomplete`   | `owc-autocomplete`    | [OwcClickEditableAutocomplete.js](./OwcClickEditableAutocomplete.js)   |
| `owc-click-editable-input-autofill` | `owc-input-autofill`  | [OwcClickEditableInputAutofill.js](./OwcClickEditableInputAutofill.js) |

## Usage

```js
import '@open-wc/components/define/owc-click-editable-input.js';
```

```js
html`<owc-click-editable-input
  type="number"
  .value=${42}
  .validator=${value => ({ valid: value >= 0, error: 'must not be negative' })}
  @submit=${ev => save(ev.target.value)}
></owc-click-editable-input>`;
```

`submit` fires when an edit is committed with a changed, valid value; `change`
fires while editing. `parsedValue` exposes the value parsed per `type`
(numbers, `Date`s - pure logic in [valueHelpers.js](./valueHelpers.js)).

## Features

- Type-aware parsing, formatting (`wa-format-date` for dates) and input
  round-tripping, including local-time date strings for native date inputs
- Custom `formatter` (return `nothing` to show the muted `fallbackValue`) and
  `validator` (blocks submit, shows the error as validation message)
- `read-only`, `show-copy-button`, `form-align`, `label`/`help-text` slots
- Autocomplete variant: `multiple`, `clearable`, `hide-select-all`, options
  via `.data`
- Used by `owc-table` and `owc-data-detail` for their editable cells

## Docs & demos

Live demos per variant: [Input](./OwcClickEditableInput.rocket.md),
[Textarea](./OwcClickEditableTextarea.rocket.md),
[Autocomplete](./OwcClickEditableAutocomplete.rocket.md),
[Input Autofill](./OwcClickEditableInputAutofill.rocket.md). The shared API
reference lives on the Input page (`/click-editable-input/`).

## Files

- [OwcClickEditable.js](./OwcClickEditable.js) - base class (edit lifecycle, validation, events)
- [valueHelpers.js](./valueHelpers.js) - pure type parsing/date formatting helpers
- [OwcClickEditable.types.ts](./OwcClickEditable.types.ts) - public option types
- [OwcClickEditable.test-browser.js](./OwcClickEditable.test-browser.js) - browser tests for the family (`npx web-test-runner src/click-editable/OwcClickEditable.test-browser.js`)
- [valueHelpers.test.js](./valueHelpers.test.js) - logic tests (`node --test src/click-editable/`)
