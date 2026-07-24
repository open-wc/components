```js server
export const config = {
  path: '/data/data-detail',
  title: 'Data Detail',
  menu: {
    parent: '/data',
    iconName: 'file-earmark-text',
    order: 40
  },
};
import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';
import { spreadProps } from '@open-wc/lit-helpers';
import '@open-wc/components/define/owc-data-detail.js';
const data = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  age: 12,
  dateOfBirth: '2000-01-01',
  planet: 'Mercurius',
  phone: '12345 / 12345',
};

const PLANET_LIST = [
  { label: 'Mercury', value: 'Mercurius' },
  { label: 'Venus', value: 'Venus' },
  { label: 'Earth', value: 'Terra' },
  { label: 'Mars', value: 'Mars' },
  { label: 'Jupiter', value: 'Iuppiter' },
  { label: 'Saturn', value: 'Saturnus' },
  { label: 'Uranus ', value: 'Uranus' },
  { label: 'Neptune', value: 'Neptunus' },
];

class Client {
  #data = {};
  familyMemberList = [];
  constructor(data) {
    const dataWithDefaults = {
      firstName: '',
      lastName: '',
      ...data,
    };
    this.#data = dataWithDefaults;
    if (dataWithDefaults && Array.isArray(dataWithDefaults.familyMemberList)) {
      for (const familyMember of dataWithDefaults.familyMemberList) {
        this.familyMemberList.push(new ClientRelationShip(familyMember));
      }
    }
  }
  get firstName() {
    return this.#data.firstName;
  }
  set firstName(value) {
    this.#data.firstName = value;
  }
  get lastName() {
    return this.#data.lastName;
  }
  set lastName(value) {
    this.#data.lastName = value;
  }
  get favoritePlanet() {
    return this.#data.favoritePlanet;
  }
  set favoritePlanet(value) {
    this.#data.favoritePlanet = value;
  }
  get dateOfBirth() {
    return new Date(this.#data.dateOfBirth);
  }
  get age() {
    if (!this.dateOfBirth) return '';
    const monthDiff = Date.now() - this.dateOfBirth.getTime();
    const ageDate = new Date(monthDiff);
    const year = ageDate.getUTCFullYear();
    const age = Math.abs(year - 1970);
    return age;
  }
  get primaryFamilyMember() {
    const members = this.familyMemberList.filter(member => member.type === 'husband/wife');
    const person = members[0].client;
    return `${person.firstName} ${person.lastName}`;
  }
  get emailList() {
    return this.#data.emailList;
  }
  get primaryEmail() {
    const publicEmails = this.#data.emailList.filter(email => email.type === 'public');
    return publicEmails[0].email;
  }
}

class ClientRelationShip {
  #data = {};
  constructor(data = {}) {
    this.#data = data;
  }
  get id() {
    return this.#data.id;
  }
  get type() {
    return this.#data.type;
  }
  get client() {
    return new Client(this.#data.client);
  }
}

const client = new Client({
  firstName: 'Ada',
  lastName: 'Lovelace',
  dateOfBirth: '2000-01-01',
  favoritePlanet: 'Terra',
  familyMemberList: [
    { id: 10, type: 'husband/wife', client: { firstName: 'Grace', lastName: 'Lovelace' } },
    { id: 20, type: 'parent/child', client: { firstName: 'Frank', lastName: 'Lovelace' } },
  ],
  emailList: [
    { id: 1, type: 'public', email: 'max@example.com' },
    { id: 2, type: 'private', email: 'max+private@example.com' },
  ],
});
```

# Data Detail

`owc-data-detail` renders one record as a compact label/value grid. It is the
single-record companion to `owc-table`: use the table to scan many rows, and use
Data Detail to show or edit the selected row.

The component is configured with a `data` object and a nested `columns` array. Each
inner array is one visual column; each item inside that array is one label/value row.
Items resolve their value from `field` (including dot paths such as
`client.firstName` and JavaScript getters), then optionally format, edit, hide, or
expand that value.

The most common item shape is:

```js
{ label: 'First Name', field: 'firstName' }
```

Add `type: 'editable'` for click-to-edit values, `formatter` for display formatting,
`visible` for conditional rows, and `type: 'expandable'` plus `contentExpanded` when a
row should open a larger detail area.

## Basic usage

Start with `data` and one or more visual columns. This example renders two visual
columns: names on the left, birth data on the right. The date row uses the built-in
`date` formatter, but the source value in `data.dateOfBirth` stays unchanged.

