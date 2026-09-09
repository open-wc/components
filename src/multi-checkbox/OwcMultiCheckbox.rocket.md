```js server
export const config = {
  path: '/forms/multi-checkbox',
  title: 'Multi Checkbox',
  menu: {
    parent: '/forms',
    order: 90,
    iconName: 'ui-checks',
  },
};
import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';

import '@open-wc/components/define/owc-multi-checkbox.js';
```

# Multi Checkbox

A list of checkboxes rendered as colored tags for selecting multiple values - used for
example by the table's checkbox filters. Options can be grouped; a group gets its own
select-all checkbox with an indeterminate state.

The selection lives in the `value` property, which has the shape of a table JSON filter
condition: `{ value: [...], operator: 'equal', field: '...' }`.

```js demo
export const simple = () => {
  return html`
    <owc-multi-checkbox
      .options=${[
        { value: 300, label: 'Passiv' },
        { value: 400, label: 'Archive' },
      ]}
    ></owc-multi-checkbox>
  `;
};
```

## Preselected values

Pass a `value` object to preselect options.

```js demo
export const preselected = () => {
  return html`
    <owc-multi-checkbox
      .options=${[
        { value: 300, label: 'Passiv' },
        { value: 400, label: 'Archive' },
      ]}
      .value=${{ value: [400], operator: 'equal', field: 'state' }}
    ></owc-multi-checkbox>
  `;
};
```

## Groups

An option that is itself an array becomes a group: it renders with a leading select-all
checkbox that is indeterminate while only part of the group is selected. Ungrouped options
are indented to line up.

```js demo
export const grouped = () => {
  return html`
    <owc-multi-checkbox
      .options=${[
        [
          { value: 200, label: 'Aktiv', color: 'danger' },
          { value: 210, label: 'Premium' },
        ],
        { value: 300, label: 'Passiv' },
        { value: 400, label: 'Archive' },
      ]}
    ></owc-multi-checkbox>
  `;
};
```

## Colors

Each option can set a `color` for its tag - one of `brand` (default), `success`, `warning`,
`danger`, or `neutral`.

```js demo
export const colors = () => {
  return html`
    <owc-multi-checkbox
      .options=${[
        { value: 'ok', label: 'Success', color: 'success' },
        { value: 'warn', label: 'Warning', color: 'warning' },
        { value: 'bad', label: 'Danger', color: 'danger' },
        { value: 'meh', label: 'Neutral', color: 'neutral' },
      ]}
    ></owc-multi-checkbox>
  `;
};
```

## Change event

A `change` event fires whenever the selection changes; read the current selection from
`ev.target.value.value`.

```js demo
export const changeEvent = () => {
  return html`
    <owc-multi-checkbox
      @change=${ev => {
        const out = ev.currentTarget.parentElement.querySelector('#multi-checkbox-out');
        out.textContent = `selected: ${JSON.stringify(ev.target.value.value)}`;
      }}
      .options=${[
        [
          { value: 200, label: 'Aktiv' },
          { value: 210, label: 'Premium' },
        ],
        { value: 300, label: 'Passiv' },
      ]}
    ></owc-multi-checkbox>
    <pre id="multi-checkbox-out">selected: []</pre>
  `;
};
```

## API

### Attributes & properties

| Property  | Type                                                 | Default                                       | Description                                                                           |
| --------- | ---------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------- |
| `options` | `Array<Checkbox \| Checkbox[]>`                      | `[]`                                          | The selectable options; a nested array renders as a group.                            |
| `value`   | `{ value: Array, operator: 'equal', field: string }` | `{ value: [], operator: 'equal', field: '' }` | The selection in JSON-filter-condition shape. Replaced (not mutated) on every change. |

### Option config

| Field   | Type                                                         | Description                                        |
| ------- | ------------------------------------------------------------ | -------------------------------------------------- |
| `value` | `string \| number \| boolean`                                | The value added to the selection when checked.     |
| `label` | `string`                                                     | Shown next to the checkbox; defaults to the value. |
| `color` | `'brand' \| 'success' \| 'warning' \| 'danger' \| 'neutral'` | Tag color; defaults to `brand`.                    |

### Events

| Event    | Description                                                   |
| -------- | ------------------------------------------------------------- |
| `change` | Fired whenever the selection changes. Read `ev.target.value`. |
