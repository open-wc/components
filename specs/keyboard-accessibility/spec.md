# Keyboard-accessible table and pinboard

`owc-table` becomes an ARIA data grid ([ADR-0007](../../docs/adr/0007-table-is-an-aria-data-grid.md)) that works with the keyboard alone, and `owc-pinboard` gets a keyboard path and a single-pointer alternative for moving cards. Both get automated keyboard tests and axe checks that run in CI.

This spec is the source of truth for the work; tickets are derived from it. Terms follow the [glossary](../../GLOSSARY.md), in particular **Data Row**, **Public Surface**, **Consumer-Visible Change** and **Migration Handling**.

## Problem

The launch posts for the table and the pinboard wait until both are keyboard accessible, with tests. The open-wc name stands for best practices, so roles added only to pass a checklist don't count. As of 2026-11-15:

- **The table has no table or grid semantics.** Rows and cells are `div`s on one CSS grid. Only the select-all checkbox, the row checkboxes and the row links have an `aria-label`.
- **The table's Tab order grows with its rows.** Every selector checkbox, editable cell and detail toggle is its own Tab stop. So is the Sort button of every sortable header, which is named only "Sort" and has its outline removed. Group headers react to mouse clicks only. Column resizing is mouse-only (drag, double-click to reset).
- **Link rows are an empty overlay.** `<a class="row-click">` is a direct child of `.row`, positioned over the whole row, with no text.
- **Column reordering is drag-only.** `OwcTableSettings` uses an HTML5 drag helper.
- **The pinboard has no keyboard path.** Cards move only through HTML5 drag and drop, which also fails WCAG 2.2 SC 2.5.7 (Dragging Movements) for pointer users. The dropzones are clickable `div`s.
- **There are no automated accessibility checks anywhere.** `chai-a11y-axe` is already installed through `@open-wc/testing`.

## Scope

**In this effort:** `owc-table` (grid semantics and keyboard, headers, groups, details, annotations, selection, editing, focus under virtualization), keyboard column reordering in `OwcTableSettings`, `owc-pinboard` (card focus, pick-up mode, Move to… menu, dropzones), axe checks in the browser tests, a manual screen reader checklist, docs and a changeset.

**Out of scope, except for axe fixes and a keyboard smoke test (C4):** the filter builder, the info block's action tabs, mass edit and the add-row button. Real gaps found there become follow-up tickets in this spec, not part of the launch gate.

**Non-goals:**

- Range selection (Shift+Arrow) and Ctrl+A.
- Type-to-edit (starting an edit by typing a character).
- Reordering cards within a pinboard column: `sorter` decides the order.
- Claiming WCAG 2.2 AA conformance for the whole component. An axe pass and these tests don't establish that, and known gaps remain in the out-of-scope parts. Docs describe the keyboard support; they don't claim conformance.

## Requirements

### Table: grid semantics

- **G1 Roles:**
  - `#data-table` is `role="grid"` with an accessible name (`aria-label`, overridable through a new `label` attribute; default from the localization term `tableLabel`).
  - The header and the body are `rowgroup`s. Every container between the grid and its rows that isn't a row (`.row-container`, `#virtualize-container`, spacers) is `role="none"` or out of the accessibility tree.
  - Header cells are `columnheader`s, body cells `gridcell`s, and every `.row` a `row`.
- **G2 Row and column counts:**
  - `aria-rowcount` on the grid counts the header row, group headers, Data Rows, insert rows and open detail rows of the whole list, not just the rendered slice. Rows of collapsed groups aren't counted.
  - Every rendered row has `aria-rowindex` (1-based, the header row is 1).
  - There is no `aria-colindex` or `aria-colcount`: every visible column is in the DOM, and ARIA only asks for them when columns are missing from it. Full-width cells use `aria-colspan`.
  - The row math is a pure function with node tests.
- **G3 Empty and loading:** an empty table shows its message as one row with one cell across all columns. The grid gets `aria-busy` while `loading`.

