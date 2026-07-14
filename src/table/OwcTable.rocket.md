```js server
export const config = {
  path: '/table',
  title: 'Table',
  menu: {
    parent: 'data',
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

import '@open-wc/components/define/owc-table.js';
const personData = [
  {
    id: '0013X00002eOb5BQAS',
    firstName: 'Robert',
    lastName: 'Lombart',
    profession: 'Teacher',
    premium: true,
    gender: 'male',
    age: 34,
  },
  {
    id: '0013X00002eP8qsQAC',
    firstName: 'Sarah',
    lastName: 'Arlon',
    profession: 'Developer',
    premium: false,
    gender: 'female',
    age: 65,
  },
  {
    id: '0013X00002eP8sDQAS',
    firstName: 'Grace',
    lastName: 'Annerer',
    profession: '',
    premium: false,
    gender: 'female',
    age: 1025,
  },
];

const person = {
  id: '0013X00002eOb5BQAS',
  firstName: 'Robert',
  lastName: 'Lombart',
  profession: 'Teacher',
  premium: true,
  gender: 'male',
};

function generateMoreData(originalData, amount = 50) {
  const data = [...originalData];
  for (let i = 0; i < amount; i++) {
    const randomIndex = Math.floor(Math.random() * data.length);
    const newEntry = JSON.parse(JSON.stringify(data[randomIndex]));
    newEntry.id = crypto.randomUUID();
    data.push(newEntry);
  }
  return data;
}
```

# Table

A Table with many filter options and features.

Simple example:

Use the `.columns` property to define columns. Assign a column with `field` and use `title` to title the table head. Rows are defined in the `.data` property. `field` has to be unique, as it acts as an id to write data into the rows.

```js demo
export const simpleTable = () => {
  return html`
    <div style="height: 60vh; overflow: auto;">
      <owc-table
        selectable
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
        .data=${generateMoreData(personData)}
      ></owc-table>
    </div>
  `;
};
```

## Data Handling

In order to fetch data from an API you can

### Passing data

If you have the data available by the time the table gets created you can pass it as a property `.data`.
This is the most straight forward way of showing something in the table.

This is commonly used by Offline first apps that use a "Sync Engine".

```js demo
export const dataHandlingPassing = () => {
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
      ]}
      .data=${[
        { id: 1, firstName: 'Ada', lastName: 'Lovelace' },
        { id: 2, firstName: 'Grace', lastName: 'Hopper' },
      ]}
    ></owc-table>
  `;
};
```

### Handle Data Function

If you want to make an API call you can provide an async `handleData` function.

Generally there are 3 modes

1. `initiallyOnce`: fetch the data once on initial render and then only filter in the browser
1. `anyFilterChange`: fetch the data on every filter change (has a debounce of 500ms by default)
1. `initiallyAndAnyFilterChange`: fetch data initially and on every filter change (!NOT IMPLEMENTED YET)

#### Handle Data Options: 'initiallyOnce'

This is great for list that are "smallish" (roughly < 50.000 entries) AND do not change often as you only do one API call then can filter in real time as you please.
If you want to refresh the data then you can press the "refresh" button or directly execute `callHandleData`.

> `initiallyOnce` is the default mode for handleData

```js demo
export const handleDataOptions_initiallyOnce = () => {
  return html`
    <owc-table
      .handleData=${async () => {
        // this await Promise is for demo purposes - this should be your fetch
        // return await fetch('api.domain.com/v1/stuff');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return personData;
      }}
      filter-mode="global-search"
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

#### Handle Data Options: 'anyFilterChange'

This is great for lists that are big where it is not practicably to download ALL the data. e.g. where the search/filtering needs to happen on the server or in the database.
This will result in an API call for every keystroke / filter change.

If you wish to limit the amount of API call then you can provide a `condition´ function to for example only do an api call after a min. of 3 characters are entered.

```js demo
export const handleDataOptions_anyFilterChange = () => {
  return html`
    <owc-table
      .handleData="${async ({ jsonFilters }) => {
        const search = jsonFilters[0]?.value;
        // this await Promise is for demo purposes - this should be your fetch
        // return await fetch('api.domain.com/v1/stuff');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return personData.filter(
          person =>
            person.firstName.toLowerCase().includes(search.toLowerCase()) ||
            person.lastName.toLowerCase().includes(search.toLowerCase()),
        );
      }}"
      .handleDataOptions=${{
        mode: 'anyFilterChange',
        condition: ({ jsonFilters }) => {
          const search = jsonFilters[0]?.value;
          return search && search.length > 2;
        },
        debounceTime: 500 /* this is the default - just here for demo purposes */,
      }}
      filter-mode="global-search"
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

