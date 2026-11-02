```js server
export const config = {
  path: '/data/pinboard',
  title: 'Pinboard',
  menu: {
    parent: '/data',
    order: 80,
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
import '@open-wc/components/define/owc-pinboard.js';
```

# Pinboard

A table with cards in columns akin to a scrumboard, with options for moving data between columns, deleting items, sorting and validation.

Moving cards between columns (and into/out of the delete/success dropzones) works out of the box — you don't need to write any code to make `<owc-pinboard>` usable. `onDrop`/`onLift` callbacks are only needed if you want to hook into or override that default behavior.

## Minimal

The `<owc-pinboard>` element is driven by the `.columns`, `.data` and `.fieldMapper` properties.
Specify the pinboard's `.columns` in an array with `label` and `value` properties. While `label` is displayed in the columns header, `value` is used to identify the column internally.
The data displayed in the table is passed in via the `.data` attribute which is an array of columns each containing an array with data. The order of these arrays should correspond to the order specified in `.columns`.
The `.fieldMapper` attribute specifies how the data is displayed. It should contain some or all of the following properties: `header`, `body`, `footer`. These are all formatters mapping from data to html and correspond to their respective fields of the data cards.

Try dragging a card between columns below — the data moves automatically, no `onDrop`/`onLift` required.

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

You can make the data cards become sorted by specifying a sorter in the `.sorter` attribute. By default cards are sorted in the same order as defined in the `.data` array.
Note the order in the first column is now descending order by date.

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

## Additional dropzones

Two additional special dropzones are also supported: `delete` and `success`. Opting a column into one just means adding its key to `.dropZones` — even as an empty object. By default, dropping a card there simply removes it from the board.

```js demo
export const additionalDropzonesPinboard = () => {
  return html`
    <owc-pinboard
      id="additionalDropzonesPinboard"
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
      .dropZones=${{ delete: {}, success: {} }}
    ></owc-pinboard>
  `;
};
```

## Dropzone Columns

To keep track of what has succeeded or been deleted instead of discarding it, give the dropzone a `data` array. This opens a collapsible column, shown by clicking on the dropzone icon. If `liftable` is set to `true`, items can be dragged back out of it.

```js demo
export const additionalDropzoneColumnsPinboard = () => {
  return html`
    <owc-pinboard
      id="additionalDropzoneColumnsPinboard"
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
      .dropZones=${{
        delete: { data: [], liftable: true },
        success: { data: [], liftable: true },
      }}
    ></owc-pinboard>
  `;
};
```

## Drop validation

Whether or not a data item can be dropped in a specific column can be specified by the `.canDrop` function. If an item can't be dropped in a column it is greyed out as soon as it is lifted.

