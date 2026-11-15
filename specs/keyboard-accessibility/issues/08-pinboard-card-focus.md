# 08: Pinboard card focus and dropzone buttons

Status: resolved

**What to build:** columns and open dropzone lists are named lists of cards with `aria-setsize`/`aria-posinset`. The board is one Tab stop with roving card focus (↑/↓, ←/→, Home/End), cards have interaction mode (Enter/F2, Escape), and focus survives virtualization by card identity. Dropzones become buttons. Adds `cardLabel` and `getCardId`.

Spec: [P1, P2, P5, F1–F3, S1–S3](../spec.md#pinboard).

**Blocked by:** 01 (only for the live region helper it adds).

- [x] List semantics and names: a column is named by its `label`, else its `value`; a dropzone list like its dropzone button; cards by `cardLabel`.
- [x] Roving focus keys per P2, also across virtualized columns of 1000 cards, and into the cards of an open dropzone list.
- [x] Controls in card templates aren't Tab stops; Enter/F2 enter interaction mode with an Escape hint; Escape returns.
- [x] Focus parks on the column list and restores by `getCardId` or object identity (F1–F3).
- [x] Dropzones are buttons with `aria-expanded`/`aria-controls` when they have a list, toggled by Enter/Space.
- [x] Visible focus indicator on cards and dropzones (S3).

## Comments

### What was built (2026-11-15)

The model is described in `src/pinboard/README.md`, "Keyboard and focus". Tests: `src/pinboard/OwcPinboard.keyboard.test-browser.js` (real key presses, one axe check of the default board with a closed and an open dropzone list).

Decisions the spec left open:

- **"Nearest position" for ←/→ is the same index**, or the last card of a shorter list. Lists without cards are skipped. Not the card that is nearest on screen.
- **Without `cardLabel`, a card's item is named through `aria-labelledby` its `owc-card`**, so the name is the text the card shows, computed by the browser. `cardLabel` sets `aria-label`. The Move to… button (10) should stay outside `owc-card`, or it becomes part of every card's name.
- **A parked list shows a focus ring** (`.card-list:focus-visible`): it is where the focus is when a column lost its last card.
- **A navigation key on a parked list brings the remembered card back and doesn't move on from it.** On a list without cards, ← and → move on to the neighbouring lists.
- **The focus follows a card to another list on its own** when a render moves it there: `#restoreFocus` finds the remembered card by identity in every list. That already covers a card dragged to another column (the pointer put the focus on it), without scrolling.
- Dropzone names: `pinboardDropzoneSuccess` ("Done" / "Erledigt"), `pinboardDropzoneDelete` ("Delete" / "Löschen"). The interaction hint is `pinboardInteractionHint`.
- `keyName` is new in `src/a11y/keys.js` (added, nothing existing changed). It is the same function as the table's `gridKey`.
- The sticky column header never covers the focused card: items have a `scroll-margin-top` of one line plus the header's padding. A header whose label wraps to several lines is taller than that.

Not verified: the look of the focus ring and of the dropzone buttons in the docs site (the tests check the computed outline and that the button has the size the `div` had), and screen readers (C3).

### For 09 (pick-up mode) and 10 (Move to… menu)

Both tickets touch `OwcPinboard.js`. To keep the two branches mergeable:

- **Keys:** add one function to `#cardKeyHandlers`, don't edit `#handleBoardKeydown`. 09 puts its handler **first** in the array (while a card is picked up, it has to see ←/→, Enter, Escape and Tab before `#navigate` and `#enterInteractionMode`; Space starts it). 10 puts its handler **last** (Shift+F10, ContextMenu). A handler gets `{ key, event, item }` and returns true when it handled the key (the default is then prevented). `item` is undefined while a list holds the focus; `key` comes from `keyName` (`Space`, `Shift+F10`, `ContextMenu`).
- **Destinations:** `this.#destinations` is the list P3 and P4 step through: columns left to right, then dropzones in the order they show, each with `kind`, `name`, `label`, `cards`, `open`, `liftable`, `onLift`, `onDrop`. The destination a card is in: `this.#destinations.find(d => d.listKey === position.list)`. Ask `canDrop(card, destination.name)` only where `destination.kind === 'column'`.
- **Moving:** `await this.#moveCard(card, from, to)` runs the lift hook, then the drop hook, and requests the render; the drag path uses it. P6 (focus and announcement after the move) belongs in or right after it, in one place for all three ways to move. After `await this.updateComplete`, `#restoreFocus` has already put the focus on the card in its new list if it is rendered there, on that list if it isn't, and on the next or previous card of the old list (else the old list) if the card is in no open list anymore. What is left for P6 is scrolling the card in, `void this.#focusCard(this.#rememberedPosition())`, which gives up on its own when the focus left the cards (F3), and the announcement. "3 of 7" is the position's `index + 1` of `cards.length` after the render.
- **A card's name for announcements** is not there yet, both tickets need it: `this.cardLabel?.(card)`, else the collapsed `textContent` of the card's `owc-card`. Whoever lands second reuses the other's helper.
- **A card's data and position:** `#positionOf(item)` gives `{ list, index }`, the card is `this.#list(position.list).cards[position.index]`.
- **Announcements:** `this.#liveRegion.announce(this.#localize.term('pinboard…'))`. Keep the `pinboard…` terms alphabetical in `en.js`, `de.js` and the copy in `localization.rocket.md`, so two branches don't append at the same line.
- **Drag cues from state (09):** `.drop-hover` and `.cannot-drop` are still set with `classList` by the drag code, on elements whose `class` Lit renders. `#renderList` and `#renderDropzone` get the destination, so a pick-up state can render both classes there.
- **The Move to… button (10)** is found by interaction mode when it is inside the card's `.column-item` (`controlsIn(item)`), and Tab cycles through it. `keepOutOfTabOrder` only covers `.column-card` (`CARD_CONTENT`), so a button next to the `owc-card` needs `tabindex="-1"` itself (on the host, for `wa-dropdown`/`wa-button`), or `CARD_CONTENT` has to select its container too. The list element may only contain `.column-item`s (the virtualizer counts its children), so the button goes inside the item.
- **Focus leaving the card (09, "focus leaving the card cancels"):** `#handleBoardFocusin` and `#handleBoardFocusout` are the places. Note that `#handleBoardFocusout` returns early while an update removes the focused card; `updated` gives the focus back.
- **Tests:** `src/pinboard/OwcPinboard.test-browser.helpers.js` has `boardFixture` (takes `canDrop`, `dropZones`, `cardLabel`, `getCardId`, `lang`, a scroll box), `focusedBoard`, `press`, `pressAll`, `focusAt`, `focusArrivesAt`, `announces`, `liveRegion`, `dropzone` and `dropzoneSettled`. It is type-checked. A new suite per ticket (`OwcPinboard.pickUp.test-browser.js`, `OwcPinboard.moveMenu.test-browser.js`) keeps the two branches from appending to the same file.
