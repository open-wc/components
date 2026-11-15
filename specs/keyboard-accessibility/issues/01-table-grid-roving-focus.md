# 01: Table as a grid with roving cell focus

Status: resolved

**What to build:** `owc-table` exposes grid semantics and is one Tab stop. Arrow keys, Home/End, Ctrl+Home/End and PageUp/PageDown move a roving focus between the cells of the header row, Data Rows and insert rows, also into rows the virtualizer hasn't rendered yet. Controls in cells leave the Tab order; a cell with one simple control focuses that control, a cell with several enters interaction mode with Enter or F2.

This is the tracer bullet: every other table ticket builds on its keydown handler and focus model. It also adds the shared live region helper (S1), which 08 waits for.

What this ticket leaves for later:

- Group headers and details get their row structure, focus and keys in 05. Until then, arrow keys skip them. The row math already counts them (G2), so the indices are right once they are rows. K2's rule for full-width rows lands with them; here it only applies to the empty message.
- Remembering the focused cell after its row left the rendered range comes in 02 (F1–F3). Here, tabbing back in restores the last cell while it is still rendered, else the first cell of the first body row.
- Enter as the row action, the row link's move and selection semantics come in 03.
- Header cells take focus here and their sort buttons leave the Tab order; `aria-sort` and the sort and resize keys come in 04.
- Editing keys and Tab inside insert rows come in 06. Until then, insert-row fields are out of the Tab order like every other control.

