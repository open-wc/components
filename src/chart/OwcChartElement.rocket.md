```js server
export const config = {
  path: '/chart',
  title: 'Chart',
  menu: {
    parent: 'data',
    order: 50,
    iconName: 'graph-up',
  },
};

import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';

import '@open-wc/components/define/owc-chart-element.js';
```

# Chart

Render line and bar charts from data series. The chart is drawn with [ApexCharts](https://apexcharts.com/) into the element, you pass your data via the `yData` property and configure the chart via the `options` property.

Note: the chart currently ships with a built-in German (`de`) locale — toolbar labels, month/day names and number formatting on the axes and tooltips all use German conventions.

The chart renders asynchronously after the element is connected, so give it an explicit height via `options.height` (or size its container) to avoid layout jumps.

```js demo
export const simpleChart = () => {
  return html`
    <owc-chart-element
      .yData=${[
        {
          name: 'Visitors',
          data: [
            [1, 120],
            [2, 200],
            [3, 150],
            [4, 320],
            [5, 280],
          ],
        },
      ]}
      .options=${{
        height: '300',
        title: 'Visitors per week',
        xType: 'number',
        xLabel: 'Week',
      }}
    ></owc-chart-element>
  `;
};
```

## X Axis Types

The `xType` option controls how the x values of your data points are interpreted:

- `'date'`: x values are `Date` objects (or date strings) and the axis becomes a datetime axis with month labels.
- `'number'`: x values are numbers on a numeric axis, optionally spaced via `xStepSize`.
- `'customNumber'`: x values are treated as categories but labeled with the numeric value, optionally decorated via `valueFormat` and rotated via `xLabelRotate`.
- omitted: x values are treated as categories and labeled as ranges up to the next category — e.g. categories `0, 10, 20` are labeled `0-10`, `10-20`, `20+`. This is useful for bucketed data such as histograms.

### Date Axis

Use `xType: 'date'` when every x value represents a point in time. The chart converts `Date`
objects and date strings to a datetime axis and renders month labels.

```js demo
export const dateXAxisChart = () => {
  return html`
    <owc-chart-element
      .yData=${[
        {
          name: 'Contracts',
          data: [
            [new Date('2026-01-01'), 12],
            [new Date('2026-02-01'), 18],
            [new Date('2026-03-01'), 15],
            [new Date('2026-04-01'), 27],
            [new Date('2026-05-01'), 31],
          ],
        },
      ]}
      .options=${{
        height: '300',
        title: 'Contracts by month',
        xType: 'date',
        xLabel: 'Month',
        yLabel: 'Contracts',
        maxX: new Date('2026-06-01'),
      }}
    ></owc-chart-element>
  `;
};
```

### Number Axis

Use `xType: 'number'` when the x values are continuous numeric values. `xStepSize` controls
the spacing between numeric axis labels.

```js demo
export const numberXAxisChart = () => {
  return html`
    <owc-chart-element
      .yData=${[
        {
          name: 'Conversion rate',
          data: [
            [0, 0.12],
            [25, 0.18],
            [50, 0.24],
            [75, 0.22],
            [100, 0.28],
          ],
        },
      ]}
      .options=${{
        height: '300',
        title: 'Conversion by discount',
        xType: 'number',
        xLabel: 'Discount',
        yLabel: 'Conversion',
        xStepSize: 25,
        yFormat: 'percent',
      }}
    ></owc-chart-element>
  `;
};
```

### Custom Number Axis

Use `xType: 'customNumber'` when the x values are numeric categories that need custom labels,
such as currency ranges, percentages, or rotated labels.

```js demo
export const customNumberXAxisChart = () => {
  return html`
    <owc-chart-element
      .yData=${[
        {
          name: 'Orders',
          data: [
            [5000, 14],
            [10000, 32],
            [25000, 21],
            [50000, 9],
            [100000, 4],
          ],
        },
      ]}
      .options=${{
        height: '300',
        type: 'bar',
        title: 'Orders by deal size',
        xType: 'customNumber',
        xLabel: 'Deal size',
        yLabel: 'Orders',
        xLabelRotate: -45,
        valueFormat: {
          prefix: '€',
          suffix: '+',
        },
      }}
    ></owc-chart-element>
  `;
};
```

### Bucketed Category Axis

Omit `xType` when the x values are bucket starts. Labels are rendered as ranges up to the
next bucket, and the last bucket receives a `+` suffix.

```js demo
export const bucketedXAxisChart = () => {
  return html`
    <owc-chart-element
      .yData=${[
        {
          name: 'Tickets',
          data: [
            [0, 18],
            [4, 37],
            [8, 22],
            [12, 10],
            [16, 5],
          ],
        },
      ]}
      .options=${{
        height: '300',
        type: 'bar',
        title: 'Tickets by response time',
        xLabel: 'Hours until first response',
        yLabel: 'Tickets',
        legendAlwaysVisible: true,
      }}
    ></owc-chart-element>
  `;
};
```

## Line Chart with Multiple Series

Each entry in `yData` becomes its own line. Colors are assigned automatically from the built-in palette, or you can set `color` per series. With `dashWidth` a series is drawn as a dashed line, which works well for showing a target or forecast next to actual values.

```js demo
export const multiSeriesChart = () => {
  return html`
    <owc-chart-element
      .yData=${[
        {
          name: 'Revenue',
          data: [
            [1, 12000],
            [2, 15000],
            [3, 13500],
            [4, 18000],
            [5, 21000],
            [6, 19500],
          ],
        },
        {
          name: 'Costs',
          data: [
            [1, 9000],
            [2, 9500],
            [3, 11000],
            [4, 10500],
            [5, 12000],
            [6, 12500],
          ],
        },
        {
          name: 'Target',
          color: '#a1a1aa',
          strokeWidth: 2,
          dashWidth: 6,
          data: [
            [1, 14000],
            [2, 14000],
            [3, 14000],
            [4, 14000],
            [5, 14000],
            [6, 14000],
          ],
        },
      ]}
      .options=${{
        height: '350',
        title: 'Revenue vs Costs',
        xType: 'number',
        xLabel: 'Month',
        yLabel: 'EUR',
        xStepSize: 1,
      }}
    ></owc-chart-element>
  `;
};
```

## Bar Chart

Set `options.type` to `'bar'` to render bars instead of lines. Without an `xType` the x values are treated as buckets and labeled as ranges — the last bucket gets a `+` suffix.

```js demo
export const barChart = () => {
  return html`
    <owc-chart-element
      .yData=${[
        {
          name: 'Customers',
          data: [
            [0, 40],
            [10, 95],
            [20, 170],
            [30, 120],
            [40, 60],
            [50, 25],
          ],
        },
      ]}
      .options=${{
        height: '300',
        type: 'bar',
        title: 'Customers by age group',
        xLabel: 'Age',
        legendAlwaysVisible: true,
      }}
    ></owc-chart-element>
  `;
};
```

## Click Handling

Each series can define an `onClick` handler which is called with the index of the clicked data point.

```js demo
export const chartClick = ({ wrapperRef }) => {
  return html`
    <div>Last clicked data point: <span class="status">none</span></div>
    <owc-chart-element
      .yData=${[
        {
          name: 'Visitors',
          data: [
            [1, 120],
            [2, 200],
            [3, 150],
            [4, 320],
          ],
          onClick: dataIndex => {
            const status = wrapperRef.value.querySelector('.status');
            status.innerText = `index ${dataIndex}`;
          },
        },
      ]}
      .options=${{
        height: '300',
        type: 'bar',
        xType: 'number',
        xLabel: 'Week',
      }}
    ></owc-chart-element>
  `;
};
```

## API

### Attributes & properties

| Property  | Type       | Default | Description                                                              |
| --------- | ---------- | ------- | ------------------------------------------------------------------------ |
| `yData`   | `Series[]` | `[]`    | The chart series to render. See [Series objects](#series-objects-ydata). |
| `options` | `object`   | `{}`    | Chart configuration. See [Options](#options).                            |

### Series objects (`yData`)

`yData` is an array of series objects. Each series has the following fields:

| Field         | Type                                                         | Description                                                                                   |
| ------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `name`        | `string`                                                     | Name of the series, shown in the legend and tooltip.                                          |
| `data`        | `([string, number] \| [number, number] \| [Date, number])[]` | The data points as `[x, y]` pairs. Which x type to use depends on `options.xType`.            |
| `color`       | `string` (optional)                                          | Color for this series. If omitted a color from the built-in palette (`colorArr`) is assigned. |
| `strokeWidth` | `number` (optional)                                          | Line width for this series. Defaults to `5` for line charts and `0` for bar charts.           |
| `dashWidth`   | `number` (optional)                                          | Dash length for this series. Defaults to `0` (solid line).                                    |
| `onClick`     | `(dataIndex: number) => void` (optional)                     | Called when a data point of this series is clicked, with the index of the clicked data point. |
| `zIndex`      | `number` (optional)                                          | Stacking order of the series (not applied when `xType` is `'date'`).                          |

### Options

All fields of `options` are optional.

| Field                 | Type                                   | Description                                                                                                                                                                   |
| --------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `height`              | `string`                               | Height of the chart (e.g. `'300'`). Defaults to `'auto'`.                                                                                                                     |
| `type`                | `'line' \| 'bar'`                      | Chart type. Defaults to `'line'`.                                                                                                                                             |
| `title`               | `string`                               | Title shown above the chart.                                                                                                                                                  |
| `xType`               | `'date' \| 'number' \| 'customNumber'` | How x values are interpreted, see [X Axis Types](#x-axis-types). When omitted, x values are treated as categories with range labels.                                          |
| `xLabel`              | `string`                               | Title of the x axis.                                                                                                                                                          |
| `yLabel`              | `string`                               | Title of the y axis.                                                                                                                                                          |
| `yFormat`             | `'percent' \| (y: number) => string`   | Formats the y axis labels. `'percent'` uses a German percent formatter, a function receives the raw value. Defaults to a German number formatter.                             |
| `xStepSize`           | `number`                               | Step size between x axis labels. Only applies when `xType` is `'number'`.                                                                                                     |
| `maxX`                | `number \| Date`                       | Upper boundary of the x axis. Only applies when `xType` is `'date'`; defaults to 20 days in the future.                                                                       |
| `xLabelRotate`        | `number`                               | Rotation angle for x axis labels. Only applies when `xType` is `'customNumber'`.                                                                                              |
| `valueFormat`         | `{ prefix?: string, suffix?: string }` | Prefix/suffix added to each x axis label. Only applies when `xType` is `'customNumber'`.                                                                                      |
| `legendAlwaysVisible` | `boolean`                              | Show the legend even when there is only a single series.                                                                                                                      |
| `annotations`         | `object`                               | An [ApexCharts annotations](https://apexcharts.com/docs/options/annotations/) object, passed through as-is. Y axis annotations are taken into account for the y axis maximum. |
| `grid`                | `object`                               | An [ApexCharts grid](https://apexcharts.com/docs/options/grid/) object, passed through as-is.                                                                                 |
| `dashArray`           | `number[]`                             | Declared in the options type but currently not applied — use `dashWidth` on the individual series instead.                                                                    |
| `strokeWidthArray`    | `number[]`                             | Declared in the options type but currently not applied — use `strokeWidth` on the individual series instead.                                                                  |

The y axis always starts at `0` and its maximum is rounded up to a "pretty" value based on the largest data point (and any y axis annotations).

### Exports

Besides the element class the module exports the built-in color palette:

```js
import { OwcChartElement, colorArr } from '@open-wc/components/OwcChartElement.js';
```

`colorArr` is the array of nine hex colors that series get assigned by default, in order. Import it when you want to reuse the palette for related UI (e.g. a custom legend).
