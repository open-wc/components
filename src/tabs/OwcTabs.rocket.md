```js server
export const config = {
  path: '/tabs',
  title: 'Tabs',
  menu: {
    parent: 'layout',
    order: 20,
    iconName: 'segmented-nav',
  },
};

import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';

import '@open-wc/components/define/owc-tabs.js';
```

# Tabs

Define multiple content section that share a display area below.

```js demo
export const tabs = () => {
  return html`
    <owc-tabs
      .tabs=${{
        general: {
          label: 'General',
          content: () => html`<p>Some General Content</p>`,
        },
        other: {
          label: 'Other',
          content: () => html`<p>Some <strong>Other</strong> Content</p> `,
        },
      }}
    >
      <div slot="tab-list-prefix">Info About 10/1300</div>
    </owc-tabs>
  `;
};
```

## Open By Default

You can set the tab that should be open via the `active` property or attribute.

```js demo
export const tabsOpen = () => {
  return html`
    <owc-tabs
      .tabs=${{
        general: {
          label: 'General',
          content: () => html`<p>Some General Content</p>`,
        },
        other: {
          label: 'Other',
          content: () => html`<p>Some <strong>Other</strong> Content</p> `,
        },
      }}
      active="general"
    >
    </owc-tabs>
  `;
};
```

## Active Changed Event

You can set the tab that should be open via the `active` property or attribute.

```js demo
export const tabsChangeEvent = ({ wrapperRef }) => {
  return html`
    <div>You are currently looking at tab: <span class="status"></span></div>
    <owc-tabs
      @active-changed=${ev => {
        const status = wrapperRef.value.querySelector('.status');
        status.innerText = ev.target.active;
      }}
      .tabs=${{
        general: {
          label: 'General',
          content: () => html`<p>Some General Content</p>`,
        },
        other: {
          label: 'Other',
          content: () => html`<p>Some <strong>Other</strong> Content</p> `,
        },
      }}
    >
    </owc-tabs>
  `;
};
```

## Prefix

By adding a `<div slot="tab-list-prefix">...</div>` you can add content before the list of tabs

```js demo
export const tabsWithPrefix = () => {
  return html`
    <owc-tabs
      .tabs=${{
        general: {
          label: 'General',
          content: () => html`<p>Some General Content</p>`,
        },
      }}
    >
      <div slot="tab-list-prefix">Info About 10/1300</div>
    </owc-tabs>
  `;
};
```

## Custom Styles

By adding .customStyles you can define a css that only applies on tab shadow dom

```js demo
export const tabsWithCustomStyle = () => {
  return html`
    <owc-tabs
      .tabs=${{
        general: {
          label: 'General',
          content: () => html`<p class="super-red">Some General Content in RED</p>`,
        },
      }}
      .customStyles=${css`
        .super-red {
          color: red;
        }
      `}
    >
    </owc-tabs>
  `;
};
```
