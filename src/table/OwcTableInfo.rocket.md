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

Part above the Table

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
