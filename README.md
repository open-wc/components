# @open-wc/components

Reusable Web Components and helpers for data, forms, and workflow interfaces. The package ships
unbundled ESM modules so applications can import only the components or utilities they use.

## Installation

```sh
npm install @open-wc/components
```

## Usage

Import component classes or helper modules from package entry points:

```js
import { OwcTable } from '@open-wc/components/OwcTable.js';
import { convertToCsv } from '@open-wc/components/table/csv.js';
```

Register custom elements with the matching `define/*` entry point:

```js
import '@open-wc/components/define/owc-table.js';
```

Then use the registered element in your templates:

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

## Documentation

Component reference pages with live demos are colocated with the source as `*.rocket.md` files.
Run the documentation site locally:

```sh
npm install
npm start
```

Then open the components index to browse reference pages with copyable demos for every public UI
export.

## Project Status

`@open-wc/components` is preparing its first public release as `0.1.0`. Public exports are expected
to remain available for the initial release, while documentation and package contents are being
audited before publication.

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, validation commands, and commit message
rules.

## License

MIT. See [LICENSE](LICENSE).
