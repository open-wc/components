```js server
export const config = {
  path: '/forms/input-autofill',
  title: 'Input Autofill',
  menu: {
    parent: '/forms',
    order: 30,
    iconName: 'magic',
  },
};

import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';

import '@open-wc/components/define/owc-input-autofill.js';
```

# Input Autofill

A free-text input paired with an autocomplete dropdown. Typing stays free text; picking an
option from the dropdown replaces the input with the option's `value`. Use it when a field
usually holds a known value (an ID, a code) but must still accept anything.

When the current value matches an option exactly, that option shows as selected in the
dropdown; free text that matches no option clears the dropdown selection.

```js demo
export const simple = () => {
  return html`
    <owc-input-autofill
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    ></owc-input-autofill>
  `;
};
```

## Label & placeholder

The `label` is forwarded to the text input; the dropdown aligns itself next to it.

```js demo
export const label = () => {
  return html`
    <owc-input-autofill
      label="ID of a company"
      placeholder="type an ID or pick a company"
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    ></owc-input-autofill>
  `;
};
```

## Preselected value

Set `value` to prefill the input. If it matches an option's `value`, the dropdown marks
that option as selected.

```js demo
export const preselected = () => {
  return html`
    <owc-input-autofill
      value="101"
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    ></owc-input-autofill>
  `;
};
```

## Events

An `input` event fires while typing free text. A `change` event fires when an option is
picked from the dropdown or typed text is committed (on blur). Read the current value from
`ev.target.value`.

```js demo
export const events = () => {
  return html`
    <owc-input-autofill
      @input=${ev => {
        const out = ev.currentTarget.parentElement.querySelector('#input-autofill-out');
        out.textContent = `input: ${JSON.stringify(ev.target.value)}`;
      }}
      @change=${ev => {
        const out = ev.currentTarget.parentElement.querySelector('#input-autofill-out');
        out.textContent = `change: ${JSON.stringify(ev.target.value)}`;
      }}
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    ></owc-input-autofill>
    <pre id="input-autofill-out">value: ""</pre>
  `;
};
```

## API

### Attributes & properties

| Property      | Type       | Default | Description                                                |
| ------------- | ---------- | ------- | ---------------------------------------------------------- |
| `data`        | `Option[]` | `[]`    | The options offered in the dropdown.                       |
| `value`       | `string`   | `''`    | The current text - free text or a picked option's `value`. |
| `label`       | `string`   | `''`    | Label shown above the text input.                          |
| `placeholder` | `string`   | `''`    | Placeholder for the text input.                            |
| `open`        | `boolean`  | `false` | Whether the dropdown is open; reflected as an attribute.   |

### Option config

Importable as `OwcInputAutofillOption` from `@open-wc/components/OwcInputAutofill.types.js`.

| Field   | Type     | Description                                         |
| ------- | -------- | --------------------------------------------------- |
| `value` | `string` | Written into the input when the option is picked.   |
| `label` | `string` | Shown in the dropdown list; may be an empty string. |

### Events

| Event    | Description                                                                  |
| -------- | ---------------------------------------------------------------------------- |
| `input`  | Fired while the user types free text.                                        |
| `change` | Fired when an option is picked from the dropdown or typed text is committed. |

### Methods

| Method    | Description             |
| --------- | ----------------------- |
| `focus()` | Focuses the text input. |
