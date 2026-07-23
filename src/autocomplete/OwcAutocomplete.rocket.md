```js server
export const config = {
  path: '/forms/autocomplete',
  title: 'Autocomplete',
  menu: {
    parent: '/forms',
    order: 20,
    iconName: 'search',
  },
};

import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';

import '@open-wc/components/define/owc-autocomplete.js';
```

# Autocomplete

Autocomplete for a feature rich dropdown.

Simple example:

Select a single option from the `.data` property with autocomplete functionality.

```js demo
export const singleSelect = () => {
  return html`
    <owc-autocomplete
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    ></owc-autocomplete>
  `;
};
```

## Multi Select

Select multiple options with the `multiple` attribute from the `.data` property with autocomplete functionality.

```js demo
export const multiSelect = () => {
  return html`
    <owc-autocomplete
      multiple
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
        { label: 'Zürich', value: '103' },
        { label: 'Helvetia', value: '104' },
        { label: 'Schellhammer', value: '105' },
      ]}
    ></owc-autocomplete>
  `;
};
```

## Multi Select Fill Mode

For Autocompletes with multiple you can enter a special "fill mode" in which you can paste space, comma, newline, tab formatted entries and those will be selected if they match the label or value of an option. (This also works copying from excel)

Try clicking the "Search Icon" and write/paste "100 104 102". You will see VAV, Helvetia and UNIQA be selected.
You can do the same by pasting for example "VAV,Helvetia,UNIQA" or "["100","104","102"]".

```js demo
export const multiSelectFillMode = () => {
  return html`
    <owc-autocomplete
      multiple
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
        { label: 'Zürich', value: '103' },
        { label: 'Helvetia', value: '104' },
        { label: 'Schellhammer', value: '105' },
      ]}
    ></owc-autocomplete>
  `;
};
```

## Select by default

The `value` attribute selects the provided options by default.

```js demo
export const selectByDefault = () => {
  return html`
    <owc-autocomplete
      value="102 103 104"
      multiple
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
        { label: 'Zürich', value: '103' },
        { label: 'Helvetia', value: '104' },
        { label: 'Schellhammer', value: '105' },
      ]}
    ></owc-autocomplete>
  `;
};
```

## Limit selected options visible

The `max-options-visible` attribute limits how many selected options are shown.

```js demo
export const maxVisible = () => {
  return html`
    <owc-autocomplete
      max-options-visible="2"
      multiple
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
        { label: 'Zürich', value: '103' },
        { label: 'Helvetia', value: '104' },
        { label: 'Schellhammer', value: '105' },
      ]}
    ></owc-autocomplete>
  `;
};
```

## Hide select all button

The `hide-select-all` attribute hides the button to select all possible options.

```js demo
export const hideSelect = () => {
  return html`
    <owc-autocomplete
      hide-select-all
      multiple
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
        { label: 'Zürich', value: '103' },
        { label: 'Helvetia', value: '104' },
        { label: 'Schellhammer', value: '105' },
      ]}
    ></owc-autocomplete>
  `;
};
```

## Placeholder

The text of the `placeholder` attribute is shown if no option is selected.

```js demo
export const placeholder = () => {
  return html`
    <owc-autocomplete
      placeholder="Choose one..."
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    ></owc-autocomplete>
  `;
};
```

## Accent Bar

The `accent-bar` attribute renders a small colored bar in front of each option (and the selected
option). The color is taken from the option's `accentBarColor` field - customize this by
setting the `.getAccentBarColor` property.

```js demo
export const accentBar = () => {
  return html`
    <owc-autocomplete
      accent-bar
      .getAccentBarColor=${row => row.accentBarColor}
      .data=${[
        { label: 'VAV', value: '100', accentBarColor: '#8247f5' },
        { label: 'Standard Life', value: '101', accentBarColor: '#00acc1' },
        { label: 'UNIQA', value: '102', accentBarColor: '#f97316' },
      ]}
    ></owc-autocomplete>
  `;
};
```

## Open externally

To open the dropdown call a function that sets `.open` to `true`. In this case there is an Open button with an event handler.