```js demo
const basicColumns = [
  [
    { label: 'First Name', field: 'firstName' },
    { label: 'Last Name', field: 'lastName' },
  ],
  [
    { label: 'Date of Birth', field: 'dateOfBirth', formatter: 'date' },
    { label: 'Age', field: 'age' },
  ],
];

export const basicUsageDemo = () => html`
  <owc-data-detail .data=${data} .columns=${basicColumns}></owc-data-detail>
`;
```

## Kitchen sink

This example combines the main features in one component:

- click-editable fields (`First Name`, `Last Name`, `Date of Birth`)
- autocomplete editing (`Favorite Planet`)
- expandable rows with nested tables (`Family Members`, `Email`)
- badges next to labels and suffix content next to values
- computed getters on the record (`age`, `primaryEmail`, `primaryFamilyMember`)

Use it as a reference when you need several features together. The smaller demos below
show each concept in isolation.

```js demo
const kitchenSinkOptions = {
  handleUpdate: ({ data, field, config, value, autoSetData }) => {
    console.log({ field, value });
    autoSetData();
  },
  columns: [
    [
      {
        label: 'First Name',
        field: 'firstName',
        type: 'editable',
        editableOptions: {
          inputOptions: {
            fallbackValue: 'thomas',
          },
        },
      },
      {
        label: 'Last Name',
        field: 'lastName',
        type: 'editable',
        editableOptions: {
          required: true,
        },
      },
      {
        label: 'Family Members',
        field: 'primaryFamilyMember',
        type: 'expandable',
        contentExpanded: data =>
          html`<owc-table
            .data=${data.familyMemberList}
            .handleInsert=${() => {
              return new ClientRelationShip();
            }}
            .columns=${[
              {
                label: 'First Name',
                field: 'client.firstName',
                type: 'editable',
              },
              {
                label: 'Last Name',
                field: 'client.lastName',
                type: 'editable',
              },
              {
                label: 'Type',
                field: 'type',
                type: 'editable',
                editableOptions: {
                  type: 'autocomplete',
                  data: [
                    { value: 'husband/wife', label: 'Husband/Wife/Partner' },
                    { value: 'parent/child', label: 'Parent/Child' },
                  ],
                },
              },
            ]}
          ></owc-table>`,
        labelBadge: data => data.familyMemberList.length,
      },
      {
        label: 'Favorite Planet',
        field: 'favoritePlanet',
        contentSuffix: () => html`<wa-icon name="rocket-takeoff"></wa-icon>`,
        type: 'editable',
        editableOptions: {
          type: 'autocomplete',
          data: PLANET_LIST.map(elm => ({ label: elm.label, value: elm.value })),
        },
      },
    ],
    [
      {
        label: 'Email',
        field: 'primaryEmail',
        type: 'expandable',
        contentExpanded: data =>
          html`<owc-table
            .data=${data.emailList}
            .handleInsert=${() => {
              return { type: 'public', email: '' };
            }}
            .handleUpdate=${({ autoSetData, data }) => {
              autoSetData();
            }}
            .columns=${[
              { label: 'E-Mail', field: 'email', type: 'editable' },
              {
                label: 'Type',
                field: 'type',
                type: 'editable',
                editableOptions: {
                  type: 'autocomplete',
                  data: [
                    { value: 'private', label: 'Private (hidden)' },
                    { value: 'public', label: 'Public' },
                  ],
                },
              },
            ]}
          ></owc-table>`,
        labelBadge: data => data.emailList.length,
      },
      {
        label: 'Date of Birth',
        field: 'dateOfBirth',
        type: 'editable',
        editableOptions: {
          inputOptions: {
            type: 'date',
          },
        },
      },
      { label: 'Age', field: 'age', formatter: data => `${data.age} Years` },
    ],
  ],
};

export const kitchenSinkDemo = () => html`
  <owc-data-detail
    .data=${client}
    fallbackValue="-"
    ${spreadProps(/**@type {{[key: string]: unknown}}*/ (kitchenSinkOptions))}
  ></owc-data-detail>
`;
```

## Columns

`columns` is an array of visual columns. Each visual column is an array of rows. The
component renders rows by index, so the first item from each visual column appears on
the first grid row, the second item from each visual column appears on the second grid
row, and so on.

This makes it easy to split a large detail view into compact side-by-side groups while
keeping the row order explicit.

### One Column

A single inner array creates a simple vertical label/value list. This is the clearest
layout for short records or narrow containers.

```js demo
const oneColumn = [
  [
    { label: 'First Name', field: 'firstName' },
    { label: 'Last Name', field: 'lastName' },
    { label: 'Age', field: 'age' },
  ],
];

export const oneColumnsDemo = () => html`
  <owc-data-detail .data=${data} .columns=${oneColumn}></owc-data-detail>
