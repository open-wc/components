```js server
export const config = {
  path: '/',
  title: '@open-wc/components',
  metadata: {
    title: '@open-wc/components',
    description:
      'Open Web Components for data-heavy interfaces: tables, forms, charts, and workflow UI shipped as unbundled ESM.',
  },
  menu: false,
};

import { atlasHeroLayout as heroLayout } from '@rocket/js/layouts/atlasHero.js';
import { heroData } from '@open-wc/components/docsData.js';

export { atlasHeroComponents as components } from '@rocket/js/layouts/atlasHero.js';
export const layout = pageData => heroLayout(pageData, heroData);
```

## Copy, paste, render

Register a component through its `define` entry point and pass data as properties. This example is
complete enough to paste into any Lit view:

```js
import { html } from 'lit';
import '@open-wc/components/define/owc-table.js';

const columns = [
  { label: 'First name', field: 'firstName', filterable: true },
  { label: 'Last name', field: 'lastName', filterable: true },
];

const rows = [
  { id: '1', firstName: 'Ada', lastName: 'Lovelace' },
  { id: '2', firstName: 'Grace', lastName: 'Hopper' },
];

export const view = () => html`<owc-table .columns=${columns} .data=${rows}></owc-table>`;
```

Every reference page follows the same pattern: pick a component from
[the component index](/components), copy the smallest demo that matches your use case, and replace
the demo data with application data.
