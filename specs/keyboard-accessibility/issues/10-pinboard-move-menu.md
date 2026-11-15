# 10: Pinboard Move to… menu

Status: resolved

**What to build:** every card has a Move to… button that opens a `wa-dropdown` with every destination except the current column; non-droppable ones are disabled. One click moves the card (SC 2.5.7). Shift+F10 or the context-menu key opens it from a focused card. Moves go through the same path as P6.

Spec: [P4, P6](../spec.md#pinboard).

**Blocked by:** 08.

- [x] The button shows on hover and focus, always on touch, and is reachable in the card's interaction mode. While it isn't shown it stays in the accessibility tree (no `display: none`).
- [x] Cards in a dropzone list have the button only if the dropzone is `liftable`.
- [x] The menu is keyboard-operable, lists every destination except the card's current column or dropzone, and disables columns where `canDrop` is false. Dropzones are never disabled.
- [x] Choosing a destination moves the card with the same hooks and focus result as pick-up mode.

## Comments

### What was built (2026-11-15)

The model is described in `src/pinboard/README.md`, "Keyboard and focus" ("Move to… menu"). Tests: `src/pinboard/OwcPinboard.moveMenu.test-browser.js` (real clicks with `sendMouse`, real key presses, one axe check with a menu open). New term, in `en`, `de` and the copy in `localization.rocket.md`: `pinboardMoveTo` ("Move to…" / "Verschieben nach…").

"Always on touch" is tested by reading the styles: the test browser has a pointer that hovers, so the test looks for the `@media (hover: none)` rule that shows the button. It was not tried on a touch screen.

### One `wa-dropdown` for the board, not one per card

The first version gave every card its own `wa-dropdown` with the button as its trigger, as the settings do for every column (07). On a board of 4 columns with 299 cards each (the most a board renders without virtualizing), measured in the test browser against the board without buttons:

| | first render | layout and paint (two frames) | render again |
| --- | --- | --- | --- |
| no buttons (before) | 22–35ms | 17–33ms | 3–5ms |
| a `wa-dropdown` and a `wa-icon` per card | 131–153ms | 74–75ms | 15ms |
| a button per card, one `wa-dropdown` (now) | 30–37ms | 41–49ms | 5–6ms |

So every card renders a plain `<button>`, and only the card whose menu is open renders a `wa-dropdown`, already `open`, next to the button. What follows from that:

- **The dropdown's trigger is an empty `span`** (`.move-menu-anchor`, `aria-hidden`, no pointer events) that lies where the button is, so the menu opens at the button. The dropdown puts `aria-haspopup` and `aria-expanded` on it, which nobody reads; the button has its own.
- **The board does what a dropdown does for its trigger**: the click that opens and closes, `aria-expanded`, and giving the focus back when the menu closes, since `trigger.focus()` on the span does nothing.
- **The button's icon is an inline SVG arrow**, not a `wa-icon`: that is one custom element per card less. Looking the term up once per render instead of once per card took the re-render from 15ms to 5ms (`term` walks up the ancestors for `lang`).

### Decisions the spec left open

- **The button's name is "Move to…" plus the card's name**: "Move to… Buy milk". With `cardLabel` it is an `aria-label`; without, `aria-labelledby` lists the button itself and the card's `owc-card`, so the browser computes it from the text the card shows, as it does for the card's list item. `#cardName` isn't used for it: at the first render there is no text to read yet.
- **A board with only one destination has no buttons**: one column and no dropzones leaves nowhere to move a card to.
- **`canDrop` is asked when the menu opens**, once per column, not while the board renders.
- **Shift+F10 and the context-menu key move the focus to the button first**, then the menu opens and focuses its first item. So the keys pressed while the menu opens are the menu's, not the roving focus's. Escape then returns to the card. A menu that was opened from its button returns to the button, and Escape again to the card.
- **Tab closes the menu and leaves the board**, forwards and backwards, as Tab does from a card. An open menu gets all of its keys: the board's interaction mode doesn't cycle through the card's controls meanwhile.
- **A card that is picked up**: Shift+F10 opens its menu, and the focus going to the menu puts the card back (09).
- **Choosing an item removes the menu at once**, without the closing animation: its state must not follow the card to its new list. The move starts after that render, so the menu causes no render between the lift hook and the drop hook.
- **A click on the button of an open menu closes it**; one menu is open at a time.
- **The menu doesn't survive its card leaving the rendered cards** (a long column that scrolls): it is gone when the card comes back.
- Two tests of 08 changed, since the button is a control of every card now: Tab in interaction mode also stops at the Move to… button, and "is not entered on a card without controls" uses a board with one column.
- `focusAt` in the test helpers calls the button `menu button` and an item `menu item Doing`.

### The last box: same hooks and focus result as pick-up mode

Finished on top of 09 (`a65f1b1`). The menu calls `#moveCard`, as dragging and pick-up mode do, after it gave the focus back to the card's item (the button, or the card for a menu that was opened from the card), which is what makes `#moveCard` take the focus along. The tests mirror 09's: the announcement and the focus after a move to a column (opened from the card, from the button, and with clicks), into a column of 1000 cards (brought in, scrolled to, focused), the focus that the user moved elsewhere while a hook ran (it stays, nothing scrolls), and the next card, else the previous one, else the list after a move to a dropzone with no list, a closed list and an open list.

### For ticket 11 (docs, changeset)

- Keys for the Keyboard section: Shift+F10 or the context-menu key on a card opens its Move to… menu; Enter or F2 reaches the button after the card's own controls; in the menu ↑/↓/Home/End, type-ahead, Enter or Space to choose, Escape, Tab.
- Consumer-Visible Change: every card that can be moved shows a button in its top corner at the end (24px, 6px from the card's edges) while the pointer is over the card or the focus is in it, and always on touch screens. It lies over the card's content there. New term `pinboardMoveTo`.
- The axe check with a menu open (C2) is already in `OwcPinboard.moveMenu.test-browser.js` and passes without disabled rules.

### Not done, not verified

- **"Move cancelled" isn't heard when the menu opens on a picked-up card**: the interaction hint ("Press Escape to return to the card") replaces it in the live region at once. F2 on a picked-up card does the same since 09. Not changed here.
- **The look** was checked once with the default theme in a throwaway page (button on hover, the open menu with a disabled column, the focus after a move), not in the docs site: `rocket start` served only 404s from the worktree.
- **Touch screens, screen readers (C3), forced colors, right-to-left** weren't tried. Chromium only.
- **Windows**: the tests check that the key's default is prevented; that this keeps the browser's context menu away for Shift+F10 was not tried there.
- **A menu with no item that can be chosen** (every column rejected, no dropzone) opens and takes no focus; Escape or a click elsewhere closes it.
- The button's name has the whole text of a card without `cardLabel`, as the card's own name does.
