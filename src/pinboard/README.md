# Pinboard

`<owc-pinboard>` is a kanban-style board: cards in columns, drag & drop
between columns with per-column `onDrop`/`onLift` callbacks, optional
delete/success drop zones, and a `canDrop` gate that grays out invalid
targets while dragging. Columns with 300 cards or more render only the
cards in and around their visible part, through the in-house
[virtualizer](../virtualizer/README.md).

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
  .fieldMapper=${{ header: c => c.title, body: c => c.summary }}
  .canDrop=${(card, column) => column !== 'done' || card.reviewed}
  .dropZones=${{ delete: { onDrop: removeCard } }}
></owc-pinboard>`;
```

## Docs & demos

See [OwcPinboard.rocket.md](./OwcPinboard.rocket.md) for live demos and the
API reference; published on the docs site under `/pinboard/`.

## Keyboard and focus

The board is one Tab stop, and the focus roves over its cards. The keys are listed for
users in the Keyboard section of the pinboard's docs; this section describes how the
code is laid out.

**Destinations.** A `Destination` is where a card can be and where it can go: a
column, or a dropzone. `#destinations` holds them as of the last render (built in
`willUpdate`): the columns from left to right, then the dropzones in the order they
show. A destination has the `name` that the hooks and `canDrop` get (the column's
`value`, the dropzone's key), its `label` (the column's `label`, else its `value`; the
localized name of a dropzone), its `cards` in the order they show, whether its list is
`open` and `liftable`, and its `onLift` and `onDrop`: the consumer's hook, else the
default. A dropzone that keeps no cards has no `listKey`. Everything that renders,
names, navigates or moves goes through this list.

**Moving a card.** `#moveCard(card, from, to)` is the one path for every move: it
awaits `from.onLift`, then `to.onDrop`, and renders. Dragging calls it from `#onDrop`,
pick-up mode from `#drop`, the Move to… menu from `#moveFromMenu`. It doesn't ask `canDrop`; whoever starts a move does, and
only about columns (`#canDropOn`), dragging too: a dropzone and its open list take every
card.

