# 07: Column reordering by keyboard

Status: resolved

**What to build:** in `OwcTableSettings`, the grip becomes a button that opens a menu (Move up, Move down, Move to top, Move to bottom), and Alt+↑/↓ moves the focused column item. Both save the order exactly like a drag does. The drag stays.

Spec: [K11](../spec.md#table-keyboard).

**Blocked by:** None.

- [x] The grip is a named button; its menu is keyboard-operable and works with a single click.
- [x] Alt+↑/↓ moves the focused item and keeps focus on it.
- [x] The new order reaches the table, the URL and local storage like a drag does; the first and last items disable impossible moves.

## Comments

### What was built (2026-11-15)

All of it is in `src/table/OwcTableSettings.js`; `OwcAutocomplete.js` and `OwcTable.js` are untouched. Tests: `src/table/OwcTableSettings.test-browser.js`, describe "owc-table-settings column reordering" (real keys and a real pointer).

- **What "a focused column item" is:** real focus on a control inside the item, its grip button or its visibility checkbox. Alt+↑/↓ works from either and puts the focus back on the same control of the moved item.
- **How the keyboard gets there:** in the settings, **Tab no longer closes the dropdown**. It moves through the dropdown's controls (search, then grip and checkbox of every column, then `?` and Reset), and the dropdown closes once focus leaves it (the autocomplete's `focusin` listener). Escape still closes it. A side effect: the visibility checkboxes, `?` and Reset are keyboard-operable for the first time (Space on a checkbox cycles the visibility, there is a test).
- **The grip** is a native `<button class="grip" slot="trigger">` named "Move column: <label>" (`tableMoveColumn` plus the column's label), inside a `wa-dropdown` with four `wa-dropdown-item`s. It is still the drag handle: an item is `draggable` only while the pointer is over its grip. The grip and its menu are hidden while a search filters the list, and Alt+↑/↓ does nothing then, since a position in a filtered list says nothing about the order.
- **Saving:** every way of reordering (drag, menu, Alt+↑/↓) ends in one private `#saveOrder(order)`, which is the old drag callback: local storage, the URL if it mirrors local storage, `overrides.order`, `change`, `reorderColumns`.
- **New terms** (`en`, `de`, and the copy in `localization.rocket.md`): `tableMoveColumnUp`, `tableMoveColumnDown`, `tableMoveColumnToTop`, `tableMoveColumnToBottom`.
- **Focus ring (S3):** `.grip:focus-visible` uses `--wa-focus-ring` and `--wa-focus-ring-offset`. Looked at once with the default theme (screenshots, not kept).

### For ticket 10 (`wa-dropdown` in the pinboard)

- **Registration:** two side-effect imports, `@awesome.me/webawesome/dist/components/dropdown/dropdown.js` and `…/dropdown-item/dropdown-item.js`, like every other Web Awesome component here. They define the elements globally; nothing goes into `scopedElements`.
- **Its events leave your shadow root.** `wa-show`, `wa-after-show`, `wa-hide`, `wa-after-hide` and `wa-select` all bubble and are composed. Outside they look like events of your own component (the autocomplete documents `wa-show`/`wa-hide` of its own; in the pinboard, `wa-details` of the dropzone lists fire the same names). Stop them on the `wa-dropdown` (`#keepInside`).
- **Clicks bubble too.** A click on the trigger or on an item reaches every click listener above the `wa-dropdown`. Here that cycled the column's visibility until `handleOptionClick` ignored clicks from inside a `wa-dropdown`. In the pinboard, check the card's and the dropzone's click and drag handlers.
- **Keys are handled in a `document` keydown listener** that exists only while the menu is open (↑/↓/Home/End, type-ahead, Enter/Space, Escape, Tab). Its `stopPropagation()` comes too late for other `document` listeners and for every listener between the focused item and the document, so a keydown handler on the board sees the menu's keys first. Leave them alone while a menu is open: `shadowRoot.querySelector('wa-dropdown[open]')` (`open` is reflected). Without that, Escape here closed the whole settings dropdown together with the menu.
- **Escape and choosing an item focus the trigger** (`trigger.focus({ preventScroll: true })`), synchronously after `wa-select`. If the choice re-renders the trigger away, restore the focus yourself after the render.
- **A freshly rendered trigger can't take focus yet.** The slotted button is not rendered until the `wa-dropdown` has done its first update, so `button.focus()` right after the host's `updateComplete` does nothing. Await the dropdown's `updateComplete` first (`#focusColumnControl`).
- **Opening is animated.** The first enabled item gets the focus after the show animation, and disabled items are skipped by the keys and get `aria-disabled="true"`. Tests wait for the focus (`waitUntil` on `shadowRoot.activeElement`) or for `wa-after-show`/`wa-after-hide` on the dropdown, never for a time.
- **Not clipped.** The menu is a popover in the top layer; inside the option list (`overflow-y: auto`, itself in a `wa-popup`) it shows and takes a real click (tested with `sendMouse`).
- **A native button as trigger** gets `aria-haspopup="menu"`, `aria-expanded` and an id from the dropdown, and Enter/Space open the menu through the native click. `Alt+ArrowDown` on the trigger does not open it.
- **Real pointer in tests:** `sendMouse`/`resetMouse` from `@web/test-runner-commands` drive HTML5 drag and drop in Chromium. A drag that depends on hover state has to start with a small move inside the handle before the long move.

### For ticket 11 (docs, changeset, axe)

- Consumer-Visible Change for the changeset: in `owc-table-settings`, Tab moves through the dropdown instead of closing it; Alt+↑/↓ and the grip's menu reorder columns; four new localization terms.
- Docs: the keyboard table of the settings belongs in `OwcTableInfo.rocket.md` ("Settings tab"), which this ticket didn't touch.
- axe on the open settings dropdown reports violations that were there before and are the autocomplete's: `role="listbox"` wraps the search field, the grips and the footer buttons (`aria-required-children`, `aria-input-field-name`), the search field and its icon button have no name, and the visibility checkboxes have no name (`wa-checkbox` without a label). None is on the grip or the menu. They need a follow-up ticket if the settings should pass axe.

### Not done, not verified

- **300 columns and more:** the list is virtualized then. After "Move to top" or "Move to bottom" the moved item may not be rendered, and focus is not restored (the autocomplete's reveal helper is private). Alt+↑/↓ moves by one, so its target is rendered.
- **Escape on the settings dropdown** closes it and leaves focus on the hidden control, as in every `owc-autocomplete`. Not changed here.
- **Pressing Tab within 100ms of opening:** the autocomplete focuses the search field again 100ms after opening and takes the focus back.
- **Firefox and Safari:** only Chromium ran. Whether a `<button>` works as a drag handle in Firefox is not verified.
- **Seen, not caused by this ticket:** the settings trigger shows the first column's label next to "Columns" (`valueLabel` matches the first option, since columns have no `value`).

### 2026-11-15: virtualized lists (keyboard-accessibility review)

With 300 columns or more the settings list is virtualized, and "Move to top" or "Move to bottom" moved the column to a place that wasn't rendered: the focus was lost. `#focusColumnControl` now brings the column's new place in before it focuses it, through the new `revealOption(index)` of `owc-autocomplete` (the private `#revealOption` it had, awaitable; documented in `OwcAutocomplete.rocket.md` and the changeset). Test: "brings in and focuses a column that … moves out of the rendered part of a virtualized list", for both moves, with 320 columns.