`;
```

### Two columns

Use two inner arrays to place two groups side by side. Here `First Name` and `Last Name`
share the first rendered row, and `Age` occupies the second row in the first visual
column.

```js demo
const twoColumns = [
  [
    { label: 'First Name', field: 'firstName' },
    { label: 'Age', field: 'age' },
  ],
  [{ label: 'Last Name', field: 'lastName' }],
];

export const twoColumnsDemo = () => html`
  <owc-data-detail .data=${data} .columns=${twoColumns}></owc-data-detail>
`;
```

### Three columns

Additional inner arrays add more visual columns. Keep the number of columns low when
labels or values are long; the component is intentionally compact and does not wrap
labels by default.

```js demo
const threeColumns = [
  [
    { label: 'First Name', field: 'firstName' },
    { label: 'Age', field: 'age' },
  ],
  [{ label: 'Last Name', field: 'lastName' }],
  [{ label: 'Last Name', field: 'lastName' }],
];

export const threeColumnsDemo = () => html`
  <owc-data-detail .data=${data} .columns=${threeColumns}></owc-data-detail>
`;
```

## Value rendering

### Content

The default render mode is plain HTML content resolved from `field`. Setting
`type: 'html'` is explicit and useful when you want the column config to document that
the value is display-only.

```js demo
const contentType = [
  [
    { label: 'First Name', field: 'firstName', type: 'html' },
    { label: 'Last Name', field: 'lastName', type: 'html' },
    { label: 'Age', field: 'age', type: 'html' },
  ],
];

export const contentTypeDemo = () => html`
  <owc-data-detail .data=${data} .columns=${contentType}></owc-data-detail>
`;
```

## Editing

Set `type: 'editable'` to render a click-editable value. When the user submits a value,
`owc-data-detail` calls `handleUpdate` with `{ data, field, value, config, autoSetData }`.
If no `handleUpdate` is provided, the component writes the submitted value into `data`
itself.

### Text input

Editable fields use the click-editable input by default. You can also set
`editableOptions.type: 'input'` explicitly, as shown here.

```js demo
const inputType = [
  [
    {
      label: 'First Name',
      field: 'firstName',
      type: 'editable',
      editableOptions: {
        type: 'input',
      },
    },
    {
      label: 'Last Name',
      field: 'lastName',
      type: 'editable',
      editableOptions: {
        type: 'input',
      },
    },
    {
      label: 'Age',
      field: 'age',
      type: 'editable',
      editableOptions: {
        type: 'input',
      },
    },
  ],
];

export const inputTypeDemo = () => html`
  <owc-data-detail .data=${data} .columns=${inputType}></owc-data-detail>
`;
```

### Input Options

#### Text

This is the shortest editable configuration. Because no `editableOptions.type` is set,
the editable type defaults to a text input.

```js demo
const editableTextColumns = [[{ label: 'First Name', field: 'firstName', type: 'editable' }]];

export const editableTextDemo = () => html`
  <owc-data-detail .data=${data} .columns=${editableTextColumns}></owc-data-detail>
`;
```

#### Number

Pass options through `editableOptions.inputOptions` to configure the underlying
click-editable input. A numeric input is useful when browser-level number controls or
validation are desired.

```js demo
const editableNumberColumns = [
  [
    {
      label: 'Age',
      field: 'age',
      type: 'editable',
      editableOptions: { type: 'input', inputOptions: { type: 'number' } },
    },
  ],
];

export const editableNumberDemo = () => html`
  <owc-data-detail .data=${data} .columns=${editableNumberColumns}></owc-data-detail>
`;
```

#### Date

The same input options can switch the editor to a date input. The stored value is still
the submitted input value; add `handleUpdate` when you need to normalize it before
writing it back to your model.

```js demo
const editableDateColumns = [
  [
    {
      label: 'Date of Birth',
      field: 'dateOfBirth',
      type: 'editable',
      editableOptions: { type: 'input', inputOptions: { type: 'date' } },
    },
  ],
];

export const editableDateDemo = () => html`
  <owc-data-detail .data=${data} .columns=${editableDateColumns}></owc-data-detail>
`;
```

### Autocomplete

Use `editableOptions.type: 'autocomplete'` with a `data` array when the value should be
selected from known options. The display value is the stored `value`, while the editor
uses the labels from the autocomplete data.