After the render, `#moveCard` says where the card is now ("Moved X to Done, 3 of 7",
without the position if the destination doesn't keep the card) and sees to the focus.
The focus goes along only if it was on the card when the move began (`#movingWithFocus`
is the remembered card of that moment) and is still on a card or held by a list. A
`focusin` on another card that the board didn't cause itself (`#restoringFocus`) means
the user went on, and the move leaves the focus alone, as it does when the focus left
the board. Otherwise `#rememberedPosition()` finds the card, and `#focusCard` scrolls
to it and focuses it. `#rememberedPosition()` looks for a card in its own list and in
the columns, not in the lists of dropzones: a card that went to a dropzone, or that a
hook removed, leaves the focus to the next card of the list it came from, else the
previous one, else that list.

**Pick-up mode.** `#pickedUp` is the card that Space picked up: what identifies it, and
as of the last render (`#refreshPickedUp` in `willUpdate`) its object, the destination
it is in (`from`) and the destination it would go to (`to`, which starts as `from`).
`#handlePickUpKey` is the first of the `#cardKeyHandlers`: without a picked-up card it
only takes Space; with one, ← and → step through `#destinations` (`#stepTo`), Space and
Enter drop (`#drop`), Escape and Tab cancel (`#cancelPickUp`), and ↑, ↓, Home and End
do nothing. A drop where the card came from cancels, a drop on a column that can't take
the card says so again and keeps the card picked up. `#pickUp` refuses a card of a list
that isn't `liftable` and says so.

The focus stays on the card all the while. Pick-up mode ends when the focus goes
anywhere else (`#handleBoardFocusin`, `#handleBoardFocusout`) or a drag starts, but not
when the card's list holds the focus for it, and not when a render replaces the card's
element, since `updated` gives the focus back. `#dropCues` renders the classes that
dragging sets with `classList`: `cannot-drop` on every column that can't take the card,
`drop-hover` on `to` (the button of a dropzone, not its list). Every step is announced.
`#cardName` is what announcements call a card: `cardLabel`, else the text of its
`owc-card`, for which a card that isn't rendered is rendered aside.

**Roles.** Every list of cards (`.card-list`) is a `list`, named by its destination's
`label`: a column's list, and the list of a dropzone inside its `wa-details`. A card's
`.column-item` is the `listitem`, with `aria-posinset` and `aria-setsize` from the
whole list, since a long list renders only part of its cards. It is named by
`cardLabel`, else by its `owc-card` (`aria-labelledby`), which is the text the card
shows. A dropzone is a `<button>` that is named by a localization term. If it keeps
cards, it has `aria-expanded` and `aria-controls` and opens and closes its list; the
`wa-details` has its own summary hidden. `#openDropzones` follows the `wa-show` and
`wa-hide` events, so it is right whoever opens a list.

**Focus model.** The focus is on a card's `.column-item`, which shows the focus ring on
its card. What the board remembers is a card, never an element: `#remembered` has what
identifies the card (`getCardId`, else its object), and its list and index, which tell
its neighbours once it is gone. `#rememberedPosition()` finds the card again, in its
list first, then in the columns; if it is gone, or in the list of a dropzone now, it
remembers the card that took its place instead, or the last card of the list. A
`CardPosition` (`{ list, index }`) is
how the code refers to a card: `list` is a destination's `listKey`, `index` counts in
its `cards`. `#itemAt` and `#positionOf` translate between positions and rendered
items through `aria-posinset`.

- Every `.column-item` has `tabindex="-1"`, and one element of the board has
  `tabindex="0"`: the card that has the focus, else the remembered card, else the first
  card of the first list that has cards. `#updateTabStop` sees to that after every
  render and when the focus leaves the board.
- Controls in cards never are Tab stops: after every render, `keepOutOfTabOrder` puts
  `tabindex="-1"` on the controls and custom elements in `.column-card`. Controls that
  render later than the board stay Tab stops until the board renders again.
  Control discovery and Tab suppression share the traversal of open shadow roots and
  assigned slots. Interaction mode reaches internal and slotted controls in composed
  order, including nested slots, without adding them to the page's Tab order.
- A list element (`.card-list`) is always rendered, so it stands in for a card that
  isn't. It **holds the focus** (`#focusHolder`) while the virtualizer brings a card in,
  when the focused card scrolls out of the rendered cards, and when a list lost its last
  card. It is the Tab stop while the remembered card isn't rendered, and moves the focus
  on to that card when Tab reaches it. A list is focusable only in these cases.
- `willUpdate` notes the card that has the focus. If the render removed its element,
  `updated` gives the focus back (`#restoreFocus`): to the remembered card, in whichever
  column it is now, else to its list. This never scrolls or announces, and it only
  happens when the focus was on a card, so the board never takes the focus from
  elsewhere. It is also what keeps the focus on a card that moves to another column.
- `#focusCard(position)` moves the focus to a card. If the card isn't rendered, its list
  holds the focus, the list's virtualizer scrolls to it (`scrollToIndex`), and
  `#pendingPosition` lets the next key go on from there. It gives up when the focus left
  the cards meanwhile.

**Keys.** One `keydown` listener on `.main-container`, `#handleBoardKeydown`. A key
from a control inside a card belongs to interaction mode (`#handleInteractionKey`, with
`handleInteractionKey` of the [a11y helpers](../a11y/README.md), as the table's): Tab
and Shift+Tab cycle through the card's controls, Escape returns to the card, and every
other key is the control's. A key pressed on a card itself, or on a list that holds the
focus, goes through `#cardKeyHandlers`: functions that get a `CardKeyPress`
(`{ key, event, item }`, with the key named by `keyName`, like `Shift+F10`) and return
true once they have handled it, which also prevents the default. They are tried in
order; a mode that changes what the arrow keys do goes in front of `#navigate`.
`item` is undefined while a list holds the focus. Keys of the dropzone buttons never
get there. The handlers are, in order: pick-up mode, interaction mode, navigation, the
Move to… menu.

← and → go to the card at the same index of the next list that has cards, or to its
last card, and treat every open dropzone list as one more column. Lists without cards
are skipped.

**Interaction mode** starts when the focus arrives on a control in a card: from Enter
or F2 (`#enterInteractionMode` focuses the card's first control) or from a pointer. The
live region then says how to leave.

**Move to… menu.** Every card that can be moved has a Move to… button
(`.move-button`): a card in a column, or in the list of a `liftable` dropzone, on a
board that has more than one destination. It is the way to move a card with single
clicks, and the way for screen reader users in browse mode.

- The button is a child of the card's `.column-item`, next to the `owc-card`, so it
  isn't part of the card's name. It is named "Move to…" plus the card's name: by
  `cardLabel`, else through `aria-labelledby` itself and the `owc-card`.
- It is no Tab stop (`tabindex="-1"`). Interaction mode reaches it after the card's own
  controls, since `controlsIn` finds it in the item.
- It is hidden with `opacity: 0` only, and shows while the pointer is over its card,
  while the focus is in its card, while its menu is open, and always where there is no
  hover (`@media (hover: none)`).
- **One menu for the whole board.** A `wa-dropdown` per card made a board of 1200 cards
  about four times slower to render, so only the card whose menu is open renders one
  (`#moveMenu` has the card's identity and the menu's items). The dropdown is rendered
  `open`, next to the button, and its trigger is an empty `.move-menu-anchor` that lies
  where the button is. So the board does what a dropdown does for its trigger otherwise:
  the click on the button (`#onMoveButtonClick`), `aria-expanded`, and giving the focus
  back when the menu closes (`#takeFocusFromMoveMenu`).
- The items are every destination except the one the card is in, as of the moment the
  menu opens. `canDrop` is asked then, about columns only (`#canDropOn`); columns it rejects
  are `disabled` items.
- Shift+F10 and the context-menu key open the menu from the card (`#openMoveMenu`, the
  last of `#cardKeyHandlers`). Closing such a menu returns to the card, any other to the
  button.
- An open menu handles its keys in a `document` listener of its own, which runs after
  the board's, so `#handleInteractionKey` leaves every key alone while the card's menu
  is open. Its `wa-*` events are stopped at the dropdown (`#stopPropagation`): they are
  composed and would look like events of the board.
- Choosing an item (`#moveFromMenu`) puts the focus back in the card first, since
  `#moveCard` only takes the focus along if it is there, removes the menu with a render
  of its own, and then calls `#moveCard`. So the menu's state doesn't follow the card to
  its new list, and the menu causes no render between the lift hook and the drop hook.
- The menu goes when its card isn't rendered anymore (`updated`), and doesn't come back
  with the card.

The controls of cards, the live region and `keyName` come from the private
[a11y helpers](../a11y/README.md), which the table uses too.

## Files

- [OwcPinboard.js](./OwcPinboard.js) - the component
- [OwcPinboard.test-browser.js](./OwcPinboard.test-browser.js) - browser tests of rendering, dragging and virtualization (`npx web-test-runner src/pinboard/OwcPinboard.test-browser.js`)
- [OwcPinboard.keyboard.test-browser.js](./OwcPinboard.keyboard.test-browser.js) - browser tests of the roles, the card focus and the dropzone buttons, with real key presses
- [OwcPinboard.pickUp.test-browser.js](./OwcPinboard.pickUp.test-browser.js) - browser tests of pick-up mode, and of the focus and the announcement after a move
- [OwcPinboard.moveMenu.test-browser.js](./OwcPinboard.moveMenu.test-browser.js) - browser tests of the Move to… button and its menu, with real clicks and key presses
- [OwcPinboard.axe.test-browser.js](./OwcPinboard.axe.test-browser.js) - axe over the board by default, with dropzone lists open, during pick-up and with the Move to… menu open
- [OwcPinboard.test-browser.helpers.js](./OwcPinboard.test-browser.helpers.js) - what keyboard tests share: a board between two buttons, pressing keys, and telling where the focus is