## Show or hide columns

Set

```html
<owc-table
  .actionTabs=${{
    settings: { visible: true }
  }}>
</owc-table>
```

to add a dropdown above the table that can show, hide or only show the columns when filtered. `visible` can be set to

- `always`: to always show the column (default)
- `never`: to never show the column
- `ifFiltered`: to only show the column if it is used within a filter

```js demo
export const hideColumnsTable = () => {
  return html`
    <owc-table
      .actionTabs=${{
        settings: { visible: true },
      }}
      .columns=${[
        {
          label: 'Nr.',
          formatter: 'rownum',
          visible: 'always', // is the default
        },
        {
          label: 'Profession',
          field: 'profession',
          visible: 'never',
        },
        {
          label: 'First Name',
          field: 'firstName',
          visible: 'always',
        },
        {
          label: 'Last Name',
          field: 'lastName',
          visible: 'ifFiltered',
        },
        {
          label: 'Age',
          field: 'age',
          visible: 'ifFiltered',
        },
      ]}
      .data=${personData}
    ></owc-table>
  `;
};
```

## Rows as Links

To add a link to row set the `render-mode` as `link` and use the `getRowLinkSettings` setting and set a link for the rows.

```js demo
export const rowLinks = () => {
  return html`
    <owc-table
      render-mode="link"
      .getRowLinkSettings=${row => ({ href: `/detail/${row.id}` })}
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
      .data=${personData}
    ></owc-table>
  `;
};
```

## Show Details

For the detail views of the rows to appear directly in the table, set the `render-mode` as `detail` and use the `renderDetails` to provide html for row detail views.

```js demo
export const showDetails = () => {
  return html`
    <owc-table
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
        {
          label: 'Last Name',
          field: 'lastName',
          visible: 'always',
        },
      ]}
      .renderDetail=${row => html`
        <h2 style="margin-top: 0;">${row.firstName} ${row.lastName}</h2>
        <ul>
          <li>Profession: ${row.profession}</li>
          <li>Gender: ${row.gender}</li>
        </ul>
      `}
      render-mode="detail"
      .data=${personData}
    ></owc-table>
  `;
};
```

## Async Show Details

Show Details can also handle async functions

```js demo
export const asyncShowDetails = () => {
  return html`
    <owc-table
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
        {
          label: 'Last Name',
          field: 'lastName',
          visible: 'always',
        },
      ]}
      .renderDetail=${async row => {
        await new Promise(resolve => setTimeout(resolve, 3000));
        return html`
          <h2 style="margin-top: 0;">${row.firstName} ${row.lastName}</h2>
          <ul>
            <li>Profession: ${row.profession}</li>
            <li>Gender: ${row.gender}</li>
          </ul>
        `;
      }}
      render-mode="detail"
      .data=${personData}
    ></owc-table>
  `;
};
```

## Add Header Content

If you want to add static content between the Filter and the content you can provide a `renderHeaderContent` function

```js demo
export const headerContent = () => {
  return html`
    <owc-table
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

## Formatted cells

To use formatted cells define the `formatter`. Existing formatters are `rownum` (numbered rows), `datetime` (date from Date object) and `currency` (local currency). A custom formatter function can also be used to filter information from this row or visually change a column with html.

