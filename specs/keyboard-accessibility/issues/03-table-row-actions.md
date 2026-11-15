# 03: Table row actions, links and selection

Status: resolved

**What to build:** Enter on a cell without its own control triggers the row's action: follow the link, toggle the detail, or fire `rowClick`. The row link stays a real `<a>`, moves into the first data cell and always has a name. Selectable tables expose `aria-multiselectable` and `aria-selected`, and Shift+Space toggles the focused row.

Spec: [K4, K5](../spec.md#table-keyboard).

**Blocked by:** 02 (needs 01; waits for 02 because both extend the same keydown handler).

- [x] Link rows: the `<a>` is inside the first data cell (not the selector or details cell), covers the row visually, doesn't cover controls, and pointer clicks on other cells still follow it. In a selectable `linkWithDetail` table, the checkbox and the detail toggle still take focus directly.
- [x] The link takes focus as its cell's control, and is named by `aria-label` from `getRowLinkSettings`, else by its cell's content, else by `tableOpenRow`. The docs' link examples pass axe's `link-name` without changes.
- [x] Enter on any plain cell of a link row navigates; Ctrl/Cmd+Enter and Shift+Enter behave as on a native link (tested by observing the anchor's activation with modifiers, without leaving the test page).
- [x] Enter toggles the detail in `detail`/`detailDeferred` rows and fires `rowClick` in `simple` rows; insert rows have no action.
- [x] `aria-selected` follows selection; Space on the checkbox and Shift+Space anywhere in the row toggle it; select-all works by keyboard.

## Comments

### 2026-11-15: implemented (agent)

All boxes are done. The contributor view is in `src/table/README.md` ("Keyboard and focus": the new "Row actions", "Pointer and rows" and "Selection"); read that first. The tests are in `OwcTable.keyboard.test-browser.js` under "owc-table row actions" and "owc-table selection", with real keys and real mouse clicks.

**Decisions on points the spec leaves open**

- **Every row keeps a first child under its cells** (`renderRowMode`): `div.row-no-click`, or `div.row-click` in `detail`/`detailDeferred` rows, and now `div.row-no-click` in rows with a link too. Only the `<a>` moved. So `:nth-child` on cells counts as before, in the table's own border rules and in consumers' `customStyles`, and the header row and the body rows still count alike. These first children are markers now: they let the pointer through.
- **A click on text follows the link** (before, only a click beside the text did). The link lies under what the cells show, so in rows with a link `.cell-text` and `.cell-full` let the pointer through and only their child elements take it. A click on a child element that is no control of its cell, like a badge, is passed on to the link by the row's click handler, with the click's Ctrl, Cmd and Shift. It isn't passed on when the element's own handler called `preventDefault()`, nor from a `label` or `summary`.
- **The link's name** has a fallback built in: without an `aria-label` from `getRowLinkSettings`, the link has `aria-labelledby` (the content of its cell) and `aria-label="Open row"`. Chromium falls back to the `aria-label` when the referenced content has no text (checked through its accessibility tree for plain HTML: an empty `aria-labelledby` target gives "Open row"), which covers content like an icon. When the content is empty at render time (`undefined`, `null`, `''`, whitespace, `nothing`), there is no `aria-labelledby`.
- **The row shows the focus ring for its link** (`.row::after`), not the link itself: the selector cell and the cell of the detail toggle lie above the link (`z-index`) and covered the left end of its outline while the row was hovered.
- **A click on a row with a link focuses the link**, so the roving focus goes to the row's first data cell, whichever cell was clicked. If that cell has another control, like an editor, the focus is on one of several controls, which is interaction mode (01's rule for pointer focus).
- **Enter with Ctrl, Cmd or Shift only does something in rows with a link.** `detail` and `simple` rows take a plain Enter only. Alt+Enter is never the grid's.
- **A row of a link mode without a link** (`getRowLinkSettings` returns nothing) fires `rowClick` on Enter, as a click on it does.
- **While the focus is parked on the grid, Enter and Shift+Space do nothing.** There is no rendered row to act on, and following a link or changing the selection of a row the user doesn't see would surprise. The navigation keys work as in 02.
- **Shift+Space has its own `keydown` listener**, on `.table-body`, in the capture phase, and stops the key (`#selectionKeyListener`). That is the one exception to "one keydown handler" (a design note): the grid has to take the key before the cell's control sees it. An editable cell's read view starts an edit on Space with any modifier in its own listener, and `preventDefault()` afterwards can't undo that. It leaves the key alone in an editor that is editing and in interaction mode (it is a space there), and on the row's own checkbox, which Chromium toggles natively on Shift+Space, like on Space.
- **Selection checkboxes are named by their content.** `aria-label` on a `wa-checkbox` doesn't reach its input, so the name is rendered as the checkbox's label, which `::part(label)` hides visually: "Select all", and "Select row" (new term `tableSelectRow`) or the `aria-label` of `getSelectorSettings`. The checkbox, its cell and its header cell get their names from it (Chromium's accessibility tree for the same structure in plain HTML: columnheader "Select all", gridcell "Select row").
- **Pointer behaviour of `detail` rows is unchanged**: a click beside what a cell shows toggles the detail, a click on the text doesn't. The toggle moved from the overlay's own listener to the row's click handler, since the overlay lets the pointer through now.

**Consumer-visible changes, for the changeset (11)**

- `a.row-click` is the first child of the row's first data cell, not of `.row`. `customStyles` that select it as `.row > .row-click` or `.row-click:first-child` no longer match it; `.row a.row-click` does. In rows with a link, `.row`'s first child is `div.row-no-click`.
- A click on the text of a row with a link follows the link. That text can't be selected by dragging over it anymore (the drag starts on the link). An element in a cell that handles clicks itself without being a control (a `span` with a click listener) still gets its click, but the click then follows the link too unless the listener calls `event.preventDefault()`; a `button` needs nothing.
- `.row-no-click`, and `.row-click` as a child of `.row`, have `pointer-events: none`. A click beside a cell's content now focuses that cell.
- The cell of the detail toggle (`.open-details`) has `z-index: 10`, like `.cell-selector`.
- The selection checkboxes have text content (their names), so `textContent` of a `.cell-selector` cell isn't empty anymore.
- `renderRowMode()` no longer renders the link. It isn't documented, but it is a public method that a subclass may override.
- New terms: `tableOpenRow`, `tableSelectRow` (`en`, `de`, and the copy in `localization.rocket.md`).
- New in the DOM: `aria-multiselectable` on the grid, `aria-selected` on Data Rows, `aria-label` and `aria-labelledby` on row links, and an `id` (`row-link-name-<index>`) on the content of the link's cell.

**For 04 (headers)**

- Enter on a header cell reaches `#triggerRowAction`, which does nothing for a cell that isn't in a Data Row and doesn't call `preventDefault()`. Take Enter and Space for the header before that branch.
- The Shift+Space listener is on `.table-body`, so it never sees keys from the header row. Shift+←/→ and Shift+Backspace are untouched.

**For 05 (groups, details, annotations)**

- `#toggleDetail(row)` is the one place a user toggles a detail: Enter, the click beside a cell's content, and the toggle button of `linkWithDetail`. `#togglesDetail()` says whether the rows toggle themselves (`detail`, `detailDeferred`). The "Details opened"/"Details closed" announcement fits in there.
- The first data cell (K8's `aria-expanded`) is the cell of `this.#visibleColumns.find(isDataColumn)`, the same cell that holds a row's link.
- `#dataRowOf(cell)` trusts `#positionOf(cell)`. That one still takes every `.full-width-cell` for the message of an empty table (row 0), so a detail or group cell would be taken for the first row: extend `#positionOf` before those become cells, or Enter and Shift+Space act on the wrong row.
- The detail toggle button still gets its `aria-label` as an attribute on the `owc-icon-button` host, which doesn't name the button (axe `button-name`). It goes with `expanded` in 05.
- The group header's `div.row-click` still takes the pointer: only `.row > .row-click` lets it through. There is a test with a real click for it now.
- Whether a click on the text of a `detail` row should toggle the detail, as Enter on that cell does, is open (see above).

**For 06 (editing)**

- In a row with a link, an editable first data column gives its cell two controls: the link and the editor. So the cell keeps the focus, Enter goes into interaction mode (the link first, Tab reaches the editor), and K10's "the editor is the cell's single control" doesn't hold there. Tested as it is ("is one of the controls of a cell that has another one"); decide whether that cell needs something better.
- The Shift+Space listener runs before the editor's own `keydown` listener, so `isActiveEditor` sees the state before the key there. In `#handleGridKeydown` it is the state after it, as 01 noted.
- Insert rows have no row action and can't be selected; Enter and Shift+Space are free there.

**For 11 (axe, docs, changeset)**

- axe passes for link tables with and without `aria-label`, also with an empty first cell. A selectable table has one violation left, `empty-table-header` on the header cell of the selector column: axe wants text of its own there, while Chromium names the cell by its checkbox. The test for the checkbox names ignores that rule with this reason. The `_open-details` column has a really empty header (`label: ''`) and gets the same violation.
- The Keyboard section needs: Enter (row action), Ctrl/Cmd/Shift+Enter (link rows), Shift+Space; and the API tables could say that `aria-label` in `getRowLinkSettings` and `getSelectorSettings` names the link and the row's checkbox.
- The C5 benchmark wasn't run. Per rendered row this ticket adds `aria-selected`, in link modes one `find` over the visible columns, and four `:has()` rules that match per `.row`.

**Not verified**

- That Ctrl/Cmd/Shift really open a new tab or window for Enter on a plain cell: the tests compare the `click` the link gets with the one the browser sends for the same key on the link itself (same modifiers), and one test checks that a plain Enter navigates (`location.hash`). Chromium only; Web Awesome's dropdown item notes that Safari ignores modifiers on scripted clicks.
- Screen readers (C3): the checklist already has the items for link rows and selection.
- The look was checked once with screenshots of a throwaway page (link rows with selector and detail toggle, at rest, with the focus on a row's link, hovered), not in the docs.
