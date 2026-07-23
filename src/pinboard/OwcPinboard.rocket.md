```js server
export const config = {
  path: '/data/pinboard',
  title: 'Pinboard',
  menu: {
    parent: '/data',
    order: 110,
    iconName: 'pin-angle',
  },
};
import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';
import '@open-wc/components/define/owc-pinboard.js';
```

# Pinboard

A table with cards in columns akin to a scrumboard, with options for moving data between columns, deleting items, sorting and validation.

## Kitchen sink

A demo of a list of chores with all of the components features. Try out dragging and dropping!

```js demo
export const kitchenSinkPinboard = () => {
  const pinboard = createRef();

  function addToColumn(data, column) {
    const currentCol = pinboard.value.columns.findIndex(elm => elm.value === column);
    pinboard.value.data[currentCol].push(data);
  }

  function removeFromColumn(data, column) {
    const currentCol = pinboard.value.columns.findIndex(elm => elm.value === column);
    pinboard.value.data[currentCol] = pinboard.value.data[currentCol].filter(elm => elm !== data);
  }

  function deleteFromColumn(data, column) {
    pinboard.value.dropZones[column].data.push(data);
  }

  function dataSuccess(data, column) {
    deleteFromColumn(data, column);
    console.log('success');
  }

  function unSucceedOrDelete(data, column) {
    pinboard.value.dropZones[column].data = pinboard.value.dropZones[column].data.filter(
      elm => elm !== data,
    );
  }

  return html`
    <owc-pinboard
      ${ref(pinboard)}
      id="kitchenSinkPinboard"
      .columns=${[
        { label: 'First priority', value: 'prio1', onDrop: addToColumn, onLift: removeFromColumn },
        { label: 'Second priority', value: 'prio2', onDrop: addToColumn, onLift: removeFromColumn },
        { label: 'Third priority', value: 'prio3', onDrop: addToColumn, onLift: removeFromColumn },
        { label: 'Ignore', value: 'ignore', onDrop: addToColumn, onLift: removeFromColumn },
      ]}
      .data=${[
        [
          {
            task: 'Throw out the trash, I cannot be ignored',
            deadline: new Date('2024-01-01'),
            canBeIgnored: false,
          },
          {
            task: 'Do the dishes, I cannot be ignored',
            deadline: new Date('2024-02-01'),
            canBeIgnored: false,
          },
        ],
        [{ task: 'Go grocery shopping', deadline: new Date('2024-01-14'), canBeIgnored: true }],
        [],
        [],
      ]}
      .fieldMapper=${{
        header: () => html`<h3>task</h3>`,
        body: data => `${data.task}`,
        footer: data => html`${data.deadline.toLocaleDateString()}`,
      }}
      .canDrop=${(data, column) => (column === 'ignore' ? data.canBeIgnored : true)}
      .dropZones=${{
        delete: {
          data: [
            {
              task: "I've been deleted",
              deadline: new Date('2024-01-01'),
              canBeIgnored: false,
            },
          ],
          onDrop: deleteFromColumn,
          onLift: unSucceedOrDelete,
          liftable: true,
        },
        success: {
          data: [
            {
              task: "I've been done",
              deadline: new Date('2024-01-01'),
              canBeIgnored: false,
            },
          ],
          onDrop: dataSuccess,
          onLift: unSucceedOrDelete,
          liftable: true,
        },
      }}
    ></owc-pinboard>
  `;
};
```

## Minimal

The `<owc-pinboard>` element is driven by the `.columns` and `.data` and `.fieldMapper` properties.
Specify the pinboard's `.columns` in an array with `label` and `value` properties. While `label` is displayed in the columns header, `value` is used to identify the column internally.
The data displayed in the table is passed in via the `.data` attribute which is an array of columns each containing an array with data. The order of these arrays should correspond to the order specified in `.columns`
The `.fieldMapper` attribute specifies how the data is displayed. It should contain some or all of the following properties: `header`, `body`, `footer`. These are all formatters mapping from data to html and correspond to their respective fields of the data cards.