```js demo
const autocompleteColumns = [
  [
    {
      label: 'Planet',
      field: 'planet',
      type: 'editable',
      editableOptions: {
        type: 'autocomplete',
        data: PLANET_LIST.map(elm => ({ label: elm.label, value: elm.value })),
      },
    },
  ],
];

export const autocompleteTypeDemo = () => html`
  <owc-data-detail .data=${data} .columns=${autocompleteColumns}></owc-data-detail>
`;
```

## Expandable

Expandable rows are for values that need a compact summary plus a larger detail area.
The label becomes a toggle, the normal value stays visible, and `contentExpanded`
renders below the grid row. Only one expandable field is opened by a label click at a
time; control the initial state with `openColumns`.

### Single Expandable

This row opens hard-coded content below the detail grid. In real usage the expanded
content can be any Lit template, including forms, charts, or another component.

```js demo
const expandableHardCodedColumns = [
  [
    {
      label: 'First Name',
      field: 'firstName',
      type: 'expandable',
      contentExpanded: () => html`<p>some expanded stuff</p>`,
    },
  ],
];

export const expandableHardCodedDemo = () => html`
  <owc-data-detail .data=${data} .columns=${expandableHardCodedColumns}></owc-data-detail>
`;
```

### Shared Expandable

Expandable rows can live in different visual columns. Clicking one expandable label
closes the previously opened expandable row, because the component stores a single open
field when users toggle labels.

```js demo
const expandableSharedColumns = [
  [
    {
      label: 'First Name',
      field: 'firstName',
      type: 'expandable',
      contentExpanded: () => html`<p>some info about First Name</p>`,
    },
  ],
  [
    {
      label: 'Last Name',
      field: 'lastName',
      type: 'expandable',
      contentExpanded: () => html`<p>some info about Last Name</p>`,
    },
  ],
];

export const expandableSharedDemo = () => html`
  <owc-data-detail .data=${data} .columns=${expandableSharedColumns}></owc-data-detail>
`;
```

### Opened Expandable

Set `.openColumns` when the detail view should start with a specific expandable row
already open.

```js demo
const expandableOpenedColumns = [
  [
    {
      label: 'First Name',
      field: 'firstName',
      type: 'expandable',
      contentExpanded: () => html`<p>some expanded stuff</p>`,
    },
  ],
];

export const expandableOpenedDemo = () => html`
  <owc-data-detail
    .data=${data}
    .columns=${expandableOpenedColumns}
    .openColumns=${['firstName']}
  ></owc-data-detail>
`;
```

## Content Suffix

`contentSuffix` renders additional content after the value. Use it for small actions,
icons, units, or status markers that belong to the value but should not replace the
value itself.

```js demo
const contentSuffixColumns = [
  [
    {
      label: 'Telefonnummer',
      contentSuffix: () => html`<wa-icon name="pencil"></wa-icon>`,
      field: 'phone',
      type: 'html',
    },
  ],
];

export const contentSuffixColumnsDemo = () => html`
  <owc-data-detail .data=${data} .columns=${contentSuffixColumns}></owc-data-detail>
`;
```

## Built in Formatters

Formatters transform the displayed value while leaving the underlying `data` object
unchanged. Built-in formatter names include `date`, `datetime`, `currency`, `number`,
`percent`, `email`, `tickCross`, and `checkbox`.

```js demo
const builtInFormatterColumns = [
  [
    {
      label: 'Date of Birth',
      field: 'dateOfBirth',
      formatter: 'date',
    },
  ],
];

export const builtinFormatter = () => html`
  <owc-data-detail .data=${data} .columns=${builtInFormatterColumns}></owc-data-detail>
`;
```

## Override Built in Formatter

The built-in date, datetime, number, currency, and percent formatters use formatter
instances from the component. Override those properties when the same formatter name
should render with different locale or formatting rules.

```js demo
const overrideBuiltInFormatterColumns = [
  [
    {
      label: 'Date of Birth',
      field: 'dateOfBirth',
      formatter: 'date',
    },
  ],
];

export const overrideBuiltinFormatter = () => html`
  <owc-data-detail
    .data=${data}
    .columns=${overrideBuiltInFormatterColumns}
    .dateFormatter=${new Intl.DateTimeFormat('de', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })}
  ></owc-data-detail>
`;
```

## Custom Formatter

Use a formatter function when the display value depends on more than a named formatter.
The function receives the full data record, so it can combine fields, add custom
markup, or return a fallback string.

```js demo
const formatter = [
  [
    {
      label: 'Date of Birth',
      field: 'dateOfBirth',
      formatter: data => {
        const dateString = new Intl.DateTimeFormat('de', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(new Date(data.dateOfBirth));
        return `📆 ${dateString}`;
      },
    },
  ],
];

export const formatterDemo = () => html`
  <owc-data-detail .data=${data} .columns=${formatter}></owc-data-detail>
