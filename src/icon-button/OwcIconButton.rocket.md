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

A borderless icon-only button. It renders as an anchor when `href` is set, so it works for
actions and navigation alike. Give it a `label` so screen readers can name it.

## As button

```js demo
export const simpleButton = () => {
  return html`
    <owc-icon-button name="gear" label="Settings" @click=${() => console.log('click')}>
    </owc-icon-button>
  `;
};
```

## With tooltip

```js demo
export const withTooltip = () => {
  return html`
    <owc-tooltip>
      Settings
      <owc-icon-button slot="anchor" name="gear" label="Settings"> </owc-icon-button>
    </owc-tooltip>
  `;
};
```

## As link

With `href` the icon button navigates. A `target` automatically adds
`rel="noreferrer noopener"`; set `download` to offer the target as a file download.

```js demo
export const asLink = () => {
  return html`
    <owc-icon-button
      name="box-arrow-up-right"
      label="Open example.com"
      href="https://example.com"
      target="_blank"
    >
    </owc-icon-button>
  `;
};
```

## Variant

The `variant` is forwarded to the underlying `wa-icon` (e.g. `regular` instead of the solid
default).

```js demo
export const variant = () => {
  return html`
    <owc-icon-button name="x-circle" label="Close" variant="regular"> </owc-icon-button>
  `;
};
```

## Disabled

Disabled icon buttons block clicks and are removed from the tab order - links included.

```js demo
export const disabled = () => {
  return html`
    <owc-icon-button disabled name="x-circle" label="Close" variant="regular"> </owc-icon-button>
    <owc-icon-button disabled name="gear" label="Settings" href="https://example.com">
    </owc-icon-button>
  `;
};
```

## API

### Attributes & properties

| Property   | Type      | Default | Description                                                                          |
| ---------- | --------- | ------- | ------------------------------------------------------------------------------------ |
| `name`     | `string`  | `''`    | Icon name, forwarded to `wa-icon`.                                                   |
| `label`    | `string`  | `''`    | Accessible name (`aria-label`); omitted from the DOM when empty.                     |
| `href`     | `string`  | `''`    | Renders the icon button as an anchor pointing here.                                  |
| `target`   | `string`  | `''`    | Link target (e.g. `_blank`); adds `rel="noreferrer noopener"` when set.              |
| `download` | `string`  | `''`    | Download filename for links; only rendered when non-empty.                           |
| `variant`  | `string`  | `''`    | Icon variant, forwarded to `wa-icon` (e.g. `regular`).                               |
| `disabled` | `boolean` | `false` | Blocks clicks and removes the control from the tab order; reflected as an attribute. |

### Methods

| Method            | Description                      |
| ----------------- | -------------------------------- |
| `click()`         | Simulates a click.               |
| `focus(options?)` | Focuses the inner button/anchor. |
| `blur()`          | Removes focus.                   |
