```js server
export const config = {
  path: '/data/doughnut-chart',
  title: 'Doughnut Chart',
  menu: { parent: '/data', order: 55, iconName: 'pie-chart' },
};
import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';
import '@open-wc/components/define/owc-doughnut-chart.js';
```

# Doughnut Chart

A doughnut chart with selectable amounts, optional slice icons and native keyboard actions.
Supply category values, formatted amounts and colors, and use slots for the heading, center and
caption. Each slice uses `value / sum(values)`, so raw amounts and fractional weights both work.

## Basic usage

This example shows 25% Books and 75% Travel. Click a slice, or focus it with Tab and press Enter
or Space. The `category-activate` event reports its ID so your application can show the details.

```js demo
export const twoCategories = () => html`
  <div>
    <owc-doughnut-chart
      style="inline-size: min(100%, 24rem)"
      context="EUR per month"
      .categories=${[
        {
          id: 'books',
          label: 'Books',
          value: 100,
          amount: '€ 1,00',
          color: '#3488a0',
          actionable: true,
        },
        {
          id: 'travel',
          label: 'Travel',
          value: 300,
          amount: '€ 3,00',
          color: '#d88b44',
          actionable: true,
        },
      ]}
      @category-activate=${event => {
        event.currentTarget.nextElementSibling.textContent = `Details requested for: ${event.detail.categoryId}`;
      }}
    >
      <h3 slot="heading">Monthly budget</h3>
      <strong style="font-size: 1.5rem">€ 4,00</strong>
      <span>Planned spending</span>
      <span>EUR per month</span>
      <p slot="caption">Prepared monthly amounts</p>
    </owc-doughnut-chart>
    <p role="status">Activate a slice to request its details.</p>
  </div>
`;
```

## Empty and zero values

An empty category array shows `empty-label`. Known categories whose values are all zero show a
neutral ring and keep the supplied center content. Zero values create no slices or action tab stops.

```js demo
export const emptyData = () => html`
  <owc-doughnut-chart .categories=${[]}>
    <h3 slot="heading">No observations</h3>
  </owc-doughnut-chart>
`;
```

```js demo
export const knownZero = () => html`
  <owc-doughnut-chart
    style="max-inline-size: 24rem"
    context="EUR per month"
    .categories=${[{ id: 'books', label: 'Books', value: 0, amount: '€ 0,00', color: '#3488a0' }]}
  >
    <h3 slot="heading">Known zero</h3>
    <strong>€ 0,00</strong>
    <span>Planned spending</span>
  </owc-doughnut-chart>
`;
```

## Labels and center content

Amounts and leader lines appear outside the ring when the complete label set fits. The center
content moves below the ring if it needs more space. Drag across a visible amount or the center
text to select and copy it; selecting text does not activate a slice.

```js demo
export const annotatedCategories = () => html`
  <owc-doughnut-chart
    style="inline-size: min(100%, 30rem)"
    context="EUR per month"
    .categories=${[
      {
        id: 'books',
        label: 'Books',
        value: 100,
        amount: '€ 1,00',
        color: '#3488a0',
        icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="16" height="16"%3E%3Ccircle cx="8" cy="8" r="5" fill="white"/%3E%3C/svg%3E',
      },
      { id: 'travel', label: 'Travel', value: 300, amount: '€ 3,00', color: '#d88b44' },
    ]}
  >
    <h3 slot="heading">Annotated budget</h3>
    <strong style="font-size: 22px">€ 4,00</strong>
    <span>per month</span>
  </owc-doughnut-chart>
`;
```

## Icons

Set a category's `icon` to a same-origin image URL or a data URL. These examples use small SVG
images. Icons are decorative and appear only when their full 16px square fits inside the slice.
The tiny share in the second chart keeps its true size and keyboard action even without its icon.

