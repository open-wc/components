```js server
export const config = {
  path: '/components/count-up',
  title: 'Count Up',
  menu: {
    order: 30,
  },
};

import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';
import '@open-wc/components/define/owc-count-up.js';
```

# Count Up

## Kitchen sink

A demo showcasing most features of Data Detail.

```js demo
export const kitchenSinkDemo = () => html` <owc-count-up end=${12345}></owc-count-up> `;
```
