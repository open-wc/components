# Layout Sidebar

`<owc-layout-sidebar>` is an app shell: a resizable sidebar (logo, optional
top template, menu with collapsible groups, bottom menu) next to the page
content in the default slot. The item matching the current URL is marked
selected and its parent groups open automatically.

## Usage

```js
import '@open-wc/components/define/owc-layout-sidebar.js';
```

```js
html`<owc-layout-sidebar
  .logoSvg=${logo}
  .menuItemList=${[
    { label: 'Home', href: '/', icon: 'house' },
    {
      label: 'Contracts',
      icon: 'folder',
      subMenuItemList: [
        { label: 'Active', href: '/contracts', hrefGETParams: { state: 'active' } },
      ],
    },
  ]}
>
  <main>page content</main>
</owc-layout-sidebar>`;
```

## Features

- URL-based selection with parent groups opening automatically (href/param
  handling in [hrefHelpers.js](./hrefHelpers.js))
- `menuTopTemplate` slot-like property for content between logo and menu
- `MenuItem` types importable from `@open-wc/components/OwcLayoutSidebar.types.js`

## Docs & demos

See [OwcLayoutSidebar.rocket.md](./OwcLayoutSidebar.rocket.md) for live demos
and the API reference; published on the docs site under `/layout-sidebar/`.

## Files

- [OwcLayoutSidebar.js](./OwcLayoutSidebar.js) - the component
- [hrefHelpers.js](./hrefHelpers.js) - pure href/param logic
- [OwcLayoutSidebar.types.ts](./OwcLayoutSidebar.types.ts) - public menu types
- [OwcLayoutSidebar.test-browser.js](./OwcLayoutSidebar.test-browser.js) - browser tests (`npx web-test-runner src/layout-sidebar/OwcLayoutSidebar.test-browser.js`)
- [hrefHelpers.test.js](./hrefHelpers.test.js) - logic tests (`node --test src/layout-sidebar/hrefHelpers.test.js`)