```js demo
import { renderSubList } from '@open-wc/components/table/subListHelpers.js';
export const formatTable = () => {
  return html`
    <owc-table
      .columns=${[
        { label: 'Nr.', formatter: 'rownum' },
        { label: 'Date', field: 'date', formatter: 'datetime' },
        {
          label: 'Amount',
          field: 'amount',
          formatter: 'currency',
        },
        {
          label: 'Product Status',
          field: 'productList[].status',
          // filteredField: 'productList[]',
          // formatter: (row, { fieldValueFiltered }) =>
          //   renderSubList(fieldValueFiltered, [
          //     product => product.label,
          //     product => product.status,
          //   ]),
        },
        {
          label: 'Product Amount',
          field: 'productList[].amount',
          fieldFilteredReturn: 'productList[]',
          filterType: 'number',
          formatter: (row, { fieldValueFiltered, currencyFormatter }) =>
            renderSubList(fieldValueFiltered, [
              product => product.label,
              product => product.amount && currencyFormatter.format(product.amount),
            ]),
        },
        {
          label: 'Performance',
          field: 'performance',
          formatter: row => html`
            <span style="background: green; border-radius: 5px; color: white; padding: 3px;">
              ${row.performance}
            </span>
          `,
        },
      ]}
      .data=${[
        {
          id: 1,
          date: new Date('2023-10-01T10:00:00Z'),
          amount: 1500.0,
          productList: [
            {
              status: 'available',
              amount: 1500.0,
              label: 'Test product 3s',
            },
          ],
          performance: 'Declining',
        },
        {
          id: 2,
          date: new Date('2023-10-02T11:30:00Z'),
          amount: 2500.5,
          productList: [
            {
              status: 'available',
              amount: 2500.5,
              label: 'Test product 1',
            },
          ],
          performance: 'Good',
        },
        {
          id: 3,
          date: new Date('2023-10-03T14:45:00Z'),
          amount: 3200.75,
          productList: [
            {
              status: 'available',
              amount: 2500.5,
              label: 'Test product 1',
            },
            {
              status: 'out of stock',
              amount: 700.25,
              label: 'Test product 2',
            },
          ],
          performance: 'Good',
        },
      ]}
    ></owc-table>
  `;
};
```

## Override Built in Formatter

```js demo
export const overrideBuiltinFormatter = () => {
  return html`
    <owc-table
      selectable
      .columns=${[
        {
          label: 'Nr.',
          formatter: 'rownum',
        },
        {
          label: 'Age',
          field: 'age',
          formatter: 'number',
        },
      ]}
      .data=${personData}
      .numberFormatter=${new Intl.NumberFormat('de', { minimumFractionDigits: 2 })}
    ></owc-table>
  `;
};
```

## Selectable rows

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
              size="small"
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

## Filter

Use the `.filterMode` property to display a filter. `builder` provides a filter option for every column that filters with the defined filter type. `global-search-with-builder` adds a global search bar that works with the `text` and `number` types. All filter types are: `checkbox` (checkable options), `date` (time span options), `text` (text search, default), `number` (operator search) and `autocomplete` (set of options). For the `autocomplete` and `checkbox` types its required to set `filterOptions`. To make a column filterable set `filterable` true.

Tip: You can exclude columns from being filtered by the global field by adding the `excludeGlobalSearch` property.

