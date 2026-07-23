```js server
export const config = {
  path: '/forms/click-editable-input',
  title: 'Click Editable Input',
  menu: {
    parent: '/forms',
    order: 50,
    iconName: 'input-cursor',
  },
};
import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html, nothing } from 'lit';

import '@open-wc/components/define/owc-click-editable-input.js';
```

# Click Editable Input

An input field that is editable through double clicking: it renders as plain text until the
user double clicks (or presses Enter/Space on the focused text), then turns into an input in
place. Enter or blur submits, Escape cancels and restores the previous value.

Example:

Use `type` to set an input type like `text` and the `value` attribute to set a default text.

```js demo
export const sampleField = () => {
  return html`
    <owc-click-editable-input
      id="textSample"
      type="text"
      value="Double click to edit!"
    ></owc-click-editable-input>
  `;
};
```

## Read Only

Use the `read-only` attribute to set a field to be read only.

```js demo
export const notEditableField = () => {
  return html`
    <owc-click-editable-input
      id="textReadOnly"
      type="text"
      value="This is read only"
      read-only
    ></owc-click-editable-input>
  `;
};
```

## Copy Button

Use the `show-copy-button` attribute display a copy button next to the field.

```js demo
export const copyButtonField = () => {
  return html`
    <owc-click-editable-input
      id="textCopyButton"
      type="text"
      value="Copy This!"
      show-copy-button
    ></owc-click-editable-input>
  `;
};
```

## Align

Set the `form-align` attribute to `start`, `center` or `end` to align the text in the field while editing.

```js demo
export const alignField = () => {
  return html`
    <owc-click-editable-input
      id="textAlign"
      type="text"
      value="This is aligned to start"
      form-align="start"
    ></owc-click-editable-input>
    <br />
    <div style="text-align: center">
      <owc-click-editable-input
        id="textAlign"
        type="text"
        value="This is aligned to center"
        form-align="center"
      ></owc-click-editable-input>
    </div>
  `;
};
```

## Fallback Value

Fallback value specifies the displayed value, if input value is blank, not given or undefined etc.

```js demo
export const fallbackField = () => {
  return html`
    <owc-click-editable-input
      id="textSample"
      type="text"
      value=""
      fallbackValue="Double click to edit!"
    ></owc-click-editable-input>
  `;
};
```

## Custom Validator

To implement the custom validator use the `.validator` attribute and define a custom validation function.

```js demo
export const validatorField = () => {
  return html`
    <owc-click-editable-input
      id="custom-validator"
      type="text"
      value="This Doesn't start with 'B'"
      .validator=${value => {
        return { valid: value.startsWith('B'), error: 'Does not start with B' };
      }}
    ></owc-click-editable-input>
  `;
};
```

## Custom Formatter

To implement the custom formatter use the `.formatter` attribute and define a custom formatter function.

```js demo
export const formatterField = () => {
  return html`
    <owc-click-editable-input
      id="text-formatted"
      type="url"
      value="https://example.com"
      .formatter=${value => html`<a href="${value}">${value}</a> 🔗`}
    ></owc-click-editable-input>
  `;
};
```

## Custom Formatter with Fallback Value

If you use custom formatter and there is no value, "else" part must be undefined, null or nothing to see the selected fallback value

```js demo
export const formatterWithFallbackField = () => {
  return html`
    <owc-click-editable-input
      id="text-formatted"
      type="url"
      value=""
      fallbackValue="Double click to edit!"
      .formatter=${value => (value ? html`<a href="${value}">${value}</a> 🔗` : nothing)}
    ></owc-click-editable-input>
  `;
};
```

## Input Types

Set `type` to change the type of the input and how it is displayed.

### Text and Number

```js demo
export const textField = () => {
  return html`
    <owc-click-editable-input id="text" type="text" value="Sample Text"></owc-click-editable-input>
    <br />
    <owc-click-editable-input id="number" type="number" value="100"></owc-click-editable-input>
  `;
};
```

### Date and Time

