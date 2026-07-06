```js server
export const config = {
  path: '/input-slider',
  title: 'Input Slider',
  menu: {
    parent: 'forms',
    order: 40,
    iconName: 'sliders',
  },
};

import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';

import '@open-wc/components/define/owc-input-slider.js';
```

# Input Slider

Simple example:

```js demo
export const simple = () => {
  return html` <owc-input-slider></owc-input-slider> `;
};
```

## Set value

Simple example:

```js demo
export const value = () => {
  return html` <owc-input-slider value="50"></owc-input-slider> `;
};
```

## Set a Label

```js demo
export const label = () => {
  return html`
    <owc-input-slider
      @change=${() => console.log('change')}
      @input=${() => console.log('input')}
      label="Give me some number"
    ></owc-input-slider>
  `;
};
```

## Events

A `change` and an `input` event gets fired.

```js demo
export const events = () => {
  return html`
    <owc-input-slider
      @change=${() => console.log('change')}
      @input=${() => console.log('input')}
    ></owc-input-slider>
  `;
};
```

## Input Position

```js demo
export const inputPosition = () => {
  return html`
    <owc-input-slider
      @change=${() => console.log('change')}
      @input=${() => console.log('input')}
      input-position="end"
    ></owc-input-slider>
  `;
};
```

## Min/Max/Step

Set minimum maximum and step. Min and max can be broken out of by using the input

```js demo
export const minMax = () => {
  return html`
    <owc-input-slider
      @change=${() => console.log('change')}
      @input=${() => console.log('input')}
      min="-50"
      max="1000"
      step="5"
    ></owc-input-slider>
  `;
};
```

## Absolute Min/Max

Set absolute minimum and maximum. These cannot be broken out of

```js demo
export const absoluteMinMax = () => {
  return html`
    <owc-input-slider
      @change=${ev => {
        console.log('change');
        console.log(ev.target.value);
      }}
      @input=${ev => {
        console.log('input');
        console.log(ev.target.value);
      }}
      absolute-min="-50"
      absolute-max="1000"
    ></owc-input-slider>
  `;
};
```
