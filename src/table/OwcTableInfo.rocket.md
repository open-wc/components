```js server
export const config = {
  path: '/internal/table-info',
  title: 'Table Info',
  menu: {
    parent: '/internal',
    order: 10000,
    iconName: 'info-square',
  },
};
import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
import { docsData } from '@open-wc/components/docsData.js';

export const components = atlasDocComponents;
export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';

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

const columns = [
  {
    label: 'Profession',
    field: 'profession',
  },
  {
    label: 'First Name',
    field: 'firstName',
  },
  {
    label: 'Last Name',
    field: 'lastName',
  },
  {
    label: 'Age',
    field: 'age',
    showInCalculateSums: true,
  },
];
```

# Table Info

The action-tab bar above the table: row counts, refresh, and built-in tabs for export, mass
edit (`owc-table-mass-edit`), and column settings (`owc-table-settings`). It is rendered
automatically by `owc-table` when `show-info` is set; use it standalone to compose your own
toolbar.

```js demo
export const simpleTable = () => {
  return html`
    <owc-table-info
      .showInfo=${true}
      .actionTabs=${{
        calculateSums: {
          visible: true,
        },
      }}
      .dataFullSize=${200}
      .dataCurrentSize=${17}
      .columns=${columns}
      .getRenderOptions=${() => ({
        selectedData: [],
        processedData: personData,
        columns,
      })}
    ></owc-table-info>
  `;
};
```

## Settings tab (`owc-table-settings`)

The built-in settings tab renders an `owc-table-settings` dropdown ("Spalten") where users
cycle each column's visibility (always → if filtered → never) and reorder columns via drag &
drop. Changes fire a `change` event and are persisted twice: to `localStorage` and to the
URL, keyed by `storeNamePrefix` (`<prefix>-override-settings` / `?<prefix>-overrides=`).
URL overrides win on load, except for columns the user overrode locally. The footer's
Reset button clears both stores.

There is no `define` entry for it - like the mass edit it is registered as a scoped element
inside `owc-table-info` and configured through the table's `store-name-prefix`.

## Built-in action tabs

`owc-table-info` owns the built-in action tabs. They are hidden by default and are enabled
through `actionTabs` by key:

| Key             | Enables                                                          |
| --------------- | ---------------------------------------------------------------- |
| `calculateSums` | Sum rows for columns with `showInCalculateSums: true`.           |
| `export`        | Copy as Excel and download as CSV.                               |
| `massEdit`      | Edit selected rows with `owc-table-mass-edit`.                   |
| `settings`      | Open column visibility/order settings with `owc-table-settings`. |

When `owc-table-info` is rendered by `owc-table`, the table supplies the render context for
these tabs automatically. When composing `owc-table-info` yourself, pass `getRenderOptions`
with the same shape (`selectedData`, `processedData`, `columns`, and any formatters your tab
uses). See the table docs for [calculate sums](/table/#calculate-sums), [exporting](/table/#exporting-the-table),
[custom action tabs](/table/#add-your-own-action-tab), and [mass editing](/table/#mass-editing).

## API

### Attributes & properties

| Property                                                | Type       | Default      | Description                                                                         |
| ------------------------------------------------------- | ---------- | ------------ | ----------------------------------------------------------------------------------- |
| `table`                                                 | `OwcTable` | -            | The connected table (wired automatically by `owc-table`).                           |
| `columns`                                               | `Column[]` | -            | Column config, forwarded to the mass-edit and settings tabs.                        |
| `getRenderOptions`                                      | `function` | `() => ({})` | Supplies tab render context such as `processedData`, `selectedData`, and `columns`. |
| `actionTabs`                                            | `object`   | -            | Adds or overrides tabs (see the table docs "Add your own action tab").              |
| `actionTabActive`                                       | `string`   | -            | The active tab key.                                                                 |
| `showInfo`                                              | `boolean`  | `false`      | Shows the row-count info line.                                                      |
| `refreshButton`                                         | `boolean`  | `false`      | Shows a refresh button.                                                             |
| `loading`                                               | `boolean`  | `false`      | Spins the refresh button.                                                           |
| `dataFullSize` / `dataCurrentSize` / `dataSelectedSize` | `number`   | `0`          | The counts shown in the info line.                                                  |

### Events

| Event                       | Description                                         |
| --------------------------- | --------------------------------------------------- |
| `refresh-button-clicked`    | Fired (bubbling, composed) when refresh is clicked. |
| `action-tab-active-changed` | Fired when the active tab changes.                  |
