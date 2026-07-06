```js server
export const config = {
  path: '/components/separator',
  title: 'Separator',
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

import '@open-wc/components/define/owc-separator.js';
```

# Separator

Separators are used to separate elements with an in between note/info.

By default the separator is horizontal and takes the full width of its container.

```js demo
export const separator = () => {
  return html`
    <p>Content above</p>
    <owc-separator></owc-separator>
    <p>Content below</p>
  `;
};
```

## With Content

Any content in the default slot is rendered between the two lines — for example a label like "OR" between two form sections.

```js demo
export const separatorWithText = () => {
  return html`
    <p>Sign in with your email address</p>
    <owc-separator>OR</owc-separator>
    <p>Continue with an existing account</p>
  `;
};
```

## Vertical

Set the `vertical` boolean attribute to draw the separator in a vertical orientation. The attribute is reflected, so you can also use it in css selectors. A vertical separator needs a container that gives it a height, e.g. a flex row.

```js demo
export const separatorVertical = () => {
  return html`
    <div style="display: flex; height: 120px; align-items: stretch;">
      <p>Left content</p>
      <owc-separator vertical>OR</owc-separator>
      <p>Right content</p>
    </div>
  `;
};
```

## Custom Styling

The separator can be styled via css custom properties:

- `--color` - The color of the separator.
- `--width` - The width of the separator.
- `--spacing` - The spacing of the separator.

```js demo
export const separatorCustomStyling = () => {
  return html`
    <p>Content above</p>
    <owc-separator style="--color: tomato; --spacing: 24px;">Custom</owc-separator>
    <p>Content below</p>
  `;
};
```

## Accessibility

The separator automatically sets `role="separator"` on itself and keeps `aria-orientation` in sync with the `vertical` property, so assistive technologies announce it correctly in both orientations.
