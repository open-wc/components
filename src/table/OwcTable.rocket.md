```js server
export const config = {
  path: '/data/table',
  title: 'Table',
  menu: {
    parent: '/data',
    order: 10,
    iconName: 'table',
  },
};
import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
import { docsData } from '@open-wc/components/docsData.js';

export const components = atlasDocComponents;
export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html, nothing } from 'lit';
import '@open-wc/components/register/de.js';

import '@open-wc/components/define/owc-table.js';
const personData = [
  {
    id: '0013X00002eOb5BQAS',
    firstName: 'Julian',
    lastName: 'Schmidt',
    profession: 'Teacher',
    premium: true,
    gender: 'male',
    age: 34,
    birthDate: '1992-04-18',
    monthlyPay: 3850,
    hobbies: ['Reading', 'Hiking', 'Photography'],
  },
  {
    id: '0013X00002eP8qsQAC',
    firstName: 'Sophie',
    lastName: 'Wagner',
    profession: 'Developer',
    premium: false,
    gender: 'female',
    age: 65,
    birthDate: '1961-09-02',
    monthlyPay: 6400,
    hobbies: ['Cooking', 'Traveling', 'Music'],
  },
  {
    id: '0013X00002eP8sDQAS',
    firstName: 'Jonas',
    lastName: 'Gruber',
    profession: '',
    premium: false,
    gender: 'female',
    age: 1025,
    birthDate: '1941-01-11',
    monthlyPay: 2100,
    hobbies: ['Gardening', 'Reading'],
  },
];

const person = {
  id: '0013X00002eOb5BQAS',
  firstName: 'Huber',
  lastName: 'Schmidt',
  profession: 'Teacher',
  premium: true,
  gender: 'male',
  age: 34,
  birthDate: '1992-04-18',
  monthlyPay: 3850,
  hobbies: ['Reading', 'Hiking', 'Photography'],
};

const firstNames = [
  'Lucie',
  'Maria',
  'Leon',
  'Julia',
  'David',
  'Emma',
  'Lucas',
  'Sophie',
  'Julian',
  'Anna',
  'Jonas',
  'Martina',
];

const lastNames = [
  'Huber',
  'Mayer',
  'Gruber',
  'Schmidt',
  'Wagner',
  'Bauer',
  'Hofer',
  'Fischer',
  'Leitner',
  'Lang',
];

const professions = ['Teacher', 'Developer', 'Lawyer', 'Professor', ''];

const hobbies = [
  'Reading',
  'Hiking',
  'Cycling',
  'Cooking',
  'Photography',
  'Gardening',
  'Gaming',
  'Traveling',
  'Swimming',
  'Music',
];

function generateMoreData(amount = 25) {
  const data = [];

  for (let i = 0; i < amount; i++) {
    const birthYear = 1960 + Math.floor(Math.random() * 40);
    const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');

    const personHobbies = [...hobbies]
      .sort(() => Math.random() - 0.5)
      .slice(0, 2 + Math.floor(Math.random() * 4));

    data.push({
      id: crypto.randomUUID(),
      firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
      lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
      profession: professions[Math.floor(Math.random() * professions.length)],
      premium: Math.random() > 0.5,
      gender: Math.random() > 0.5 ? 'male' : 'female',
      age: 25 + Math.floor(Math.random() * 45),
      birthDate: `${birthYear}-${birthMonth}-${birthDay}`,
      monthlyPay: 2800 + Math.floor(Math.random() * 4200),
      hobbies: personHobbies,
    });
  }

  return data;
}

const defaultTableConfig = {};
```

# Table

`owc-table` is a highly configurable table component for displaying structured data. It supports client-side and server-side data loading, filtering, sorting, grouping, inline editing, exporting, custom row rendering, and many additional features while remaining easy to integrate into existing applications.

The component is configured through a column definition and a data source. Whether your data already exists locally or needs to be loaded from an API, `owc-table` provides a consistent API for displaying and interacting with tabular data.

## Simple Example

The following example demonstrates a simple setup to render a table.

Columns are defined using the `.columns` property, while row data is provided through `.data`. Each column requires a unique `field` that maps to a property of every row object. The `label` property defines the text shown in the table header.

```js demo
export const simpleTable = () => {
  return html`
    <div style="height: 60vh; overflow: auto; ">
      <owc-table
        virtualizer-mode="always"
        selectable
        grow-full-width
        filter-mode="global-search-with-builder"
        save-state-to-url
        sticky-header
        show-info
        .actionTabs=${{
          export: { visible: true },
          settings: { visible: true },
        }}
        .columns=${[
          {
            label: 'Nr.',
            formatter: 'rownum',
          },
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
            filterable: true,
          },
          {
            label: 'Age',
            field: 'age',
            formatter: 'number',
            showInCalculateSums: true,
            filterable: true,
          },
          {
            label: 'Monthly Pay',
            field: 'monthlyPay',
            formatter: 'number',
          },
          {
            label: 'Birthdate',
            field: 'birthDate',
            formatter: 'date',
          },
        ]}
        .data=${generateMoreData(200)}
      ></owc-table>
    </div>
  `;
};
```

## Getting Started

Every table consists of two building blocks:

- **Columns** define how data is presented.
- **Rows** provide the actual data to display.

A row is represented as a plain JavaScript object. Each column references one property of that object using its `field` property.

```js
const row = {
  id: 1,
  firstName: 'Ada',
  lastName: 'Lovelace',
};
```

```js
columns = [
  {
    label: 'First Name',
    field: 'firstName',
  },
  {
    label: 'Last Name',
    field: 'lastName',
  },
];
```

Once both are provided, the table automatically renders the data.

## Loading Data

`owc-table` supports two approaches for loading data:

- Pass an existing array using `.data`.
- Provide an asynchronous `handleData` function.

Choose the approach that best fits your application. If your data already exists locally, using `.data` is the simplest option. If the data needs to be fetched from an API or database, `handleData` provides an asynchronous loading mechanism.

### Passing Data

If all data is already available when the table is rendered, provide it through the `.data` property.

This is the recommended approach for applications that keep their data locally, for example after synchronizing it with a backend.

```js demo
export const dataHandlingPassing = () => {
  return html`
    <owc-table
      .columns=${[
        {
          label: 'First Name',
          field: 'firstName',
        },
        {
          label: 'Last Name',
          field: 'lastName',
        },
      ]}
      .data=${[
        { id: 1, firstName: 'Ada', lastName: 'Lovelace' },
        { id: 2, firstName: 'Grace', lastName: 'Hopper' },
      ]}
    ></owc-table>
  `;
};
```

### Loading Data with handleData

When data must be retrieved from an external source such as a REST API or database, provide an asynchronous `handleData` function instead of using `.data`.

Depending on the configured mode, the table decides when this function is executed.

| Mode                          | Description                                                                            |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| `initiallyOnce`               | Loads the data once and performs all filtering and sorting locally.                    |
| `anyFilterChange`             | Requests new data whenever filters change.                                             |
| `initiallyAndAnyFilterChange` | Loads data initially and again whenever filters change. _(Currently not implemented.)_ |

The behavior can be configured using `.handleDataOptions`.

### Handle Data Mode: initiallyOnce

`initiallyOnce` is the default mode.

This mode is ideal for datasets that comfortably fit into memory and do not change frequently. The table performs a single request when it is first rendered. Afterwards, filtering and sorting happen entirely in the browser without additional network requests.

Whenever new data is required, call `callHandleData()` manually or use the built-in refresh button (enabled by default).

```js demo
export const handleDataOptions_initiallyOnce = () => {
  return html`
    <owc-table
      .handleData=${async () => {
        // Simulate an API request.
        await new Promise(resolve => setTimeout(resolve, 1000));
        return personData;
      }}
      .columns=${[
        {
          label: 'Profession',
          field: 'profession',
        },
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
      ]}
    ></owc-table>
  `;
};
```

### Handle Data Mode: anyFilterChange

Use `anyFilterChange` for large datasets that should remain on the server.

Whenever a filter changes, the table calls `handleData()` again with the current filters. This allows filtering to happen directly in the backend or database instead of loading all records into the browser.

To reduce unnecessary requests, use the optional `condition` callback. It determines whether a request should be executed for the current filter state. The example below only performs a request once the user has entered at least three characters.

```js demo
const handleDataOptionsArray = [...generateMoreData(100), ...personData];

export const handleDataOptions_anyFilterChange = () => {
  return html`
    <owc-table
      .handleData="${async ({ jsonFilters }) => {
        const search = jsonFilters[0]?.value;

        await new Promise(resolve => setTimeout(resolve, 1000));

        return handleDataOptionsArray.filter(
          person =>
            person.firstName.toLowerCase().includes(search.toLowerCase()) ||
            person.lastName.toLowerCase().includes(search.toLowerCase()),
        );
      }}"
      filter-mode="global-search"
      .handleDataOptions=${{
        mode: 'anyFilterChange',
        condition: ({ jsonFilters }) => {
          const search = jsonFilters[0]?.value;
          return search && search.length > 2;
        },
        debounceTime: 500,
      }}
      .columns=${[
        {
          label: 'Profession',
          field: 'profession',
          filterable: true,
          filterType: 'autocomplete',
          filterOptions: [
            { value: 'Teacher', label: 'Teacher' },
            { value: 'Lawyer', label: 'Lawyer' },
            { value: 'Developer', label: 'Developer' },
            { value: 'Professor', label: 'Professor' },
          ],
        },
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
      ]}
    ></owc-table>
  `;
};
```

## Columns

Columns define how data is presented in the table.

Every column represents one value of a row object. At minimum, a column requires a `label`, which is displayed in the table header, and a `field`, which references the corresponding property on each row.

```js
columns = [
  {
    label: 'First Name',
    field: 'firstName',
  },
  {
    label: 'Last Name',
    field: 'lastName',
  },
];
```

