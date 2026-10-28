# Changelog

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