```js demo
export const openExternally = () => {
  return html`
    <owc-autocomplete
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    ></owc-autocomplete>
    <wa-button
      size="s"
      @click=${() => {
        const buttonOpen = document
          .querySelector('[demo-name=openExternally]')
          ?.shadowRoot?.querySelector('owc-autocomplete');
        if (buttonOpen) {
          buttonOpen.open = true;
        }
      }}
      >Open</wa-button
    >
  `;
};
```

## Disabled

The `disabled` attribute disables the dropdown.

```js demo
export const disabled = () => {
  return html`
    <owc-autocomplete
      disabled
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    ></owc-autocomplete>
  `;
};
```

## Clear button

The `with-clear` attribute adds a button that clears the selected options. It is only shown
while at least one option is selected.

```js demo
export const withClear = () => {
  return html`
    <owc-autocomplete
      with-clear
      value="101"
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    ></owc-autocomplete>
  `;
};
```

## Label

The `label` attribute adds label above the dropdown.

```js demo
export const label = () => {
  return html`
    <owc-autocomplete
      label="Options"
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    ></owc-autocomplete>
  `;
};
```

## Help text

The `hint` attribute adds a help text below the dropdown.

```js demo
export const helpText = () => {
  return html`
    <owc-autocomplete
      hint="Choose an option to continue..."
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    ></owc-autocomplete>
  `;
};
```

## Fixed Trigger

If you just want Autocomplete functionality but don't need to display the values in the form itself, you can use the `fixed-trigger` attribute to instead just display a slot.

```js demo
export const fixedTrigger = () => {
  return html`
    <owc-autocomplete
      fixed-trigger
      multiple
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    >
      <wa-icon name="gear"></wa-icon>Choices
    </owc-autocomplete>
  `;
};
```

## Size

The `size` attribute sets the height of the dropdown. Possible options are `small`, `medium` and `large`. The default is `medium`.

```js demo
export const size = () => {
  return html`
    <owc-autocomplete
      size="s"
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    ></owc-autocomplete>
    <br />
    <owc-autocomplete
      size="m"
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    ></owc-autocomplete>
    <br />
    <owc-autocomplete
      size="l"
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    ></owc-autocomplete>
  `;
};
```

## Number

You can also use numbers as values.

```js demo
export const number = () => {
  return html`
    <owc-autocomplete
      .data=${[
        { label: 'VAV', value: 100 },
        { label: 'Standard Life', value: 101 },
        { label: 'UNIQA', value: 102 },
      ]}
      .value=${100}
    ></owc-autocomplete>
  `;
};
```

## Events

Listen to `change` to react to selections. The element's `value` property always holds the
current selection - a single value, or an array of values when `multiple` is set.

```js demo
export const changeEvent = () => {
  return html`
    <owc-autocomplete
      multiple
      @change=${ev => {
        const out = ev.currentTarget.parentElement.querySelector('#change-event-out');
        out.textContent = `value: ${JSON.stringify(ev.currentTarget.value)}`;
      }}
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    ></owc-autocomplete>
    <pre id="change-event-out">value: []</pre>
  `;
};
```

## Keyboard interaction

While the dropdown is open:

- `ArrowDown` / `ArrowUp` move the highlighted option (wrapping around)
- `Home` / `End` jump to the first / last option
- `Enter` selects the highlighted option - if the search filters down to a single option, `Enter` selects it directly
- `Escape` or `Tab` close the dropdown

While the combobox is focused and closed, any typing key opens the dropdown and focuses the search input.

## API

### Attributes & properties

