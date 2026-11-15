# 09: Pinboard pick-up mode

Status: resolved

**What to build:** Space picks up the focused card; ←/→ step through columns and dropzones with the drag cues; Space or Enter drops, Escape, Tab or blur cancel. `canDrop` is respected and announced. Every step is announced in the live region. After the drop, focus follows the card or moves to its neighbour, without stealing focus back.

Spec: [P3, P6, F3](../spec.md#pinboard).

**Blocked by:** 08.

- [x] Pick-up, each destination, drop and cancel are announced with localized strings.
- [x] Non-droppable columns are reachable, marked `.cannot-drop`, and dropping there does nothing. `canDrop` is never asked about dropzones: a `canDrop` that returns false for every unknown name still allows a keyboard drop on Delete.
- [x] A card in a `liftable` dropzone list can be picked up, starting from its dropzone; in a list that isn't `liftable`, Space announces that the card can't be moved.
- [x] The lift and drop hooks run in the same order and with the same arguments as a drag, awaited.
- [x] After a move, focus is on the card in its new column; after a dropzone drop, with or without a dropzone list, on the next card of the list it came from (else previous, else the list).
- [x] If focus left the board while async hooks ran, it stays there.

## Comments

### What was built (2026-11-15)

The model is described in `src/pinboard/README.md`, "Keyboard and focus" ("Moving a card" and "Pick-up mode"). Tests: `src/pinboard/OwcPinboard.pickUp.test-browser.js` (real key presses; drags are synthetic `DragEvent`s, as in the existing suite).

New terms, in `en`, `de` and the copy in `localization.rocket.md`, alphabetical among the `pinboard…` terms: `pinboardCannotDrop`, `pinboardCannotMove`, `pinboardDestination`, `pinboardMoveCancelled`, `pinboardMoved`, `pinboardPickedUp`.

### To decide: `canDrop` and an open dropzone list when dragging

The spec (P3) says `canDrop` is asked about columns only, "as with dragging". Dragging doesn't quite do that today: `#onDragMove` asks `canDrop(card, 'delete')` (or `'success'`) when a card is dragged over the **open list** of a dropzone, and refuses the drop if it returns false. Only the dropzone's button never asks. So with a `canDrop` that returns false for every name it doesn't know, a card can be dragged onto the Delete button but not onto the open Delete list.

The keyboard follows the spec: `#takes` never asks `canDrop` about a dropzone. The drag behaviour is unchanged. Either the drag should stop asking for dropzone lists (then P3's "as with dragging" is true), or the spec should say that the keyboard differs.

**Done in the keyboard-accessibility review (2026-11-15):** the drag follows the spec now. `#onDragMove` and `#showNonDropColsDisabled` decide through `#takes` too, so `canDrop` is asked about columns only, and the open list of a dropzone takes every dragged card, as its button does. Test: "is not asked about the open list of a dropzone that a card is dragged onto either" in `OwcPinboard.pickUp.test-browser.js`. It is a Consumer-Visible Change, listed in the changeset's migration notes ("`canDrop` and dropzones"), and in a commit of its own (`fix(pinboard): dragging onto an open dropzone list doesn't ask canDrop …`) so it can be reverted alone.

### Decisions the spec left open

- **A drop where the card came from cancels**: Space or Enter without a step (or after stepping back) says "Move cancelled" and runs no hook, as dragging a card onto its own column does nothing. This also holds for a card of a dropzone list on its own dropzone (a drag onto the dropzone's button runs the hooks there).
- **↑, ↓, Home and End do nothing while a card is picked up.** They would move the focus off the card, which cancels. Every other key that moves the focus still cancels: Tab, F2 into the card's controls, a click elsewhere.
- **← and → stop at the first and the last destination** and say it again; they don't wrap.
- **A column that can't take the card shows `.cannot-drop` and no drop-hover shadow** while it is the current destination, as dragging over it shows none. `canDrop` is also asked about the card's own column, as dragging does.
- **A dropzone shows the drop-hover on its button**, also while its list is open. The announcement has the number of cards if the dropzone keeps cards ("Done, 3 cards"), else only the name ("Delete").
- **The focus never follows a card into the list of a dropzone**, open or not (P6). That is now a rule of `#rememberedPosition()` and so also holds when a consumer's render moves the focused card there. 08 had the focus follow the card into every list.
- **"Focus left the board" (F3) also covers going on to another card** while the hooks run: the focus then stays on that card. The move still announces its result.
- **Pick-up mode survives a render**, also one that replaces every card object, if `getCardId` is set: the picked-up card is found again by its id in `willUpdate`. If no list shows the card anymore, the move is cancelled. It also survives the card scrolling out of the rendered cards (its list holds the focus; ←/→, Space and Escape keep working there).
- **Starting a drag cancels pick-up mode.**
- **P6 applies to drags too**: a dragged card that had the focus is scrolled to in its new column, and every drag is announced ("Moved X to Done, 3 of 7").
- **The announcement trusts the hooks**: after them and the render it says "Moved X to Done", with the position only if the card is in the destination's cards. A hook that vetoes the move without the board knowing still gets "Moved X to Done".
- **A card's name without `cardLabel`** is the collapsed text of its `owc-card`. A card that isn't rendered (its list holds the focus) is rendered into a detached element for it.

### Not done, not verified

- **The current destination isn't scrolled into view.** On a board that is wider than its scroll box, the drop-hover shadow can be out of sight while ← and → step. The announcement still says where the card would go. Scrolling a column in horizontally without scrolling the page vertically needs more than `scrollIntoView`, and the spec doesn't ask for it.
- ~~A held Space key repeats: it picks up, cancels and picks up again.~~ Fixed in the keyboard-accessibility review: a repeated Space (and a repeated Enter while a card is picked up) does nothing.
- Screen readers (C3) and the look of the cues in the docs site weren't checked; the tests check the classes, the focus and the text of the live region.
- The public docs (`OwcPinboard.rocket.md`) don't describe the keys yet (ticket 11).

### For 10 (Move to… menu)

- The entry point is `async #moveCard(card, from, to)`: `card` is the card's data, `from` and `to` are `Destination`s of `#destinations` (`from` is the one whose `listKey` is the card's list). It awaits the hooks and the render, announces, and sees to the focus; nothing to do after it. It doesn't ask `canDrop`: `#takes(destination, card)` does, and is true for every dropzone.
- The focus goes along if it is in the card when `#moveCard` is called (anywhere inside the card's `.column-item` counts, so also a menu inside it). If the menu is rendered outside the item, give the focus back to the card before calling it.
- `#cardName(data)` exists. `#isSame(a, b)` compares destinations of different renders, `#cardOf(item)` gives an item's card.
- Opening the menu moves the focus off the card, which cancels pick-up mode; nothing to do for that.

### 2026-11-15: fixes from the keyboard-accessibility review

- **F2 and Shift+F10 on a picked-up card say both messages**: "Move cancelled" and the interaction hint as one message ("Move cancelled Press Escape to return to the card"). The hint used to replace the cancel within the live region's debounce. `#handleBoardFocusin` collects its messages and says them together (`#announceAll`, as the table does); `#putBack()` puts the card back without saying so, `#cancelPickUp()` still says it.
- **A held Space picks up once**: keydowns with `event.repeat` don't pick up, drop or cancel (Enter neither while a card is picked up).