Spec: [G1–G3, K1–K3, S1–S3, C1, C5](../spec.md#requirements).

**Blocked by:** None.

- [x] Roles and names per G1 and G3 for the grid, the header row, Data Rows, insert rows and the empty message.
- [x] `aria-rowcount` and `aria-rowindex` per G2, computed by a pure, node-tested function that also counts group headers and open details. No `aria-colindex` or `aria-colcount`.
- [x] The grid is one Tab stop; Tab and Shift+Tab leave it; tabbing back in restores the last cell while it is rendered (K1).
- [x] Navigation keys per K2 work in plain and virtualized tables, including Ctrl+End on 100k rows. ↑ from the first body row reaches the header row; Ctrl+Home and PageUp stop at the first body row.
- [x] K3 focus targets, decided from the rendered content: plain cell, single simple control (checkbox, detail toggle, link), multi-control cell with interaction mode and an Escape hint in the live region. A custom formatter with a text input, and one with a custom element that has a button in its open shadow tree, both become interaction-mode cells.
- [x] No control inside the grid is reachable with Tab, checked by tabbing through a selectable, editable, `linkWithDetail` table with sortable headers.
- [x] Visible focus indicator on cells, and no `outline: 0` left on them (S3).
- [x] The live region helper exists with tests, and new strings are `en`/`de` terms (S1, S2).
- [x] `@web/test-runner-commands` is a dev dependency, and keyboard tests use real key presses (C1); the existing table suites still pass.
- [x] The 100k-row benchmark still meets the targets listed in C5; the numbers are recorded under `## Comments` (C5).

## Comments

### 2026-11-15: implemented (agent)

All boxes are done. The contributor view of the result is in `src/table/README.md` ("Keyboard and focus") and `src/a11y/README.md`; read those first.

**Decisions on points the spec leaves open**

- **The Tab stop is always a cell, never a control (K1 vs K3).** The remembered cell has `tabindex="0"` while it is rendered, else the first cell of the first body row. Focus that reaches a cell with exactly one simple control, from Tab or from a click beside the control, is handed on to the control. While the focus is on a control, the cell goes back to `tabindex="-1"`, so nothing in the grid is a Tab stop: otherwise Shift+Tab would stop at the cell and be handed back to the control, a trap. Navigation keys focus the control directly, so a screen reader hears one focus change per key. Controls therefore never need to become Tab stops again, and the pass after a render only ever takes elements out of the Tab order.
- **While neither that cell nor the first body row is rendered, the grid element is the Tab stop** (`tabindex="0"`), and moves the focus on to the first cell of the first body row when Tab reaches it (`:focus-visible`, so a click doesn't scroll to the top). The grid element has no `tabindex` otherwise, except `-1` while it holds the focus for a row that is being brought in (see below).
- **Every custom element in a cell's content gets `tabindex="-1"`, a control or not.** After a render, a Lit child hasn't rendered its shadow tree yet, so the pass can't tell. Side effect: a click on e.g. a `wa-badge` focuses its host; the grid hands that focus on to the cell or its control. Which custom elements count as controls is decided later, when a cell gets the focus (`controlsIn`).
- **An empty table has `aria-rowcount="2"`**: the header row and the row of the message, which has `aria-rowindex="2"`. G2 doesn't list the message row, but with 1 the grid would have a row beyond its count.
- **Interaction mode also starts when the pointer focuses a control** in a cell that keeps the focus itself (a text input, one of several buttons), with the same hint. Otherwise the arrow keys would move the grid's focus while the caret is in the input.
- **Tab in interaction mode cycles through Tab stops, not controls**: a custom element with two buttons in its shadow tree is one control (K3) with two stops (`tabStopsOf`), so both stay reachable.
- **A key that another listener handled (`defaultPrevented`) isn't the grid's.** That covers Enter and Space on an editable cell's read view, and Escape inside a control that uses it itself.
- **The live region is created on its host's first update**, not on first use (the design note is guidance): screen readers only watch regions they already know. It is absolutely positioned at the top left of its containing block; see `src/a11y/README.md` for why not at its place in the flow, and why not `position: fixed`.
- **The control helpers are shared too**: `src/a11y/controls.js`, next to `LiveRegionController.js`, both private. 08 needs the same for cards (`keepOutOfTabOrder(root, contentSelector)`, `controlsIn`, `tabStopsOf`).
- **`owc-table` has a new public `label` property** (G1), documented in the API section of `OwcTable.rocket.md`. The Keyboard section and the changeset stay with 11.

**For 02 (focus under virtualization)**

- `#remembered` is `{ item, column }`: the list item by object identity (or the symbols `HEADER_ITEM` / `EMPTY_ITEM`), and the index among the visible columns. F1 wants `getRowId` instead of identity: `#rememberedPosition()` is the one place that resolves it, and today it only finds rendered rows. `#handleGridFocusin` is the one place that writes it (plus the column in `#focusPosition`).
- Parking exists in a narrow form: `#focusPosition` calls `#holdFocusOnGrid()` before it awaits `scrollToIndex`, and keys that arrive meanwhile continue from `#pendingPosition`. The grid is focusable only then (and while it is the Tab stop). Nothing parks the focus when a scroll, sort or filter removes the focused row: it falls to `body`, and `#updateTabStop()` (after every render) picks a new Tab stop.
- Tabbing in, and a navigation key on the grid element, go to `#firstPosition()` when the remembered row isn't rendered. F2 replaces both with the remembered row.
- Keys work out where they come from through the focused element (`#positionOf(cell)` reads `data-index`), not through `#remembered`. In a table that isn't virtualized and isn't grouped, rows aren't keyed, so after a sort the focused element shows another row; the keys stay consistent with what the user sees, but the focus doesn't follow the row. That is F1/F2's "keep focus on the same row".

**For 03 (row actions, links, selection)**

- `a.row-click` has `tabindex="-1"` and is still the first child of `.row`, outside every cell. Keys from it are ignored (the grid only takes keys from its own cells), so link rows have no keyboard path between 01 and 03.
- A click beside a cell's content lands on the row's overlay (`.row-click` / `.row-no-click`), not on the cell, so it doesn't move the roving focus; only a click on the content does. Worth fixing when the overlay is reworked.
- Enter and F2 on a cell that has the focus itself are taken only when the cell has controls. Enter on a plain cell is free for the row action. Space is untouched everywhere.
- Keys are named by `gridKey` (`Shift+Space`, `Control+Home`; Command counts as Control).

**For 04 (headers)**

- The header `.cell` (`role="columnheader"`) takes the focus. `owc-table-header-cell` has `tabindex="-1"`, which takes its sort button out of the Tab order, and is `transparent` for `controlsIn`, so the button isn't a control. The button itself is unchanged: still in the accessibility tree, still named "Sort", still `outline: 0`. `OwcTableHeaderCell.test-browser.js` is untouched.
- A click on a header label focuses the `owc-table-header-cell` host or its button first; the grid hands that focus on to the header cell.
- `.table-body .cell` and `.full-width-cell` have `scroll-margin-top: 95px` like `.row-container`, because the grid scrolls the cell into view itself (`scrollIntoView({ block: 'nearest', inline: 'nearest' })`) and focuses with `preventScroll`. Replace all three when the real sticky height is measured.
- `moveInGrid` returns `undefined` for keys with Shift or Alt, so `Shift+ArrowLeft` and `Shift+Backspace` are free.

**For 05 (groups, details, annotations)**

- Group headers and details already count in `aria-rowcount` and `aria-rowindex` (`gridRows.js`), but have no roles. A detail row's index is its Data Row's `gridRowIndex(...) + 1`.
- Arrow keys skip group headers through `canFocus` in `#gridShape()`; remove it when they take focus. `isFullWidth` is what keeps ←/→/Home/End on a one-cell row and remembers the column; it is only set for the empty table today. `.full-width-cell` is the class the grid recognises such a cell by (`CELLS`, `#isCell`), and `#positionOf` assumes it is the empty message (row 0): extend both.
- Details aren't list items, so `moveInGrid`'s rows (indices of the list) have no place for them yet.
- Keys from details, annotations and group headers are ignored on purpose (`#cellIn` finds no cell), so a table or an input inside a detail keeps its keys. Controls in open details and annotations are still Tab stops: `keepOutOfTabOrder` only looks at `.cell-text`, `.cell-full` and `owc-table-header-cell` (`CELL_CONTENT`).
- `.group-label-container` still has `outline: 0`.

**For 06 (editing)**

- Keys from an `owc-click-editable-*` whose `editable` property is true are ignored (`isActiveEditor`). The property, not the attribute: the attribute is only reflected after the editor's update.
- Insert-row fields are out of the Tab order and are focus targets like every `owc-click-editable-*`: the arrow keys move into an insert row's field, the focus lands in its input, and from there every key is the editor's. Escape closes that editor and gives the keys back; Tab leaves the grid. Checked by hand with a throwaway test; there is no test in the suite for the way out, since 06 changes it.
- `#handleInsertClick` is unchanged; the field it focuses becomes the remembered cell through `focusin`.

**For 08 (pinboard)**

- `new LiveRegionController(this)` and `announce(localizedText)`; the default delay is 50ms. Give tests their own controller with a short delay, or wait for the text.
- The region is appended to the shadow root outside the host's template. That holds while the host's `render()` always returns the same template, as the table's and the pinboard's do.

**C5: 100k-row benchmark**

Measured on 2026-11-15 on the working tree that became this ticket's commit, with the probe scripts from the exploration notes (`benchmark.mjs`, `benchmark-sort.mjs`): headless Chromium (Playwright 1.65.1), 1400×900, 1x CPU, Apple M1 Pro. **The machine was under parallel load from other agents the whole time** (load average 5 to 21 on 10 cores), so absolute numbers are on the slow side. To have a baseline under the same load, the base commit `ab422fd` was served next to the worktree and the two were measured in turns.

| Target (C5) | Baseline in the notes (`ab422fd`, earlier that day) | `ab422fd`, same session | This ticket | Met |
| --- | --- | --- | --- | --- |
| First rows within 200ms | 142, 163, 180, 186 ms | median 117 ms (114 to 138, 15 runs) | median 120 ms (116 to 158, 15 runs) | yes |
| Re-render after a sort within 100ms, without the sort | 41, 50, 60 ms | 53, 52, 38 ms | 53, 53, 53 ms | yes |
| Re-render after a filter within 100ms, without the filter | 37, 40, 44 ms | 37, 38, 37 ms | 44, 37, 37 ms | yes |
| No white while scrolling (60px and 250px per frame, down, up, up from the end) | 0 frames with gaps | 0 | 0 | yes |
| At most one blank frame when dragging the scrollbar or flinging (10 jumps, jump to the end) | at most 1 in a row | at most 1 in a row | at most 1 in a row | yes |
| No task over 50ms while scrolling | 0 | 0 | 0 | yes |

- The scripted scroll gave the same lines as the baseline in every run, including 0 frames with jumps: 3 runs each in the page layout, 1 each in the `owc-layout-sidebar` layout.
- Wheel and keyboard scrolling, which the notes left unmeasured, through the demo's "Monitor manual scrolling" with scripted input (4 runs): 120 wheel ticks of 100px and 60 of 600px, then with the focus on a cell 200 × ↓ and 60 × PageDown at 30 keys per second, and Ctrl+End followed by Ctrl+Home. Every phase: 0 frames with gaps, 0 tasks over 50ms. On `ab422fd` the same keys scroll the page, with the same result.
- What the benchmark caught on the way, both fixed before the numbers above:
  - The live region as a plain absolutely positioned element at the end of the shadow root made the sidebar layout's "Scroll up from the end" phase show 1 frame with a 24px jump, in 5 of 5 runs. Inside a scroll box that isn't positioned, such an element stays where the content ends without scrolling with it, and makes the page as tall as the table. There is a test for it now (`LiveRegionController.test-browser.js`).
  - `position: fixed` for the region fixed that, but cost about 10ms of first paint (medians 120/131 and 108/118 ms, base/worktree, 10 runs each; without the region 108/110). It is `position: absolute; top: 0; left: 0` now, which costs nothing measurable.
- The pass over rendered cells (`keepOutOfTabOrder` and `#updateTabStop` in `updated()`) made no measurable difference to first paint when it was switched off (medians 111/119 and 107/116 ms against 108/118 with it, while the region was still fixed).
- Not measured: a human on a trackpad, and 4x CPU throttling (not a target). 11 measures again.

### 2026-11-15: slotted controls finding resolved

The shared `src/a11y/controls.js` traversal now follows open shadow roots and flattened assigned slots, without duplicate targets. Control discovery, interaction targets and Tab suppression use it. It remembers the `tabindex` values it changes so controls remain programmatically focusable in interaction mode, and a custom widget's own negative `tabindex` stays excluded. Slot-only wrappers and pointer focus on cards keep their existing behavior; unassigned light children are suppressed before their host renders its slots, but aren't interaction targets while unrendered.

Browser regressions cover table cells and pinboard cards with shadow buttons and a slotted input, both directly and through nested slots: forward Tab, reverse Shift+Tab, wrapping, Enter/F2, Escape and leaving the widget. Helper regressions also check duplicate-free order, repeated suppression, slot fallback and unassigned content. All 146 tests in the helper, table keyboard and pinboard keyboard suites pass. This closes the review finding within this ticket; no new spec or ADR is needed.

Validation: the full `npm test` and `npm run types` pass. ESLint passes. `npm run lint` reaches Prettier and fails only on two existing `focusables.test-browser.js` files in linked `.claude/worktrees/` checkouts; formatting all tracked files separately passes, as does the new browser fixture helper.