| Attribute             | Property                    | Type                              | Default              | Description                                                                                                |
| --------------------- | --------------------------- | --------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------- |
| -                     | `data`                      | `Array<T>`                        | `[]`                 | The options. Each option needs a `label` and a `value` field (see `getOptionValue`).                       |
| `value`               | `value`                     | `unknown \| unknown[]`            | -                    | The selected value(s). As an attribute: a space separated list. As a property: a single value or an array. |
| `multiple`            | `multiple`                  | `boolean`                         | `false`              | Allow selecting multiple options; selections are rendered as removable tags.                               |
| `open`                | `open`                      | `boolean`                         | `false`              | Whether the dropdown is open.                                                                              |
| `disabled`            | `disabled`                  | `boolean`                         | `false`              | Disables the control.                                                                                      |
| `required`            | `required`                  | `boolean`                         | `false`              | Marks the internal form input as required.                                                                 |
| `label`               | `label`                     | `string`                          | `''`                 | Label rendered above the control (alternative: `label` slot).                                              |
| `hint`                | `hint`                      | `string`                          | `''`                 | Help text rendered below the control (alternative: `hint` slot).                                           |
| `placeholder`         | `placeholder`               | `string`                          | `''`                 | Text shown while nothing is selected.                                                                      |
| `placement`           | `placement`                 | `'top' \| 'bottom'`               | `'bottom'`           | Preferred dropdown placement.                                                                              |
| `size`                | `size`                      | `'small' \| 'medium' \| 'large'`  | `'medium'`           | Size of the control.                                                                                       |
| `with-clear`          | `withClear`                 | `boolean`                         | `false`              | Show a clear button while at least one option is selected.                                                 |
| `accent-bar`          | `accentBar`                 | `boolean`                         | `false`              | Render a colored accent bar per option (see `getAccentBarColor`).                                          |
| `max-options-visible` | `maxOptionsVisible`         | `number`                          | `3`                  | Max number of tags shown when `multiple`; further selections collapse into a `+N` tag. `0` shows all.      |
| `hide-select-all`     | `hideSelectAll`             | `boolean`                         | `false`              | Hide the select all/deselect all button (only rendered when `multiple`).                                   |
| `fill-mode`           | `fillMode`                  | `boolean`                         | `false`              | Paste mode: the search input selects all options matching the pasted values/labels.                        |
| `fixed-trigger`       | `fixedTrigger`              | `boolean`                         | `false`              | Render the default slot as trigger instead of the form control.                                            |
| -                     | `maxDropdownOptionsVisible` | `number`                          | `200`                | Max number of options rendered in the dropdown list.                                                       |
| -                     | `syncWidth`                 | `boolean`                         | `true`               | Sync the dropdown width with the trigger width.                                                            |
| -                     | `currentValue`              | `unknown`                         | `''`                 | Value of the keyboard-highlighted option.                                                                  |
| -                     | `getOptionValue`            | `(row: T) => unknown`             | `row.value`          | Extracts the value of an option.                                                                           |
| -                     | `getAccentBarColor`         | `(row: T) => string \| undefined` | `row.accentBarColor` | Extracts the accent bar color of an option.                                                                |
| -                     | `getTag`                    | `(option: T) => TemplateResult`   | -                    | Customizes the tag rendered per selection when `multiple`.                                                 |
| -                     | `footer`                    | `() => TemplateResult`            | -                    | Renders extra content at the bottom of the dropdown.                                                       |

### Events

| Event                    | Description                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| `change`                 | Fired whenever the selection changes (select, deselect, clear, select all, fill mode paste). |
| `input`                  | Fired when the selection is cleared via the clear button or a tag remove button.             |
| `autocomplete-selection` | Fired when an option is selected. `detail` is the selected option object. Bubbles/composed.  |
| `wa-show`                | Fired after the dropdown opened via `show()`.                                                |
| `wa-hide`                | Fired after the dropdown closed via `hide()`.                                                |

### Methods

| Method             | Description                                      |
| ------------------ | ------------------------------------------------ |
| `show()`           | Opens the dropdown (no-op when already open).    |
| `hide()`           | Closes the dropdown.                             |
| `toggle()`         | Toggles the dropdown.                            |
| `focus()`          | Opens the dropdown and focuses the search input. |
| `clear()`          | Deselects all options (does not fire `change`).  |
| `toggleFillMode()` | Switches between search filtering and fill mode. |

### Slots

| Slot          | Description                                                   |
| ------------- | ------------------------------------------------------------- |
| `label`       | The label (alternative to the `label` attribute).             |
| `hint`        | The help text (alternative to the `hint` attribute).          |
| `start`       | Content placed before the selected value inside the combobox. |
| `end`         | Content placed after the selected value inside the combobox.  |
| `clear-icon`  | Replaces the default clear icon.                              |
| `expand-icon` | Replaces the default chevron icon.                            |
| (default)     | The trigger content when `fixed-trigger` is set.              |