```js demo
export const simplePinboard = () => {
  return html`
    <owc-pinboard
      id="simplePinboard"
      .columns=${[
        { label: 'First priority', value: 'prio1' },
        { label: 'Second priority', value: 'prio2' },
        { label: 'Third priority', value: 'prio3' },
      ]}
      .data=${[
        [
          { task: 'Throw out the trash', deadline: new Date('2024-01-01') },
          { task: 'Do the dishes', deadline: new Date('2024-02-01') },
        ],
        [{ task: 'Go grocery shopping', deadline: new Date('2024-01-14') }],
        [],
      ]}
      .fieldMapper=${{
        body: data => html`Do ${data.task} until ${data.deadline.toLocaleDateString()}`,
      }}
    ></owc-pinboard>
  `;
};
```

## Other formatters

Use other `.fieldMapper` formatters to create more expressive cards. Tip: Formatters can also return `string` instead of `litHtml`.

```js demo
export const formattersPinboard = () => {
  return html`
    <owc-pinboard
      id="formattersPinboard"
      .columns=${[
        { label: 'First priority', value: 'prio1' },
        { label: 'Second priority', value: 'prio2' },
        { label: 'Third priority', value: 'prio3' },
      ]}
      .data=${[
        [
          { task: 'Throw out the trash', deadline: new Date('2024-01-01') },
          { task: 'Do the dishes', deadline: new Date('2024-02-01') },
        ],
        [{ task: 'Go grocery shopping', deadline: new Date('2024-01-14') }],
        [],
      ]}
      .fieldMapper=${{
        header: () => html`<h3>task</h3>`,
        body: data => `${data.task}`,
        footer: data => html`${data.deadline.toLocaleDateString()}`,
      }}
    ></owc-pinboard>
  `;
};
```

## Sorting

You can make the become data cards become sorted by specifying a sorter in the `.sorter` attribute. By default cards are sorted in the same order as defined in the `.data` array.
Note the order in the fist column is now descending order by date.

```js demo
export const descendingPinboard = () => {
  return html`
    <owc-pinboard
      id="descendingPinboard"
      .columns=${[
        { label: 'First priority', value: 'prio1' },
        { label: 'Second priority', value: 'prio2' },
        { label: 'Third priority', value: 'prio3' },
      ]}
      .data=${[
        [
          { task: 'Throw out the trash', deadline: new Date('2024-01-01') },
          { task: 'Do the dishes', deadline: new Date('2024-02-01') },
        ],
        [{ task: 'Go grocery shopping', deadline: new Date('2024-01-14') }],
        [],
      ]}
      .fieldMapper=${{
        body: data => html`Do ${data.task} until ${data.deadline.toLocaleDateString()}`,
      }}
      .sorter=${(a, b) => b.deadline.valueOf() - a.deadline.valueOf()}
    ></owc-pinboard>
  `;
};
```

## Lift and Drop callbacks

You can move items between columns by dragging and dropping. Dropping an item in another column executes a callback specified in `.column`. This callback should modify the array in `.data` to reflect the change. The callback can of course do anything else you might need to do when data changes, such as saving the changes in a database.

```js demo
export const moveableDataPinboard = () => {
  const pinboard = createRef();

  function addToColumn(data, column) {
    const currentCol = pinboard.value.columns.findIndex(elm => elm.value === column);
    pinboard.value.data[currentCol].push(data);
  }

  function removeFromColumn(data, column) {
    const currentCol = pinboard.value.columns.findIndex(elm => elm.value === column);
    pinboard.value.data[currentCol] = pinboard.value.data[currentCol].filter(elm => elm !== data);
  }
  return html`
    <owc-pinboard
      ${ref(pinboard)}
      id="moveableDataPinboard"
      .columns=${[
        { label: 'First priority', value: 'prio1', onDrop: addToColumn, onLift: removeFromColumn },
        { label: 'Second priority', value: 'prio2', onDrop: addToColumn, onLift: removeFromColumn },
        { label: 'Third priority', value: 'prio3', onDrop: addToColumn, onLift: removeFromColumn },
      ]}
      .data=${[
        [
          { task: 'Throw out the trash', deadline: new Date('2024-01-01') },
          { task: 'Do the dishes', deadline: new Date('2024-02-01') },
        ],
        [{ task: 'Go grocery shopping', deadline: new Date('2024-01-14') }],
        [],
      ]}
      .fieldMapper=${{
        body: data => html`Do ${data.task} until ${data.deadline.toLocaleDateString()}`,
      }}
    ></owc-pinboard>
  `;
};
```

