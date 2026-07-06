```js server
export const config = {
  path: '/icon-button',
  title: 'Icon Button',
  menu: {
    parent: 'utilities',
    order: 30,
    iconName: 'hand-index',
  },
};
import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';

import '@open-wc/components/define/owc-icon-button.js';
import '@open-wc/components/define/owc-tooltip.js';
```

# Icon Button

## As button

```js demo
export const simpleButton = () => {
  return html`
    <owc-icon-button name="gear" @click=${() => console.log('click')}> </owc-icon-button>
  `;
};
```

## With tooltip

```js demo
export const withTooltip = () => {
  return html`
    <owc-tooltip>
      Settings
      <owc-icon-button slot="anchor" name="gear" @click=${() => console.log('click')}>
      </owc-icon-button>
    </owc-tooltip>
  `;
};
```

## As link

```js demo
export const asLink = () => {
  return html`
    <owc-icon-button name="gear" href="https://www.google.com" target="_blank"> </owc-icon-button>
  `;
};
```

## Variant

```js demo
export const variant = () => {
  return html`
    <owc-icon-button
      name="x-circle"
      href="https://www.google.com"
      target="_blank"
      variant="regular"
    >
    </owc-icon-button>
  `;
};
```

## Disabled Button

```js demo
export const disabled = () => {
  return html`
    <owc-icon-button disabled="true" name="x-circle" variant="regular"> </owc-icon-button>
  `;
};
```