```js demo
export const dropValidationPinboard = () => {
  return html`
    <owc-pinboard
      id="dropValidationPinboard"
      .columns=${[
        { label: 'First priority', value: 'prio1' },
        { label: 'Second priority', value: 'prio2' },
        { label: 'Third priority', value: 'prio3' },
        { label: 'Ignore', value: 'ignore' },
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

## Overriding default behavior

Every `onDrop`/`onLift` — on a column or on a dropzone — receives the default action as its third argument. That means you don't have to reimplement moving data yourself: call the default action whenever you want (before, after, conditionally), or skip it entirely to fully replace the behavior.

```js demo
export const overridingDefaultsPinboard = () => {
  return html`
    <owc-pinboard
      id="overridingDefaultsPinboard"
      .columns=${[
        { label: 'First priority', value: 'prio1' },
        { label: 'Second priority', value: 'prio2' },
        {
          label: 'Ignore',
          value: 'ignore',
          onDrop: (data, column, defaultDrop) => {
            defaultDrop(data, column);
            console.log(`${data.task} was moved into "${column}"`);
          },
        },
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

The same third-argument pattern applies to `onLift`, and to `dropZones.delete`/`dropZones.success`.

## Kitchen sink

A demo of a list of chores using most of the component's features together: dropzones with visible lists, drop validation, and one column overriding the default drop behavior to add logging.

```js demo
export const kitchenSinkPinboard = () => {
  return html`
    <owc-pinboard
      id="kitchenSinkPinboard"
      .columns=${[
        { label: 'First priority', value: 'prio1' },
        { label: 'Second priority', value: 'prio2' },
        { label: 'Third priority', value: 'prio3' },
        {
          label: 'Ignore',
          value: 'ignore',
          onDrop: (data, column, defaultDrop) => {
            defaultDrop(data, column);
            console.log(`ignored: ${data.task}`);
          },
        },
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
          liftable: true,
        },
      }}
    ></owc-pinboard>
  `;
};
```

## Large boards

A column with 300 cards or more renders only the cards in and around its visible part, so boards with thousands of cards per column stay fast. The same applies to a dropzone list. Columns are virtualized one by one: a short column next to a long one still renders every card. `virtualizer-mode="always"` does this for any number of cards, and `virtualizer-mode="never"` always renders every card.

Cards that aren't rendered aren't part of the page, so the browser's find-in-page doesn't find them, and printing leaves them out.

The board below has 2,000 cards in its first column and 300 in its second. The third column has 20 cards and renders all of them.

```js demo
export const largePinboard = () => {
  /** @param {string} label @param {number} count */
  const tasks = (label, count) =>
    Array.from({ length: count }, (_, index) => ({
      title: `${label} #${index + 1}`,
      lines: (index % 4) + 1,
    }));
  return html`
    <div style="height: 500px; overflow: auto">
      <owc-pinboard
        .columns=${[
          { label: 'Backlog', value: 'backlog' },
          { label: 'In progress', value: 'progress' },
          { label: 'Done', value: 'done' },
        ]}
        .data=${[tasks('Backlog', 2000), tasks('In progress', 300), tasks('Done', 20)]}
        .fieldMapper=${{
          header: data => data.title,
          body: data => 'A card with some text. '.repeat(data.lines * 2),
        }}
      ></owc-pinboard>
    </div>
  `;
};
```

Cards are keyed by their object, and a column is sorted again only when its array or the `sorter` changes. When a change to a card affects its sort position, assign a new array for its column.

## API

### Attributes & properties

| Property                               | Type                                    | Default      | Description                                                                                                                                                                                                                                                                                    |
| -------------------------------------- | --------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `columns`                              | `{ label?, value, onDrop?, onLift? }[]` | `[]`         | The board columns. `onDrop`/`onLift` are optional — by default a card is moved into/out of the column automatically. Supplying one receives `(data, column, defaultAction)` and can call `defaultAction` itself to opt into, delay, or skip the default move.                                  |
| `data`                                 | `T[][]`                                 | `[]`         | Card data per column, index-aligned with `columns`.                                                                                                                                                                                                                                            |
| `fieldMapper`                          | `Fields<T>`                             | `{ body }`   | Maps a card to content: `body`, `header?`, `footer?`, `image?` (`{src, alt}`), `style?`.                                                                                                                                                                                                       |
| `dropZones`                            | `{ delete?, success? }`                 | `{}`         | Extra drop targets. Adding a key (even `{}`) opts cards into that target with default remove-from-board behavior; add `data: []` to also keep a reopenable, `liftable`-configurable list. `onDrop`/`onLift` are optional overrides, same `(data, column, defaultAction)` signature as columns. |
| `canDrop`                              | `(data, column) => boolean`             | `() => true` | Columns that reject the dragged card are grayed out and refuse the drop.                                                                                                                                                                                                                       |
| `sorter`                               | `(a, b) => number`                      | keep order   | Sort within each column (applied to a copy). A column is sorted again when its array or the sorter changes.                                                                                                                                                                                    |
| `virtualizerMode` (`virtualizer-mode`) | `'auto' \| 'always' \| 'never'`         | `'auto'`     | Render only the cards in and around the visible part of a column: from 300 cards on (`auto`), always, or never. See [Large boards](#large-boards).                                                                                                                                             |