```js demo
export const dateTimeTypes = () => {
  return html`
    <owc-click-editable-input id="time" type="time" value="12:00"></owc-click-editable-input>
    <br />
    <owc-click-editable-input
      id="date"
      type="date"
      .value=${new Date('01-01-2001')}
    ></owc-click-editable-input>
    <br />
    <owc-click-editable-input
      id="datetime-local"
      type="datetime-local"
      value="2024-01-01T12:00"
    ></owc-click-editable-input>
  `;
};
```

### Web and Phone

```js demo
export const urlField = () => {
  return html`
    <owc-click-editable-input
      id="url"
      type="url"
      value="https://example.com"
    ></owc-click-editable-input>
    <br />
    <owc-click-editable-input
      id="email"
      type="email"
      value="user@example.com"
    ></owc-click-editable-input>
    <br />
    <owc-click-editable-input
      id="password"
      type="password"
      value="password123"
    ></owc-click-editable-input>
    <br />
    <owc-click-editable-input
      id="search"
      type="search"
      value="Search Query"
    ></owc-click-editable-input>
    <br />
    <owc-click-editable-input id="tel" type="tel" value="+1234567890"></owc-click-editable-input>
  `;
};
```

## Edit externally

To simulate a double click call a function that sets `.editable` to `true` and calls the `focus()` function. In this case there is an edit button with an event handler. This will not be affected by the `read-only` attribute.

```js demo
export const buttonField = () => {
  return html`
    <owc-click-editable-input id="textButton" type="text"></owc-click-editable-input>
    <wa-button
      variant="brand"
      style="margin-top: 20px"
      size="s"
      @click=${() => {
        const buttonAutocomplete = document
          .querySelector('[demo-name=buttonField]')
          ?.shadowRoot?.querySelector('owc-click-editable-input');
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

## API

This API is shared by the whole click-editable family:
[Input](/click-editable-input/), [Textarea](/click-editable-textarea/),
[Autocomplete](/click-editable-autocomplete/) and
[Input Autofill](/click-editable-input-autofill/).

### Attributes & properties

| Attribute          | Property         | Type                                                  | Default   | Description                                                                          |
| ------------------ | ---------------- | ----------------------------------------------------- | --------- | ------------------------------------------------------------------------------------ |
| `value`            | `value`          | `string \| number \| Date \| Array`                   | `''`      | The current value. For `date`/`datetime-local` a `Date` instance works best.         |
| `type`             | `type`           | input types like `text`, `number`, `date`, ...        | `'text'`  | Type of the inner input; also controls parsing (`parsedValue`) and formatting.       |
| `editable`         | `editable`       | `boolean`                                             | `false`   | Whether the field is currently in edit mode. Reflected.                              |
| `read-only`        | `readOnly`       | `boolean`                                             | `false`   | Prevents entering edit mode via click/keyboard. Reflected.                           |
| `fallbackValue`    | `fallbackValue`  | `string`                                              | `'-'`     | Shown (muted) when there is no value.                                                |
| `show-copy-button` | `showCopyButton` | `boolean`                                             | `false`   | Adds a copy button next to the value. Reflected.                                     |
| `form-align`       | `formAlign`      | `'start' \| 'center' \| 'end'`                        | `'start'` | Text alignment of the input while editing.                                           |
| -                  | `formatter`      | `(parsedValue) => TemplateResult`                     | built-in  | Renders the display value. Return `undefined`/`null`/`nothing` to show the fallback. |
| -                  | `validator`      | `(parsedValue) => { valid: boolean, error?: string }` | -         | Blocks submitting while invalid; `error` is shown as validation message.             |

### Events & methods

| Member        | Description                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------- |
| `submit`      | Event fired when an edit is committed with a changed, valid value (Enter or blur).             |
| `change`      | Event fired while the value changes during editing, and when Escape restores a modified value. |
| `focus()`     | Focuses the input (edit mode) or the display text.                                             |
| `parsedValue` | The value parsed according to `type` (number, `Date`, ...).                                    |

### Slots

| Slot        | Description                         |
| ----------- | ----------------------------------- |
| `label`     | Label rendered above the value.     |
| `help-text` | Help text rendered below the value. |