```js demo
export const sliceIcons = () => {
  const icon = path =>
    `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`)}`;
  const book = icon('M2 3h4l2 1 2-1h4v10h-4l-2 1-2-1H2V3ZM8 4v10');
  const travel = icon('M14 2 9 14 7 9 2 7 14 2ZM7 9l7-7');
  const home = icon('M2 7 8 2l6 5M4 6v8h8V6M7 14V9h2v5');
  const reportActivation = event => {
    event.currentTarget.nextElementSibling.textContent = `Activated: ${event.detail.categoryId}`;
  };

  return html`
    <div style="display: flex; flex-wrap: wrap; gap: 2rem">
      <div style="flex: 1 1 20rem; min-inline-size: 0">
        <owc-doughnut-chart
          context="EUR"
          .categories=${[
            {
              id: 'books',
              label: 'Books',
              value: 2500,
              amount: '€ 25,00',
              color: '#3488a0',
              icon: book,
              actionable: true,
            },
            {
              id: 'travel',
              label: 'Travel',
              value: 2500,
              amount: '€ 25,00',
              color: '#144569',
              icon: travel,
              actionable: true,
            },
            {
              id: 'home',
              label: 'Home',
              value: 5000,
              amount: '€ 50,00',
              color: '#9772b5',
              icon: home,
              actionable: true,
            },
          ]}
          @category-activate=${reportActivation}
        >
          <h3 slot="heading">Three category icons</h3>
          <strong style="font-size: 22px">€ 100,00</strong>
          <span>Prepared amounts</span>
        </owc-doughnut-chart>
        <p role="status">Activate a slice to report its category ID.</p>
      </div>
      <div style="flex: 1 1 20rem; min-inline-size: 0">
        <owc-doughnut-chart
          context="EUR"
          .categories=${[
            {
              id: 'tiny',
              label: 'One-cent share',
              value: 1,
              amount: '€ 0,01',
              color: '#3488a0',
              icon: book,
              actionable: true,
            },
            {
              id: 'remaining',
              label: 'Remaining amount',
              value: 9999,
              amount: '€ 99,99',
              color: '#144569',
              icon: home,
              actionable: true,
            },
          ]}
          @category-activate=${reportActivation}
        >
          <h3 slot="heading">An icon that cannot fit</h3>
          <strong style="font-size: 22px">€ 100,00</strong>
          <span>Prepared amounts</span>
        </owc-doughnut-chart>
        <p role="status">Tab to the one-cent share and press Enter.</p>
      </div>
    </div>
  `;
};
```

## Animation

Replace `categories` with updated values to ease automatically to the new proportions over 400 ms.
Icons, amount positions, leader lines and hit areas follow the slices. Press the button again during
the transition to reverse from the current position. Supplied amount text updates immediately;
formatting and center content remain consumer-owned.

Initial rendering, category additions, removals, reordering and empty or all-zero states apply
immediately. Reduced motion also applies the destination immediately.

```js demo
export const animatedAngles = () => {
  const icon = path =>
    `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`)}`;
  const groups = [
    {
      id: 'books',
      label: 'Books',
      color: '#3488a0',
      icon: icon('M2 3h4l2 1 2-1h4v10h-4l-2 1-2-1H2V3ZM8 4v10'),
    },
    {
      id: 'travel',
      label: 'Travel',
      color: '#144569',
      icon: icon('M14 2 9 14 7 9 2 7 14 2ZM7 9l7-7'),
    },
    {
      id: 'home',
      label: 'Home',
      color: '#9772b5',
      icon: icon('M2 7 8 2l6 5M4 6v8h8V6M7 14V9h2v5'),
    },
  ];
  const distributions = [
    [2500, 2500, 5000],
    [6000, 3000, 1000],
  ];
  const money = new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const prepare = values =>
    groups.map((group, index) => ({
      ...group,
      value: values[index],
      amount: `€ ${money.format(values[index] / 100)}`,
      actionable: true,
    }));
  let destination = 0;

  const update = event => {
    const button = event.currentTarget;
    const host = button.parentElement;
    const chart = host.querySelector('owc-doughnut-chart');
    destination = 1 - destination;
    chart.categories = prepare(distributions[destination]);
    button.textContent = `Show distribution ${destination === 0 ? 'B' : 'A'}`;
    host.querySelector('[data-motion-status]').textContent =
      `Distribution ${destination === 0 ? 'A' : 'B'} selected.`;
  };

  return html`
    <div>
      <button type="button" @click=${update}>Show distribution B</button>
      <owc-doughnut-chart
        style="inline-size: min(100%, 30rem)"
        context="EUR"
        .categories=${prepare(distributions[0])}
        @category-activate=${event => {
          event.currentTarget.parentElement.querySelector('[data-activation-status]').textContent =
            `Activated: ${event.detail.categoryId}`;
        }}
      >
        <h3 slot="heading">Animated slice angles</h3>
        <strong style="font-size: 22px">€ 100,00</strong>
        <span>Prepared amounts</span>
      </owc-doughnut-chart>
      <p data-motion-status role="status">Distribution A shown.</p>
      <p data-activation-status role="status">Activate a slice while its angle changes.</p>
    </div>
  `;
};
```

