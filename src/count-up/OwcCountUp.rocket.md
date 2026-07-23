```js server
export const config = {
  path: '/utilities/count-up',
  title: 'Count Up',
  menu: {
    parent: '/utilities',
    order: 40,
    iconName: '123',
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

Animates a number counting up to `end`, powered by
[countup.js](https://github.com/inorganik/countUp.js). By default the animation starts when
the element scrolls into view and runs only once.

```js demo
export const simple = () => html`<owc-count-up end="12345"></owc-count-up>`;
```

## Duration & separator

`duration` is the animation time in seconds; `separator` is the grouping character
(defaults to `.`).

```js demo
export const durationSeparator = () =>
  html`<owc-count-up end="1234567" duration="2" separator=","></owc-count-up>`;
```

## Advanced options

Pass any [countup.js option](https://github.com/inorganik/countUp.js#usage) through
`options` - explicit options win over the convenience properties. Replace the scroll-spy
defaults deliberately when you set your own object.

```js demo
export const advanced = () =>
  html`<owc-count-up
    end="88.9"
    duration="2"
    .options=${{
      enableScrollSpy: true,
      scrollSpyOnce: true,
      decimalPlaces: 1,
      decimal: ',',
      suffix: ' %',
    }}
  ></owc-count-up>`;
```

## API

### Attributes & properties

| Property    | Type             | Default                                          | Description                                                    |
| ----------- | ---------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| `start`     | `number`         | `0`                                              | Value the animation starts from.                               |
| `end`       | `number`         | `0`                                              | Value the animation counts up to.                              |
| `duration`  | `number`         | `5`                                              | Animation duration in seconds.                                 |
| `separator` | `string`         | `'.'`                                            | Grouping separator.                                            |
| `options`   | `CountUpOptions` | `{ enableScrollSpy: true, scrollSpyOnce: true }` | Extra countup.js options; win over the convenience properties. |

### Read-only properties

| Property  | Type      | Description                                                     |
| --------- | --------- | --------------------------------------------------------------- |
| `countUp` | `CountUp` | The underlying countup.js instance, e.g. for `countUp.reset()`. |
