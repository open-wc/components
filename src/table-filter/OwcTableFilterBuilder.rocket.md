```js server
export const config = {
  path: '/components/filter-builder',
  title: 'Table Filter Builder',
  menu: {
    order: 30,
  },
};
import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@finum/data-table/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';
import { OwcTableFilterBuilder } from '@finum/data-table/OwcTableFilterBuilder.js';

customElements.define('owc-table-filter-builder', OwcTableFilterBuilder);
```

# Filter Builder

```js demo
export const simpleTable = () => {
  return html`
    <owc-table-filter-builder
      ?global-search=${true}
      @change=${ev => console.log(ev.target.value)}
      .columns=${[
        {
          label: 'First Name',
          field: 'firstName',
          filterable: true,
        },
        {
          label: 'Last Name',
          field: 'lastName',
          filterable: true,
        },
        {
          label: 'Profession',
          field: 'profession',
        },
        {
          label: 'Age',
          field: 'age',
          formatter: 'number',
          showInCalculateSums: true,
        },
      ]}
    ></owc-table-filter-builder>
  `;
};
```
