```js server
export const config = {
  path: '/card',
  title: 'Card',
  menu: {
    parent: 'data',
    order: 90,
    iconName: 'card-text',
  },
};
import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';

import '@open-wc/components/define/owc-card.js';
```

# Card

A simple card for text and an image.

Simple example:

Any text or HTML within the `owc-card` element will be and displayed as the content of a card. The width of the card adjusts to the text in the card and the text will wrap when the width of the container is used up.

```js demo
export const simpleCard = () => {
  return html`
    <owc-card>
      This is the content of this card
      <p>Lorem ipsum dolor sit <b>amet</b>, consectetur adipiscing elit.</p>
    </owc-card>
  `;
};
```

## Card with header and footer

With the `slot` attribute an element can be moved to the `header` or `footer`.

```js demo
export const cardWithHeader = () => {
  return html`
    <owc-card>
      This is the content of this card
      <p>
        Lorem ipsum dolor sit <b>amet</b>, consectetur adipiscing elit. Sed do eiusmod tempor
        incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam
      </p>
      <span slot="header"><h3>The header can be used as a title</h3></span>
      <span slot="footer">This text is in the <i>footer</i></span>
    </owc-card>
  `;
};
```

## Card with image

An `img` element with the `slot` attribute set to `img` adds an image to the card. The size of the image adapts to the width of the card.

```js demo
export const cardWithImage = () => {
  return html`
    <owc-card>
      A kitten walks towards camera on top of a pallet.
      <span slot="header">Header text</span>
      <span slot="footer">Footer text</span>
      <img
        slot="media"
        src="https://images.unsplash.com/photo-1547191783-94d5f8f6d8b1?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=400&q=80"
        alt="A kitten walks towards camera on top of a pallet."
      />
    </owc-card>
  `;
};
```

## Card with link

Use the `.href` attribute specify the URL that the card links to when clicked

```js demo
export const cardLink = () => {
  return html`
    <owc-card .href=${'https://www.example.com'}>
      <h3 slot="header">This card links to example.com</h3>
      Lorem ipsum dolor sit <b>amet</b>, consectetur adipiscing elit.
      <br />
      Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      <br />
      Ut enim ad minim veniam
    </owc-card>
  `;
};
```
