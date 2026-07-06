```js server
export const config = {
  path: '/loading-screen',
  title: 'Loading Screen',
  menu: {
    parent: 'layout',
    order: 30,
    iconName: 'hourglass-split',
  },
};

import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';

import '@open-wc/components/define/owc-loading-screen.js';
```

# Loading Screen

A full-area loading indicator with a spinner and a percentage readout. It is intended for application loading states, e.g. while the initial data of an app is being fetched.

The component positions itself in the center of its nearest positioned ancestor and fills the available space. In the demos below each example is therefore wrapped in a container with `position: relative` and an explicit height — do the same in your application (or let it cover the full viewport).

Set the `progress` property to a number between `0` and `1`. It is displayed as a percentage.

Note: the displayed percentage always stops at 99% — reaching "100%" is the moment the loading screen gets removed, so it is never shown.

```js demo
export const loadingScreen = () => {
  return html`
    <div style="position: relative; height: 240px;">
      <owc-loading-screen .progress=${0.42}></owc-loading-screen>
    </div>
  `;
};
```

## Autofill

If you do not have real progress information you can set the `autofill` boolean attribute. The loading screen then increments its own progress on a timer, giving the user a sense of movement.

Note: `autofill` keeps incrementing beyond the actual loading duration — the displayed value still caps at 99%. Remove the element once your application is ready.

```js demo
export const loadingScreenAutofill = () => {
  return html`
    <div style="position: relative; height: 240px;">
      <owc-loading-screen autofill></owc-loading-screen>
    </div>
  `;
};
```

## With a Logo

Via the `logoSvg` property you can pass a lit template (typically an inline svg) that is shown above the spinner.

```js demo
export const loadingScreenWithLogo = () => {
  return html`
    <div style="position: relative; height: 320px;">
      <owc-loading-screen
        autofill
        .logoSvg=${html`
          <svg viewBox="0 0 100 24" xmlns="http://www.w3.org/2000/svg" role="img">
            <circle cx="12" cy="12" r="10" fill="currentColor" />
            <text x="28" y="17" font-size="14" fill="currentColor">My App</text>
          </svg>
        `}
      ></owc-loading-screen>
    </div>
  `;
};
```