```js demo
export const filterTable = () => {
  return html`
    <owc-table
      .filterMode=${'global-search-with-builder'}
      .columns=${[
        {
          label: 'Status',
          field: 'status',
          filterable: true,
          filterType: 'checkbox',
          filterOptions: [
            { value: 'Offline', label: 'Offline' },
            { value: 'Online', label: 'Online' },
            { value: 'Away', label: 'Away' },
          ],
        },
        {
          label: 'Meeting Date',
          field: 'meetingDate',
          formatter: 'datetime',
          filterable: true,
          filterType: 'date',
        },
        {
          label: 'Name',
          field: 'clientName',
          filterable: true,
          // filterType: 'text' is default
        },
        {
          label: 'Alter',
          field: 'age',
          excludeGlobalSearch: true,
          filterable: true,
          filterType: 'number',
        },
        {
          label: 'Country',
          field: 'country',
          filterable: true,
          filterType: 'autocomplete',
          filterOptions: [
            { value: 'Austria', label: 'Österreich' },
            { value: 'Germany', label: 'Deutschland' },
            { value: 'France', label: 'Frankreich' },
            { value: 'Spain', label: 'Spanien' },
            { value: 'Hungary', label: 'Ungarn' },
          ],
        },
      ]}
      .data=${[
        {
          id: 1,
          clientName: 'Robert Lombart',
          country: 'Spain',
          status: 'Online',
          age: 28,
          meetingDate: new Date('2022-06-28T14:30:00.000Z'),
        },
        {
          id: 2,
          clientName: 'Ada Lovelace',
          country: 'Austria',
          status: 'Away',
          age: 19,
          meetingDate: new Date('2022-05-31T14:30:00.000Z'),
        },
        {
          id: 3,
          clientName: 'Sarah Arlon',
          country: 'Spain',
          status: 'Offline',
          age: 50,
          meetingDate: new Date('2023-04-13T12:00:00.000Z'),
        },
        {
          id: 4,
          clientName: 'Brian Arlon',
          country: 'Hungary',
          status: 'Online',
          age: 60,
          meetingDate: new Date('2022-06-13T10:00:00.000Z'),
        },
      ]}
    ></owc-table>
  `;
};
```

## Extra info

The `show-info` shows a help text that says how many rows are currently being displayed. This works with the filter.

```js demo
export const showInfoTable = () => {
  return html`
    <owc-table
      show-info
      .filterMode=${'global-search'}
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

## Sorting

To sort by a column by default use `sorter` to set the order. `field` is required and is the column to be sorted, `order` is ascending by default but can be set to `asc` or `desc` and `sortType` can be `dateNoYear` to ignore the year in a date when sorting (example below).

```js demo
export const sortingTable = () => {
  return html`
    <owc-table
      .columns=${[
        {
          label: 'Nr.',
          formatter: 'rownum',
        },
        {
          label: 'Status',
          field: 'status',
        },
        {
          label: 'Meeting date',
          field: 'meetingDate',
          formatter: 'datetime',
          sorter: [{ field: 'meetingDate', order: 'desc', sortType: 'dateNoYear' }],
        },
        {
          label: 'First Name',
          field: 'firstName',
        },
      ]}
      .data=${[
        {
          id: 1,
          firstName: 'Robert',
          status: 'Offline',
          meetingDate: new Date('2022-06-28T14:30:00.000Z'),
        },
        {
          id: 2,
          firstName: 'Ada',
          status: 'Online',
          meetingDate: new Date('2023-05-31T14:30:00.000Z'),
        },
        {
          id: 3,
          firstName: 'Sarah',
          status: 'Online',
          meetingDate: new Date('2022-04-13T12:00:00.000Z'),
        },
      ]}
    ></owc-table>
  `;
};
```

## Groups

By specifing a list of groups and a selector function, mapping data elements to group keys, you can divide the table up into groups for a better overview. Groups can be opened and closed by clicking. All elements grouped into non specified groups go into a "other" group. By specifying a priority the display order of the groups can be decided. By setting the active property of a group to true, it will be open by default.

