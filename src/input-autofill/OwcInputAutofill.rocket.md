```js server
export const config = {
  path: '/components/input-autofill',
  title: 'Input-Autofill',
  menu: {
    order: 10,
  },
};

import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';

import '@open-wc/components/define/owc-input-autofill.js';
```

# Input-Autofill

Simple example:

```js demo
export const simple = () => {
  return html`
    <owc-input-autofill
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    ></owc-input-autofill>
  `;
};
```

## Set a Label

```js demo
export const label = () => {
  return html`
    <owc-input-autofill
      @change=${() => console.log('change')}
      @input=${() => console.log('input')}
      label="ID of a company"
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    ></owc-input-autofill>
  `;
};
```

## Events

A `change` and an `input` event gets fired.

```js demo
export const events = () => {
  return html`
    <owc-input-autofill
      @change=${() => console.log('change')}
      @input=${() => console.log('input')}
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    ></owc-input-autofill>
  `;
};
```
