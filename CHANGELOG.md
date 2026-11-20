# Changelog

## 0.4.0

### Minor Changes

- 738672d: `owc-table` and `owc-pinboard` work with the keyboard alone, and tell screen readers what they show. The keys are listed in the new Keyboard sections of their docs.

  Interaction mode reaches controls in open shadow roots and assigned slots, including nested slots, in their rendered order. Tab and Shift+Tab cycle through them without adding stops to the page's normal Tab order; Escape returns to the cell or card.

  `owc-table` is an ARIA data grid with one Tab stop:

  - The arrow keys, Home, End, Ctrl+Home, Ctrl+End, PageUp and PageDown move the focus from cell to cell, also to rows a large table hasn't rendered yet. The focus stays on its row through sorting, filtering and scrolling, and Tab returns to the cell that had it last.
  - Enter on a cell triggers the row's action: it follows the link of a link row (Ctrl, Cmd and Shift work as on a link), opens or closes a row's detail, or fires `rowClick`. Shift+Space selects the row.
  - Header cells sort with Enter and Space, and resize with Shift+← and Shift+→ (Shift+Backspace resets the width). Group headers expand and collapse with Enter, Space, → and ←. An open detail is a row of its own.
  - A cell with one link, button, checkbox or editable field gives the focus to it. A cell with several controls, or with a text field, takes the focus itself: Enter or F2 goes to its controls, Tab moves between them, Escape comes back.
  - Editable cells start editing with Enter or Space; Enter keeps the value, Escape drops it. In a row that is being added, Tab moves from field to field. The read view of `owc-click-editable-*` shows the focus ring of the theme (`--wa-focus-ring`) for the keyboard, in tables and outside them.
  - Screen readers hear the grid's name (new `label` attribute, default "Table"), its row count, the column headers, the sort state, the selection, whether a group or a detail is open, and a row's annotation when the focus moves into the row.
  - The settings tab reorders columns without dragging: a menu on every column's grip, and Alt+↑/↓. Its dropdown is a named group with a list of the columns, and every visibility checkbox is named by its column and its visibility.
  - The form controls of the filter builder, of mass edit and of editable checkboxes are named for screen readers, and a filter's buttons show while one of them has the focus.

  `owc-pinboard` is one Tab stop with a roving focus over its cards:

  - The arrow keys, Home and End move between cards and columns. Enter or F2 goes to the controls in a card.
  - Space picks a card up, ← and → choose where it goes, Space or Enter drops it, Escape puts it back.
  - Every card that can be moved has a Move to… button (Shift+F10 on a card): one click and a menu move it, without dragging. A board with only one destination (one column, no dropzones) has none.
  - Every move, also a drag, runs the same `onLift` and `onDrop` hooks as before, keeps the focus on the card, and is announced.
  - New `cardLabel` (a card's name for screen readers) and `getCardId` (keeps the focus on a card whose object is replaced) properties.
  - The dropzones are buttons that open and close their lists.

  Also new: `expanded` on `owc-icon-button` (sets `aria-expanded` on its button), `label` on `owc-click-editable-*` (names the form control while editing; the table and `owc-data-detail` set it from the column or field), `revealOption(index)` on `owc-autocomplete` (scrolls its open list to an option, rendering it first in a virtualized list), and `listRole` on `owc-autocomplete` (`'list'` for subclasses whose items have controls of their own instead of being options, as the table's settings). The search field of `owc-autocomplete` is named "Search", and its search/fill mode button by what it switches to.

  Fixes:

  - `owc-click-editable-autocomplete`: Enter on an option commits it; before, it ended the edit with the old value. After a pick, the focus returns to the read view.

  Migration:

  - **Tab order.** The selection checkboxes, editable cells, detail toggles and the sort buttons of the headers are no longer Tab stops of their own; the table is one Tab stop, and the arrow keys reach them. Controls inside cells, open details, row annotations and pinboard cards are no Tab stops either (`tabindex="-1"`). F2 on a cell reaches the controls of its row's annotation. In rows that are being added (`insertData`), Tab still moves from field to field. In `owc-table-settings`, Tab moves through the dropdown instead of closing it.
  - **Enter on a row** now triggers its action, as a click does. Handle `rowClick` or the link accordingly if a key listener of yours relied on Enter doing nothing.
  - **The row link moved.** `a.row-click` is now the first child of the row's first data cell (the first column that isn't the selector or the detail toggle), not of `.row`. `customStyles` that select `.row > .row-click` or `.row-click:first-child` no longer match it; `.row a.row-click` does. In rows with a link, the first child of `.row` is a `div.row-no-click`. `.row-no-click`, and `.row-click` as a child of `.row`, let the pointer through (`pointer-events: none`). `renderRowMode()` no longer renders the link.
  - **Clicks on the text of a row.** A click on the text of a row with a link follows the link, and one on the text of a `detail` or `detailDeferred` row toggles its detail (before, only a click beside the text did). The text can still be selected: a drag over it doesn't open the row, and neither does the second click of a double click, which selects a word. An element that handles clicks without being a control, like a `span` with a click listener, still gets its click, but the row is opened too unless the listener calls `event.preventDefault()`. A click beside a cell's content now focuses that cell.
  - **Details.** A row's `wa-details` is now inside `.row-container > .detail-row`, not a direct child of `.row-container`, and has the class `full-width-cell`. A closed detail is `aria-hidden`. `customStyles` that select `.row-container > wa-details` no longer match. The cell of the detail toggle (`.open-details`) has `z-index: 10`, and the toggle no longer takes its name from the `aria-label` of `getSelectorSettings`: it is named "Details". The header of its column is named "Details" too (visually hidden).
  - **Group headers.** `.group-label` is a `<button>` (was a `span`) inside a new `.full-width-cell`. `.group-label-container` is the row, takes the click itself, and no longer has `align-items: center` or `outline: 0`.
  - **Headers.** The sort buttons are `aria-hidden` with `tabindex="-1"`; the header cells have `aria-sort`. The sort arrows follow `jsonSorters` whenever it changes, also when it is set from outside. `owc-table-header-cell` elements in the table no longer have a `data-sorter` attribute. In a sortable column whose label has a control, F2 reaches the control.
  - **Scroll margin.** The rows' and cells' `scroll-margin-top` was always 95px. It is now the height of what sticks above the body (the header row, and the info block with `sticky-header`), and 0 without `sticky-header`. So a row the table scrolls to ends up right below the sticky header, or at the top of the scroll container.
  - **Checkboxes.** The selection checkboxes, the checkboxes of `editableOptions.type: 'checkbox'` and of `formatter: 'checkbox'` have their names as visually hidden content, so the `textContent` of their cells isn't empty anymore. A checkbox in a cell is named by its column's `labelString` or string `label`. The header cell of the selection column holds a visually hidden "Selection" before the select-all checkbox, which names it (`aria-labelledby`).
  - **Form controls with labels.** The `wa-input` and `wa-textarea` of `owc-click-editable-*`, of the filter builder, of mass edit and the search field of `owc-autocomplete`, and the filter builder's `wa-select`s, now render a `label`, hidden visually through `::part(form-control-label)`.
  - **Settings dropdown.** In `owc-table-settings`, the visibility checkboxes have their names as visually hidden content, the legend's checkboxes have their text as content and are no Tab stops, the column rows are `role="listitem"` in a `role="list"`, and the dropdown (`#listbox`) is `role="group"` instead of `listbox`.
  - **`canDrop` and dropzones.** `canDrop` is asked about columns only; a dropzone takes every card. Before, dragging a card over the open list of a dropzone asked `canDrop(card, 'success')` (or `'delete'`) and refused the drop if it returned false, while the dropzone's button took it. Now the open list takes it too. A `canDrop` that returns false for names it doesn't know no longer keeps cards out of open dropzone lists.
  - **Pinboard.** The dropzones are `<button>`s (were `div`s). Every card that can be moved shows a 24px Move to… button in its top corner at the end while the pointer is over it or the focus is in it, and always on touch screens; it lies over the card's content there. The columns are lists and the cards list items, with `aria-posinset` and `aria-setsize`.
  - **New localization terms**, in `en` and `de`: `tableAnnotationHint`, `tableColumnVisibilityLegend`, `tableColumnWidth`, `tableDeleteFilter`, `tableDetails`, `tableDetailsClosed`, `tableDetailsOpened`, `tableGroupLabel`, `tableInteractionHint`, `tableLabel`, `tableMoveColumnDown`, `tableMoveColumnToBottom`, `tableMoveColumnToTop`, `tableMoveColumnUp`, `tableNegateFilter`, `tableOpenRow`, `tableOperator`, `tablePauseFilter`, `tableResumeFilter`, `tableSelection`, `tableSelectRow`, `autoCompleteSearch`, `autoCompleteUseFillMode`, `autoCompleteUseSearch`, and `pinboardCannotDrop`, `pinboardCannotMove`, `pinboardDestination`, `pinboardDropzoneDelete`, `pinboardDropzoneSuccess`, `pinboardInteractionHint`, `pinboardMoveCancelled`, `pinboardMoved`, `pinboardMoveTo`, `pinboardPickedUp`. Language packs of your own fall back to English for them until you add them.

### Patch Changes

- 9fcf32a: Dependencies:

  - `@awesome.me/webawesome` now requires `^3.14.0` (was `^3.11.0`).
  - `@cfworker/json-schema` now requires `^4.1.6` (was `^4.1.1`).

  Fixes:

  - Elements built on the `waves` reactive base no longer throw `issueWarning is not a function` when they hit a development warning, for example a reactive property declared without a getter. The warning is now logged once per kind with `console.warn`.

## 0.3.0

### Minor Changes

- 1d17fb5: `owc-pinboard` renders its columns through the package's in-house virtualizer instead of `@lit-labs/virtualizer`, like `owc-table` and `owc-autocomplete`. A column or dropzone list with 300 cards or more renders only the cards in and around its visible part. Smaller lists render every card, so the browser's find-in-page finds them. The new `virtualizer-mode` attribute (`virtualizerMode`) works like the table's: `auto` (default) from 300 cards on, `always`, or `never`.

  Migration:

  - `keyFunction` is removed. Cards are keyed by their object, like the table's rows and the autocomplete's options. Setting it does nothing anymore.
  - A column is sorted again when its array or the `sorter` changes, not on every render. If a change to a card affects its sort position, assign a new array, e.g. `board.data = [...board.data]` with the column's array copied, or a new `sorter`.

  Dependencies:

  - `@lit-labs/virtualizer` is no longer a dependency. No component uses it anymore.

## 0.2.1

### Patch Changes

- 834e36d: Add an optional `maxFileSize` byte limit to `OwcFileUpload`. Oversized selections show localized inline errors and emit `files-rejected`, while accepted files and existing selections are preserved.
- c8474e6: Fix SQL conversion of multi-select filter values to match the in-memory filter's any-choice behavior. Preserve negation, empty selections, nested groups, and native array operands for `some` and `every`.

## 0.2.0

### Minor Changes

- 9811e01: `owc-autocomplete` lists every matching option, also when there are 50,000 of them. It renders its options through the package's new in-house virtualizer instead of `@lit-labs/virtualizer`.

  - New `virtualizer-mode` attribute (`virtualizerMode` property), with the same values as on `owc-table`: `auto` (the default) renders only the options in and around the visible part of the list from 300 options on, `always` does so for any number of options, and `never` always renders every option.
  - The dropdown no longer stops at 200 options. Every option that matches the search is listed.
  - Fix keyboard navigation in long lists. Arrow keys, `Home`, `End` and wrap-around reach every option, the highlighted option is always scrolled into view right away (also after a search and when the dropdown opens again), and `Enter` selects the option you see. When you have scrolled the list away from the highlighted option, `Enter` scrolls it back into view instead of selecting it; the next `Enter` selects it.
  - The option list grows with its options up to the space available below or above the control, and then scrolls. It no longer takes at least 300px, so short lists get a short dropdown.
  - The option list is its own scroll container, so the dropdown works inside table cells and other containers that clip their content, and inside scrolling layouts such as `owc-layout-sidebar`.
  - Opening a dropdown with 50,000 options is faster: the widest label, which sets the dropdown's width, is found without measuring every label, and it is remembered until the options change.
  - Fix the column settings of `owc-table`: the drag grips for reordering columns stayed hidden until a search had been typed and cleared.

  The autocomplete docs have a new Large option lists section with 50,000-option benchmarks, one with page scrolling and one inside `owc-layout-sidebar`.

  Migration:

  - `maxDropdownOptionsVisible` is removed, together with the `limitedProcessedData` getter that applied it. Every matching option is listed now; `processedData` holds the options the dropdown lists. To render every option at once instead of only the visible ones, set `virtualizer-mode="never"`.
  - The `virtualizer` and `virtualizerHost` getters are removed, without a replacement. The option list is the element with the id `rows` in the shadow root.
  - The option list no longer has the `no-clipping` attribute or an inline `min-height: 300px`.
  - Options are rendered only while the dropdown is open.

- c24bd16: `owc-table` is laid out as one CSS grid. The header row and every body row are subgrid rows of it, and the browser sizes the columns that have no configured `width`.

  - Columns without a `width` fit their content as the browser lays it out, at least 50px: the header label on one line, and the rendered rows, which in a large table are the rows in and around the visible area. Content that can wrap fits its widest word, as before. Then the widths are frozen, so they no longer change while rows with other content scroll into view. Before, a script measured every rendered cell.
  - The widths are sized again when the data, the filters, the sorters, the columns or the `overrides` change, on a double-click on a column's resize handle, when the window gets wider or narrower, and through `recalculateColumnWidths()`. A window resize that only changes the height, like a mobile browser's toolbar hiding while you scroll, no longer sizes them again.
  - When the widths change, a large table measures its rows' heights again, so rows that wrap differently get their new heights. The rendered rows and the scroll position stay.
  - Fix tables first rendered in a hidden container (`display: none`): all their columns were 50px wide. They now fit their content once the table shows.
  - A column whose width comes from a body cell now includes that cell's border, so the first and the last column can be 1px wider than before, and their content is no longer cut off by that pixel.
  - Fix grouped tables being 1px wider than their columns: the click area of a group header no longer reaches past the header's right edge.

  Migration: the table's layout changed for `customStyles` that override it.

  - `#data-table` is a grid (`display: grid`), and `.table-header`, `.table-body`, `#virtualize-container`, `.row-container` and `.row` are subgrids that span all its columns (`grid-template-columns: subgrid`). Rules that change their `display`, their `grid-template-columns` or their width break the alignment of the columns.
  - `.virtualizer-spacer`, `.group-label-container`, `.row-annotation`, `wa-details` and `#empty-message-wrapper` span all columns (`grid-column: 1 / -1`), and their content doesn't size the columns (`contain: inline-size`). They no longer take their width from `--owc-table-width`, which the table still sets.
  - `#loading-indicator` is no longer inside `.table-body`. It is a child of `#data-table` that covers the body's row of the grid.

- c24bd16: `owc-table` renders a grouped table as one list, virtualized by the in-house virtualizer like an ungrouped table. No table renders through `@lit-labs/virtualizer` anymore.

  - Group headers are rows of the same list as the Data Rows, and they look as before: colors, row count and chevron. Group order and the **Others** group work as before.
  - `virtualizer-mode="auto"` counts the Data Rows of all groups toward the 300-row threshold, and group headers and rows being inserted don't count. Before, each group was virtualized on its own once it had 300 rows, so a table with many smaller groups rendered every row.
  - Collapsing or expanding a group removes or adds its rows, also while the table is scrolled far down.
  - Fix row clicks and selection in grouped tables. Before, `rowClick` reported, and the selection checkbox selected, the row at the same position within the ungrouped rows instead of the clicked row.
  - Rows being inserted (`insertData`) can't be selected. Before, checking one counted a selection that matched no row.
  - `visibleData` holds the rendered Data Rows of grouped tables in display order. Before, it stayed empty for grouped tables.
  - Grouped tables render their rows in the first update instead of one animation frame later.
  - `groupList`, `groupSelector` and `othersGroupActive` are reactive properties: changing them groups the rows again.
  - Editing a cell, or several rows with the mass edit, moves rows to another group when the edit changes their group, and the row counts follow. The table renders again as soon as an edited value is in a row: when `handleUpdate` calls `autoSetData()`, or right away for a cell edit without `handleUpdate`.

  The 100,000-row benchmark in the table docs has a **Group by department** toggle.

  Migration:

  - The `.group-rows-container` element that wrapped each group's rows is gone. A group's rows now follow its header (`.group-label-container`) directly, so `customStyles` rules for `.group-rows-container` no longer apply.
  - Grouped tables no longer group their rows on every render. They group them again when `data`, `groupList`, `groupSelector` or `othersGroupActive` change, and after the table's own cell and mass edits. If you change rows' group fields in place outside those editors, assign a new array to `data`, e.g. `table.data = [...table.data]`; calling `requestUpdate()` alone no longer moves the rows to their new groups.

- c24bd16: `owc-table` lays out its header row and body rows as CSS grids that share one column track list. This replaces flex rows sized by generated per-column `nth-child` width rules. Tables look the same.

  Migration: row and cell layout changed from flex to grid, which affects `customStyles` that override it.

  - `.row` is now `display: grid`, and its cells sit on the column tracks. Flex properties on `.row` and `.cell`, and `width`, `min-width` or `max-width` rules on `.cell`, no longer size columns. Set a column's width through its `width` property instead.
  - `renderSizeTableColumnStyles()`, which rendered the per-column width rules, is removed.
  - A custom header `label` template that allows wrapping (`white-space: normal`) no longer wraps when the header is wider than the table. Its column takes the label's single-line width.

- c24bd16: `owc-table` has a new `scrollTarget` property: the element that scrolls the table. It overrides the automatic detection of the scroll container, which stays on while `scrollTarget` is unset; setting it back to `undefined` or `null` turns the detection on again. Use it where the table can't find the element that scrolls it on its own, such as a scroll box inside a closed shadow root, or one that clips its content (`overflow: hidden`) and is scrolled by script.

  The table docs now describe the virtualizer modes and their 300-row threshold, how the table finds its scroll container, and what `visibleData` holds.

  Migration: `virtualizer`, `virtualizerHost` and `resetVirtualizer()` are removed. They handed out `@lit-labs/virtualizer` internals, which the table no longer uses.

  - `virtualizer` (the `@lit-labs/virtualizer` instance) and `virtualizerHost` (the element it rendered into) have no replacement. To work with the rendered rows, await `table.updateComplete`; `visibleData` then holds the Data Rows the table renders.
  - `resetVirtualizer()`: remove the call. The table keeps its row measurements up to date itself. To recalculate column widths after a content change, call `recalculateColumnWidths()`.

### Patch Changes

- 10f5f82: Installing `@open-wc/components` no longer runs an install script. Earlier versions had a `postinstall` script that ran `patch-package`, which the package doesn't depend on, so `npm install` failed with `patch-package: command not found` unless your project had `patch-package` itself. Where it did run, it had nothing to apply, because the patch it was written for was never part of the published package.

  Dependencies:

  - `patch-package` is no longer a dev dependency, and the repository's patch for `@lit-labs/virtualizer` is deleted. `owc-table` and `owc-autocomplete` render through the package's in-house virtualizer now, so no component needs the patched behavior.
  - `@lit-labs/virtualizer` stays a runtime dependency, unpatched, because `owc-pinboard` still virtualizes its columns with it. It is removed once the pinboard moves to the in-house virtualizer.

  Migration: workarounds for the failing install, such as `--ignore-scripts` or a `patch-package` dependency added only for this package, can be removed.

- c24bd16: `owc-table` renders large ungrouped tables through a new in-house virtualizer instead of `@lit-labs/virtualizer`. It applies from 300 Data Rows in `virtualizer-mode="auto"` and always in `virtualizer-mode="always"`. Rows stay in normal flow between two spacer elements (`.virtualizer-spacer`), so they're no longer absolutely positioned.

  - Fix tables that stayed white after scrolling stopped. Rows always cover the visible area once scrolling stops, and when the browser reports an empty part of the table, the table renders the missing rows.
  - Fix the total height of large tables: row heights are measured and unmeasured rows are estimated at the typical measured height, so the last of 100,000 rows can be reached.
  - Find the scrolling element without configuration: the page, the content area of `owc-layout-sidebar`, a scroll box of your own, or a scroll box with a `display: contents` slot. Wrappers that only scroll horizontally don't count.
  - Render the first rows in the first update, without waiting for a frame.
  - `visibleData` holds the rendered Data Rows in display order, and is set in the same update that renders them, so scrolling to new rows costs a single update. Tables that render every row now report all Data Rows in `visibleData`; before, it stayed empty. Rows being inserted are not part of `visibleData`, and they no longer count toward the 300-row threshold.

  The table docs have a new Large Tables section with 100,000-row benchmarks, one with page scrolling and one inside `owc-layout-sidebar`.

- c24bd16: `owc-table`: inserting a row with the **New** button (`handleInsert`) now scrolls to the new row and focuses its first editable field in large virtualized tables too. Before, nothing happened when the new row wasn't rendered, for example in a table of 100,000 rows scrolled to the top. This includes grouped tables, where a collapsed group expands to show its new row.

  - The table no longer waits a fixed 100ms before it scrolls and focuses. It waits until the new row is rendered.
  - The whole new row is scrolled into view, and only when it isn't fully visible yet. This works in whatever element scrolls the table, such as a scroll box of your own; before, only the browser window was checked.
  - Focus goes to the first editable field of the new row. Before, it went to the first editable field anywhere in the table, so a second insert focused the earlier insert row again.

- c24bd16: In large `owc-table` tables (from 300 Data Rows in `virtualizer-mode="auto"`, or with `virtualizer-mode="always"`), the rows you are looking at stay where they are on screen when rows above them change height.

  - Fix rows jumping while you scroll up through rows that are taller than the others, such as rows with annotations or cells with several lines, and after jumping to another part of the table when the table learns how tall its rows really are.
  - Fix rows jumping when a detail above them opens or closes, or when detail content above them arrives asynchronously.
  - Rows with an open detail that haven't been shown yet, for example ones opened through `openDetails`, now count with the typical detail height, so the scrollbar is closer to the real height of the table.

  Opening a detail still scrolls it into view, `detail` mode still renders the closed details of all rendered rows so the browser's find in page sees them, and open details stay open when their rows scroll out of view and back.

  The 100,000-row benchmarks in the table docs can now render details (`detail` or `detailDeferred`) and annotations, and their scripted run reports frames in which the rows jumped.

## 0.1.9

### Patch Changes

- a2cf44a: Show readable English and German validation messages in JsonForm controls and array layouts using the existing localization system. Preserve raw validator errors and validation behavior. Custom renderers can read the optional `validationMessage` field from their renderer state.
- f3481e6: Disable row navigation, detail toggles, and rowClick events for pending table inserts while keeping their editing controls available.

## 0.1.8

### Patch Changes

- 665b6f0: Make closed autocomplete triggers reachable with Tab, including fixed triggers, while keeping disabled controls out of the tab order.
- 665b6f0: Fix JSON form required-field errors appearing on unrelated controls whose names share a prefix, such as `salutation` and `salutationType`. Errors still apply to descendants of a missing required object.
- 26c7bc2: Add a `layouts` property to JsonForm for caller-supplied layout components, registered through scoped elements and selected by `uiSchema.type`. Forward registrations through built-in layouts and register their child forms in the correct scope. Export `LayoutDefinition` and `LayoutRecord` types.

## 0.1.7

### Patch Changes

- 4f869bd: Fix `grow-full-width` tables retaining automatic column widths after resizing or preventing grid containers from shrinking. Automatically sized columns now grow and shrink with their container, including below their natural content widths, while preserving configured and manually resized widths and the 50px column minimum. Automatic sizes are no longer persisted as user preferences.

  Restore full-width sizing when a table is shown again after its data changed while hidden. Keep effective columns local to each table so shared definitions cannot leak widths between instances. Read measured and manually resized widths from `table.visibleColumns`; the input `table.columns` definitions are no longer modified by runtime sizing.

  Restore natural column widths when full-width sizing is disabled, and refit remaining automatic columns after a manual resize finishes. Coordinate concurrent sizing requests and keep natural measurements separate from fitted widths. Awaiting `recalculateColumnWidths()` now includes rendering the resulting widths and processing sizing requests received during measurement.

## 0.1.6

### Patch Changes

- 5d2601d: Keep the autocomplete popover width stable while searching by measuring the full option list.

All notable changes to this project will be documented in this file.

## 0.1.5

- Use inherited Web Awesome spacing, border, radius, and badge font-size tokens in detail cards while preserving explicit `--owc-detail-card-*` overrides.

- Make the detail-card accent rail optional and preserve the bottom border of open cards without body content. To retain the previous default rail, set `accent-color="var(--wa-color-brand-fill-loud)"`.

## 0.1.4

- Render synchronous table row details immediately while retaining the loading state for asynchronous details.
- Measure formatted table cells after virtualized rows become available instead of retaining header-only column widths.
- Restore table header alignment and support the `--owc-table-header-align` compatibility token.

## 0.1.3

Table operator type improvements

## 0.1.2

Json Form Type Fixes

## 0.1.1

Fixing type exports

## 0.1.0

Initial release
