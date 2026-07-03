```js server
export const config = {
  path: '/components/tooltip',
  title: 'Tooltip',
};
import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';

import '@open-wc/components/define/owc-tooltip.js';
import { ref, createRef } from 'lit/directives/ref.js';
```

# Tooltip

A tooltips target is defined by the `anchor` slot

```js demo
export const simpleTooltip = () => {
  return html`
    <owc-tooltip>
      I am a tooltip
      <button slot="anchor">Hover Me</button>
    </owc-tooltip>
  `;
};
```

## Placement

The `placement` attribute defines the preferred placement of the tooltip.

```js demo
export const tooltipPlacment = () => {
  return html`
    <owc-tooltip placement="bottom">
      I am a tooltip
      <button slot="anchor">Hover Me</button>
    </owc-tooltip>
  `;
};
```

## Click Trigger

The `trigger` attribute defines how the tooltip is opened. Setting this to click instead opens the tooltip when clicking the `anchor`.

```js demo
export const tooltipClickTrigger = () => {
  return html`
    <owc-tooltip trigger="click">
      I am a tooltip
      <button slot="anchor">Click Me</button>
    </owc-tooltip>
  `;
};
```

## Manual Trigger

The `trigger` attribute defines how the tooltip is opened. Setting this to manual instead only opens the tooltip when setting the `open` attribute.

```js demo
export const tooltipManualTrigger = () => {
  const tooltipRef = createRef();
  return html`
    <button
      @click=${() => {
        tooltipRef.value.open = !tooltipRef.value.open;
      }}
    >
      Click me
    </button>
    <owc-tooltip ${ref(tooltipRef)} trigger="click">
      I am a tooltip
      <button slot="anchor">I have a tooltip</button>
    </owc-tooltip>
  `;
};
```

## Removing Arrows

You can remove the arrow by setting the `without-arrow` attribute.

```js demo
export const tooltipNoArrow = () => {
  return html`
    <owc-tooltip without-arrow>
      I am a tooltip
      <button slot="anchor">No Arrow</button>
    </owc-tooltip>
  `;
};
```

## HTML

You can also use html within a tooltip

```js demo
export const tooltipHtml = () => {
  return html`
    <owc-tooltip>
      <strong>I am Bold</strong>
      <button slot="anchor">No Arrow</button>
    </owc-tooltip>
  `;
};
```