```js demo
export const groupedTable = () => {
  return html`
    <owc-table
      .groupList=${[
        { key: 'r', label: 'Starts with R', priority: 10, active: true },
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
          label: 'Status',
          field: 'status',
        },
        {
          label: 'Meeting date',
          field: 'meetingDate',
          formatter: 'datetime',
          sorter: [{ field: 'meetingDate', order: 'desc', sortType: 'dateNoYear' }],
        },
        {
          label: 'First Name',
          field: 'firstName',
        },
      ]}
      .data=${[
        {
          id: 1,
          firstName: 'Robert',
          status: 'Offline',
          meetingDate: new Date('2022-06-28T14:30:00.000Z'),
        },
        {
          id: 2,
          firstName: 'Ada',
          status: 'Online',
          meetingDate: new Date('2023-05-31T14:30:00.000Z'),
        },
        {
          id: 3,
          firstName: 'Michelle',
          status: 'Online',
          meetingDate: new Date('2022-04-13T12:00:00.000Z'),
        },
        {
          id: 4,
          firstName: 'Sarah',
          status: 'Online',
          meetingDate: new Date('2022-03-13T12:00:00.000Z'),
        },
      ]}
    ></owc-table>
  `;
};
```

## Calculate Sums

By adding `showInCalculateSums` property to a column and adding a action tab
you can show the total sum of all values of a column
...

```js demo
export const calculateSums = () => {
  return html`
    <owc-table
      show-info
      .filterMode=${'global-search'}
      .actionTabs=${{
        calculateSums: {
          visible: true,
        },
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
          label: 'Age',
          field: 'age',
          filterable: true,
          formatter: 'number',
          showInCalculateSums: true,
        },
      ]}
      .data=${personData}
    ></owc-table>
  `;
};
```

## Sticky header

Use the `sticky-header` attribute to make the header fixed at the top of the table when scrolling.

```js demo
export const stickyHeaderTable = () => {
  return html`
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
      .data=${generateMoreData(personData)}
    ></owc-table>
  `;
};
```

## Save state to URL

Use the attribute `save-state-to-url` to save selected filters and rows to the url in case the page reloads. The name of the stored table can be changed with the `store-name-prefix` attribute.

PS: this is not a full demo as the first table is already using `save-state-to-url` and they would fight over the url.
PPS: if you want to handle multiple tables with different states on a single page you need to handle that yourself.

```html
<owc-table save-state-to-url store-name-prefix="save-state-example"></owc-table>
```

## Align column content

Use `align` to align the content in columns. It is possible to align the content as `start` (left bound), `center` (centered), `end` (right bound) and `full` (centered but excluding header) with the default being `start`.

```js demo
export const alignContent = () => {
  return html`
    <owc-table
      .columns=${[
        {
          label: 'Nr.',
          formatter: 'rownum',
          align: 'start', // is the default
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

## Width of columns

Use `width` to change the width of a column and use `resizable` to change if columns are resizable, this is true by default.

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
          resizable: true, // is the default
          width: 400,
        },
        {
          label: 'Last Name',
          field: 'lastName',
          resizable: true, // is the default
        },
      ]}
      .data=${personData}
    ></owc-table>
  `;
};
```

## Exporting the Table

Tables can be copied to an Excel Table or downloaded as a `*.csv`. It comes with a built in "Export" Tab action which you can enable by setting it's visibility to true.

```js
.actionTabs=${{
  export: { visible: true },
}}
```

To exclude a column set `includeInExport` to false.

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

## Add your own action tab

You can add your own action by adding an additional key to the `actionTabs`.

```js demo
export const actionTabTable = () => {
  return html`
    <owc-table
      selectable
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
  `;
};
```

## Open a specific action tab

You can pre open a tag by setting `.actionTabActive` or `action-tab-active` to the key of the tab.
Example `<owc-table action-tab-active="settings"></owc-table>`

```js demo
export const actionTabOpenTable = () => {
  return html`
    <owc-table
      .columns=${[
        {
          label: 'First Name',
          field: 'firstName',
        },
      ]}
      .data=${personData}
      .actionTabs=${{
        export: {
          visible: true,
        },
        settings: {
          visible: true,
        },
      }}
      action-tab-active="settings"
    ></owc-table>
  `;
};
```

## Lexicon for filters

Use `description` in the `.columns` property to add a Lexicon next to the search where you can describe the filter options available. `subDescription` adds a dropdown for extra details.

