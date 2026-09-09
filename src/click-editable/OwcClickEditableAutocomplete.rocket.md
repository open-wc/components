```js server
export const config = {
  path: '/forms/click-editable-autocomplete',
  title: 'Click Editable Autocomplete',
  menu: {
    parent: '/forms',
    order: 70,
    iconName: 'menu-button-wide',
  },
};
import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';

import '@open-wc/components/define/owc-click-editable-autocomplete.js';
```

# Click Editable Autocomplete

An input field with autocomplete options that is editable through double clicking. See the
[Click Editable Input API](/click-editable-input/#api) for the shared attributes, events and
slots.

Example:

The `<owc-click-editable-autocomplete>` element is the input field with autocomplete options. Add options with a `label` and `value` property in the `.data` attribute. Add a default option with the `value` attribute.

```js demo
export const simpleAutocompleteField = () => {
  return html`
    <owc-click-editable-autocomplete
      id="simpleAutocomplete"
      value="103"
      .data=${[
        { label: 'Apple', value: '100' },
        { label: 'Banana', value: '101' },
        { label: 'Grape', value: '102' },
        { label: 'Strawberry', value: '103' },
      ]}
    ></owc-click-editable-autocomplete>
  `;
};
```

## Read Only

Use the `read-only` attribute to set a field to be read only.

```js demo
export const notEditableField = () => {
  return html`
    <owc-click-editable-autocomplete
      id="autocomplete"
      value="102"
      read-only
      .data=${[
        { label: 'Apple', value: '100' },
        { label: 'Banana', value: '101' },
        { label: 'Grape', value: '102' },
        { label: 'Strawberry', value: '103' },
      ]}
    ></owc-click-editable-autocomplete>
  `;
};
```

## Copy Button

Use the `show-copy-button` attribute display a copy button next to the field.

```js demo
export const copyButtonField = () => {
  return html`
    <owc-click-editable-autocomplete
      id="autocomplete"
      value="102"
      show-copy-button
      .data=${[
        { label: 'Apple', value: '100' },
        { label: 'Banana', value: '101' },
        { label: 'Grape', value: '102' },
        { label: 'Strawberry', value: '103' },
      ]}
    ></owc-click-editable-autocomplete>
  `;
};
```

## Custom Formatter

To implement the custom formatter use the `.formatter` attribute and define a custom formatter function.

```js demo
export const formatterField = () => {
  return html`
    <owc-click-editable-autocomplete
      id="autocomplete"
      .formatter=${value => (value ? html`Selected Date: ${value}` : html`No Date Selected`)}
      .data=${[
        { label: 'Today', value: '28.01' },
        { label: 'Tomorrow', value: '29.01' },
        { label: 'Yesterday', value: '27.01' },
      ]}
    ></owc-click-editable-autocomplete>
  `;
};
```

## Clearable

Use the `clearable` attribute to add a button next to the selected option, that clears the selection.

```js demo
export const clearableAutocompleteField = () => {
  return html`
    <owc-click-editable-autocomplete
      id="clearableAutocomplete"
      value="100"
      clearable
      .data=${[
        { label: 'Apple', value: '100' },
        { label: 'Banana', value: '101' },
        { label: 'Grape', value: '102' },
        { label: 'Strawberry', value: '103' },
      ]}
    ></owc-click-editable-autocomplete>
  `;
};
```

## Multi-Select

Use the `multiple` attribute to enable multi-select.

```js demo
export const multipleAutocompleteField = () => {
  return html`
    <owc-click-editable-autocomplete
      id="multipleAutocomplete"
      value="103"
      multiple
      .data=${[
        { label: 'Apple', value: '100' },
        { label: 'Banana', value: '101' },
        { label: 'Grape', value: '102' },
        { label: 'Strawberry', value: '103' },
      ]}
    ></owc-click-editable-autocomplete>
  `;
};
```

## Hide Select All

Use the `hide-select-all` attribute to hide the "Select All" button in the multi-select window.

```js demo
export const hideSelectAutocompleteField = () => {
  return html`
    <owc-click-editable-autocomplete
      id="multipleAutocomplete"
      value="103"
      multiple
      hide-select-all
      .data=${[
        { label: 'Apple', value: '100' },
        { label: 'Banana', value: '101' },
        { label: 'Grape', value: '102' },
        { label: 'Strawberry', value: '103' },
      ]}
    ></owc-click-editable-autocomplete>
  `;
};
```

## Label

Use the `label` slot to add a label.

```js demo
export const labelAutocompleteField = () => {
  return html`
    <owc-click-editable-autocomplete
      id="multipleAutocomplete"
      value="103"
      .data=${[
        { label: 'Apple', value: '100' },
        { label: 'Banana', value: '101' },
        { label: 'Grape', value: '102' },
        { label: 'Strawberry', value: '103' },
      ]}
    >
      <div slot="label">Fruit:</div>
    </owc-click-editable-autocomplete>
  `;
};
```

## Edit externally

To simulate a double click call a function that sets `.editable` and `.open` to `true`. In this case there is an edit button with an event handler. This will not be affected by the `read-only` attribute.

```js demo
export const buttonAutocompleteField = () => {
  return html`
    <owc-click-editable-autocomplete
      id="buttonAutocomplete"
      .data=${[
        { label: 'Apple', value: '100' },
        { label: 'Banana', value: '101' },
        { label: 'Grape', value: '102' },
        { label: 'Strawberry', value: '103' },
      ]}
    ></owc-click-editable-autocomplete>
    <wa-button
      variant="brand"
      style="margin-top: 20px"
      size="s"
      @click=${() => {
        const buttonAutocomplete = document
          .querySelector('[demo-name=buttonAutocompleteField]')
          ?.shadowRoot?.querySelector('owc-click-editable-autocomplete');
        if (buttonAutocomplete) {
          buttonAutocomplete.editable = true;
          buttonAutocomplete.open = true;
        }
      }}
      >Edit</wa-button
    >
  `;
};
```

## Manual Width

You can use the variable `--owc-autocomplete-popover-width` to manually set the width of the autocompletes dropdown. This is useful when sync does not work, or the dropdown width needs to be significantly larger than the form field.

```js demo
export const manualWidth = () => {
  return html`
    <owc-click-editable-autocomplete
      style="--owc-autocomplete-popover-width: 500px"
      .data=${[
        { label: 'Today', value: '28.01' },
        { label: 'Tomorrow', value: '29.01' },
        { label: 'Yesterday', value: '27.01' },
        { label: 'This is a really long option, his may not fit in the usual box', value: '30' },
      ]}
    ></owc-click-editable-autocomplete>
  `;
};
```

## Number

You can also use numbers as values. Labels are looked up loosely, so a string value `'100'`
finds an option with the numeric value `100` and vice versa.

```js demo
export const number = () => {
  return html`
    <owc-click-editable-autocomplete
      .data=${[
        { label: 'VAV', value: 100 },
        { label: 'Standard Life', value: 101 },
        { label: 'UNIQA', value: 102 },
      ]}
      .value=${100}
    ></owc-click-editable-autocomplete>
  `;
};
```

## API

Shares the full [Click Editable Input API](/click-editable-input/#api) (formatter, validator,
`read-only`, `show-copy-button`, `form-align`, slots, `change`/`submit` events). Additional
attributes & properties:

| Property          | Type                      | Default | Description                                                                    |
| ----------------- | ------------------------- | ------- | ------------------------------------------------------------------------------ |
| `data`            | `Array<{ label, value }>` | `[]`    | The selectable options (property only). Reactive - may be loaded async.        |
| `value`           | `unknown` \| `unknown[]`  | `''`    | The selected option value; an array in `multiple` mode.                        |
| `multiple`        | `boolean`                 | `false` | Multi-select; selecting fires `change`, closing the dropdown submits.          |
| `clearable`       | `boolean`                 | `false` | Shows a clear button next to the selection.                                    |
| `hide-select-all` | `boolean`                 | `false` | Hides the "select all" button in `multiple` mode.                              |
| `open`            | `boolean` (property)      | `false` | Opens/closes the dropdown, e.g. together with `editable` for external editing. |

Values without a matching option are skipped in the display. The dropdown width can be fixed
via the `--owc-autocomplete-popover-width` CSS custom property (see "Manual Width").
