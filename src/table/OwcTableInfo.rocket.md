```js server
export const config = {
  path: '/table-info',
  title: 'Table Info',
  menu: {
    parent: 'data',
    order: 20,
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
      show-info
      .actionTabs=${{
        massEdit: {
          label: 'Massenänderung',
          content: () => html`<owc-table-mass-edit></owc-table-mass-edit>`,
        },
        calculateSums: {
          visible: true,
        },
      }}
      .fullSize=${200}
      .currentSize=${17}
      .columns=${[
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
      ]}
      .data=${personData}
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

## API

### Attributes & properties

| Property                                                | Type       | Default | Description                                                            |
| ------------------------------------------------------- | ---------- | ------- | ---------------------------------------------------------------------- |
| `table`                                                 | `OwcTable` | -       | The connected table (wired automatically by `owc-table`).              |
| `columns`                                               | `Column[]` | -       | Column config, forwarded to the mass-edit and settings tabs.           |
| `data`                                                  | `T[]`      | -       | Rows, used by tabs like sums.                                          |
| `actionTabs`                                            | `object`   | -       | Adds or overrides tabs (see the table docs "Add your own action tab"). |
| `actionTabActive`                                       | `string`   | -       | The active tab key.                                                    |
| `showInfo`                                              | `boolean`  | `false` | Shows the row-count info line.                                         |
| `refreshButton`                                         | `boolean`  | `false` | Shows a refresh button.                                                |
| `loading`                                               | `boolean`  | `false` | Spins the refresh button.                                              |
| `dataFullSize` / `dataCurrentSize` / `dataSelectedSize` | `number`   | `0`     | The counts shown in the info line.                                     |

### Events

| Event                       | Description                                         |
| --------------------------- | --------------------------------------------------- |
| `refresh-button-clicked`    | Fired (bubbling, composed) when refresh is clicked. |
| `action-tab-active-changed` | Fired when the active tab changes.                  |