```js demo
export const descriptionTable = () => {
  return html`
    <owc-table
      .filterMode=${'builder'}
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
          ],
          description: 'This filters the professions with multiple options',
          subDescription: 'All options are: Teacher, Lawyer, Developer',
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

## Editing Table Content

In the Table below you can you double click on the First Name to edit it.

This works by defining the column as `editable`.

```js
{
  label: 'First Name',
  field: 'firstName',
  type: 'editable',
},
```

```js demo
export const editingContent = () => {
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
      ]}
      .data=${personData}
    ></owc-table>
  `;
};
```

### Edit with Checkbox

Using `editableOptions: { type: 'checkbox' },` you can handle boolean values with a checkbox.

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

### Edit with Autocomplete

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
            ],
          },
        },
      ]}
      .data=${personData}
    ></owc-table>
  `;
};
```

### Add new Row

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

### Mass Editing

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

## Example FAQ

```js client
const faqList = [
  {
    id: '1',
    question: 'What is a planet?',
    answer:
      'A planet is a celestial body that orbits a star, has enough mass to be nearly round in shape, and has cleared its orbit of other debris. Planets can be rocky, like Earth, or gaseous, like Jupiter.',
  },
  {
    id: '2',
    question: 'How many planets are in our solar system?',
    answer:
      'There are eight officially recognized planets in our solar system: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune. Pluto was reclassified as a dwarf planet in 2006.',
  },
  {
    id: '3',
    question: 'Why is Pluto not considered a planet anymore?',
    answer:
      'Pluto was reclassified as a dwarf planet because it does not meet all the criteria set by the International Astronomical Union (IAU). Specifically, it has not cleared its orbit of other debris, which is a requirement for full-fledged planets.',
  },
  {
    id: '4',
    question: 'Could humans live on any other planet?',
    answer:
      'Currently, Earth is the only planet known to support human life. However, scientists are studying Mars as a potential candidate for human colonization due to its relatively Earth-like conditions, such as a day length similar to ours and the presence of water ice. However, challenges like low temperatures, thin atmosphere, and high radiation must be overcome for long-term survival.',
  },
];
```

```js demo
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { highlightSearchTerms } from '@open-wc/components/text/highlightSearchTerms.js';

export const exampleFaq = () => {
  return html`
    <owc-table
      filter-mode="global-search"
      .columns=${[
        {
          label: 'Nr.',
          formatter: 'rownum',
          visible: 'always',
        },
        {
          label: 'Question',
          field: 'question',
          filterable: true,
          formatter: row =>
            row.question ? html`<strong>${row.question}</strong>` : 'Keine FAQ vorhanden',
        },
        {
          label: 'Answer',
          field: 'answer',
          filterable: true,
          formatter: (row, options) => {
            const search = options?.custom?.jsonFilters[0].value;
            return unsafeHTML(
              highlightSearchTerms({
                search,
                text: row.answer,
              }),
            );
          },
        },
      ]}
      .renderDetail=${async (row, { jsonFilters }) => {
        const search = jsonFilters[0].value || '';
        return html`
          <p style="text-align: center;">
            ${unsafeHTML(
              highlightSearchTerms({
                search,
                text: row.answer,
                truncate: false,
              }),
            )}
          </p>
        `;
      }}
      render-mode="detail"
      .data=${faqList}
    ></owc-table>
  `;
};
```

## Annotation

Use `renderAnnotation` to render custom annotations to the top of the row

```js demo
import '@awesome.me/webawesome/dist/components/tag/tag.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';

