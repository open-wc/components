```js server
export const config = {
  path: '/components/click-editable-input-autofill',
  title: 'Click Editable Input Autofill',
  menu: {
    order: 30,
  },
};
import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';

import '@open-wc/components/define/owc-click-editable-input-autofill.js';
```

# Click Editable Input Autofill

A input field with inputAutofill options that is editable through double clicking.

Example:

The `<owc-click-editable-input-autofill>` element is the input field with inputAutofill options. Add options with a `label` and `value` property in the `.data` attribute. Add a default option with the `value` attribute.

```js demo
export const simpleInputAutofillField = () => {
  return html`
    <owc-click-editable-input-autofill
      id="simpleInputAutofill"
      value="Grape"
      .data=${[
        { label: 'Apple', value: 'Apple' },
        { label: 'Banana', value: 'Banana' },
        { label: 'Grape', value: 'Grape' },
        { label: 'Strawberry', value: 'Strawberry' },
      ]}
    ></owc-click-editable-input-autofill>
  `;
};
```

## Read Only

Use the `read-only` attribute to set a field to be read only.

```js demo
export const notEditableField = () => {
  return html`
    <owc-click-editable-input-autofill
      id="inputAutofill"
      value="Banana"
      read-only
      .data=${[
        { label: 'Apple', value: 'Apple' },
        { label: 'Banana', value: 'Banana' },
        { label: 'Grape', value: 'Grape' },
        { label: 'Strawberry', value: 'Strawberry' },
      ]}
    ></owc-click-editable-input-autofill>
  `;
};
```

## Copy Button

Use the `show-copy-button` attribute display a copy button next to the field.

```js demo
export const copyButtonField = () => {
  return html`
    <owc-click-editable-input-autofill
      id="inputAutofill"
      value="Banana"
      show-copy-button
      .data=${[
        { label: 'Apple', value: 'Apple' },
        { label: 'Banana', value: 'Banana' },
        { label: 'Grape', value: 'Grape' },
        { label: 'Strawberry', value: 'Strawberry' },
      ]}
    ></owc-click-editable-input-autofill>
  `;
};
```

## Custom Formatter

To implement the custom formatter use the `.formatter` attribute and define a custom formatter function.

```js demo
export const formatterField = () => {
  return html`
    <owc-click-editable-input-autofill
      id="inputAutofill"
      .formatter=${value => (value ? html`Selected Date: ${value}` : html`No Date Selected`)}
      .data=${[
        { label: 'Today', value: 'Today' },
        { label: 'Tomorrow', value: 'Tomorrow' },
        { label: 'Yesterday', value: 'Yesterday' },
      ]}
    ></owc-click-editable-input-autofill>
  `;
};
```

## Label

Use the `label` slot attribute to add a label.

```js demo
export const labelInputAutofillField = () => {
  return html`
    <owc-click-editable-input-autofill
      id="multipleInputAutofill"
      value="Grape"
      .data=${[
        { label: 'Apple', value: 'Apple' },
        { label: 'Banana', value: 'Banana' },
        { label: 'Grape', value: 'Grape' },
        { label: 'Strawberry', value: 'Strawberry' },
      ]}
    >
      <div slot="label">Frut:</div>
    </owc-click-editable-input-autofill>
  `;
};
```

## Edit externally

To simulate a double click call a function that sets `.editable` and `.open` to `true`. In this case there is an edit button with an event handler. This will not be affected by the `read-only` attribute.

```js demo
export const buttonInputAutofillField = () => {
  return html`
    <owc-click-editable-input-autofill
      id="buttonInputAutofill"
      .data=${[
        { label: 'Apple', value: 'Apple' },
        { label: 'Banana', value: 'Banana' },
        { label: 'Grape', value: 'Grape' },
        { label: 'Strawberry', value: 'Strawberry' },
      ]}
    ></owc-click-editable-input-autofill>
    <wa-button
      variant="brand"
      style="margin-top: 20px"
      size="small"
      @click=${() => {
        const buttonInputAutofill = document
          .querySelector('[demo-name=buttonInputAutofillField]')
          ?.shadowRoot?.querySelector('owc-click-editable-input-autofill');
        if (buttonInputAutofill) {
          buttonInputAutofill.editable = true;
          buttonInputAutofill.focus();
        }
      }}
      >Edit</wa-button
    >
  `;
};
```