## API

### Imports

```js
import '@open-wc/components/define/owc-doughnut-chart.js';
// Or register a subclass yourself:
import { OwcDoughnutChart } from '@open-wc/components/OwcDoughnutChart.js';
```

Import the category and activation types from the public type entry:

```ts
import type {
  OwcDoughnutChartCategory,
  OwcDoughnutChartActivation,
} from '@open-wc/components/OwcDoughnutChart.types.js';
```

### Properties and attributes

<div tabindex="0" role="region" aria-labelledby="properties-and-attributes" style="overflow: auto; max-inline-size: 100%">

| Property           | Attribute           | Default             | Description                                                    |
| ------------------ | ------------------- | ------------------- | -------------------------------------------------------------- |
| `categories`       | —                   | `[]`                | Ordered category array. Replace the array to update the chart. |
| `context`          | `context`           | `''`                | Unit or period included in each slice's accessible name.       |
| `emptyLabel`       | `empty-label`       | `'Keine Daten'`     | Message when the array is empty.                               |
| `unavailableLabel` | `unavailable-label` | `'Nicht verfügbar'` | Message for invalid input.                                     |

</div>

### Categories

<div tabindex="0" role="region" aria-labelledby="categories" style="overflow: auto; max-inline-size: 100%">

| Field        | Type                 | Description                                                      |
| ------------ | -------------------- | ---------------------------------------------------------------- |
| `id`         | `string`             | Unique, stable, nonempty category identity.                      |
| `label`      | `string`             | Nonempty accessible category name.                               |
| `value`      | `number`             | Finite, nonnegative weight. Slice size is `value / sum(values)`. |
| `amount`     | `string`             | Exact, nonempty consumer-formatted amount.                       |
| `color`      | `string`             | Valid CSS color.                                                 |
| `icon`       | `string` (optional)  | Decorative image URL, shown when its full 16 px square fits.     |
| `actionable` | `boolean` (optional) | Enables the native slice button when `true`.                     |

</div>

Values may be raw amounts or fractional weights; their sum must be finite. Zero values have no arc.
All-zero data draws a neutral ring without actions. Missing data uses the empty state; invalid
categories use the unavailable state. The chart does not derive formatted amounts or center content.

### Slots

<div tabindex="0" role="region" aria-labelledby="slots" style="overflow: auto; max-inline-size: 100%">

| Slot      | Description                                                                   |
| --------- | ----------------------------------------------------------------------------- |
| `heading` | Heading markup above the ring. Choose its level for the surrounding document. |
| Default   | Selectable center content. Wide content moves below the ring.                 |
| `caption` | Optional content below the chart.                                             |

</div>

### Events and keyboard

`category-activate` bubbles across shadow boundaries with `detail: { categoryId: string }`.
Consumers handle navigation or other actions. Tab reaches actionable slices in category order;
Enter and Space activate them. Focus follows the same ID through updates. When a focused category
disappears, focus moves to the supplied heading. Center content and visible amount labels support
native selection and copying.

### Styling

Style slotted markup directly. The `heading`, `center`, `caption`, `amount` and `leader-lines` parts
expose chart content. `--owc-doughnut-chart-neutral-color` sets the zero ring color (default `#d9d9d9`).
The ring fits its container up to 288 px in diameter. Outer amounts and leaders are omitted as a set
when they cannot fit without collisions; exact amounts remain in the slices' accessible names.

### Rendering support

The chart uses Canvas 2D paths with matching HTML controls and HTML-in-Canvas content. When native
HTML-in-Canvas is unavailable, its runtime polyfill loads automatically. Preserve dynamic import
splitting in your bundler to keep this fallback out of the native browser's initial download.

While rendering initializes, the chart is hidden and inert. If loading or drawing fails, or no paint
arrives within five seconds, all component output disappears. Surrounding recovery UI belongs to the
consumer.