`;
```

## Conditional visibility

Set `visible: false` to hide a row unconditionally. Hidden rows are removed before the
grid row count is calculated.

```js demo
const visibleItems = [
  [
    {
      label: 'Planet',
      field: 'planet',
      visible: false,
    },
    {
      label: 'Age',
      field: 'age',
    },
  ],
];

export const visibleDemo = () => html`
  <owc-data-detail .data=${data} .columns=${visibleItems}></owc-data-detail>
`;
```

`visible` can also be a function of the current record. This is useful for fields that
only apply to some records. In this example the first detail view hides `First Name`
because `age` is `12`; the second one shows it because the data override sets `age` to
`40`.

```js demo
const visibleFunctionItems = [
  [
    {
      label: 'First Name',
      field: 'firstName',
      visible: data => data.age > 20,
    },
    {
      label: 'Age',
      field: 'age',
    },
  ],
];

export const visibleFunctionDemo = () => html`
  <owc-data-detail .data=${data} .columns=${visibleFunctionItems}></owc-data-detail>
  <hr />
  <owc-data-detail .data=${{ ...data, age: 40 }} .columns=${visibleFunctionItems}></owc-data-detail>
`;
```

## API

### Attributes & properties

| Attribute       | Property                                                                                         | Type                      | Default       | Description                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------ | ------------------------- | ------------- | ------------------------------------------------------------------------------------------ |
| -               | `data`                                                                                           | `T`                       | `{}`          | The record to display.                                                                     |
| -               | `columns`                                                                                        | `OwcDataDetailColumns<T>` | `[]`          | Array of columns; each column is an array of items (see below).                            |
| -               | `openColumns`                                                                                    | `Array<Field<T>>`         | `[]`          | Fields whose expandable content is open. Managed on label clicks (single open).            |
| `fallbackValue` | `fallbackValue`                                                                                  | `string`                  | `'-'`         | Fallback shown in editable cells without a value.                                          |
| -               | `handleUpdate`                                                                                   | `handleUpdate<T>`         | -             | Called when an editable cell is submitted (`{ data, field, value, config, autoSetData }`). |
| -               | `dateFormatter`, `dateTimeFormatter`, `currencyFormatter`, `numberFormatter`, `percentFormatter` | `Intl.*Format`            | German locale | Formatters used by the built-in `formatter` names.                                         |

### Column item (`OwcDataDetailItem<T>`)

| Field             | Type                                               | Description                                                                                                |
| ----------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `label`           | `string \| (data: T) => TemplateResult \| string`  | The row label.                                                                                             |
| `field`           | `Field<T>`                                         | Field path into `data` (dot paths like `client.firstName` work).                                           |
| `type`            | `'html' \| 'string' \| 'editable' \| 'expandable'` | How the value renders; default is plain content.                                                           |
| `formatter`       | built-in name or `(row, options) => ...`           | Built-ins: `date`, `datetime`, `currency`, `number`, `percent`, `email`, `tickCross`, `checkbox`.          |
| `editableOptions` | `EditableOptions<T>`                               | For `type: 'editable'`: input type (`input`, `textarea`, `autocomplete`, `checkbox`), options, `required`. |
| `contentExpanded` | `(data: T) => TemplateResult`                      | For `type: 'expandable'`: the expanded content (e.g. a nested `owc-table`).                                |
| `labelBadge`      | `(data: T) => TemplateResult \| string \| number`  | Small badge rendered next to the label.                                                                    |
| `contentSuffix`   | `(data: T) => TemplateResult \| string \| number`  | Content rendered after the value.                                                                          |
| `visible`         | `boolean \| (data: T) => boolean`                  | Hide/show the item; defaults to visible.                                                                   |

### Editable options

| Field                | Type                                                    | Description                                                                  |
| -------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `type`               | `'input' \| 'textarea' \| 'autocomplete' \| 'checkbox'` | Editor to render for `type: 'editable'`; defaults to `input`.                |
| `inputOptions`       | `object`                                                | Options forwarded to the click-editable input, textarea, or autocomplete.    |
| `insertInputOptions` | `object`                                                | Options used when a surrounding table renders the value as a new insert row. |
| `data`               | `Array<{ label: string, value: string }>`               | Autocomplete options.                                                        |
| `dataFn`             | `(row: T) => Array<{ label: string, value: string }>`   | Builds autocomplete options from the current row.                            |
| `required`           | `boolean`                                               | Marks the field as required for editable update helpers.                     |

The types are importable from `@open-wc/components/OwcDataDetail.types.js`.
