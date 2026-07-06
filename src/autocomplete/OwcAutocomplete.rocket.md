```js server
export const config = {
  path: '/autocomplete',
  title: 'Autocomplete',
  menu: {
    parent: 'forms',
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
export const singeSelect = () => {
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

Try clicking the "Search Icon" and write/paste "100 104 102". You will see VAV, UNIQA and Shellhammer be selected.
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

The text of the `placeholder` attribute is shown if no option is selected.

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
      size="small"
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

The `clearable` attribute adds a button that clears the selected options.

```js demo
export const clearable = () => {
  return html`
    <owc-autocomplete
      clearable
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

I you just want Autocomplete functionality but don't need to display the values in the form itself, you can use the `fixed-trigger` property to instead just display a slot.

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
      size="small"
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    ></owc-autocomplete>
    <br />
    <owc-autocomplete
      size="medium"
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    ></owc-autocomplete>
    <br />
    <owc-autocomplete
      size="large"
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
