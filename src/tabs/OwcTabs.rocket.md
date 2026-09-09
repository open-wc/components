```js server
export const config = {
  path: '/layout/tabs',
  title: 'Tabs',
  menu: {
    parent: '/layout',
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
import { html, css } from 'lit';

import '@open-wc/components/define/owc-tabs.js';
```

# Tabs

Define multiple content sections that share a display area below. Clicking a tab shows its
content; clicking the active tab again closes the display area.

Tabs are defined via the `.tabs` property - an object whose keys identify the tabs and whose
values configure `label`, `content`, and optionally `visible`, `order`, `labelPrefix` and
`labelSuffix`.

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

Whenever the active tab changes (by clicking a tab or setting `active`), an `active-changed`
event fires. Read the new value from `ev.target.active` - it is an empty string when all tabs
are closed. The event does not fire for the initial value on first render.

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

## Visibility and Order

Each tab can define `visible` (a boolean or a function of the render options) and `order`.
Hidden tabs are skipped, and tabs render sorted by `order` (missing orders count as `0`).
The render options come from the `.getRenderOptions` property and are also passed to every
tab's `content` function, together with an `open` flag.

```js demo
export const tabsVisibilityOrder = () => {
  return html`
    <owc-tabs
      .getRenderOptions=${() => ({ isAdmin: false })}
      .tabs=${{
        admin: {
          label: 'Admin',
          visible: options => options.isAdmin,
          content: () => html`<p>Admin only</p>`,
        },
        last: {
          label: 'Last',
          order: 100,
          content: () => html`<p>Ordered last</p>`,
        },
        first: {
          label: 'First',
          order: -10,
          content: () => html`<p>Ordered first</p>`,
        },
      }}
    >
    </owc-tabs>
  `;
};
```

## Render Mode

tabs can be rendered in two different modes: eager or deferred. eager loading means, that every tab content gets rendered immediately. this also runs every function if any functions are defined. on the other side, deferred loading only renders it if the tab gets opened, which may result in a longer loading time when opening the tab for the first time.

### Eager loading

here the dates get set without opening the tabs. if you compare both tabs, both times are nearly indent since the content function has been called when the tab itself has been rendered.

```js client
function setFirstLoadedDate(dateToSet) {
  if (dateToSet === undefined) {
    return new Date();
  } else {
    return dateToSet;
  }
}
```

```js demo
var one, two;

export const tabsEagerLoading = () => {
  return html`
    <owc-tabs
      render-mode="eager"
      .tabs=${{
        general: {
          label: 'Date one',
          content: () => {
            one = setFirstLoadedDate(one);
            return html`<p>I got rendered the first time at ${one}</p>`;
          },
        },
        other: {
          label: 'date two',
          content: () => {
            two = setFirstLoadedDate(two);
            return html`<p>but I got rendered the first time at ${two}</p>`;
          },
        },
      }}
    >
      <div slot="tab-list-prefix">Info About 10/1300</div>
    </owc-tabs>
  `;
};
```

### deferred loading

now using deferred rendering, the time will only be calculated to when the tab is opened. this can save unnecessary loading when using big calculations.

```js demo
var three, four;

export const tabsDeferredLoading = () => {
  return html`
    <owc-tabs
      render-mode="deferred"
      .tabs=${{
        general: {
          label: 'Date one',
          content: () => {
            three = setFirstLoadedDate(three);
            return html`<p>I got rendered the first time at ${three}</p>`;
          },
        },
        other: {
          label: 'date two',
          content: () => {
            four = setFirstLoadedDate(four);
            return html`<p>but I got rendered the first time at ${four}</p>`;
          },
        },
      }}
    >
      <div slot="tab-list-prefix">Info About 10/1300</div>
    </owc-tabs>
  `;
};
```

## API

### Attributes & properties

| Attribute     | Property           | Type                           | Default      | Description                                                                |
| ------------- | ------------------ | ------------------------------ | ------------ | -------------------------------------------------------------------------- |
| `active`      | `active`           | `string`                       | `''`         | Key of the open tab; an empty string means all tabs are closed. Reflected. |
| -             | `tabs`             | `Tabs<T>`                      | `{}`         | The tab definitions, keyed by tab id (see below).                          |
| -             | `getRenderOptions` | `() => T`                      | `() => ({})` | Provides the options passed to `visible` and `content` functions.          |
| -             | `customStyles`     | `CSSResult \| string`          | empty        | Extra CSS applied inside the shadow root (e.g. to style tab content).      |
| `render-mode` | `renderMode`       | `eager` \| `deferred` (String) | `eager`      | The mode that is used to render the tab content                            |

### Tab definition (`Tab<T>`)

| Field         | Type                                                 | Description                                                       |
| ------------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| `label`       | `string \| TemplateResult`                           | The tab button label.                                             |
| `content`     | `(options: T & { open: boolean }) => TemplateResult` | Renders the tab content; receives the render options plus `open`. |
| `visible`     | `boolean \| ((options: T) => boolean)`               | Hide/show the tab; defaults to visible.                           |
| `order`       | `number`                                             | Sort key for the tab list; missing orders count as `0`.           |
| `labelPrefix` | `string \| TemplateResult`                           | Content rendered before the tab button.                           |
| `labelSuffix` | `string \| TemplateResult`                           | Content rendered after the tab button.                            |

The types are importable from `@open-wc/components/OwcTabs.types.js`.

### Events

| Event            | Description                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| `active-changed` | Fired when the active tab changes (bubbles). Not fired for the initial value. Read `ev.target.active`. |

### Slots & parts

| Name                   | Description                                   |
| ---------------------- | --------------------------------------------- |
| Slot `tab-list-prefix` | Content rendered before the tab buttons.      |
| Part `tab-list`        | The row of tab buttons.                       |
| Part `content-wrapper` | The wrapper around each tab's content.        |
| Part `bottom-shadow`   | The decorative shadow below the content area. |
