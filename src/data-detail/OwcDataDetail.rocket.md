```js server
export const config = {
  path: '/components/data-detail',
  title: 'Data Detail',
  menu: {
    order: 30,
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
```

# Data Detail

## Kitchen sink

A demo showcasing most features of Data Detail.

```js demo
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

const kitchenSinkOptions = {
  handleUpdate: ({ data, field, config, value, autoSetData }) => {
    console.log({ field, value });
    autoSetData();
  },
  handleDelete: () => {},
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
                title: 'First Name',
                field: 'client.firstName',
                type: 'editable',
              },
              {
                title: 'Last Name',
                field: 'client.lastName',
                type: 'editable',
              },
              {
                title: 'Type',
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
              // data.emailList =
              console.log(data);
              // autoSetData();
            }}
            .columns=${[
              { label: 'E-Mail', field: 'email', type: 'editable' },
              {
                title: 'Type',
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
      // {
      //   label: 'Date of Birth',
      //   field: 'dateOfBirth',
      //   formatter: data =>
      //     new Intl.DateTimeFormat('de', {
      //       day: '2-digit',
      //       month: '2-digit',
      //       year: 'numeric',
      //     }).format(data.dateOfBirth),
      // },
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

### One Column

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

## Type

### Content

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

### Input

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

Defaults to Text Input Editable

```js demo
const editableTextColumns = [[{ label: 'First Name', field: 'firstName', type: 'editable' }]];

export const editableTextDemo = () => html`
  <owc-data-detail .data=${data} .columns=${editableTextColumns}></owc-data-detail>
`;
```

#### Number

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

### Single Expandable

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

## Show Hide Cells

You can generally hide a cell by setting `visible: false`

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

Or Hide columns based on data.
For example only show the firstName cell if the age is bigger then 20

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
