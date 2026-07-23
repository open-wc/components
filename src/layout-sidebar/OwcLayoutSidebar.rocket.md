```js server
export const config = {
  path: '/layout/layout-sidebar',
  title: 'Layout Sidebar',
  menu: {
    parent: '/layout',
    order: 10,
    iconName: 'layout-sidebar',
  },
};

import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';

import '@open-wc/components/define/owc-layout-sidebar.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
```

# Layout Sidebar

A full-page application layout with a navigation sidebar on the left and a content area on the right. The two areas are rendered as a `wa-split-panel`, so the divider between the sidebar and the content can be dragged to resize the sidebar (it starts at 260px and can not get smaller than that).

The sidebar shows an optional logo at the top, a main menu, and a second menu that is pinned to the bottom (typically for things like settings or logout). Menu items with a `subMenuItemList` render as an expandable group instead of a link.

Your page content goes into the default slot and is displayed in the content area.

```js
import { OwcLayoutSidebar } from '@open-wc/components/OwcLayoutSidebar.js';
```

The types are available as well:

```js
import { MenuItem, OwcLayoutSidebarOptions } from '@open-wc/components/OwcLayoutSidebar.types.ts';
```

**Note:** The component is meant to fill the full page - the sidebar sizes itself to the viewport height and sticks to the top while the content scrolls. The demos on this page are wrapped in a fixed-height container so the docs page stays usable, which is why the sidebar can look cut off here.

```js demo
export const layoutSidebar = () => {
  return html`
    <div style="height: 420px; overflow: auto;">
      <owc-layout-sidebar
        .menuItemList=${[
          { icon: 'gear', label: 'General', href: '/general' },
          { icon: 'clock', label: 'History', href: '/history' },
          { icon: 'pencil', label: 'Editor', href: '/editor' },
        ]}
      >
        <h1>Page Content</h1>
        <p>Anything in the default slot is rendered in the content area next to the sidebar.</p>
      </owc-layout-sidebar>
    </div>
  `;
};
```

## Menu Items

`menuItemList` (main menu) and `menuBottomItemList` (bottom menu) take an array of `MenuItem` objects.

Fields you set as a consumer:

| Field             | Type                     | Description                                                                                                                                           |
| ----------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`           | `string`                 | The visible text of the menu item                                                                                                                     |
| `href`            | `string`                 | The link target (a plain `<a href>`, so clicking navigates the page)                                                                                  |
| `hrefGETParams`   | `Record<string, string>` | Optional GET parameters that get appended to `href` as a query string (e.g. `{ filter: 'open' }` turns `/tasks` into `/tasks?filter=open`)            |
| `icon`            | `string`                 | Optional [Web Awesome](https://webawesome.com/) icon name rendered before the label (e.g. `gear`)                                                     |
| `visible`         | `boolean`                | Set to `false` to hide the item (and its sub menu). Anything else - including leaving it out - shows the item                                         |
| `subMenuItemList` | `MenuItem[]`             | Optional child items. If present the item renders as an expandable group instead of a link (its own `href` is then not used)                          |
| `open`            | `boolean`                | Whether a group with a `subMenuItemList` starts expanded. Also managed by the component: groups containing the selected item are opened automatically |

Fields managed by the component - you do not need to set them:

| Field      | Type       | Description                                                                                                             |
| ---------- | ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| `selected` | `boolean`  | Set on the item whose full href matches the current URL. Note that it gets overwritten whenever the URL state is loaded |
| `parent`   | `MenuItem` | Set internally on sub menu items so the component can open all ancestor groups of the selected item                     |

## Selection follows the URL

When the element is connected it calls `loadStateFromUrl()` automatically. This method walks through all menu items (top and bottom), compares each item's full href (including `hrefGETParams`) with the current `location.pathname` + `location.search`, and marks the matching item as `selected`. All ancestor groups of the selected item are set to `open` so the selection is visible.

You can call `loadStateFromUrl()` yourself after a navigation that did not recreate the element:

```js
const sidebar = document.querySelector('owc-layout-sidebar');
sidebar.loadStateFromUrl();
```

Since the comparison is against the current URL, the demos on this page show no selected item - in an application the item matching the visited page is highlighted.

## Sub Menus, Bottom Items and Logo

A realistic setup with nested sub menu items, a bottom menu and a logo. `logoSvg` takes a lit template (e.g. an inline SVG) that is shown above the menu.

```js demo
export const layoutSidebarFull = () => {
  return html`
    <div style="height: 420px; overflow: auto;">
      <owc-layout-sidebar
        .logoSvg=${html`
          <svg viewBox="0 0 155 40" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="8" fill="#d1e6f5" />
            <text x="52" y="26" font-size="18" fill="currentColor">My App</text>
          </svg>
        `}
        .menuItemList=${[
          { icon: 'house', label: 'Home', href: '/home' },
          {
            icon: 'pencil',
            label: 'Content',
            open: true,
            subMenuItemList: [
              { label: 'Articles', href: '/content', hrefGETParams: { type: 'article' } },
              { label: 'Pages', href: '/content', hrefGETParams: { type: 'page' } },
            ],
          },
          {
            icon: 'clock',
            label: 'History',
            subMenuItemList: [
              { label: 'Today', href: '/history/today' },
              { label: 'Last Week', href: '/history/last-week' },
            ],
          },
          { icon: 'rocket-takeoff', label: 'Hidden Feature', href: '/hidden', visible: false },
        ]}
        .menuBottomItemList=${[
          { icon: 'gear', label: 'Settings', href: '/settings' },
          { icon: 'info-circle', label: 'About', href: '/about' },
        ]}
      >
        <h1>Dashboard</h1>
        <p>
          The "Content" group starts expanded because it has <code>open: true</code>. The "Hidden
          Feature" item is not rendered because it has <code>visible: false</code>. "Settings" and
          "About" are pinned to the bottom of the sidebar.
        </p>
      </owc-layout-sidebar>
    </div>
  `;
};
```

## API

### Attributes & properties

| Property             | Type             | Default | Description                                                              |
| -------------------- | ---------------- | ------- | ------------------------------------------------------------------------ |
| `menuItemList`       | `MenuItem[]`     | `[]`    | The main menu. Items with `subMenuItemList` render as expandable groups. |
| `menuBottomItemList` | `MenuItem[]`     | `[]`    | Menu pinned to the bottom of the sidebar.                                |
| `menuTopTemplate`    | `TemplateResult` | -       | Rendered between the logo and the menu (e.g. a user badge).              |
| `logoSvg`            | `TemplateResult` | empty   | The logo at the top.                                                     |

`MenuItem` (importable from `@open-wc/components/OwcLayoutSidebar.types.js`): `label`,
`href`, `icon?`, `hrefGETParams?` (object or query string), `visible?`, `open?`,
`subMenuItemList?`. On load the item matching the current URL is marked `selected` and its
parent groups are opened. The page content goes into the default slot.

### Methods

| Method               | Description                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loadStateFromUrl()` | Marks the menu item whose href (including `hrefGETParams`) matches the current URL as selected and opens its ancestor groups. Called automatically when the element is connected. |