Besides displaying values, columns also control formatting, filtering, sorting, editing, visibility, alignment, export behavior, and many other features described throughout this section.

### Formatted Cells

Columns can format their displayed values using the `formatter` property.

Several built-in formatters are available:

| Formatter  | Description                                             |
| ---------- | ------------------------------------------------------- |
| `rownum`   | Displays the row number.                                |
| `number`   | Formats numeric values.                                 |
| `currency` | Formats values using the configured currency formatter. |
| `percent`  | Formats percentages.                                    |
| `date`     | Formats dates using the configured date formatter.      |
| `datetime` | Formats date and time values.                           |

In addition to the built-in formatters, a custom formatter function can be supplied. The function receives the current row and additional rendering information and may return plain text or HTML.

```js demo
export const formatTable = () => {
  return html`
    <owc-table
      .columns=${[
        {
          label: 'Nr.',
          formatter: 'rownum',
        },
        {
          label: 'First Name',
          field: 'firstName',
        },
        {
          label: 'Age',
          field: 'age',
          formatter: 'number',
        },
        {
          label: 'Monthly Pay',
          field: 'monthlyPay',
          formatter: 'currency',
        },
        {
          label: 'Birthdate',
          field: 'birthDate',
          formatter: 'date',
        },
        {
          label: 'Hobbies',
          field: 'hobbies[]',
          fieldFilteredReturn: 'hobbies[]',
          filterType: 'number',
          formatter: (row, { fieldValueFiltered }) => {
            return html`
              <ul>
                ${fieldValueFiltered.map(value => html`<li>${value}</li>`)}
              </ul>
            `;
          },
        },
        {
          label: 'Profession',
          field: 'profession',
          formatter: row => html`
            <span style="background: green; border-radius: 5px; color: white; padding: 3px;">
              ${row.profession}
            </span>
          `,
        },
      ]}
      .data=${personData}
    ></owc-table>
  `;
};
```

### Override Built-in Formatters

The built-in formatters use German locale settings by default.

You can override the formatter instances to use different locales, currencies, or formatting options throughout the entire table.

```js demo
export const overrideBuiltinFormatter = () => {
  return html`
    <owc-table
      .columns=${[
        { label: 'Nr.', formatter: 'rownum' },
        {
          label: 'First Name',
          field: 'firstName',
        },
        {
          label: 'Age',
          field: 'age',
          formatter: 'number',
        },
        {
          label: 'Monthly Pay',
          field: 'monthlyPay',
          formatter: 'currency',
        },
        {
          label: 'Birthdate',
          field: 'birthDate',
          formatter: 'date',
        },
      ]}
      .data=${personData}
      .numberFormatter=${new Intl.NumberFormat('de', {
        minimumFractionDigits: 2,
      })}
      .currencyFormatter=${new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
      .dateFormatter=${new Intl.DateTimeFormat('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      })}
    ></owc-table>
  `;
};
```

### Align Column Content

Use the `align` property to control how values are aligned inside a column.

| Value    | Description                                                         |
| -------- | ------------------------------------------------------------------- |
| `start`  | Left-aligned (default).                                             |
| `center` | Center-aligned.                                                     |
| `end`    | Right-aligned.                                                      |
| `full`   | Centers the cell content while leaving the header aligned normally. |

```js demo
export const alignContent = () => {
  return html`
    <owc-table
      .columns=${[
        {
          label: 'Nr.',
          formatter: 'rownum',
          align: 'start',
        },
        {
          label: 'Profession',
          field: 'profession',
          align: 'center',
        },
        {
          label: 'First Name',
          field: 'firstName',
          align: 'end',
        },
        {
          label: 'Last Name',
          field: 'lastName',
          align: 'full',
        },
      ]}
      .data=${personData}
    ></owc-table>
  `;
};
```

### Column Width

Use the `width` property to define an initial column width.

Columns without a `width` fit their content, at least 50px: the header label on one line, and the rows the table has rendered. In a large table, those are the rows in and around the visible area. The widths then stay the same while you scroll, even when rows with wider content come into view, so the columns never jump. Cell text doesn't wrap, so a column fits the whole text; content that can wrap, such as text in a custom formatter with `white-space: normal`, fits its widest word.

The table sizes these columns again when the data, the filters, the sorters, the columns or the `overrides` change, when the window gets wider or narrower, and when you call `await table.recalculateColumnWidths()`, for example after content in a cell changed on its own. Set `grow-full-width` to stretch them to the width of the table's container.

Columns are resizable by default: drag the right edge of a column's header cell. Double-click it to go back to the configured `width`, or to the width that fits the content. Set `resizable` to `false` to disable resizing for an individual column.

```js demo
export const widthOfColumns = () => {
  return html`
    <owc-table
      .columns=${[
        {
          label: 'Nr.',
          formatter: 'rownum',
          resizable: false,
          width: 60,
        },
        {
          label: 'Profession',
          field: 'profession',
          resizable: false,
          width: 300,
        },
        {
          label: 'First Name',
          field: 'firstName',
          resizable: true,
          width: 1000,
        },
        {
          label: 'Last Name',
          field: 'lastName',
          resizable: true,
        },
      ]}
      .data=${personData}
    ></owc-table>
  `;
};
```

### Show or Hide Columns

Columns can be shown, hidden, or displayed only when they are part of the active filter.

To allow users to configure column visibility interactively, enable the built-in **Settings** action tab.

```html
<owc-table
  .actionTabs=${{
    settings: {
      visible: true,
    },
  }}
></owc-table>
```

Each column controls its visibility using the `visible` property.

| Value        | Description                                                       |
| ------------ | ----------------------------------------------------------------- |
| `always`     | Always display the column (default).                              |
| `never`      | Never display the column.                                         |
| `ifFiltered` | Display the column only when it participates in an active filter. |

```js demo
export const hideColumnsTable = () => {
  return html`
    <owc-table
      filter-mode="global-search-with-builder"
      .actionTabs=${{
        settings: {
          visible: true,
        },
      }}
      .columns=${[
        {
          label: 'Nr.',
          formatter: 'rownum',
          visible: 'always',
          filterable: true,
        },
        {
          label: 'Profession',
          field: 'profession',
          visible: 'never',
          filterable: true,
        },
        {
          label: 'First Name',
          field: 'firstName',
          visible: 'always',
          filterable: true,
        },
        {
          label: 'Last Name',
          field: 'lastName',
          visible: 'ifFiltered',
          filterable: true,
        },
        {
          label: 'Age',
          field: 'age',
          visible: 'ifFiltered',
          filterable: true,
        },
      ]}
      .data=${personData}
    ></owc-table>
  `;
};
```

## Filtering & Sorting

`owc-table` provides flexible filtering and sorting capabilities for both client-side and server-side data.

Filtering is configured per column, while the overall filtering experience is controlled using the `filter-mode` attribute.

Depending on your data source, filtering can either happen directly in the browser or on the server through `handleData()`. For more information about server-side filtering, see **Loading Data**.

### Filter Modes

The `filter-mode` attribute controls how users interact with filters.

| Value                        | Description                                             |
| ---------------------------- | ------------------------------------------------------- |
| `hidden`                     | Filtering is disabled.                                  |
| `global-search`              | Displays a single global search field.                  |
| `builder`                    | Displays the filter builder only.                       |
| `global-search-with-builder` | Displays both the global search and the filter builder. |

```html
<owc-table filter-mode="global-search"></owc-table>
```

Choose the mode that best fits your use case:

- **hidden** for read-only tables.
- **global-search** for simple text searches.
- **builder** when users need advanced filtering.
- **global-search-with-builder** to provide both options.

### Making Columns Filterable

Columns participate in filtering only when `filterable` is enabled.

```js
columns = [
  {
    label: 'First Name',
    field: 'firstName',
    filterable: true,
  },
];
```

If a column is not marked as filterable, it will never appear in the filter builder.

### Filter Types

Each filterable column may define a filter type.

| Type           | Description                            |
| -------------- | -------------------------------------- |
| `text`         | Free text input (default).             |
| `number`       | Numeric comparison.                    |
| `date`         | Date comparison.                       |
| `checkbox`     | Boolean values.                        |
| `autocomplete` | Select values from predefined options. |

If no `filterType` is specified, the table automatically uses a text filter.

```js demo
export const filterTypes = () => {
  return html`
    <owc-table
      filter-mode="builder"
      .columns=${[
        {
          label: 'First Name',
          field: 'firstName',
          filterable: true,
          filterType: 'text',
        },
        {
          label: 'Age',
          field: 'age',
          filterable: true,
          filterType: 'number',
        },
        {
          label: 'Birthdate',
          field: 'birthDate',
          filterable: true,
          filterType: 'date',
        },
        {
          label: 'Premium',
          field: 'premium',
          filterable: true,
          type: 'editable',
          editableOptions: { type: 'checkbox' },
          filterType: 'checkbox',
        },
        {
          label: 'Profession',
          field: 'profession',
          filterable: true,
          filterType: 'autocomplete',
          filterOptions: [
            {
              label: 'Developer',
              value: 'Developer',
            },
            {
              label: 'Teacher',
              value: 'Teacher',
            },
            {
              label: 'Lawyer',
              value: 'Lawyer',
            },
          ],
        },
      ]}
      .data=${personData}
    ></owc-table>
  `;
};
```

### Autocomplete Filters

Autocomplete filters present a predefined list of selectable values.

Provide the available options through `filterOptions`.

```js
{
  label: 'Profession',
  field: 'profession',
  filterable: true,
  filterType: 'autocomplete',
  filterOptions: [
    {
      label: 'Developer',
      value: 'Developer',
    },
    {
      label: 'Teacher',
      value: 'Teacher',
    },
  ],
}
```

This filter type is particularly useful when users should only choose from a known set of values.

### Sorting

Columns become sortable by enabling the `sortable` property.

```js
columns = [
  {
    label: 'Age',
    field: 'age',
    sortable: true,
  },
];
```

Users can sort by clicking the corresponding table header.

Sorting is performed automatically using the configured formatter and data type. For more advanced use cases, custom sorters can be provided through the `sorters` property.

```js demo
export const sorting = () => {
  return html`
    <owc-table
      .columns=${[
        {
          label: 'First Name',
          field: 'firstName',
          sortable: true,
        },
        {
          label: 'Last Name',
          field: 'lastName',
          sortable: true,
        },
        {
          label: 'Age',
          field: 'age',
          sortable: true,
          formatter: 'number',
        },
      ]}
      .data=${personData}
    ></owc-table>
  `;
};
```

### Custom Sorters

For values that cannot be sorted using the default comparison logic, provide custom sorters through the `sorters` property. Here, as an example, only month and day are considered.

```js demo
export const sortingTable = () => {
  return html`
    <owc-table
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
          filterable: true,
        },
        {
          label: 'Birthdate',
          field: 'birthDate',
          formatter: 'date',
          sorter: [{ field: 'birthDate', order: 'desc', sortType: 'dateNoYear' }],
        },
      ]}
      .data=${generateMoreData(10)}
    ></owc-table>
  `;
};
```