### Table: keyboard

- **K1 One Tab stop:** the grid is one Tab stop. Tab and Shift+Tab leave the grid, except in interaction mode (K3) and in insert rows (K10). Tabbing back in restores the last focused cell (F1), or the first cell of the first body row the first time.
- **K2 Navigation (APG data grid):**
  - ←/→ move between cells of a row, ↑/↓ between rows in the same column.
  - Home/End go to the first or last cell of the row, Ctrl+Home/End to the first cell of the first body row or the last cell of the last row.
  - PageUp/PageDown move by the number of rows that fit into the visible part of the table.
  - The header row is part of the navigation: ↑ from the first body row reaches it. Ctrl+Home and PageUp stop at the first body row.
  - Navigation doesn't wrap. Rows that aren't rendered are brought in through the virtualizer (`scrollToIndex`) before they get focus.
  - Full-width rows (group headers, details, the empty message) have one cell: ←/→ don't move off it, ↑/↓ come back to the column the user left.
- **K3 What gets focus in a cell:** decided whenever a cell gets focus, from the cell's rendered content, never from its column's formatter (the selector and details columns are formatters too):
  - **What counts as a control:** a natively focusable element (`a[href]`, `button`, `input`, `select`, `textarea`, `[tabindex]`, `[contenteditable]`), or a custom element that is focusable itself or has one of these in its open shadow tree, at any depth. Content in a closed shadow root can't be seen, and the docs say so (R1).
  - **No controls:** the cell itself (`tabindex` on the cell).
  - **Exactly one simple control:** that control, directly. Simple controls are links, buttons and checkboxes (native ones, `wa-button`, `owc-icon-button`, `wa-checkbox`) and `owc-click-editable-*` elements.
  - **Several controls, or one that isn't simple** (text inputs, selects, autocompletes, and any other custom element with a control inside, since it may use arrow keys itself): the cell. Enter or F2 enters **interaction mode**: Tab and Shift+Tab cycle through the cell's controls, and Escape returns focus to the cell. On entry, a polite live region says how to leave ("Press Escape to return to the table"), so the cycle never traps a user (WCAG 2.1.2).
  - Controls in cells never are Tab stops of their own, whether or not their shadow host delegates focus.
  - Header cells follow the same rules, except that the sort button isn't a control (K6).
- **K4 Row action:** Enter on a cell without its own control triggers the row's action:
  - `link` and `linkWithDetail` rows follow the row's link. Modifier keys (Ctrl, Cmd, Shift) behave as on a native link.
  - The real `<a>` stays the accessible link and moves into the row's first data cell: the first column that isn't the selector or the details column, so those cells keep their single control. The link counts as its cell's control (K3), so in a cell without other controls it takes focus directly. It still covers the whole row visually without covering controls.
  - The link's name is the `aria-label` from `getRowLinkSettings` if there is one, else the content of its cell (`aria-labelledby`), else the localization term `tableOpenRow`.
  - `detail` and `detailDeferred` rows toggle the detail.
  - `simple` rows fire `rowClick`, as a click does.
  - Insert rows have no row action.
- **K5 Selection:** when `selectable`:
  - The grid has `aria-multiselectable="true"`, and each Data Row `aria-selected`.
  - Space on a row's checkbox toggles it natively. Shift+Space toggles the focused row from any of its cells.
  - The select-all checkbox is a single-control header cell.
- **K6 Headers:**
  - A header cell takes focus itself. The sort button inside `owc-table-header-cell` stays a pointer target, but leaves the Tab order and the accessibility tree (`tabindex="-1"`, `aria-hidden`), since the sort state is on the header cell.
  - Sortable header cells have `aria-sort`: `ascending`, `descending`, or `none` while unsorted. Columns that can't be sorted have no `aria-sort`. Enter or Space on a header cell cycles its sort, as a click does.
  - On a resizable column, Shift+←/→ resizes by 10px (respecting the minimum width), and Shift+Backspace resets it like the double-click does. A polite live region announces the new width.
  - The sticky header never covers the focused cell: the rows' `scroll-margin-top` matches the real height of what sticks above the body (header row, info block), replacing today's fixed 95px. The scroll container can be the document or a consumer's box, so `scroll-padding` isn't an option.
