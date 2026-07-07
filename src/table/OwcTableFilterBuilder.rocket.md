```js server
export const config = {
  path: '/filter-builder',
  title: 'Table Filter Builder',
  menu: {
    parent: 'data',
    order: 40,
    iconName: 'funnel',
  },
};
import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';
import { OwcTableFilterBuilder } from '@open-wc/components/OwcTableFilterBuilder.js';

customElements.define('owc-table-filter-builder', OwcTableFilterBuilder);
```

# Filter Builder

`owc-table-filter-builder` is the standalone filter UI that `owc-table` embeds for its
`filter-mode` options. It lets users combine per-column filters with AND/OR logic and exposes the
result as a JSON filter structure via the `.value` property. Feed that structure to
`jsonToFilter()` from `@open-wc/components/filter/jsonToFilter.js` to get a predicate function, or
to `jsonToSqlFilter()` to build a SQL where clause.

Use the `.columns` property (same column definitions as `owc-table`) to declare which fields can
be filtered and how (`filterType`: `text` (default), `number`, `date`, `datetime`, `checkbox`,
`autocomplete`, `array`, `boolean` or `custom`).

A `change` event fires whenever the user edits the filters - read the current filter structure
from `event.target.value`. The assigned `.value` array is cloned internally, so the builder never
mutates the array you passed in.

```js demo
export const simpleTable = () => {
  return html`
    <owc-table-filter-builder
      ?global-search=${true}
      @change=${ev => console.log(ev.target.value)}
      .columns=${[
        {
          label: 'First Name',
          field: 'firstName',
          filterable: true,
        },
        {
          label: 'Last Name',
          field: 'lastName',
          filterable: true,
        },
        {
          label: 'Profession',
          field: 'profession',
        },
        {
          label: 'Age',
          field: 'age',
          formatter: 'number',
          showInCalculateSums: true,
        },
      ]}
    ></owc-table-filter-builder>
  `;
};
```

## Global search

With the `global-search` attribute the builder keeps a global text search entry at the start of
`.value` (its `field` is the `globalSearchField` sentinel exported from
`@open-wc/components/filter/jsonToFilter.js`) and renders a search input for it. Add
`global-search-only` to hide the manual filter entries and only offer the search input.

```js demo
export const globalSearchOnly = () => {
  return html`
    <owc-table-filter-builder
      global-search
      global-search-only
      @change=${ev => console.log(ev.target.value)}
      .columns=${[
        { label: 'First Name', field: 'firstName', filterable: true },
        { label: 'Last Name', field: 'lastName', filterable: true },
      ]}
    ></owc-table-filter-builder>
  `;
};
```

## Preset filters

Assign `.value` to start from an existing filter state. Filters are plain JSON objects
(`{ field, operator, value, enabled?, negated? }`); a nested array expresses an OR group.

```js demo
export const presetFilters = () => {
  return html`
    <owc-table-filter-builder
      @change=${ev => console.log(ev.target.value)}
      .value=${[
        { field: 'firstName', operator: 'includes', value: 'a' },
        [
          { field: 'age', operator: 'greaterThanOrEqual', value: 30 },
          { field: 'age', operator: 'lessThan', value: 10 },
        ],
      ]}
      .columns=${[
        { label: 'First Name', field: 'firstName', filterable: true },
        { label: 'Age', field: 'age', filterable: true, filterType: 'number' },
      ]}
    ></owc-table-filter-builder>
  `;
};
```

## Filter Lexikon

Columns with a `description` (and optionally `subDescription`) are listed in an expandable
"Filter Lexikon" panel next to the filter entries. Set the `hide-info-detail` attribute to
suppress the panel (the table's array filters use this internally).

## Properties

| Property           | Attribute            | Type                | Default | Description                                                       |
| ------------------ | -------------------- | ------------------- | ------- | ----------------------------------------------------------------- |
| `value`            | -                    | `NestedJsonFilters` | `[]`    | Current filter state; nested arrays are OR groups                 |
| `columns`          | -                    | `Column[]`          | `[]`    | Filterable column definitions (same shape as `owc-table` columns) |
| `globalSearch`     | `global-search`      | `boolean`           | `false` | Keep and render a global text search entry at `value[0]`          |
| `globalSearchOnly` | `global-search-only` | `boolean`           | `false` | Only show the global search input, no manual filter entries       |
| `hideInfoDetail`   | `hide-info-detail`   | `boolean`           | `false` | Hide the "Filter Lexikon" column description panel                |

## Events

| Event    | Description                                                            |
| -------- | ---------------------------------------------------------------------- |
| `change` | Fired after every user edit; read the filter state from `target.value` |

## OwcTableFilter

`@open-wc/components/OwcTableFilterBuilder.js` also exports `OwcTableFilter`, the single filter
entry the builder is composed of. It renders one `{ field, operator, value }` filter with a field
selector, an operator select, and a type specific value input, plus delete / pause / negate
controls. It fires `change` (read `target.value`) and `delete` events. You normally don't use it
directly - reach for it only when building your own filter arrangement UI.
