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

A slider paired with a number input that both edit the same value. The slider covers the
common range (`min`/`max`), while the input allows breaking out of it - the slider range
grows to follow. Hard limits are set with `absolute-min`/`absolute-max`.

```js demo
export const simple = () => {
  return html` <owc-input-slider></owc-input-slider> `;
};
```

## Set value

The `value` attribute (or property) sets the current value of both controls.

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

An `input` event fires while the value changes (typing, dragging the slider) and a `change`
event fires when a change is committed. Read the current value from `ev.target.value`.

```js demo
export const events = () => {
  return html`
    <owc-input-slider
      @change=${ev => {
        const out = ev.currentTarget.parentElement.querySelector('#slider-event-out');
        out.textContent = `value: ${ev.target.value}`;
      }}
      @input=${ev => {
        const out = ev.currentTarget.parentElement.querySelector('#slider-event-out');
        out.textContent = `value: ${ev.target.value}`;
      }}
    ></owc-input-slider>
    <pre id="slider-event-out">value: 0</pre>
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

## Stacked

With `input-position="end"` and the `stacked` attribute the label and input share the first
row and the slider spans the full width below.

```js demo
export const stacked = () => {
  return html`
    <owc-input-slider stacked input-position="end" label="Give me some number"></owc-input-slider>
  `;
};
```

## Disabled

```js demo
export const disabled = () => {
  return html` <owc-input-slider disabled value="30" label="Not editable"></owc-input-slider> `;
};
```

## API

### Attributes & properties

| Attribute        | Property        | Type               | Default   | Description                                                                          |
| ---------------- | --------------- | ------------------ | --------- | ------------------------------------------------------------------------------------ |
| `value`          | `value`         | `number`           | `0`       | The current value.                                                                   |
| `label`          | `label`         | `string`           | `''`      | Label shown above the controls.                                                      |
| `min`            | `min`           | `number`           | `0`       | Lower end of the slider range; shrinks if the input goes below it.                   |
| `max`            | `max`           | `number`           | `100`     | Upper end of the slider range; grows if the input goes above it.                     |
| `step`           | `step`          | `number`           | `1`       | Step for both the slider and the input.                                              |
| `absolute-min`   | `absoluteMin`   | `number`           | -         | Hard lower bound - values are clamped to it.                                         |
| `absolute-max`   | `absoluteMax`   | `number`           | -         | Hard upper bound - values are clamped to it.                                         |
| `input-position` | `inputPosition` | `'start' \| 'end'` | `'start'` | Whether the number input renders before or after the slider.                         |
| `stacked`        | `stacked`       | `boolean`          | `false`   | With `input-position="end"`: label+input on top, full-width slider below. Reflected. |
| `disabled`       | `disabled`      | `boolean`          | `false`   | Disables both controls. Reflected.                                                   |

### Events

| Event    | Description                                                          |
| -------- | -------------------------------------------------------------------- |
| `input`  | Fired while the value changes (typing or dragging).                  |
| `change` | Fired when a change is committed (input blur/enter, slider release). |

### Styling

The grid layout can be tuned with the CSS custom properties `--owc-input-width` (default
`8ch`) and `--owc-input-slider-gap` (default `20px`). The inner Web Awesome input and slider
parts are re-exported with `input-*` and `slider-*` prefixes (e.g. `input-control`,
`slider-track`, `slider-thumb`), and the label is exposed as part `label`.