Custom sorters are especially useful when displaying formatted values while sorting by a different underlying value.

### Save State to URL

Enable the `save-state-to-url` attribute to persist the current table state in the browser URL.

```html
<owc-table save-state-to-url></owc-table>
```

The following state is preserved:

- active filters
- sorting
- column visibility
- manually resized column widths
- other persisted table settings

Sharing the URL restores the same table configuration when it is opened again.

Currently, there is no support for multiple tables using this attribute on the same page. trying to use it with multiple tables on the same page will result in fighting of the tables.

### Filter Descriptions

Filter descriptions provide additional information about available filters and their purpose.

They help users understand which values are expected and can be especially useful when many filterable columns are available.

```js
{
  label: 'Birthdate',
  field: 'birthDate',
  filterable: true,
  filterDescription:
    'Enter a date to find everyone born on or after the selected day.',
}
```

```js demo
export const descriptionTable = () => {
  return html`
    <owc-table
      filter-mode="global-search-with-builder"
      .columns=${[
        {
          label: 'Nr.',
          formatter: 'rownum',
        },
        {
          label: 'First Name',
          field: 'firstName',
          filterable: true,
          description: 'This filters the first name with text search',
        },
        {
          label: 'Last Name',
          field: 'lastName',
          filterable: true,
          description: 'This filters the last name with text search',
        },
        {
          label: 'Profession',
          field: 'profession',
          filterable: true,
          filterType: 'autocomplete',
          filterOptions: [
            { value: 'Teacher', label: 'Teacher' },
            { value: 'Lawyer', label: 'Lawyer' },
            { value: 'Developer', label: 'Developer' },
            { value: 'Professor', label: 'Professor' },
          ],
          description: 'This filters the professions with multiple options',
          subDescription: 'All options are: Teacher, Lawyer, Developer, Professor',
        },
        {
          label: 'Age',
          field: 'age',
          filterable: true,
          filterType: 'number',
          description: 'This filters the age with a number filter with conditional operators',
        },
      ]}
      .data=${personData}
    ></owc-table>
  `;
};
```

Descriptions are shown inside the filter builder and should briefly explain what the filter does without repeating the column label.

### Client-side vs. Server-side Filtering

Filtering behaves differently depending on how data is loaded.

| Data Source                           | Behavior                                                       |
| ------------------------------------- | -------------------------------------------------------------- |
| `.data`                               | All filtering is performed locally in the browser.             |
| `handleData()` with `initiallyOnce`   | Data is loaded once, then filtered locally.                    |
| `handleData()` with `anyFilterChange` | Filters are sent to the server and filtering happens remotely. |

Choose the approach that best matches the size and update frequency of your dataset.

## Row Rendering

By default, rows are rendered as plain table rows.

`owc-table` provides several rendering options that allow rows to behave as links, display expandable details, show annotations, or be grouped.

The rendering mode is controlled using the `render-mode` attribute.

