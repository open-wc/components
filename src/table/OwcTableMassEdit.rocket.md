```js server
export const config = {
  path: '/table-mass-edit',
  title: 'Table Mass Edit',
  menu: {
    parent: 'data',
    order: 30,
    iconName: 'pencil-square',
  },
};
import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
import { docsData } from '@open-wc/components/docsData.js';

export const components = atlasDocComponents;
export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';

import '@open-wc/components/define/owc-table.js';
import '@open-wc/components/define/owc-table-info.js';

const personData = [
  {
    id: '0013X00002eOb5BQAS',
    firstName: 'Robert',
    lastName: 'Lombart',
    profession: 'Teacher',
    premium: true,
    age: 30,
  },
  {
    id: '0013X00002eP8qsQAC',
    firstName: 'Sarah',
    lastName: 'Arlon',
    profession: 'Developer',
    premium: false,
    age: 10,
  },
  {
    id: '0013X00002eP8sDQAS',
    firstName: 'Grace',
    lastName: 'Annerer',
    profession: '',
    premium: false,
    age: 10,
  },
];
```

# Table Mass Edit

A form to change one column of many selected table rows at once. You pick a column, enter a new value, preview the change as a comparison of current vs new values directly in the table and then apply it to all selected rows.

## Registration

The class is publicly importable:

```js
import { OwcTableMassEdit } from '@open-wc/components/OwcTableMassEdit.js';
```

There is however **no** `define` entry (no `@open-wc/components/define/owc-table-mass-edit.js`). The element is registered as a scoped element inside `owc-table-info` — in practice you use it as tab content of an `owc-table-info` that is connected to an `owc-table`. The easiest way to get that is the built-in `massEdit` action tab of the table:

```js
.actionTabs=${{
  massEdit: { visible: true },
}}
```

which renders an `owc-table-mass-edit` element with `.columns`, `.data` (selected rows), `.allData` and `.table` already wired up (see the [Table docs](/table) "Mass Editing" section).

> If you want to use the element standalone you have to register the class yourself, e.g. with `customElements.define('owc-table-mass-edit', OwcTableMassEdit)` or via your own scoped registry.

## Properties

| Property    | Type                         | Description                                                                                                            |
| ----------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `table`     | `OwcTable`                   | Reference to the parent table. Needed for the preview (compare rendering) and for applying changes via `handleUpdate`. |
| `columns`   | `Column[]`                   | The table columns. Only columns with a `field` and `editableOptions: { massEdit: true }` show up in the column picker. |
| `column`    | `Column`                     | The currently selected column.                                                                                         |
| `data`      | `Array`                      | The selected rows the edit will be applied to.                                                                         |
| `allData`   | `Array`                      | All (processed) rows of the table. Used to build the preview comparison.                                               |
| `value`     | `any`                        | The new value to write into the selected column.                                                                       |
| `operation` | `'SET' \| 'ADD' \| 'REMOVE'` | Defaults to `'SET'`. The current implementation always sets the value.                                                 |
| `preview`   | `Boolean`                    | While `true` the table renders in compare mode showing current vs new values for the selected rows.                    |

## Methods

- `setColumn(value)`: selects the column whose `field` matches `value`. If that column is currently hidden it is temporarily forced to `visible: 'always'` on the table so the preview can be seen.
- `resetColumn()`: reverts the temporary visibility override of the last selected column and clears the selection.
- `executeEdit(event)`: applies `value` to every selected row by calling the table's `handleUpdate` once per row (with `field`, `data`, `config`, `value` and an `autoSetData()` helper that writes the value into the row). If no `table` is set, an optionally assigned `handleUpdateExecute` function is called instead.

## How it works

1. The reader selects rows in the table (the component operates on the table's selected rows — without a selection there is nothing to change).
2. A column is picked from an autocomplete listing all columns with `editableOptions: { massEdit: true }`.
3. Depending on `editableOptions.type` of that column a matching input is rendered:

| `editableOptions.type` | Input                                              |
| ---------------------- | -------------------------------------------------- |
| _(not set)_            | `wa-input`                                         |
| `textarea`             | `wa-textarea`                                      |
| `autocomplete`         | `owc-autocomplete` (fed by `editableOptions.data`) |
| `checkbox`             | `wa-checkbox`                                      |

4. "Preview" switches the table to compare rendering (`renderType: 'compare'` with `compareOverrides` keyed by row `id` — so rows need ids). A column can customize this rendering with `formatterCompare`.
5. "… Änderungen durchführen" executes the edit via the table's `handleUpdate` callback, "Abbrechen" leaves the preview without changing anything.

> Note: the buttons are currently labeled in German ("Abbrechen", "N Änderungen durchführen").

## Demo

Select some rows first, then open the "Massenänderung" tab, pick a column (Last Name or Profession), enter a value and press "Preview". The table switches to a comparison of current vs new values — executing applies the change through the table's `handleUpdate`.

The tab content receives `selectedData`, `processedData` and `columns` as render options; the table reference is looked up from the demo element (in an application you typically keep a reference to your table yourself — or simply use the built-in `massEdit: { visible: true }` tab which wires everything for you).

```js demo
export const massEditTab = () => {
  return html`
    <owc-table
      selectable
      show-info
      .handleUpdate=${({ autoSetData }) => {
        autoSetData();
      }}
      .actionTabs=${{
        massEdit: {
          visible: true,
          label: 'Massenänderung',
          content: ({ selectedData, processedData, columns }) => html`
            <owc-table-mass-edit
              .columns=${columns}
              .data=${selectedData}
              .allData=${processedData}
              .table=${getMassEditDemoTable()}
            ></owc-table-mass-edit>
          `,
        },
      }}
      .columns=${[
        {
          label: 'First Name',
          field: 'firstName',
        },
        {
          label: 'Last Name',
          field: 'lastName',
          editableOptions: {
            massEdit: true,
          },
        },
        {
          label: 'Profession',
          field: 'profession',
          editableOptions: {
            massEdit: true,
            type: 'autocomplete',
            data: [
              { value: 'Teacher', label: 'Teacher' },
              { value: 'Lawyer', label: 'Lawyer' },
              { value: 'Developer', label: 'Developer' },
            ],
          },
        },
        {
          label: 'Age',
          field: 'age',
        },
      ]}
      .data=${personData}
    ></owc-table>
  `;
};

// only needed in this demo to hand the table reference to the tab content
const getMassEditDemoTable = () =>
  document.querySelector('[demo-name=massEditTab]')?.shadowRoot?.querySelector('owc-table');
```