## Additional dropzones

To additional special dropzones are also supported: delete and success. These come with their own callback.
Note: While the additional dropzones can be used without the normal columns having callbacks, these callbacks are still included here for a better demo experience.

```js demo
export const additionalDropzonesPinboard = () => {
  const pinboard = createRef();

  function deleteFromColumn(data, column) {}

  function dataSuccess(data, column) {
    deleteFromColumn(data, column);
    console.log('success');
  }

  function addToColumn(data, column) {
    const currentCol = pinboard.value.columns.findIndex(elm => elm.value === column);
    pinboard.value.data[currentCol].push(data);
  }

  function removeFromColumn(data, column) {
    const currentCol = pinboard.value.columns.findIndex(elm => elm.value === column);
    pinboard.value.data[currentCol] = pinboard.value.data[currentCol].filter(elm => elm !== data);
  }

  return html`
    <owc-pinboard
      ${ref(pinboard)}
      id="additionalDropzonesPinboard"
      .columns=${[
        { label: 'First priority', value: 'prio1', onDrop: addToColumn, onLift: removeFromColumn },
        { label: 'Second priority', value: 'prio2', onDrop: addToColumn, onLift: removeFromColumn },
        { label: 'Third priority', value: 'prio3', onDrop: addToColumn, onLift: removeFromColumn },
      ]}
      .data=${[
        [
          { task: 'Throw out the trash', deadline: new Date('2024-01-01') },
          { task: 'Do the dishes', deadline: new Date('2024-02-01') },
        ],
        [{ task: 'Go grocery shopping', deadline: new Date('2024-01-14') }],
        [],
      ]}
      .fieldMapper=${{
        body: data => html`Do ${data.task} until ${data.deadline.toLocaleDateString()}`,
      }}
      .dropZones=${{ delete: { onDrop: deleteFromColumn }, success: { onDrop: dataSuccess } }}
    ></owc-pinboard>
  `;
};
```

## Dropzone Columns

To show what has succeeded or been deleted dropzones can also be passed data. This data is displayed in a column which is opened by clicking on the dropzone. Furthermore if the `liftable` property is set to true in the dropzone options, items can be lifted from these columns

```js demo
export const additionalDropzoneColumnsPinboard = () => {
  const pinboard = createRef();

  function deleteFromColumn(data, column) {
    pinboard.value.dropZones[column].data.push(data);
  }

  function dataSuccess(data, column) {
    deleteFromColumn(data, column);
    console.log('success');
  }

  function unSucceedOrDelete(data, column) {
    pinboard.value.dropZones[column].data = pinboard.value.dropZones[column].data.filter(
      elm => elm !== data,
    );
  }

  function addToColumn(data, column) {
    const currentCol = pinboard.value.columns.findIndex(elm => elm.value === column);
    pinboard.value.data[currentCol].push(data);
  }

  function removeFromColumn(data, column) {
    const currentCol = pinboard.value.columns.findIndex(elm => elm.value === column);
    pinboard.value.data[currentCol] = pinboard.value.data[currentCol].filter(elm => elm !== data);
  }

  return html`
    <owc-pinboard
      ${ref(pinboard)}
      id="additionalDropzonesPinboard"
      .columns=${[
        { label: 'First priority', value: 'prio1', onDrop: addToColumn, onLift: removeFromColumn },
        { label: 'Second priority', value: 'prio2', onDrop: addToColumn, onLift: removeFromColumn },
        { label: 'Third priority', value: 'prio3', onDrop: addToColumn, onLift: removeFromColumn },
      ]}
      .data=${[
        [
          { task: 'Throw out the trash', deadline: new Date('2024-01-01') },
          { task: 'Do the dishes', deadline: new Date('2024-02-01') },
        ],
        [{ task: 'Go grocery shopping', deadline: new Date('2024-01-14') }],
        [],
      ]}
      .fieldMapper=${{
        body: data => html`Do ${data.task} until ${data.deadline.toLocaleDateString()}`,
      }}
      .dropZones=${{
        delete: {
          data: [
            {
              task: "I've been deleted",
              deadline: new Date('2024-01-01'),
              canBeIgnored: false,
            },
          ],
          onDrop: deleteFromColumn,
          onLift: unSucceedOrDelete,
          liftable: true,
        },
        success: {
          data: [
            {
              task: "I've been done",
              deadline: new Date('2024-01-01'),
              canBeIgnored: false,
            },
          ],
          onDrop: dataSuccess,
          onLift: unSucceedOrDelete,
          liftable: true,
        },
      }}
    ></owc-pinboard>
  `;
};
```

