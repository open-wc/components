# Input Autofill

`<owc-input-autofill>` pairs a free-text input with an autocomplete dropdown:
typing stays free text, picking an option replaces the input with the option's
`value`. Use it when a field usually holds a known value (an ID, a code) but
must still accept anything - it backs `owc-click-editable-input-autofill`.

## Usage

```js
import '@open-wc/components/define/owc-input-autofill.js';
```

```js
html`<owc-input-autofill
  label="ID of a company"
  @change=${ev => console.log(ev.target.value)}
  .data=${[
    { label: 'VAV', value: '100' },
    { label: 'Standard Life', value: '101' },
  ]}
></owc-input-autofill>`;
```

## Features

- Free text and option picking in one field; the `value` property always holds
  the current text
- A value that exactly matches an option shows as selected in the dropdown
  (pure logic in [optionHelpers.js](./optionHelpers.js)); free text clears the
  dropdown selection
- Options with an empty `label` stay selectable - the label is display only
- `input` fires while typing; `change` fires (bubbling, composed) when an
  option is picked or typed text is committed
- Typing in the dropdown's internal search field does not leak `input` events
  to consumers

## Docs & demos

See [OwcInputAutofill.rocket.md](./OwcInputAutofill.rocket.md) for live demos
and the full API reference; published on the docs site under
`/input-autofill/`.

## Files

- [OwcInputAutofill.js](./OwcInputAutofill.js) - the component
- [optionHelpers.js](./optionHelpers.js) - pure option matching/validation logic
- [OwcInputAutofill.types.ts](./OwcInputAutofill.types.ts) - option types
- [OwcInputAutofill.test-browser.js](./OwcInputAutofill.test-browser.js) - browser tests (`npx web-test-runner src/input-autofill/OwcInputAutofill.test-browser.js`)
- [optionHelpers.test.js](./optionHelpers.test.js) - logic tests (`node --test src/input-autofill/optionHelpers.test.js`)