- **K7 Groups:**
  - A group header is a row with one `gridcell` across all columns (`aria-colspan`). The cell contains a `<button>` named like "Engineers, 12 rows", with `aria-expanded`. It is the cell's single control, so it gets focus directly.
  - Enter or Space toggles the group, → expands it, ← collapses it.
  - The Others group behaves the same.
- **K8 Details:**
  - An open detail is its own row right after its Data Row, with one cell across all columns. It is rendered as a row only while it's open.
  - Its content is arbitrary, so its cell always works like a multi-control cell (K3: Enter or F2 in, Escape out).
  - Expanded state:
    - `linkWithDetail` rows have a detail toggle button, which gets `aria-expanded`. `owc-icon-button` gets a new `expanded` property that sets it on its inner button (R2).
    - `detail` and `detailDeferred` rows have no toggle button: the row itself toggles (K4). There, the row's first data cell has `aria-expanded`, and the live region announces "Details opened" or "Details closed" on every toggle, since focus may be on another cell.
  - There is no `aria-controls`: the toggle's button and the detail cell are in different shadow roots, and screen readers barely use it. The detail row follows its Data Row directly.
  - Closing a detail with focus inside it moves focus to its Data Row.
- **K9 Annotations:** an annotation is not a row.
  - When roving focus moves into an annotated row from another row, the live region announces the annotation's text, whichever cell or control gets the focus.
  - `aria-describedby` alone can't do that: it doesn't reach controls inside shadow roots, and a row's description isn't reliably read when focus lands on one of its cells. The Data Row still references the annotation with `aria-describedby`.
  - The manual check (C3) verifies the announcement.
- **K10 Editing:**
  - An editable cell's `owc-click-editable-*` element is its single control (K3). Enter or Space starts editing. While editing, every key belongs to the editor (the grid ignores keys from inside an active editor). Enter commits, Escape cancels, and focus returns to the cell's control.
  - The insert flow keeps focusing the new row's first editable field, which also becomes the grid's remembered cell.
  - Insert rows are the exception to K1, because their fields render as open editors: Tab and Shift+Tab move between the fields of the insert row, and leave the grid from its last or first field. Without this, filling a new row would take Enter, typing, Escape and → for every field.
- **K11 Column settings:** in `OwcTableSettings`, the grip becomes a button with a menu: Move up, Move down, Move to top, Move to bottom. Alt+↑/↓ on a focused column item moves it too. Both work for keyboard and single-pointer users, and the drag interaction stays.

### Table and pinboard: focus

- **F1 Stable identity:** the remembered focus is an item identity plus a column, never a DOM reference or an array index:
  - table: `getRowId` for Data Rows, the group key for group headers (the Others group has its own key), the detail's row id for detail rows, object identity for insert rows until they have an id;
  - pinboard: `getCardId` (P5), else object identity.