## Drop validation

Wether or not a data item can be dropped in a specific column can be specified by the `.canDrop` function. If an item can't be dropped it a column it is greyed out as soon as it is lifted.

```js demo
export const dropValidationPinboard = () => {
  const pinboard = createRef();

  function addToColumn(data, column) {
    const currentCol = pinboard.value.columns.findIndex(elm => elm.value === column);
    pinboard.value.data[currentCol].push(data);
  }

  function removeFromColumn(data, column) {
    const currentCol = pinboard.value.columns.findIndex(elm => elm.value === column);
    pinboard.value.data[currentCol] = pinboard.value.data[currentCol].filter(elm => elm !== data);
  }
  return html`
    <owc-pinboard
      ${ref(pinboard)}
      id="dropValidationPinboard"
      .columns=${[
        { label: 'First priority', value: 'prio1', onDrop: addToColumn, onLift: removeFromColumn },
        { label: 'Second priority', value: 'prio2', onDrop: addToColumn, onLift: removeFromColumn },
        { label: 'Third priority', value: 'prio3', onDrop: addToColumn, onLift: removeFromColumn },
        { label: 'Ignore', value: 'ignore', onDrop: addToColumn, onLift: removeFromColumn },
      ]}
      .data=${[
        [
          { task: 'Throw out the trash', deadline: new Date('2024-01-01'), canBeIgnored: false },
          { task: 'Do the dishes', deadline: new Date('2024-02-01'), canBeIgnored: false },
        ],
        [{ task: 'Go grocery shopping', deadline: new Date('2024-01-14'), canBeIgnored: true }],
        [],
        [],
      ]}
      .fieldMapper=${{
        body: data => html`Do ${data.task} until ${data.deadline.toLocaleDateString()}`,
      }}
      .canDrop=${(data, column) => (column === 'ignore' ? data?.canBeIgnored : true)}
    ></owc-pinboard>
  `;
};
```

## API

### Attributes & properties

| Property      | Type                                    | Default      | Description                                                                              |
| ------------- | --------------------------------------- | ------------ | ---------------------------------------------------------------------------------------- |
| `columns`     | `{ label?, value, onDrop?, onLift? }[]` | `[]`         | The board columns; `onDrop`/`onLift` fire when a card is dropped into / dragged out.     |
| `data`        | `T[][]`                                 | `[]`         | Card data per column, index-aligned with `columns`.                                      |
| `fieldMapper` | `Fields<T>`                             | `{ body }`   | Maps a card to content: `body`, `header?`, `footer?`, `image?` (`{src, alt}`), `style?`. |
| `dropZones`   | `{ delete?, success? }`                 | `{}`         | Extra drop targets (`onDrop`, optional collapsible `data` list, `onLift`, `liftable`).   |
| `canDrop`     | `(data, column) => boolean`             | `() => true` | Columns that reject the dragged card are grayed out and refuse the drop.                 |
| `sorter`      | `(a, b) => number`                      | keep order   | Sort within each column (applied to a copy).                                             |
| `keyFunction` | `(data) => string`                      | `() => ''`   | Stable card key for the virtualizer.                                                     |
