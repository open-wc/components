```js server
export const config = {
  path: '/pie-chart',
  title: 'Pie Chart',
  menu: {
    parent: 'data',
    order: 60,
    iconName: 'pie-chart',
  },
};

import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';

import '@open-wc/components/define/owc-pie-chart-element.js';
```

# Pie Chart

Render a pie chart from a list of named values. The chart is drawn with [ApexCharts](https://apexcharts.com/) into the element, you pass your data via the `yData` property and configure the chart via the `options` property.

Note: the pie chart currently ships with a built-in German (`de`) locale — toolbar labels and number formatting in the tooltip use German conventions, and the empty state reads "Keine Daten".

The chart renders asynchronously after the element is connected, so size its container (e.g. via `max-width`) so the page does not jump while it loads. The legend is always shown below the chart.

```js demo
export const simplePieChart = () => {
  return html`
    <div style="max-width: 480px;">
      <owc-pie-chart-element
        .yData=${[
          { name: 'Email', data: 44 },
          { name: 'Phone', data: 25 },
          { name: 'Chat', data: 18 },
        ]}
      ></owc-pie-chart-element>
    </div>
  `;
};
```

## Data (`yData`)

`yData` is an array of slice objects. Each slice has the following fields:

| Field     | Type                    | Description                                                     |
| --------- | ----------------------- | --------------------------------------------------------------- |
| `name`    | `string`                | Label of the slice, shown in the legend and tooltip.            |
| `data`    | `number`                | Value of the slice. Slice sizes are proportional to the values. |
| `onClick` | `() => void` (optional) | Called when this slice is clicked.                              |

Slice colors are assigned automatically from a built-in palette (the same nine colors repeated).

## Options

All fields of `options` are optional.

| Field        | Type     | Description                                                                                                                            |
| ------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `title`      | `string` | Title shown above the chart.                                                                                                           |
| `otherIndex` | `number` | Index of the slice in `yData` that represents "everything else" — that slice is rendered in a neutral grey instead of a palette color. |

## Title and "Other" Slice

A typical use case is showing the biggest contributors individually and grouping the rest into an "Other" slice. Point `otherIndex` at that entry and it is colored grey so it visually recedes behind the named slices.

```js demo
export const pieChartWithOther = () => {
  return html`
    <div style="max-width: 480px;">
      <owc-pie-chart-element
        .yData=${[
          { name: 'Germany', data: 3200 },
          { name: 'Austria', data: 1800 },
          { name: 'Switzerland', data: 1100 },
          { name: 'Other', data: 950 },
        ]}
        .options=${{
          title: 'Orders by country',
          otherIndex: 3,
        }}
      ></owc-pie-chart-element>
    </div>
  `;
};
```

## Click Handling

Each slice can define an `onClick` handler which is called when the slice is clicked — useful to drill down into the underlying data.

```js demo
export const pieChartClick = ({ wrapperRef }) => {
  const setStatus = name => {
    const status = wrapperRef.value.querySelector('.status');
    status.innerText = name;
  };
  return html`
    <div>Last clicked slice: <span class="status">none</span></div>
    <div style="max-width: 480px;">
      <owc-pie-chart-element
        .yData=${[
          { name: 'Email', data: 44, onClick: () => setStatus('Email') },
          { name: 'Phone', data: 25, onClick: () => setStatus('Phone') },
          { name: 'Chat', data: 18, onClick: () => setStatus('Chat') },
        ]}
      ></owc-pie-chart-element>
    </div>
  `;
};
```

## Exports

The module exports the element class:

```js
import { OwcPieChartElement } from '@open-wc/components/OwcPieChartElement.js';
```