| Type                                            | Description                                       |
| ----------------------------------------------- | ------------------------------------------------- |
| `simple`                                        | Simple Row (default).                             |
| [`link`](#rows-as-links)                        | Row with a link                                   |
| [`detail`](#row-details)                        | Row with an expandable Detail (preloaded)         |
| [`detailDeferred`](#rows-with-deferred-details) | Row with an expandable Detail (loaded after call) |
| [`linkWithDetail`](#rows-as-links-with-details) | combination of `link` and `detail`                |

### Rows as Links

Set `render-mode="link"` to make every row behave as a link.

The destination for each row is provided by the `getRowLinkSettings` callback. The callback receives the complete row object, allowing links to be generated dynamically. In this example, it searches via the google search for the profession. it can also reference pages of the same Website.

```js demo
export const rowsAsLinks = () => {
  return html`
    <owc-table
      render-mode="link"
      .getRowLinkSettings=${row => ({ href: `https://www.google.com/search?q=${row.profession}` })}
      .columns=${[
        {
          label: 'First Name',
          field: 'firstName',
        },
        {
          label: 'Last Name',
          field: 'lastName',
        },
        {
          label: 'Profession',
          field: 'profession',
        },
      ]}
      .data=${personData}
    ></owc-table>
  `;
};
```

Besides the destination URL, additional link settings such as `target` or other supported anchor attributes may also be returned.

---

### Row Details

Rows can display additional content below the main row.

Enable this behavior using `render-mode="detail"` and provide a `renderDetail` callback. this is called when the row is clicked upon.

The callback receives the selected row and returns the content that should be displayed when the row is expanded.

```js demo
export const showDetails = () => {
  return html`
    <owc-table
      render-mode="detail"
      .renderDetail=${row => html`
        <div style="padding:16px;">
          <h4>${row.firstName} ${row.lastName}</h4>

          <p>Profession: ${row.profession}</p>

          <p>Age: ${row.age}</p>
        </div>
      `}
      .columns=${[
        {
          label: 'First Name',
          field: 'firstName',
        },
        {
          label: 'Last Name',
          field: 'lastName',
        },
        {
          label: 'Profession',
          field: 'profession',
        },
      ]}
      .data=${personData}
    ></owc-table>
  `;
};
```

Expanded rows remain open until the user collapses them again or the table state changes.

---

### Opening Details Programmatically

Expanded rows can also be controlled programmatically.

Assign row identifiers to the `openDetails` property to expand specific rows.

```js
table.openDetails = [2, 5, 9];
```

The identifiers must match the values returned by `getRowId()`.

```js demo
const showDetailsProgrammaticallyArray = [...generateMoreData(20), ...personData]
  .map(value => ({ value, sort: Math.random() }))
  .sort((a, b) => a.sort - b.sort)
  .map(({ value }) => value);

export const showDetailsProgrammatically = () => {
  return html`
    <owc-table
      render-mode="detail"
      .openDetails=${['0013X00002eOb5BQAS', '0013X00002eP8qsQAC', '0013X00002eP8sDQAS']}
      .renderDetail=${row => html`
        <div style="padding:16px;">
          <h4>${row.firstName} ${row.lastName}</h4>

          <p>Profession: ${row.profession}</p>

          <p>Age: ${row.age}</p>
        </div>
      `}
      .columns=${[
        {
          label: 'First Name',
          field: 'firstName',
        },
        {
          label: 'Last Name',
          field: 'lastName',
        },
        {
          label: 'Profession',
          field: 'profession',
        },
      ]}
      .data=${showDetailsProgrammaticallyArray}
    ></owc-table>
  `;
};
```

---

### Rows with Deferred Details

usually, details get rendered in the background if the row itself is displayed. this might causes cluttering of the DOM. to reduce objects in the DOM, you can use `render-mode="detailDeferred"` instead. then, the detail will only be rendered when opened.

```js demo
export const showDetailsDeferred = () => {
  return html`
    <owc-table
      render-mode="detailDeferred"
      .renderDetail=${row => html`
        <div style="padding:16px;">
          <h4>${row.firstName} ${row.lastName}</h4>

          <p>Profession: ${row.profession}</p>

          <p>Age: ${row.age}</p>
        </div>
      `}
      .columns=${[
        {
          label: 'First Name',
          field: 'firstName',
        },
        {
          label: 'Last Name',
          field: 'lastName',
        },
        {
          label: 'Profession',
          field: 'profession',
        },
      ]}
      .data=${personData}
    ></owc-table>
  `;
};
```

---

### Async Row Details

Sometimes additional information is not available immediately and must be loaded from an API.

`renderDetail` may therefore return a `Promise`.

The table automatically waits for the promise to resolve before rendering the returned content.

```js demo
export const asyncShowDetails = () => {
  return html`
    <owc-table
      render-mode="detail"
      .renderDetail=${async row => {
        await new Promise(resolve => setTimeout(resolve, 1000));

        return html`
          <div style="padding:16px;">
            <h4>${row.firstName} ${row.lastName}</h4>

            <p>Additional information loaded asynchronously.</p>
          </div>
        `;
      }}
      .columns=${[
        {
          label: 'First Name',
          field: 'firstName',
        },
        {
          label: 'Last Name',
          field: 'lastName',
        },
        {
          label: 'Profession',
          field: 'profession',
        },
      ]}
      .data=${personData}
    ></owc-table>
  `;
};
```

---

This approach is recommended when loading expensive or rarely used data.

### Rows as Links with Details

it's also possible to combine the link and the detail mode. in this mode, an additional button is provided to expand the detail. the rest of the row still functions like a link.

```js demo
export const rowsAsLinksAndDetails = () => {
  return html`
    <owc-table
      render-mode="linkWithDetail"
      .getRowLinkSettings=${row => ({ href: `https://www.google.com/search?q=${row.profession}` })}
      .renderDetail=${row => html`
        <div style="padding:16px;">
          <h4>${row.firstName} ${row.lastName}</h4>

          <p>Profession: ${row.profession}</p>

          <p>Age: ${row.age}</p>
        </div>
      `}
      .columns=${[
        {
          label: 'First Name',
          field: 'firstName',
        },
        {
          label: 'Last Name',
          field: 'lastName',
        },
        {
          label: 'Profession',
          field: 'profession',
        },
      ]}
      .data=${personData}
    ></owc-table>
  `;
};
```

---

### Row Annotations

Annotations allow additional visual content to be rendered inside a row without modifying the regular column layout.

Provide a `renderAnnotation` callback that returns the annotation for the current row.

```js demo
export const annotation = () => {
  return html`
    <owc-table
      .renderAnnotation=${row => {
        return !row.profession
          ? html`<wa-tag variant="warning">
              <wa-icon name="clock"></wa-icon>
              &nbsp;<span>Warning: Profession field is empty</span>
            </wa-tag>`
          : nothing;
      }}
      .columns=${[
        {
          label: 'First Name',
          field: 'firstName',
        },
        {
          label: 'Last Name',
          field: 'lastName',
        },
        {
          label: 'Profession',
          field: 'profession',
        },
      ]}
      .data=${personData}
    ></owc-table>
  `;
};
```

Annotations are useful for displaying status indicators, badges, warnings, or other supplementary information.

---

### Grouping Rows

Rows can be grouped by providing a `groupSelector` function.

The callback receives each row and returns the group identifier for that row.

```js
table.groupSelector = row => row.profession;
```

Rows sharing the same group identifier are rendered together. In order to make it work, you need in addition provide the groups

```js client
const groupedTableArray = [...generateMoreData(100), ...personData];
```

```js demo
export const groupedTable = () => {
  return html`
    <div style="height: 60vh; overflow: auto; ">
      <owc-table
        .groupList=${[
          {
            key: 'Teacher',
            label: 'Teacher',
          },
          {
            key: 'Developer',
            label: 'Developer',
          },
          {
            key: 'Lawyer',
            label: 'Lawyer',
          },
          {
            key: 'Professor',
            label: 'Professor',
          },
        ]}
        .groupSelector=${row => row.profession}
        .columns=${[
          {
            label: 'Nr.',
            formatter: 'rownum',
          },
          {
            label: 'Gender',
            field: 'gender',
          },
          {
            label: 'Birthdate',
            field: 'birthDate',
            formatter: 'date',
            sorter: [{ field: 'birthDate', order: 'desc', sortType: 'dateNoYear' }],
          },
          {
            label: 'Profession',
            field: 'profession',
          },
          {
            label: 'First Name',
            field: 'firstName',
          },
        ]}
        .data=${groupedTableArray}
      ></owc-table>
    </div>
  `;
};
```

---

### Custom Group Configuration

The appearance and ordering of groups can be customized through `groupList`.

Each group may define a label, priority, colors, and whether it should be expanded by default.

```js
table.groupList = [
  {
    key: 'developer',
    label: 'Developers',
    priority: 1,
    active: true,
    backgroundColor: '#1976d2',
    textColor: '#fff',
  },
  {
    key: 'teacher',
    label: 'Teachers',
    priority: 2,
  },
];
```

```js demo
const customGroupedTableArray = [...generateMoreData(100), ...personData];

export const customGroupedTable = () => {
  return html`
    <div style="height: 60vh; overflow: auto; ">
      <owc-table
        .groupList=${[
          { key: 'j', label: 'Starts with R', priority: 10, active: true },
          {
            key: 'm',
            label: 'Starts with M',
            priority: 10,
            active: false,
            backgroundColor: 'red',
            textColor: 'white',
          },
        ]}
        .groupSelector=${row => row.firstName.toLowerCase().substring(0, 1)}
        .columns=${[
          {
            label: 'Nr.',
            formatter: 'rownum',
          },
          {
            label: 'Gender',
            field: 'gender',
          },
          {
            label: 'Birthdate',
            field: 'birthDate',
            formatter: 'date',
            sorter: [{ field: 'birthDate', order: 'desc', sortType: 'dateNoYear' }],
          },
          {
            label: 'First Name',
            field: 'firstName',
          },
        ]}
        .data=${groupedTableArray}
      ></owc-table>
    </div>
  `;
};
```

Groups are rendered according to their priority. Groups that are not listed may optionally be collected into an **Others** group.

---

### Others Group

Rows whose group is not defined in `groupList` are collected in an **Others** group after all other groups. It starts collapsed; enable `othersGroupActive` to expand it.

```js
table.othersGroupActive = true;
```

This is useful when only a subset of groups should receive a custom appearance while all remaining groups are still displayed.

---

### Large Grouped Tables

A grouped table renders its group headers and rows as one list. Like an ungrouped table, it only renders the rows in and around the visible area once it has 300 Data Rows, counted across all groups (see [Large Tables](#large-tables)). Clicking a group header removes or adds the group's rows, wherever the table is scrolled, and the `rownum` formatter numbers the rows within each group.

`groupList`, `groupSelector` and `othersGroupActive` can be changed at any time; the table groups its rows again. So does an edit in a cell or with the mass edit: when an edited value is in a row, the row moves to the group it belongs to now, and the row counts follow. If you change a row's group field in place yourself, assign a new array to `data`, e.g. `table.data = [...table.data]`; `requestUpdate()` alone doesn't group the rows again.

---

## Additional settings

This chapter mainly talks about additional settings, that do not directly have to do with the data itself but more of additional features and options over the entire row.

---

### Extra Info

The `show-info` shows a help text that says how many rows are currently being displayed. This works with the filter as well.

```js demo
export const showInfoTable = () => {
  return html`
    <owc-table
      show-info
      filter-mode="global-search"
      .columns=${[
        {
          label: 'Nr.',
          formatter: 'rownum',
        },
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
      ]}
      .data=${personData}
    ></owc-table>
  `;
};
```

---

### Add Header Content

If you want to add static content between the Filter and the content you can provide a `renderHeaderContent` function

```js demo
export const headerContent = () => {
  return html`
    <owc-table
      filter-mode="global-search"
      .columns=${[
        {
          label: 'Nr.',
          formatter: 'rownum',
          visible: 'always', // is the default
        },
        {
          label: 'First Name',
          field: 'firstName',
          visible: 'always',
        },
      ]}
      .renderHeaderContent=${() => html`<p>some extra header content</p>`}
      .data=${personData}
    ></owc-table>
  `;
};
```

---

### Sticky header

Use the `sticky-header` attribute to make the header fixed at the top of the table when scrolling.

```js demo
export const stickyHeaderTable = () => {
  return html`
    <div style="height: 60vh; overflow: auto; ">
      <owc-table
        sticky-header
        .columns=${[
          {
            label: 'Nr.',
            formatter: 'rownum',
          },
          {
            label: 'Profession',
            field: 'profession',
          },
          {
            label: 'First Name',
            field: 'firstName',
          },
          {
            label: 'Last Name',
            field: 'lastName',
          },
        ]}
        .data=${generateMoreData()}
      ></owc-table>
    </div>
  `;
};
```

---

### Exporting the Table

Tables can be copied to an Excel Table or downloaded as a `*.csv`. It comes with a built in "Export" Tab action which you can enable by setting it's visibility to true.

```js
.actionTabs=${{
  export: { visible: true },
}}
```

To exclude a column, set `includeInExport` to false.

```js demo
export const exportTable = () => {
  return html`
    <owc-table
      .columns=${[
        {
          label: 'Nr.',
          formatter: 'rownum',
          includeInExport: false,
        },
        {
          label: 'Profession',
          field: 'profession',
        },
        {
          label: 'First Name',
          field: 'firstName',
        },
        {
          label: 'Last Name',
          field: 'lastName',
        },
      ]}
      .data=${personData}
      .actionTabs=${{
        export: { visible: true },
      }}
    ></owc-table>
  `;
};
```

---

### Selectable rows

The `selectable` attribute makes rows selectable and adds a checkbox to select all rows. To work with the selected data add a custom tab via the `.actionTabs` property - its `content` callback receives `selectedData`, an array with the information of the selected rows. In this example it is logged in the console. IDs are required when using selectable rows.

```js demo
export const selectableTable = () => {
  return html`
    <owc-table
      selectable
      .columns=${[
        {
          label: 'Nr.',
          formatter: 'rownum',
        },
        {
          label: 'First Name',
          field: 'firstName',
        },
        {
          label: 'Last Name',
          field: 'lastName',
        },
      ]}
      .actionTabs=${{
        showSelected: {
          label: 'Auswahl',
          visible: true,
          content: ({ selectedData }) => html`
            <wa-button
              size="s"
              @click=${async () => {
                console.log(
                  'Selected Data: ' +
                    selectedData
                      .map(data => data.firstName + ' ' + data.lastName + ' (' + data.id + ')')
                      .join(', '),
                );
              }}
            >
              Show Selected
            </wa-button>
          `,
        },
      }}
      .data=${personData}
    ></owc-table>
  `;
};
```

---

### Add your own Action Tab

You can add your own action by adding an additional key to the `actionTabs`.
selected data contains the data that has been selected via the checkbox and processed data is the data that is currently shown. i.e.: if a filter is applied, the statistics will be calculated based of that.

```js demo
export const actionTabTable = () => {
  return html`
  <div style="height: 60vh; overflow: auto; ">
    <owc-table
      show-info
      filter-mode="global-search-with-builder"
      selectable
      .columns=${[
        {
          label: 'Nr.',
          formatter: 'rownum',
          includeInExport: false,
          filterable: true,
        },
        {
          label: 'Profession',
          field: 'profession',
          filterable: true,
        },
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
      ]}
      .data=${generateMoreData(100)}
      .actionTabs=${{
        statistics: {
          label: 'Gender Statistics',
          content: ({ selectedData, processedData }) => {
            const data = selectedData.length > 0 ? selectedData : processedData;
            const maleCount = data.filter(person => person.gender === 'male').length;
            const femaleCount = data.filter(person => person.gender === 'female').length;
            return html`
              <p>Males: ${maleCount}</p>
              <p>Females: ${femaleCount}</p>
            `;
          },
        },
      }}
    ></owc-table>
    </div
  `;
};
```

---

### Open a specific Action Tab

You can pre open a tag by setting `.actionTabActive` or `action-tab-active` to the key of the tab.
Example `<owc-table action-tab-active="statistics"></owc-table>`

```js demo
export const actionTabOpenTable = () => {
  return html`
    <owc-table
      .columns=${[
        {
          label: 'Nr.',
          formatter: 'rownum',
          includeInExport: false,
          filterable: true,
        },
        {
          label: 'Profession',
          field: 'profession',
          filterable: true,
        },
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
      ]}
      .data=${generateMoreData(10)}
      .actionTabs=${{
        export: {
          visible: true,
        },
        settings: {
          visible: true,
        },
        statistics: {
          label: 'Gender Statistics',
          content: ({ selectedData, processedData }) => {
            const data = selectedData.length > 0 ? selectedData : processedData;
            const maleCount = data.filter(person => person.gender === 'male').length;
            const femaleCount = data.filter(person => person.gender === 'female').length;
            return html`
              <p>Males: ${maleCount}</p>
              <p>Females: ${femaleCount}</p>
            `;
          },
        },
      }}
      action-tab-active="statistics"
    ></owc-table>
  `;
};
```

---

## Editing

`owc-table` supports inline editing for individual cells, adding new rows, and editing multiple rows at once.

Editing behavior is configured on a per-column basis, allowing editable and read-only columns to coexist within the same table.

### Editable Cells

Enable editing by setting the `editable` property on a column.

When a user edits a value, the table updates the row and optionally forwards the change through `handleUpdate`.

```js
columns = [
  {
    label: 'First Name',
    field: 'firstName',
    editable: true,
  },
];
```

The appropriate editor is selected automatically based on the column configuration.

---

### Text Input

By default, editable columns use a text input.

```js demo
export const editableTable = () => {
  return html`
    <owc-table
      .columns=${[
        {
          label: 'First Name',
          field: 'firstName',
          type: 'editable',
        },
        {
          label: 'Last Name',
          field: 'lastName',
          type: 'editable',
        },
        {
          label: 'Profession',
          field: 'profession',
        },
      ]}
      .data=${personData}
    ></owc-table>
  `;
};
```

Users can click a cell to edit its value directly.

---

### Editing with Checkbox

Boolean values can be edited using a checkbox.

Configure the column with an appropriate editor.

```js demo
export const editCheckbox = () => {
  return html`
    <owc-table
      .columns=${[
        {
          label: 'Nr.',
          formatter: 'rownum',
        },
        {
          label: 'First Name',
          field: 'firstName',
          type: 'editable',
        },
        {
          label: 'Last Name',
          field: 'lastName',
        },
        {
          label: 'Premium',
          field: 'premium',
          type: 'editable',
          editableOptions: { type: 'checkbox' },
        },
      ]}
      .data=${personData}
    ></owc-table>
  `;
};
```

Checkboxes are recommended whenever the edited value represents a boolean state.

---

### Editing with Autocomplete

Autocomplete editors present a predefined list of selectable values.

Provide the available options through `editOptions`.

```js demo
export const editAutocomplete = () => {
  return html`
    <owc-table
      .columns=${[
        {
          label: 'Nr.',
          formatter: 'rownum',
        },
        {
          label: 'First Name',
          field: 'firstName',
          type: 'editable',
        },
        {
          label: 'Last Name',
          field: 'lastName',
        },
        {
          label: 'Profession',
          field: 'profession',
          type: 'editable',
          editableOptions: {
            type: 'autocomplete',
            data: [
              { value: 'Teacher', label: 'Teacher' },
              { value: 'Lawyer', label: 'Lawyer' },
              { value: 'Developer', label: 'Developer' },
              { value: 'Professor', label: 'Professor' },
            ],
          },
        },
      ]}
      .data=${personData}
    ></owc-table>
  `;
};
```

Autocomplete editors help ensure users only enter valid values.

---

### Adding Rows

Provide a `handleInsert` callback to allow users to create new rows.

The callback should return a newly initialized row object.

```js
table.handleInsert = () => ({
  id: crypto.randomUUID(),
  firstName: '',
  lastName: '',
  profession: '',
});
```

```js demo
export const addNewRow = () => {
  return html`
    <owc-table
      .handleInsert=${() => ({ id: crypto.randomUUID(), firstName: '', lastName: '' })}
      .columns=${[
        {
          label: 'Nr.',
          formatter: 'rownum',
        },
        {
          label: 'First Name',
          field: 'firstName',
          type: 'editable',
        },
        {
          label: 'Last Name',
          field: 'lastName',
          type: 'editable',
        },
      ]}
      .data=${personData}
    ></owc-table>
  `;
};
```

The returned object is inserted into the table and can immediately be edited.
The table scrolls the new row into view if it isn't fully visible, and focuses its first
editable field. Large tables render the new row first, so this also works while the table is
scrolled far away from the new row. In a grouped table, the new row is added at the end of its
group, and a collapsed group expands to show it.
While a row is in `insertData`, it has no row link or detail toggle and does not emit
`rowClick`. Its editable fields and action controls remain available. Normal row actions
become available after the row is removed from `insertData` and added to `data`.

---

### Handling Data Updates

Whenever a value changes, `handleUpdate` is called.

Use this callback to synchronize changes with an external data source such as a REST API or database.

here's an example of a call. use `autoSetData()` to save it locally. The table then renders the row again, and moves it to another group if the edit changed its group.

```js demo
export const handleDataUpdatesExample = () => {
  return html`
    <owc-table
      selectable
      .handleUpdate=${async ({ data, field, config, value, autoSetData }) => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('data has been saved');
        autoSetData();
      }}
      .actionTabs=${{
        massEdit: { visible: true },
      }}
      .columns=${[
        {
          label: 'Nr.',
          formatter: 'rownum',
        },
        {
          label: 'First Name',
          field: 'firstName',
          type: 'editable',
        },
        {
          label: 'Last Name',
          field: 'lastName',
          formatterCompare: (row, { override }) => `${override.lastName}`,
          editableOptions: {
            massEdit: true,
          },
        },
        {
          label: 'Profession',
          field: 'profession',
          type: 'editable',
          editableOptions: {
            massEdit: true,
            type: 'autocomplete',
            data: [
              { value: 'Teacher', label: 'Teacher' },
              { value: 'Lawyer', label: 'Lawyer' },
              { value: 'Developer', label: 'Developer' },
            ],
          },
        },
      ]}
      .data=${personData}
    ></owc-table>
  `;
};
```

---

### Mass Editing

Multiple selected rows can be updated simultaneously.

Mass editing is useful when the same value should be applied to several rows at once. Mass edit can only change columns if it's specified in the `editableOptions` via `massEdit: true`. in addition, you can specify a formatterCompare to display the change.

```js demo
export const massEdit = () => {
  return html`
    <owc-table
      selectable
      .handleUpdate=${({ data, field, config, value, autoSetData }) => {
        autoSetData();
      }}
      .actionTabs=${{
        massEdit: { visible: true },
      }}
      .columns=${[
        {
          label: 'Nr.',
          formatter: 'rownum',
        },
        {
          label: 'First Name',
          field: 'firstName',
          type: 'editable',
        },
        {
          label: 'Last Name',
          field: 'lastName',
          formatterCompare: (row, { override }) => `${override.lastName}`,
          editableOptions: {
            massEdit: true,
          },
        },
        {
          label: 'Profession',
          field: 'profession',
          type: 'editable',
          editableOptions: {
            massEdit: true,
            type: 'autocomplete',
            data: [
              { value: 'Teacher', label: 'Teacher' },
              { value: 'Lawyer', label: 'Lawyer' },
              { value: 'Developer', label: 'Developer' },
            ],
          },
        },
      ]}
      .data=${personData}
    ></owc-table>
  `;
};
```

Mass editing respects the same validation and update handling as editing individual cells.

## Large Tables

From 300 Data Rows on, `owc-table` only renders the rows in and around the visible part of the table, so tables with 100,000 rows stay fast. While you scroll, it renders the rows that come into view and removes the rows far outside of it.

### Virtualizer Modes

`virtualizer-mode` decides when the table renders only part of its rows:

- `auto` (default): from 300 Data Rows on. Rows being inserted (`insertData`) and group headers don't count, and a grouped table counts the Data Rows of all its groups.
- `always`: for any number of rows.
- `never`: never. The table renders every row.

Rows that aren't rendered aren't part of the page, so the browser's find-in-page doesn't find them, and printing leaves them out. Tables with fewer than 300 Data Rows in `auto` mode, and tables with `virtualizer-mode="never"`, keep all their rows in the page. When a row leaves the rendered range, it also loses its focus and any unsaved input in its cells. What the table keeps track of itself, such as the selection, stays.

### Scroll Container

The table finds the element that scrolls it on its own: the page, the content area of `owc-layout-sidebar`, or a scroll box of your own. Starting at the table, it walks up through its ancestors, including slots and shadow roots, and takes the first one that scrolls vertically: its `overflow-y` is `auto` or `scroll`, and its content is taller than the element. It passes over elements with `display: contents`, and it stops at elements with `position: fixed`, at open popovers and at modal dialogs. When none of them scrolls, the page does.

Set `scrollTarget` to the element that scrolls the table when the table can't find it on its own, for example:

- a scroll box inside a closed shadow root;
- a scroll box that clips its content (`overflow: hidden`) and is scrolled by script.

```js
table.scrollTarget = scrollBox;
```

`scrollTarget` turns the detection off. Set it to `undefined` or `null` to turn the detection on again. `document.documentElement` and `document.body` stand for the page.

Even with the wrong scroll container, the table doesn't stay empty: when an empty part of it becomes visible, it renders the missing rows. That takes a frame, though, while with the right scroll container, new rows appear in the same frame as the scroll.

### Visible Data

`visibleData` holds the Data Rows the table renders, in display order. While the table renders only part of its rows, those are the rows in the visible area and some rows above and below it. Otherwise they are all filtered Data Rows, except the rows of collapsed groups. Group headers and rows being inserted (`insertData`) aren't part of it. The table sets `visibleData` in the same update in which it renders the rows:

```js
await table.updateComplete;
const renderedIds = table.visibleData.map(row => row.id);
```

### Row Heights and Details

Rows can have different heights. Details, annotations and cells with several lines are measured as they render, and the rows you're looking at stay in place when rows above them turn out taller or shorter, or when a detail above them opens or closes. Until the table has seen most of its rows, the scrollbar shows an estimate of their total height. Rows with an open detail that haven't been shown yet count with the typical height of an open detail.

Open details stay open when their rows leave the rendered range and come back, because `openDetails` keeps track of them, and opening a detail still scrolls it into view. In `render-mode="detail"`, every rendered row renders its closed detail too, so find-in-page finds detail content in the rendered rows.

### Benchmark

The two demos below load 100,000 generated rows with 20 columns when you click **Load 100,000 rows**. Use them to check how a large table scrolls in your browser:

- **Details** renders a detail for every row (`render-mode="detail"`, closed details included) or only for opened ones (`detailDeferred`). Click a row to open its detail.
- **Annotations** shows an annotation above about 1% of the rows.
- **Jump** scrolls to the given row.
- **Run scripted scroll** scrolls down slowly, flings down and up, jumps around like a dragged scrollbar, and scrolls up from the end through rows that haven't been measured yet. Per phase, it reports the painted frames in which part of the visible table area had no rows, the frames in which the rows moved by more or less than the scrolled distance (jumps), and the tasks that took longer than 50ms (Chromium only).
- **Monitor manual scrolling** counts frames without rows and long tasks while you scroll with the mouse wheel, the trackpad, the keyboard or the scrollbar.
- **Group by department** groups the rows into one group per department, all expanded, and reports how long the table took to paint them. Grouped rows are virtualized as one list, with the group headers among the rows, so a grouped table scrolls like an ungrouped one. With grouping on, **Jump** counts the group headers as rows.

```js client
import { LitElement, css } from 'lit';
import '@open-wc/components/define/owc-layout-sidebar.js';

const benchmarkRowCount = 100_000;

const departments = ['Sales', 'Finance', 'Support', 'Research', 'Marketing', 'Operations'];
const cities = ['Vienna', 'Graz', 'Linz', 'Salzburg', 'Munich', 'Zurich', 'Berlin', 'Prague'];
const countries = ['Austria', 'Germany', 'Switzerland', 'Czechia'];
const statuses = ['Active', 'Pending', 'On leave', 'Inactive'];

/** A tiny seeded random generator, so every run renders the same data. */
function seededRandom(seed) {
  return () => {
    seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648;
    return seed / 2_147_483_648;
  };
}

function generateBenchmarkRows(count) {
  const random = seededRandom(1);
  const pick = list => list[Math.floor(random() * list.length)];
  const rows = new Array(count);
  for (let index = 0; index < count; index++) {
    const firstName = pick(firstNames);
    const lastName = pick(lastNames);
    rows[index] = {
      id: `row-${index}`,
      firstName,
      lastName,
      email: `${firstName}.${lastName}.${index}@example.com`.toLowerCase(),
      profession: pick(professions) || 'Engineer',
      department: pick(departments),
      city: pick(cities),
      country: pick(countries),
      age: 20 + Math.floor(random() * 50),
      monthlyPay: 2000 + Math.round(random() * 600_000) / 100,
      bonus: random() * 0.2,
      score: Math.round(random() * 1000) / 10,
      birthDate: `${1950 + Math.floor(random() * 55)}-0${1 + Math.floor(random() * 9)}-1${Math.floor(random() * 9)}`,
      lastLogin: new Date(Date.UTC(2026, 0, 1) + Math.floor(random() * 2.5e10)).toISOString(),
      premium: random() > 0.7,
      active: random() > 0.2,
      status: pick(statuses),
      hobbies: [pick(hobbies), pick(hobbies)],
      projects: Math.floor(random() * 40),
    };
  }
  return rows;
}

let benchmarkRows;

const benchmarkColumns = [
  { label: 'Nr.', formatter: 'rownum' },
  { label: 'ID', field: 'id' },
  { label: 'First Name', field: 'firstName' },
  { label: 'Last Name', field: 'lastName' },
  { label: 'Email', field: 'email', formatter: 'email' },
  { label: 'Profession', field: 'profession' },
  { label: 'Department', field: 'department' },
  { label: 'City', field: 'city' },
  { label: 'Country', field: 'country' },
  { label: 'Age', field: 'age', formatter: 'number' },
  { label: 'Monthly Pay', field: 'monthlyPay', formatter: 'currency' },
  { label: 'Bonus', field: 'bonus', formatter: 'percent' },
  { label: 'Score', field: 'score', formatter: 'number' },
  { label: 'Birthdate', field: 'birthDate', formatter: 'date' },
  { label: 'Last Login', field: 'lastLogin', formatter: 'datetime' },
  { label: 'Premium', field: 'premium', formatter: 'tickCross' },
  { label: 'Active', field: 'active', formatter: 'checkbox' },
  {
    label: 'Status',
    field: 'status',
    formatter: row => html`<span class="status-badge">${row.status}</span>`,
  },
  { label: 'Hobbies', field: 'hobbies', formatter: row => row.hobbies.join(', ') },
  { label: 'Projects', field: 'projects', formatter: 'number' },
];

const renderBenchmarkDetail = row => html`
  <div style="padding: 16px">
    <h4>${row.firstName} ${row.lastName}</h4>
    <p>${row.profession} in ${row.department}, ${row.city}, ${row.country}</p>
    <p>${row.projects} projects, ${row.status.toLowerCase()}</p>
  </div>
`;

/** Annotates about 1% of the rows: those with a score below 1. */
const renderBenchmarkAnnotation = row =>
  row.score < 1 ? html`<span>Needs a review: the score is ${row.score}</span>` : nothing;

const renderNoAnnotation = () => nothing;

/** Resolves after the browser has painted the next frame. */
function afterNextPaint(action = () => {}) {
  return new Promise(resolve =>
    requestAnimationFrame(() => {
      action();
      // a task queued in an animation frame callback runs once that frame is painted
      const channel = new MessageChannel();
      channel.port1.onmessage = () => resolve();
      channel.port2.postMessage(undefined);
    }),
  );
}

/** The element that scrolls the table vertically, through slots and shadow roots. */
function scrollParent(element) {
  let node = element;
  while (node) {
    node = node.assignedSlot ?? node.parentNode;
    if (node instanceof ShadowRoot) {
      node = node.host;
    }
    // the body's overflow belongs to the page
    if (!(node instanceof Element) || node === document.documentElement || node === document.body) {
      break;
    }
    const { overflowY } = getComputedStyle(node);
    if (/auto|scroll/.test(overflowY) && node.scrollHeight > node.clientHeight) {
      return node;
    }
  }
  return document.scrollingElement;
}

/** The visible area of a scroll container within the viewport, in viewport coordinates. */
function clipRect(scroller) {
  if (scroller === document.scrollingElement) {
    return { top: 0, bottom: window.innerHeight, left: 0 };
  }
  const rect = scroller.getBoundingClientRect();
  return {
    top: Math.max(rect.top, 0),
    bottom: Math.min(rect.bottom, window.innerHeight),
    left: Math.max(rect.left, 0),
  };
}

/** Scrolls without the smooth scrolling a page may have turned on. */
function scrollInstantly(scroller, top) {
  scroller.scrollTo({ top, behavior: 'instant' });
}

/** The scroll positions at which the table body starts and ends in view. */
function bodyScrollRange(table, scroller) {
  const body = table.shadowRoot.querySelector('.table-body').getBoundingClientRect();
  const clip = clipRect(scroller);
  return {
    start: scroller.scrollTop + body.top - clip.top,
    end: scroller.scrollTop + body.bottom - clip.bottom,
    rowHeight: body.height / table.allData.length,
  };
}

/** The first row in the visible area, and where it is. */
function firstVisibleRow(table, scroller) {
  const clip = clipRect(scroller);
  for (const row of table.shadowRoot.querySelectorAll('.row-container')) {
    const rect = row.getBoundingClientRect();
    if (rect.bottom > clip.top) {
      return rect.top < clip.bottom ? { row, top: rect.top } : undefined;
    }
  }
  return undefined;
}

/**
 * Whether the visible part of the table body shows space without rows, by
 * looking at what the browser hit-tests at a few points.
 */
function hasVisibleGap(table, scroller) {
  const root = table.shadowRoot;
  const body = root.querySelector('.table-body').getBoundingClientRect();
  const clip = clipRect(scroller);
  const top = Math.max(body.top, clip.top);
  const bottom = Math.min(body.bottom, clip.bottom);
  const x = Math.max(body.left, clip.left) + 30;
  for (let y = top + 1; y < bottom; y += Math.max((bottom - top) / 8, 1)) {
    const hit = root.elementFromPoint(x, y);
    if (!hit || !root.contains(hit) || hit.closest('.table-header')) {
      // clipped by a scroll container, or covered by the sticky header
      continue;
    }
    if (!hit.closest('.row-container, .group-label-container')) {
      return true;
    }
  }
  return false;
}

/** Counts painted frames with gaps or jumps, and long tasks, phase by phase. */
class ScrollMonitor {
  #longTasks = [];
  #observer;

  constructor(table) {
    this.table = table;
    this.scroller = scrollParent(table);
    if (PerformanceObserver.supportedEntryTypes?.includes('longtask')) {
      this.#observer = new PerformanceObserver(list => this.#longTasks.push(...list.getEntries()));
      this.#observer.observe({ type: 'longtask' });
    }
    this.start('');
  }

  start(name) {
    this.current = {
      name,
      frames: 0,
      gaps: 0,
      gapRun: 0,
      longestGapRun: 0,
      scrolledFrames: 0,
      jumps: 0,
      largestJump: 0,
      since: performance.now(),
    };
    this.reference = firstVisibleRow(this.table, this.scroller);
  }

  /**
   * Samples a painted frame. When the frame scrolled by a known distance, the
   * rows that stay visible must move by exactly that distance.
   */
  sample(scrolled) {
    const phase = this.current;
    phase.frames++;
    if (hasVisibleGap(this.table, this.scroller)) {
      phase.gaps++;
      phase.gapRun++;
      phase.longestGapRun = Math.max(phase.longestGapRun, phase.gapRun);
    } else {
      phase.gapRun = 0;
    }
    const { reference } = this;
    if (scrolled !== undefined && reference?.row.isConnected) {
      phase.scrolledFrames++;
      const jump = Math.abs(reference.row.getBoundingClientRect().top - reference.top + scrolled);
      if (jump > 1) {
        phase.jumps++;
        phase.largestJump = Math.max(phase.largestJump, jump);
      }
    }
    this.reference = firstVisibleRow(this.table, this.scroller);
  }

  /** Long tasks are reported a little late, so read them after the phase. */
  async finish() {
    await afterNextPaint();
    const phase = this.current;
    const tasks = this.#longTasks.filter(task => task.startTime >= phase.since);
    const longest = Math.max(0, ...tasks.map(task => task.duration));
    return (
      `${phase.name}: ${phase.gaps} of ${phase.frames} frames with gaps` +
      ` (at most ${phase.longestGapRun} in a row), ` +
      (phase.scrolledFrames
        ? `${phase.jumps} frames with jumps` +
          (phase.jumps ? ` (largest ${Math.round(phase.largestJump)}px), ` : ', ')
        : '') +
      (this.#observer
        ? `${tasks.length} tasks over 50ms (longest ${Math.round(longest)}ms)`
        : 'long tasks not measurable in this browser')
    );
  }

  stop() {
    this.#observer?.disconnect();
  }
}

/** One expanded group per department. Operations has no group, so it lands under Others. */
function benchmarkGroups() {
  return [
    { key: 'Sales', label: 'Sales', priority: 1, active: true },
    { key: 'Finance', label: 'Finance', active: true },
    { key: 'Support', label: 'Support', active: true },
    { key: 'Research', label: 'Research', active: true },
    { key: 'Marketing', label: 'Marketing', active: true },
  ];
}

const byDepartment = row => row.department;

const noGroups = [];

class TableBenchmark extends LitElement {
  static properties = {
    layout: { type: String },
    renderMode: { state: true },
    annotations: { state: true },
    rows: { state: true },
    results: { state: true },
    busy: { state: true },
    monitor: { state: true },
    grouped: { state: true },
  };

  static styles = css`
    :host {
      display: block;
    }
    .controls {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    input[type='number'] {
      width: 7em;
    }
    .results {
      font-size: 0.875rem;
    }
    .sidebar-frame {
      height: 100vh;
    }
  `;

  constructor() {
    super();
    this.layout = 'page';
    this.renderMode = 'simple';
    this.annotations = false;
    this.rows = undefined;
    this.results = [];
    this.busy = false;
    this.monitor = undefined;
    this.grouped = false;
    this.groups = benchmarkGroups();
  }

  get table() {
    return this.renderRoot.querySelector('owc-table');
  }

  report(...lines) {
    this.results = [...this.results, ...lines];
  }

  /** Lets the layout fill the viewport, as it would in an application. */
  showLayout() {
    this.renderRoot
      .querySelector('.sidebar-frame')
      ?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }

  async load() {
    this.busy = true;
    benchmarkRows ??= generateBenchmarkRows(benchmarkRowCount);
    const start = performance.now();
    this.rows = benchmarkRows;
    await this.updateComplete;
    this.showLayout();
    await this.table.updateComplete;
    await afterNextPaint();
    this.report(
      `First rows painted ${Math.round(performance.now() - start)}ms after setting the data`,
    );
    this.busy = false;
  }

  async toggleGrouping(event) {
    this.grouped = event.target.checked;
    if (!this.rows) {
      return;
    }
    this.busy = true;
    const start = performance.now();
    await this.updateComplete;
    await this.table.updateComplete;
    await afterNextPaint();
    this.report(
      `Rows painted ${Math.round(performance.now() - start)}ms after turning grouping ${this.grouped ? 'on' : 'off'}`,
    );
    this.busy = false;
  }

  async jump() {
    const input = this.renderRoot.querySelector('input[type="number"]');
    const index = Math.min(Math.max(Number(input.value) - 1, 0), this.rows.length - 1);
    const table = this.table;
    const scroller = scrollParent(table);
    this.showLayout();
    const start = performance.now();
    for (let attempt = 0; attempt < 5; attempt++) {
      // a row, or with grouping on a group header, by its index in the rendered list
      const item = table.shadowRoot.querySelector(`[data-index="${index}"]`);
      if (item) {
        (item.closest('.row-container') ?? item).scrollIntoView({
          block: 'start',
          behavior: 'instant',
        });
        await afterNextPaint();
        this.report(`Row ${index + 1} shown after ${Math.round(performance.now() - start)}ms`);
        return;
      }
      // jump close to the row by the average row height, then let the table render it
      const range = bodyScrollRange(table, scroller);
      scrollInstantly(scroller, range.start + index * range.rowHeight);
      await afterNextPaint();
      await afterNextPaint();
    }
    this.report(`Row ${index + 1} was not rendered`);
  }

  async runScript() {
    this.busy = true;
    const table = this.table;
    const scroller = scrollParent(table);
    this.showLayout();
    const monitor = new ScrollMonitor(table);
    // An action returns the distance it scrolled, or nothing for jumps.
    const phase = async (name, frames, action) => {
      monitor.start(name);
      for (let frame = 0; frame < frames; frame++) {
        let scrolled;
        await afterNextPaint(() => {
          scrolled = action(frame);
        });
        monitor.sample(scrolled);
      }
      this.report(await monitor.finish());
    };
    const scrollBy = delta => {
      const top = scroller.scrollTop;
      scrollInstantly(scroller, top + delta);
      return scroller.scrollTop - top;
    };
    const random = seededRandom(3);

    scrollInstantly(scroller, bodyScrollRange(table, scroller).start);
    await afterNextPaint();
    await phase('Scroll down at 60px per frame', 150, () => scrollBy(60));
    await phase('Fling down at 250px per frame', 80, () => scrollBy(250));
    await phase('Fling up at 250px per frame', 60, () => scrollBy(-250));
    await phase('10 jumps, like dragging the scrollbar', 50, frame => {
      if (frame % 5 === 0) {
        const { start, end } = bodyScrollRange(table, scroller);
        scrollInstantly(scroller, start + random() * (end - start));
      }
    });
    await phase('Jump to the end of the table', 10, () =>
      scrollInstantly(scroller, bodyScrollRange(table, scroller).end),
    );
    // the last item of the table ends where the table body ends
    const root = table.shadowRoot;
    const last = [...root.querySelectorAll('.row-container, .group-label-container')]
      .at(-1)
      ?.getBoundingClientRect();
    const body = root.querySelector('.table-body').getBoundingClientRect();
    const clip = clipRect(scroller);
    this.report(
      last &&
        Math.abs(body.bottom - last.bottom) < 1 &&
        last.top >= clip.top &&
        last.bottom <= clip.bottom + 1
        ? 'The last row is visible at the end'
        : 'The last row is not visible at the end',
    );
    await phase('Scroll up from the end at 60px per frame', 100, () => scrollBy(-60));
    monitor.stop();
    this.busy = false;
  }

  toggleMonitor() {
    if (this.monitor) {
      const { monitor } = this;
      this.monitor = undefined;
      monitor.finish().then(line => {
        monitor.stop();
        this.report(line);
      });
      return;
    }
    const monitor = new ScrollMonitor(this.table);
    monitor.start('Manual scrolling');
    this.monitor = monitor;
    const sampleEachFrame = () =>
      afterNextPaint().then(() => {
        if (this.monitor === monitor) {
          monitor.sample();
          sampleEachFrame();
        }
      });
    sampleEachFrame();
  }

  render() {
    const table = this.rows
      ? html`<owc-table
          sticky-header
          render-mode=${this.renderMode}
          .columns=${benchmarkColumns}
          .renderDetail=${renderBenchmarkDetail}
          .renderAnnotation=${this.annotations ? renderBenchmarkAnnotation : renderNoAnnotation}
          .data=${this.rows}
          .groupList=${this.grouped ? this.groups : noGroups}
          .groupSelector=${this.grouped ? byDepartment : undefined}
          .othersGroupActive=${true}
        ></owc-table>`
      : nothing;
    return html`
      <div class="controls">
        <label
          >Details
          <select @change=${event => (this.renderMode = event.target.value)} ?disabled=${this.busy}>
            <option value="simple">None</option>
            <option value="detail">detail</option>
            <option value="detailDeferred">detailDeferred</option>
          </select></label
        >
        <label
          ><input
            type="checkbox"
            @change=${event => (this.annotations = event.target.checked)}
            ?disabled=${this.busy}
          />
          Annotations</label
        >
        <label>
          <input
            type="checkbox"
            .checked=${this.grouped}
            ?disabled=${this.busy}
            @change=${this.toggleGrouping}
          />
          Group by department
        </label>
      </div>
      <div class="controls">
        <button @click=${this.load} ?disabled=${this.busy || this.rows}>Load 100,000 rows</button>
        <label>Row <input type="number" min="1" max=${benchmarkRowCount} value="50000" /></label>
        <button @click=${this.jump} ?disabled=${this.busy || !this.rows}>Jump</button>
        <button @click=${this.runScript} ?disabled=${this.busy || !this.rows || this.monitor}>
          Run scripted scroll
        </button>
        <button @click=${this.toggleMonitor} ?disabled=${this.busy || !this.rows}>
          ${this.monitor ? 'Stop monitoring' : 'Monitor manual scrolling'}
        </button>
      </div>
      <ul class="results">
        ${this.results.map(line => html`<li>${line}</li>`)}
      </ul>
      ${
        this.layout === 'sidebar'
          ? html`<div class="sidebar-frame">
              <owc-layout-sidebar
                .menuItemList=${[
                  { icon: 'house', label: 'Overview', href: '#overview' },
                  { icon: 'table', label: 'Reports', href: '#reports' },
                  { icon: 'gear', label: 'Settings', href: '#settings' },
                ]}
                >${table}</owc-layout-sidebar
              >
            </div>`
          : table
      }
    `;
  }
}

customElements.define('table-benchmark-demo', TableBenchmark);
```

### Benchmark with Page Scrolling

The table is part of the page, and the page scrolls.

```js demo
export const benchmarkPageScrolling = () => {
  return html`<table-benchmark-demo layout="page"></table-benchmark-demo>`;
};
```

### Benchmark inside owc-layout-sidebar

The table sits in the content area of `owc-layout-sidebar`, which scrolls instead of the page.

```js demo
export const benchmarkLayoutSidebar = () => {
  return html`<table-benchmark-demo layout="sidebar"></table-benchmark-demo>`;
};
```

## Localization

owc-table comes with the option to localize on top of the formatter overwrites. it does so by using `webawesome localization`. Currently, it supports german and english. to change it, add a lang tag.

german:

```js demo
export const localizationGerman = () => {
  return html`
    <owc-table
      lang="de"
      selectable
      filter-mode="global-search-with-builder"
      show-info
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
      ]}
      .data=${personData}
    ></owc-table>
  `;
};
```

english:

```js demo
export const localizationEnglish = () => {
  return html`
    <owc-table
      lang="en"
      selectable
      filter-mode="global-search-with-builder"
      show-info
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
      ]}
      .data=${personData}
    ></owc-table>
  `;
};
```

## API

The following reference lists all public attributes, properties, callbacks, and events exposed by `owc-table`.

Unless stated otherwise, properties can be configured declaratively as HTML attributes (where supported) or programmatically using JavaScript.

### Data API

| Property            | Type                                                              | Description                                                                                                       |
| ------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `data`              | `Array<T>`                                                        | is the access point to initialize the data ([see Passing Data](#passing-data))                                    |
| `visibleData`       | `Array<T>`                                                        | the Data Rows the table renders, in display order ([see Visible Data](#visible-data))                             |
| `processedData`     | `Array<T>`                                                        | the data after it has been processed by a filter                                                                  |
| `allData`           | `Array<T>`                                                        | contains every entry                                                                                              |
| `insertData`        | `Array<T>`                                                        | used to insert data                                                                                               |
| `handleData`        | `(options?: { jsonFilters?: NestedJsonFilters }) => Promise<T[]>` | Async data provider function ([see Loading Data with handleData](#loading-data-with-handledata))                  |
| `handleDataOptions` | `HandleDataOptions`                                               | the options to `handleData` ([see Handle Data Mode](#handle-data-mode-initiallyonce))                             |
| `save-state-to-url` | `boolean`                                                         | saves active options into the url ([see Save State to Url](#save-state-to-url))                                   |
| `store-name-prefix` | `string`                                                          | changes the name prefix of the table when using `save-state-to-url` ([see Save State to Url](#save-state-to-url)) |
| `loading`           | `boolean`                                                         | reflects if the table is loading at the moment                                                                    |

### Columns API

| Property              | Type                           | Description                                                                                                       |
| --------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `columns`             | `Column<T>[]`                  | the definition of the columns ([see Columns](#columns))                                                           |
| `overrides`           | `Overrides`                    | overrides certain column options like visibility                                                                  |
| `grow-full-width`     | `boolean`                      | stretches the columns without a `width` to the width of the table's container ([see Column Width](#column-width)) |
| `selectable`          | `boolean`                      | defines if rows can be selected                                                                                   |
| `getSelectorSettings` | `(row: T) => SelectorSettings` | gets the selector settings for that row                                                                           |

### Filtering and Sorting API

| Property               | Type                      | Description                                                  |
| ---------------------- | ------------------------- | ------------------------------------------------------------ |
| `filter-mode`          | `string`                  | Sets the filtering behavior ([See Filtering](#filter-modes)) |
| `filter`               | `Filter<unknown> \| null` | custom filter function                                       |
| `jsonFilters`          | `NestedJsonFilters`       | Declarative JSON filters                                     |
| `highlightFilter`      | `Filter<unknown> \| null` | custom highlight function                                    |
| `highlightJsonFilters` | `NestedJsonFilters`       | Declarative JSON highlight filters                           |
| `sorters`              | `Sorter[]`                | custom sorting functions                                     |
| `jsonSorters`          | `JsonSorter[]`            | Declarative json sorters                                     |

### Row Rendering API

| Property              | Type                                        | Description                                                                                                      |
| --------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `render-mode`         | `string`                                    | Sets how the rows are rendered ([see Row Rendering](#row-rendering))                                             |
| `sticky-header`       | `boolean`                                   | makes the header sticky ([see Sticky Header](#sticky-header))                                                    |
| `renderDetail`        | `renderDetail<T> \| renderDetailPromise<T>` | The function to render a detail ([see Row Details](#row-details))                                                |
| `renderAnnotation`    | `RenderAnnotation<T>`                       | function to render annotations above the rows ([see Row Annotation](#row-annotations))                           |
| `renderHeaderContent` | `RenderHeaderContent`                       | renders static content at the header ([see Add Header Content](#add-header-content))                             |
| `openDetails`         | `(string \| number)[]`                      | Expands listed rows programmatically ([see Opening Details Programmatically](#opening-details-programmatically)) |
| `getRowLinkSettings`  | `(row: T) => RowLinkSettings`               | sets the link for the rows ([see Rows as Links](#rows-as-links))                                                 |
| `getRowId`            | `(row: T) => string \| number`              | returns the id of the specified row                                                                              |

### Grouping API

| Property            | Type                 | Description                                                                                  |
| ------------------- | -------------------- | -------------------------------------------------------------------------------------------- |
| `groupSelector`     | `(row: T) => string` | determines the selector to be used to assign the group ([see Grouping Rows](#grouping-rows)) |
| `groupList`         | `Group[]`            | the available groups ([see Grouping Rows](#grouping-rows))                                   |
| `othersGroupActive` | `boolean`            | whether the group of rows that match no group in `groupList` (**Others**) is expanded        |

### Editing API

| Property           | Type                         | Description                                                                  |
| ------------------ | ---------------------------- | ---------------------------------------------------------------------------- |
| `handleInsert`     | `() => T`                    | is called to handle inserts of data ([see Adding Rows](#adding-rows))        |
| `handleUpdate`     | `handleUpdate<T>`            | is called for every update ([Handling Data Updates](#handling-data-updates)) |
| `compareOverrides` | `Record<string, Partial<T>>` | makes the override comparison for mass edit                                  |

### Large Tables API

| Property           | Type                            | Description                                                                                                                                               |
| ------------------ | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `virtualizer-mode` | `"auto" \| "always" \| "never"` | when the table renders only the rows in and around the visible area: `auto` (default) from 300 Data Rows on ([see Virtualizer Modes](#virtualizer-modes)) |
| `scrollTarget`     | `Element \| null \| undefined`  | the element that scrolls the table; overrides the automatic detection, which is on while it's unset ([see Scroll Container](#scroll-container))           |

### Actions & Toolbar API

| Property            | Type                                       | Description                                                                                             |
| ------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `actionTabs`        | `Tabs<OwcTableActionTabsRenderOptions<T>>` | a list of action tabs ([see Add your own Action Tab](#add-your-own-action-tab))                         |
| `action-tab-active` | `string`                                   | the tab that should be per default open ([see Open a specific Action Tab](#open-a-specific-action-tab)) |
| `show-info`         | `boolean`                                  | displays additional info ([see Extra Info](#extra-info))                                                |

### Formatting API

to overwrite the formats, see [Override Built-in Formatters](#override-built-in-formatters)

| Property            | Type                  | Description                         | Default                                                               |
| ------------------- | --------------------- | ----------------------------------- | --------------------------------------------------------------------- |
| `currencyFormatter` | `Intl.NumberFormat`   | manages how `currency`is displaced  | de, EUR; xxx.xxx,xx €                                                 |
| `numberFormatter`   | `Intl.NumberFormat`   | manages how `number` is displaced   | xxx.xxx,oo (o means optionally, max two decimals)                     |
| `percentFormatter`  | `Intl.NumberFormat`   | manages how `percent` is displaced  | de; xx,xx% / xx%                                                      |
| `dateFormatter`     | `Intl.DateTimeFormat` | manages how `date` is displaced     | de; `dd.MM.yyyy`                                                      |
| `dateTimeFormatter` | `Intl.DateTimeFormat` | manages how `datetime` is displaced | de; `dd.MM.yyyy, H:mm` / `dd.MM.yyyy, HH:mm` (depends on the browser) |

### Styling API

| Property       | Type                          | Description                                                                      |
| -------------- | ----------------------------- | -------------------------------------------------------------------------------- |
| `customStyles` | `CSSResult \| TemplateResult` | styles for the shadow doms. (i.e.: if you need custom styles for the action tab) |

### Events

| Event                 | Description                                                                |
| --------------------- | -------------------------------------------------------------------------- |
| @rowClick             | Fired when a row is clicked; the row data is on event.row (RowClickEvent). |
| @owc-table-data-ready | Fired (bubbling, composed) once new data has been rendered.                |