export const annotationTable = () => {
  // filter-mode="global-search-with-builder"
  //show-info
  // .actionTabs=${{
  //   export: { visible: true },
  //   settings: { visible: true },
  // }}
  //save-state-to-url
  return html`
    <owc-table
      selectable
      sticky-header
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
      .renderDetail=${(row, {}) => {
        return html`${row.profession}`;
      }}
      render-mode="detail"
      .renderAnnotation=${row => {
        return !row.profession
          ? html`<wa-tag variant="warning">
              <wa-icon name="clock"></wa-icon>
              &nbsp;<span>Warning: Profession field is empty</span>
            </wa-tag>`
          : nothing;
      }}
      .data=${personData}
    ></owc-table>
  `;
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

The sections above document each feature with live demos; this is the summary of the public
surface. Column config types are importable from `@open-wc/components/OwcTable.types.js`.

### Attributes & properties

| Property                                                                                         | Type                        | Description                                                                                     |
| ------------------------------------------------------------------------------------------------ | --------------------------- | ----------------------------------------------------------------------------------------------- |
| `data`                                                                                           | `T[]`                       | The rows to display.                                                                            |
| `columns`                                                                                        | `Column<T>[]`               | Column configuration (labels, field paths, formatters, editing, visibility, ...).               |
| `handleData` / `handleDataOptions`                                                               | `function` / `object`       | Async data provider and its options (see "Data Handling").                                      |
| `loading`                                                                                        | `boolean`                   | Shows the loading state; reflected.                                                             |
| `store-name-prefix`                                                                              | `string`                    | Key prefix for URL/localStorage persistence (state, column settings).                           |
| `selectable`                                                                                     | `boolean`                   | Adds the selection checkbox column (see "Selectable rows").                                     |
| `save-state-to-url`                                                                              | `boolean`                   | Persists filters/sorting to the URL (see "Save state to URL").                                  |
| `sticky-header`                                                                                  | `boolean`                   | Keeps the header visible while scrolling.                                                       |
| `filter-mode`                                                                                    | `string`                    | Filtering behavior; reflected.                                                                  |
| `jsonFilters` / `filter`                                                                         | `JsonFilter[]` / `function` | Declarative JSON filters or a custom filter function (see "Filter").                            |
| `highlightJsonFilters` / `highlightFilter`                                                       | `JsonFilter[]` / `function` | Highlight matching cells without filtering rows.                                                |
| `jsonSorters` / `sorters`                                                                        | `JsonSorter[]` / `array`    | Declarative or custom sorting (see "Sorting").                                                  |
| `getRowLinkSettings`                                                                             | `function`                  | Renders rows as links (see "Rows as Links").                                                    |
| `renderDetail` / `openDetails`                                                                   | `function` / `array`        | Detail rows (see "Show Details").                                                               |
| `renderAnnotation`                                                                               | `function`                  | Row annotations (see "Annotation").                                                             |
| `renderHeaderContent`                                                                            | `function`                  | Extra header content (see "Add Header Content").                                                |
| `handleInsert` / `insertData`                                                                    | `function` / `T[]`          | Inserting new rows (see "Editing Table Content").                                               |
| `show-info`                                                                                      | `boolean`                   | Shows the `owc-table-info` action-tab bar (see "Extra info").                                   |
| `actionTabs` / `action-tab-active`                                                               | `object` / `string`         | Custom action tabs and the active tab (see "Add your own action tab").                          |
| `emptyMessage`                                                                                   | `TemplateResult`            | Rendered when there are no rows.                                                                |
| `customStyles`                                                                                   | `CSSResult`                 | Extra styles injected into the table.                                                           |
| `currencyFormatter`, `dateFormatter`, `dateTimeFormatter`, `numberFormatter`, `percentFormatter` | `Intl.*`                    | Override the built-in formatters (see "Override Built in Formatter").                           |
| `render-mode`, `virtualizer-mode`, `renderType`                                                  | `string`                    | Rendering strategy tuning; `renderType`/`compareOverrides` drive the mass-edit compare preview. |
| `visibleData`, `processedData`, `allData`                                                        | `T[]` (read)                | The rows after filtering/sorting/visibility - useful for exports and mass edit.                 |

### Events

| Event                  | Description                                                                    |
| ---------------------- | ------------------------------------------------------------------------------ |
| `rowClick`             | Fired when a row is clicked; the row data is on `event.row` (`RowClickEvent`). |
| `owc-table-data-ready` | Fired (bubbling, composed) once new data has been rendered.                    |