- **F2 Park and restore:** when the element with focus leaves the rendered range or is removed by a render, focus moves to an element that is always rendered (the grid element in the table, the column's list element in the pinboard), without scrolling and without a live region message (a screen reader still announces the element focus lands on). The next navigation key, or tabbing back in, scrolls the remembered item back in and focuses it. If the item is gone, focus goes to the nearest item at the same position.
- **F3 Never steal focus:** focus is only restored or moved by the component when focus is still inside the component (or was parked by it). Async work (detail loading, pinboard hooks) never pulls focus back from elsewhere.

### Pinboard

- **P1 Semantics:**
  - Each column is a `list` named by its `label`, else by its `value`, and each card a `listitem` with `aria-setsize` and `aria-posinset`, since columns are virtualized.
  - A dropzone's list of dropped cards is a `list` too, named like its dropzone button.
  - The dropzones are `<button>`s named by localization terms ("Done", "Delete"). A dropzone with a dropped-cards list has `aria-expanded` and `aria-controls`, and Enter or Space toggles the list, as a click does today.
- **P2 Card focus:**
  - The board is one Tab stop with roving focus; the dropzone buttons are Tab stops of their own.
  - ↑/↓ move between cards of a column, ←/→ to the card at the nearest position in the neighbouring column, Home/End to the first or last card of the column.
  - The cards of an open dropzone list are part of the roving focus: ←/→ treat each open list as one more column after the last one, in the order the dropzones are shown.
  - Screen readers with a browse mode (NVDA, JAWS) don't pass arrow keys or Space on to a `list`. For their users, the Move to… button (P4) and the dropzone buttons are the way to move cards, and both are reachable in browse mode. C3 checks that with NVDA.
  - Controls inside card templates and the Move to… button aren't Tab stops of their own. Enter or F2 enters **interaction mode**: Tab and Shift+Tab cycle through the card's controls, and Escape returns to the card. On entry, the live region says how to leave.
- **P3 Pick-up mode:**
  - Space picks up the focused card. ←/→ step through the destinations: the columns left to right, then the dropzones. The card's current column or dropzone is the starting point.
  - A card in a dropzone list can be picked up only if its dropzone is `liftable`. Otherwise Space announces that the card can't be moved.
  - `canDrop` is asked about columns only, as with dragging; dropzones always take the card. Columns where it returns false stay reachable and are announced as not droppable; dropping there does nothing but announce it again.
  - Space or Enter drops the card. Escape, Tab, or focus leaving the card cancels.
  - The same visual cues as dragging show: the drop-hover shadow on the current destination, and `.cannot-drop` on columns that can't take the card.
  - A polite live region announces pick-up, every destination ("Done, 3 cards" / "Can't drop in Archive"), the drop and the cancel.
- **P4 Move to… menu:**
  - Every card that can be moved has a Move to… button in its corner, visible on hover and while the card has focus, and always on touch (`hover: none`). It works with one click, so it's the single-pointer alternative to dragging (SC 2.5.7). Cards in a dropzone list that isn't `liftable` have none.
  - While it isn't visible, the button is hidden visually only (not with `display: none`), so it stays in the accessibility tree for browse mode (P2).
  - The menu is a keyboard-operable `wa-dropdown` listing every destination except the card's current column or dropzone. Columns where `canDrop` is false are disabled and marked as such.
  - Shift+F10 or the context-menu key on a focused card opens it directly.
- **P5 New properties:**
  - `cardLabel: (data) => string`: the card's name in announcements and its accessible name. Default: the card's trimmed text content.
  - `getCardId: (data) => string | number`: stable identity for focus (F1). Default: object identity. The docs recommend it for consumers that rebuild their card objects.
- **P6 Drop results:**
  - All moves, whatever started them (drag, pick-up, menu), run the same lift and drop hooks as today, awaited in the same order.
  - After the hooks and the next render, focus follows the card to its new column (scrolled in through the virtualizer), and the live region announces "Moved X to Done, 3 of 7".
  - If the card isn't in a column anymore (it went to a dropzone, with or without a list, or a hook removed it), focus goes to the next card of the list it came from, else the previous one, else the list itself.
  - F3 applies: if focus left the board while the hooks ran, focus stays where the user put it.

### Shared

- **S1 Live region:** a private helper owns a visually hidden polite live region per component and debounces repeated messages. Both components use it.
- **S2 Localization:** every new string is a localization term in `en` and `de`.
- **S3 Visible focus:** every focus target has a visible focus indicator (`:focus-visible`), including cells, rows' controls, cards and dropzones, with at least 3:1 contrast against its surroundings. It uses `--wa-focus-ring`, as `owc-icon-button` does, and today's `outline: 0` on cells goes. axe can't check this, so the manual check (C3) does.

### Checks

- **C1 Keyboard tests:** browser tests drive the public elements with real key presses (`sendKeys` from `@web/test-runner-commands`), not by calling handlers. That package is only a transitive dependency today, so it becomes a dev dependency. Every requirement above that a test can observe has at least one test; the rest is in the manual check (C3).
- **C2 axe:** `await expect(el).to.be.accessible()` runs in the browser tests for: every `render-mode`, selectable, editable with an insert row, grouped with Others, virtualized (scrolled to the middle), sticky header, empty, with annotations and an open detail; the pinboard by default, with dropzones and their lists open, during pick-up and with the Move to… menu open. Violations in our own code get fixed. A rule is disabled only for Web Awesome internals we can't change, with a written reason next to it. One exception in our own code (decided on 2026-11-16, see [05](issues/05-table-groups-details.md)): `aria-required-children` for controls in an annotation, which are in the grid but in no row (K9), accepted only for those controls. They run in `npm test`, so the existing `verify.yml` gates them.
- **C3 Manual screen reader check:** before the launch posts, the user runs the checklist in [manual-screen-reader-check.md](manual-screen-reader-check.md) and records the result under the last ticket's `## Comments`:
  - VoiceOver + Chrome: required.
  - NVDA + Chrome: required for the pinboard items marked NVDA (P2), nice to have for the rest.
  - Safari and Firefox: a keyboard smoke test, not a gate. Chromium stays the only required engine, as for the virtualizer.
- **C4 Out-of-scope parts:** a table with its info block, the filter builder open and mass edit open gets an axe check, with the same rule for violations as C2. One keyboard smoke test each shows that the filter builder, the info block's action tabs, mass edit and the add-row button can be reached with Tab and operated with Enter or Space. Gaps beyond that become follow-up tickets (Scope).
- **C5 Performance:** the grid adds attributes to every cell and a pass over rendered cells that keeps their controls out of the Tab order. The 100k-row benchmark in the table docs (Large Tables) still meets the targets the virtualizer was built to, at 1x CPU:
  - no white during wheel, trackpad or keyboard scrolling;
  - at most one blank frame when dragging the scrollbar or flinging;
  - no task over 50ms while scrolling;
  - first rows within 200ms of setting the data;
  - re-render within 100ms after a sort or filter, not counting the sort or filter itself.

  It is measured after 01 and again in 11, with the demo's own instruments, and recorded under each ticket's `## Comments`.

### Release

- **R1 Docs:** `OwcTable.rocket.md` and `OwcPinboard.rocket.md` get a Keyboard section (a key table per component), the new properties in their API sections, and the READMEs list the keyboard model for contributors. The table's Keyboard section also says how controls in custom formatters are found, and that content in closed shadow roots isn't (K3). `OwcIconButton.rocket.md` documents `expanded`.
- **R2 Changeset:** one `minor` changeset. Migration notes:
  - selector checkboxes, editable cells, detail toggles and the headers' sort buttons are no longer Tab stops of their own;
  - in insert rows, Tab still moves from field to field;
  - Enter on a row now triggers its action;
  - the link overlay moved into the first data cell (relevant for `customStyles`);
  - new: `label` on the table, `cardLabel` and `getCardId` on the pinboard, `expanded` on `owc-icon-button`.
- **R3 Release Gate:** `npm run lint`, `npm run test`, `npm run types` and `npm run build` pass.

## Delivery order

The tickets live in [issues/](issues/).

- **01 is the tracer bullet:** the grid, one Tab stop and cell navigation over the header, Data Rows and insert rows. Its ticket lists what it leaves for 02–06. It also adds the live region helper (S1), which is the only reason 08 waits for it.
- **02–06 run one at a time, in number order:** each only needs 01, but they all extend the same keydown handler in `OwcTable.js`, so each is blocked by the one before it.
- **07 and the pinboard tickets** are independent of the table tickets otherwise.

| Ticket                                                                               | Blocked by |
| ------------------------------------------------------------------------------------ | ---------- |
| [01: Table as a grid with roving cell focus](issues/01-table-grid-roving-focus.md)   | —          |
| [02: Table focus survives virtualization](issues/02-table-focus-virtualization.md)   | 01         |
| [03: Table row actions, links and selection](issues/03-table-row-actions.md)          | 02         |
| [04: Table headers: sort and resize by keyboard](issues/04-table-headers.md)          | 03         |
| [05: Table groups, details and annotations](issues/05-table-groups-details.md)        | 04         |
| [06: Table editing in the grid](issues/06-table-editing.md)                           | 05         |
| [07: Column reordering by keyboard](issues/07-settings-column-reorder.md)             | —          |
| [08: Pinboard card focus and dropzone buttons](issues/08-pinboard-card-focus.md)      | 01         |
| [09: Pinboard pick-up mode](issues/09-pinboard-pick-up.md)                            | 08         |
| [10: Pinboard Move to… menu](issues/10-pinboard-move-menu.md)                         | 08         |
| [11: axe checks, docs, changeset](issues/11-axe-docs-changeset.md)                    | 02–10      |
| [12: Settings dropdown passes axe](issues/12-settings-dropdown-axe.md) (resolved in the review) | — |
| [13: Filter builder: every filter type named, toggle states exposed](issues/13-filter-builder-names-and-states.md) (follow-up, needs triage) | — |
| [14: Action tabs say which tab is open](issues/14-action-tabs-state.md) (follow-up, needs triage) | — |
| [15: A detail that find-in-page opens joins the grid](issues/15-detail-opened-by-find-in-page.md) (follow-up, needs triage) | — |
| [16: One roving focus model for the table and the pinboard](issues/16-shared-roving-focus.md) (follow-up, needs triage) | — |

## Design notes

Guidance, not requirements.

- **One keydown handler per component** on the grid or board element, dispatching on the focused cell or card found through `composedPath()`. Keys from inside an active editor or interaction mode pass through.
- **Roving tabindex, not `aria-activedescendant`:** controls inside cells need real focus, and `aria-activedescendant` doesn't reach into shadow roots.
- **Controls in shadow roots:** `tabindex="-1"` on a shadow host takes its whole shadow tree out of the Tab order in Chromium, with or without delegated focus (checked on 2026-11-15 with a throwaway browser test). That covers `wa-checkbox`, `wa-button`, `owc-icon-button`, `owc-click-editable-*` and `owc-table-header-cell`. `owc-icon-button` and `owc-click-editable-*` don't delegate focus but override `focus()`, so calling it on the host reaches the inner control. Tests verify the Tab order, since it's what K1 relies on.
- **Two passes for K3:** keeping controls out of the Tab order happens after a render, for the rendered cells; choosing the focus target happens when a cell gets focus. The first one runs while scrolling, so it has to stay cheap (C5).
- **Live region:** one visually hidden element per component, inside its shadow root, created on first use; clearing it before setting a repeated message makes screen readers read it again.
- **Row index math:** the header row is 1, so `aria-rowindex` = 2 + the item's index in the list + the number of open detail rows before it. A detail row has its Data Row's index + 1. Open details are few, so a sorted array of their list indices and a binary search is enough.

## Related

- [ADR-0007](../../docs/adr/0007-table-is-an-aria-data-grid.md): grid instead of table pattern.
- [ADR-0006](../../docs/adr/0006-own-an-in-flow-vertical-virtualizer.md) and the virtualizer spec, which was removed once it was finished (`git show 72207f2:specs/virtualizer-replacement/spec.md`). F2 lifts its non-goal "keeping DOM-only state such as focus" for focus only; half-typed edits still aren't kept.
- WAI-ARIA APG: [Data Grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/), [Developing a Keyboard Interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/).
- WCAG 2.2: SC 2.1.1 Keyboard, 2.1.2 No Keyboard Trap, 2.4.3 Focus Order, 2.4.7 Focus Visible, 2.5.7 Dragging Movements, 4.1.2 Name, Role, Value, 4.1.3 Status Messages.
