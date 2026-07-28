# @open-wc/components

Web Components for data-heavy interfaces — tables, forms, charts, and workflow UI — shipped as
unbundled ESM so applications import only what they use.

## Installation

```sh
npm install @open-wc/components
```

## Copy, paste, render

Register a component through its `define` entry point and pass data as properties:

```js
import { html } from 'lit';
import '@open-wc/components/define/owc-table.js';

const columns = [
  { label: 'First name', field: 'firstName', filterable: true },
  { label: 'Last name', field: 'lastName', filterable: true },
];

const rows = [
  { id: '1', firstName: 'Ada', lastName: 'Lovelace' },
  { id: '2', firstName: 'Grace', lastName: 'Hopper' },
];

export const view = () => html`<owc-table .columns=${columns} .data=${rows}></owc-table>`;
```

Every component follows the same pattern: pick the smallest demo that matches your use case from
the docs and swap in your own data.

You can also import classes or helpers directly without registering the element:

```js
import { OwcTable } from '@open-wc/components/OwcTable.js';
import { convertToCsv } from '@open-wc/components/table/csv.js';
```

## What's inside

Components are organized by the interface problem they solve:

- **Data** — `Table`, `Data Detail`, `Detail Card`, `Card List`, `Pinboard`: tables, charts, and
  record views for displaying application data.
- **Forms** — `Json Form`, `Autocomplete`, `Input Autofill`, `Input Slider`, `Click Editable *`,
  `Multi Checkbox`: schema-driven forms and the input controls that compose them.
- **Layout** — `Layout Sidebar`, `Tabs`, `Loading Screen`, `Separator`: application shell and page
  structure.
- **Utilities** — `Toast`, `Localization`, `Tooltip`, `Icon Button`, `File Upload`, `Count Up`,
  `Wave Controller`: small helpers, feedback elements, and controllers.

A few components (`Table Info`, `Table Mass Edit`, `Filter Builder`, `Card`) are internal building
blocks used inside the components above rather than standalone features.

## Documentation

Component reference pages with live, copyable demos are colocated with the source as `*.rocket.md`
files. Run the documentation site locally to browse the full component index:

```sh
npm install
npm start
```

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, validation commands, and commit message
rules.

## License

MIT. See [LICENSE](LICENSE).
