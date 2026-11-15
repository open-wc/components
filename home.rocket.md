```js server
export const config = {
  path: '/',
  title: '@open-wc/components',
  metadata: {
    title: 'Web components for data-heavy interfaces',
    description:
      'Tables, forms, and workflow UI as framework-agnostic Lit components, shipped as unbundled ESM.',
  },
  menu: false,
};

import { atlasHeroLayout as heroLayout } from '@rocket/js/layouts/atlasHero.js';
import { heroData } from '@open-wc/components/docsData.js';

export { atlasHeroComponents as components } from '@rocket/js/layouts/atlasHero.js';
export const layout = pageData => heroLayout(pageData, heroData);
```

```js client
import { html, render } from 'lit';
import '@open-wc/components/define/owc-table.js';

const firstNames = ['Ada', 'Grace', 'Alan', 'Margaret', 'Linus', 'Barbara', 'Dennis', 'Radia'];
const lastNames = ['Lovelace', 'Hopper', 'Turing', 'Hamilton', 'Torvalds', 'Liskov', 'Ritchie'];
const professions = ['Engineer', 'Designer', 'Analyst', 'Product Manager', 'Researcher', 'Teacher'];
const cities = ['Vienna', 'Amsterdam', 'Lisbon', 'Berlin', 'Zurich', 'Copenhagen', 'Prague'];

// Seeded, so everybody sees the same 1,000 people.
let seed = 42;
const random = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const pick = list => list[Math.floor(random() * list.length)];
const twoDigits = value => String(value).padStart(2, '0');

const people = Array.from({ length: 1000 }, (_, index) => ({
  id: String(index + 1),
  firstName: pick(firstNames),
  lastName: pick(lastNames),
  profession: pick(professions),
  city: pick(cities),
  age: 22 + Math.floor(random() * 43),
  monthlyPay: 2800 + Math.floor(random() * 42) * 100,
  birthDate: `${1960 + Math.floor(random() * 40)}-${twoDigits(1 + Math.floor(random() * 12))}-${twoDigits(1 + Math.floor(random() * 28))}`,
}));

const columns = [
  { label: 'Nr.', formatter: 'rownum' },
  { label: 'First name', field: 'firstName', filterable: true, sortable: true },
  { label: 'Last name', field: 'lastName', filterable: true, sortable: true },
  { label: 'Profession', field: 'profession', filterable: true, sortable: true },
  { label: 'City', field: 'city', filterable: true, sortable: true },
  { label: 'Age', field: 'age', formatter: 'number', filterable: true, sortable: true },
  { label: 'Monthly pay', field: 'monthlyPay', formatter: 'currency', sortable: true },
  { label: 'Birthdate', field: 'birthDate', formatter: 'date', sortable: true },
];

const liveTable = document.querySelector('#home-live-table');
if (liveTable) {
  render(
    html`
      <owc-table
        virtualizer-mode="always"
        selectable
        grow-full-width
        sticky-header
        show-info
        filter-mode="global-search"
        .actionTabs=${{ export: { visible: true }, settings: { visible: true } }}
        .columns=${columns}
        .data=${people}
      ></owc-table>
    `,
    liveTable,
  );
}
```

<div class="home-section-head">
  <h2 id="try-it">Try it right here</h2>
  <p>This is a live <code>owc-table</code> with 1,000 rows: search it, sort a column, select rows, pick the visible columns, or export them. Rows are virtualized, so it stays fast with far more.</p>
</div>
<div class="home-window">
  <div class="home-window-bar"><i></i><i></i><i></i><code>&lt;owc-table&gt;</code><a href="/data/table">Table docs →</a></div>
  <div id="home-live-table" class="home-window-body"></div>
</div>

<div class="home-section-head">
  <h2 id="whats-inside">What's inside</h2>
  <p>One package, organized by the interface problem you are solving. Every component has a reference page with copyable demos.</p>
</div>
<div class="home-categories">
  <section class="home-category">
    <h3><a href="/data">Data</a> <span>5 components</span></h3>
    <p>Tables, record views, and card collections for displaying application data.</p>
    <ul>
      <li><a href="/data/table">Table</a></li>
      <li><a href="/data/data-detail">Data Detail</a></li>
      <li><a href="/data/detail-card">Detail Card</a></li>
      <li><a href="/data/card-list">Card List</a></li>
      <li><a href="/data/pinboard">Pinboard</a></li>
    </ul>
  </section>
  <section class="home-category">
    <h3><a href="/forms">Forms</a> <span>9 components</span></h3>
    <p>Schema-driven forms and the input controls that compose them.</p>
    <ul>
      <li><a href="/forms/json-form">Json Form</a></li>
      <li><a href="/forms/autocomplete">Autocomplete</a></li>
      <li><a href="/forms/input-autofill">Input Autofill</a></li>
      <li><a href="/forms/input-slider">Input Slider</a></li>
      <li><a href="/forms/click-editable-input">Click Editable</a></li>
      <li><a href="/forms/multi-checkbox">Multi Checkbox</a></li>
    </ul>
  </section>
  <section class="home-category">
    <h3><a href="/layout">Layout</a> <span>4 components</span></h3>
    <p>Application shell and page structure.</p>
    <ul>
      <li><a href="/layout/layout-sidebar">Layout Sidebar</a></li>
      <li><a href="/layout/tabs">Tabs</a></li>
      <li><a href="/layout/loading-screen">Loading Screen</a></li>
      <li><a href="/layout/separator">Separator</a></li>
    </ul>
  </section>
  <section class="home-category">
    <h3><a href="/utilities">Utilities</a> <span>7 helpers</span></h3>
    <p>Small helpers, feedback elements, and controllers.</p>
    <ul>
      <li><a href="/utilities/toast">Toast</a></li>
      <li><a href="/utilities/tooltip">Tooltip</a></li>
      <li><a href="/utilities/icon-button">Icon Button</a></li>
      <li><a href="/utilities/file-upload">File Upload</a></li>
      <li><a href="/utilities/count-up">Count Up</a></li>
      <li><a href="/utilities/localization">Localization</a></li>
    </ul>
  </section>
</div>

## Copy, paste, render

Register a component through its `define` entry point and pass data as properties. This example is
complete enough to paste into any Lit view:

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

Every reference page follows the same pattern: pick a component from
[the component index](/components), copy the smallest demo that matches your use case, and replace
the demo data with application data.
