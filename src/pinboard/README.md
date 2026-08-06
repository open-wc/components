# Pinboard

`<owc-pinboard>` is a kanban-style board: cards in columns, drag & drop
between columns with per-column `onDrop`/`onLift` callbacks, optional
delete/success drop zones, and a `canDrop` gate that grays out invalid
targets while dragging. Columns are virtualized for large card counts.

## Usage

```js
import '@open-wc/components/define/owc-pinboard.js';
```

```js
html`<owc-pinboard
  .columns=${[
    { label: 'Todo', value: 'todo', onDrop: moveTo('todo'), onLift: liftFrom('todo') },
    { label: 'Done', value: 'done', onDrop: moveTo('done'), onLift: liftFrom('done') },
  ]}
  .data=${[todoCards, doneCards]}
  .keyFunction=${card => card.id}
  .fieldMapper=${{ header: c => c.title, body: c => c.summary }}
  .canDrop=${(card, column) => column !== 'done' || card.reviewed}
  .dropZones=${{ delete: { onDrop: removeCard } }}
></owc-pinboard>`;
```

## Docs & demos

See [OwcPinboard.rocket.md](./OwcPinboard.rocket.md) for live demos and the
API reference; published on the docs site under `/pinboard/`.

## Virtualized card lists

Small card lists render normally. Larger columns and populated drop-zone lists
use bounded virtualized rendering; the threshold is private implementation
policy, not a consumer setting. Window scrolling is the default. Set the
additive `scrollTarget` property to the exact application-shell element that
owns vertical scrolling; the pinboard does not infer a scrolling ancestor.

Card heights are measured after rendering so variable card content can reflow
without overlapping following cards. Virtualization is an implementation detail
and does not change the `keyFunction`, sorting, or drag-and-drop contracts.

## Files

- [OwcPinboard.js](./OwcPinboard.js) - the component
- [OwcPinboard.test-browser.js](./OwcPinboard.test-browser.js) - browser tests (`npx web-test-runner src/pinboard/OwcPinboard.test-browser.js`)
