# 04: Table headers: sort and resize by keyboard

Status: resolved

**What to build:** header cells are `columnheader`s that take focus themselves and carry `aria-sort`; the sort button stays for the pointer only. Enter or Space cycles the sort. Shift+←/→ resizes a resizable column by 10px and Shift+Backspace resets it; the live region announces the width. The sticky header never covers the focused cell.

Spec: [K6](../spec.md#table-keyboard).

**Blocked by:** 03 (needs 01; waits for 03 because both extend the same keydown handler).

- [x] `aria-sort` reflects the sort state, with `none` on sortable columns that aren't sorted and no attribute on columns that can't be sorted; Enter and Space cycle it like a click.
- [x] The sort button is `aria-hidden` and out of the Tab order, and still sorts on click. The header cell's name is the column label, without "Sort".
- [x] Shift+←/→ resize, respecting the minimum width; Shift+Backspace resets to the configured or measured width; the width is announced.
- [x] Non-resizable and non-sortable columns ignore those keys.
- [x] With `sticky-header`, moving focus up through a scrolled table keeps the focused cell visible below the header, with and without the info block, in page scrolling and in a consumer's scroll box. The fixed `scroll-margin-top: 95px` is gone.

## Comments

### 2026-11-15: implemented (agent)

All boxes are done. The contributor view is in `src/table/README.md` ("Keyboard and focus": the new "Headers" and "Sticky header"); read that first. The tests are in `OwcTable.keyboard.test-browser.js` under "owc-table headers" (real keys, real clicks) and in `OwcTableHeaderCell.test-browser.js`.

**Decisions on points the spec leaves open**

- **`jsonSorters` is the one sort state, and the header row renders from it**: `aria-sort` on the header cell and `order` on its `owc-table-header-cell` (the arrow). Before, the table copied `jsonSorters` into the header cells once, by position, in `firstUpdated`, and cleared the others on a click. So the arrow now also follows `jsonSorters` set from outside or loaded later, and stays with its column when `overrides` reorder or hide columns. A column with a `sorter` of its own is sorted when `jsonSorters` has the first of its sorters, so its arrow shows from the start also when that sorter's `field` isn't the column's (it didn't before).
- **Several sorters in `jsonSorters`** (only a consumer sets that; a click or a key always leaves one): every column among them has its `aria-sort` and its arrow. ARIA says authors SHOULD mark one header at a time; here the header cells say what the arrows show.
- **The third press unsorts**, as the third click does: `jsonSorters` is `[{ field, order: undefined }]`, `aria-sort` is `none`, and the rows stay in the order they have. Unchanged behaviour of the header cell.
- **`owc-table-header-cell` has a public `cycleSort()`**, which is all its click handler calls. The table calls it for Enter and Space instead of reaching into the element's shadow tree. The element isn't in `exports/`.
- **The sort button keeps its `aria-label`** (`tableSort`). It does nothing while the button is `aria-hidden`; it stays so the term and the three localization tests of the header cell stay meaningful. 11 can drop the label and the term with the changeset if that is preferred.
- **The header cell of a column that can be sorted always keeps the focus**, also when its label has exactly one simple control, which would take the focus by K3. Otherwise such a column couldn't be sorted from the keyboard: the focus would never be on the cell. Enter and Space sort; F2 goes into the cell's controls (interaction mode, with the hint), Escape comes back. The same holds for a sortable header cell with several controls: Enter sorts there, F2 is the way in. Header cells of columns that can't be sorted follow K3 unchanged, so the select-all checkbox takes its cell's focus (K5).
- **Only a plain Enter or Space sorts**, and only on the cell itself. With Ctrl, Cmd, Shift or Alt they do nothing in the header row.
- **The resize keys work from the header cell and from its single control** (focus on a button in the label of a column that can't be sorted), not from the controls of a cell in interaction mode, which get every key.
- **A resize starts from the width the column has**: the user's or the configured `width`, else the measured one, rounded to whole px. The drag differs: its first move only takes over the measured width.
- **At the minimum width (50px), Shift+← says the width again** ("50 pixels wide"), so the user hears that nothing changed.
- **The announcement is the width alone** ("210 pixels wide", `tableColumnWidth`): the focus is on the header cell, so the screen reader has just said which column. After Shift+Backspace it comes once the columns are sized again.
- **Keys a column ignores are left to the page** (no `preventDefault()`): Enter and Space on a column that can't be sorted, the three resize keys on one that can't be resized, and all of them in the body. Space then scrolls the page, as it does on a body cell.
- **What sticks is measured, in CSS custom properties on the host's `style`**, like the existing `--info-height`: `--_owc-table-header-height` (a `ResizeObserver` on `.table-header`, rounded up to whole px). The styles add them up as `--_owc-table-sticky-height` on `#data-table`: 0 without `sticky-header`, the header row with it, plus `--info-height` with an info block. The leading underscore marks them as private.

**Consumer-visible changes, for the changeset (11)**

- The sort buttons are `aria-hidden` and have `tabindex="-1"` themselves (R2 already lists them as no Tab stops). Header cells have `aria-sort`.
- New keys on header cells: Enter and Space (sort), Shift+←/→ (resize by 10px), Shift+Backspace (reset the width).
- A sortable column's header cell with a control in its label: the control is reached with F2, not directly with the arrow keys.
- The sort arrows follow `jsonSorters` whenever it changes (see above).
- `scroll-margin-top` of `.row-container` and of body cells was 95px always. It is now what really sticks, and 0 without `sticky-header`. So a row that the table scrolls to (keyboard focus, a new insert row, a detail that opens and scrolls its row to the top) ends up right below the sticky header, or at the very top of the scroll container without one, not 95px below the top.
- `owc-table-header-cell` elements in the table no longer have the `data-sorter` attribute (the table used it to find them; nothing does anymore).
- New term: `tableColumnWidth` (`en`, `de`, and the copy in `localization.rocket.md`).
- New on the host's `style` attribute: `--_owc-table-header-height`.

**For 05 (groups, details, annotations)**

- Every new row or cell that takes the focus or is scrolled to needs `scroll-margin-top: var(--_owc-table-sticky-height, 0px)`, or a sticky header covers it. Today `.row-container`, `.table-body .cell` and `.full-width-cell` have it; `.group-label-container` has none, since nothing scrolls to a group header yet. A detail row inside its `.row-container` and the group's cell need it once they take the focus.
- `#handleHeaderKey(event, key, cell)` is called for `columnheader` cells before the Enter and F2 branch and returns whether it took the key. The keys of a group's cell (Enter, Space, ←, →) can go in the same place the same way.
- `#focusTargetOf(cell, controls)` is the one place that says where the focus belongs in a cell, used by `#focusCell` and by `#handleGridFocusin`. K8's "a detail's cell always works like a multi-control cell" is one more condition there, next to the one for sortable header cells.
- `isSortable(column)` and `isResizable(column)` are module functions; the selector and the detail toggle columns already are neither.

**For 06 (editing)**

- The header keys only run for header cells, after the checks for an active editor and for interaction mode, so editors are untouched. Shift+Backspace, Shift+← and Shift+→ are still free in the body.

**For 11 (axe, docs, changeset)**

- The Keyboard section needs: Enter and Space on a header cell (sort), Shift+←/→ and Shift+Backspace (resize and reset), and F2 for a control in a sortable column's label.
- axe passes on a plain table with the new header markup and on a standalone `owc-table-header-cell` (both tested). `aria-hidden-focus` is satisfied by the button's own `tabindex="-1"`.
- The C5 benchmark wasn't run. Per render this ticket adds one `find` over `jsonSorters` per sortable column; per focus move at most one `getAttribute` on the cell. The `ResizeObserver` on `.table-header` writes an inherited custom property on the host when the header row's height changes, which is once per table in practice.
- Whether a screen reader says the new sort direction after Enter (the checklist's Sorting item) depends on it announcing a change of `aria-sort` on the focused element. If VoiceOver doesn't, the live region can say it; that needs two terms and isn't built.

**Not verified**

- Screen readers (C3). The names were checked in Chromium's accessibility tree (CDP `Accessibility.getFullAXTree`) on the docs page served from this worktree: the column headers are named "First Name", "Last Name", "Nr.", "Select all" and so on, and no button named "Sort" is in the tree. CDP doesn't list `aria-sort` among a node's properties, so the sort state is only checked as an attribute.
- The look was checked with two screenshots of the docs' sticky header demo (focus moved up through the scrolled table, and a focused, widened header cell), not beyond that.
- Right-to-left: Shift+→ always widens the column.
- Safari and Firefox.
