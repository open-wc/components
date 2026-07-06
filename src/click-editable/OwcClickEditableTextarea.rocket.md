```js server
export const config = {
  path: '/click-editable-textarea',
  title: 'Click Editable Textarea',
  menu: {
    parent: 'forms',
    order: 60,
    iconName: 'textarea-t',
  },
};
import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';

import '@open-wc/components/define/owc-click-editable-textarea.js';
```

# Click Editable Textarea

A text-area that is editable through double clicking.

Example:

The `<owc-click-editable-textarea>` element is the input field. Set an `id` and and use `type` to set an input type like `text`. Use the `value` attribute to set a default text.

```js demo
export const sampleField = () => {
  return html`
    <owc-click-editable-textarea
      id="areaSimple"
      value="Double click to edit this text area!"
    ></owc-click-editable-textarea>
  `;
};
```

## Read Only

Use the `read-only` attribute to set a the text area to be read only.

```js demo
export const notEditableField = () => {
  return html`
    <owc-click-editable-textarea
      id="areaSimple"
      value="This text area is read only"
      read-only
    ></owc-click-editable-textarea>
  `;
};
```

## Copy Button

Use the `show-copy-button` attribute display a copy button next to the field.

```js demo
export const copyButtonField = () => {
  return html`
    <owc-click-editable-textarea
      id="areaSimple"
      value="Copy this text area!"
      show-copy-button
    ></owc-click-editable-textarea>
  `;
};
```

## Align

Set the `formAlign` attribute to `start` or `center` to align the text in the field.

```js demo
export const alignField = () => {
  return html`
    <div>
      <owc-click-editable-textarea
        id="areaSimple"
        value="Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum."
        form-align="start"
      ></owc-click-editable-textarea>
    </div>
    <br />
    <div>
      <owc-click-editable-textarea
        id="areaSimple"
        value="Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum."
        form-align="center"
      ></owc-click-editable-textarea>
    </div>
  `;
};
```

## Custom Validator

To implement the custom validator use the `.validator` attribute and define a custom validation function.

```js demo
export const validatorField = () => {
  return html`
    <owc-click-editable-textarea
      id="custom-validator"
      value="If this TextArea is edited it isn't valid because the text exceeds 20 words, the limit that is defined in the validator"
      .validator=${value => {
        const wordCount = value.trim().split(/\s+/).length;
        if (wordCount) {
          return { valid: wordCount < 20, error: 'Word count exceeds 20' };
        }
      }}
    ></owc-click-editable-textarea>
  `;
};
```

## Custom Formatter

To implement the custom formatter use the `.formatter` attribute and define a custom formatter function.

```js demo
export const formatterField = () => {
  return html`
    <owc-click-editable-textarea
      id="text-formatted"
      value="Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat."
      .formatter=${value => html`✨<i>${value}</i>✨`}
    ></owc-click-editable-textarea>
  `;
};
```

## Edit externally

To simulate a double click call a function that sets `.editable` to `true` and calls the `focus()` function. In this case there is an edit button with an event handler. This will not be affected by the `read-only` attribute.

```js demo
export const buttonField = () => {
  return html`
    <owc-click-editable-textarea
      id="textButton"
      value="Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum."
    ></owc-click-editable-textarea>
    <wa-button
      variant="brand"
      style="margin-top: 20px"
      size="small"
      @click=${() => {
        const buttonAutocomplete = document
          .querySelector('[demo-name=buttonField]')
          ?.shadowRoot?.querySelector('owc-click-editable-textarea');
        if (buttonAutocomplete) {
          buttonAutocomplete.editable = true;
          buttonAutocomplete.focus();
        }
      }}
      >Edit</wa-button
    >
  `;
};
```

## Tabbable if open

If multiple textareas are editable you can tab from one to the next

```js demo
export const tabbable = () => {
  return html`
    <div>A:</div>
    <owc-click-editable-textarea editable class="tabbable-a"></owc-click-editable-textarea>
    <div>B:</div>
    <owc-click-editable-textarea editable class="tabbable-b"></owc-click-editable-textarea>
  `;
};
```
