# Table

`<owc-table>` is the package's data table: sortable, filterable, selectable,
editable, virtualized, with URL/localStorage state persistence, CSV/Excel
export, grouping, sums, detail rows, and an action-tab bar. It is a family of
components plus a set of pure helper modules that also ship as their own
public exports (`table/*`, `filter/*`).

## Components

| Element                    | Role                                                                       | Source                                                 |
| -------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------ |
| `owc-table`                | The table itself                                                           | [OwcTable.js](./OwcTable.js)                           |
| `owc-table-info`           | Action-tab bar above the table (info, export, filter, mass edit, settings) | [OwcTableInfo.js](./OwcTableInfo.js)                   |
| `owc-table-header-cell`    | Header cell with sorting/filtering                                         | [OwcTableHeaderCell.js](./OwcTableHeaderCell.js)       |
| `owc-table-filter`         | Column filter UI                                                           | [OwcTableFilter.js](./OwcTableFilter.js)               |
| `owc-table-filter-builder` | Standalone JSON-filter builder                                             | [OwcTableFilterBuilder.js](./OwcTableFilterBuilder.js) |
| `owc-table-mass-edit`      | Bulk-edit selected rows (mass-edit tab)                                    | [OwcTableMassEdit.js](./OwcTableMassEdit.js)           |
| `owc-table-settings`       | Column visibility/order settings (settings tab)                            | [OwcTableSettings.js](./OwcTableSettings.js)           |

## Column widths

The table is one CSS grid (`#data-table`), and the header row and every body row
(`.row`) are subgrid rows of it, so the browser keeps their cells aligned. The
containers in between (`.table-header`, `.table-body`, `#virtualize-container`,
`.row-container`) are subgrids across all columns too. Spacers, group headers,
annotations, details and the empty message span all columns, and their content doesn't
size them.

A column's configured `width` wins, and dragging the edge of its header cell sets it.
The browser sizes every other column to its content in the header and in the rendered
rows: the widest content that can't wrap, which is the whole text of a cell by default,
and at least 50px. The table then freezes these widths in px, so they don't change
while rows with other content scroll into view. In a large table, the rendered rows are
the ones in and around the visible area when the widths are sized.

The widths are sized again when the data, the filters, the sorters, the columns or the
`overrides` change, when you double-click a column's resize handle (which also drops a
dragged width), when the window gets wider or narrower, and when you call
`recalculateColumnWidths()`. Scrolling never sizes them. A table that isn't laid out
when it sizes them (inside `display: none`) lets its columns fit their content until
it has a width, and sizes them then. When the widths change, a large table measures
its rows' heights again, since rows can wrap differently.

Set `grow-full-width` to fit automatically sized columns to the table's container.
These columns grow and shrink when the container changes size. Configured widths,
manually resized columns, and non-resizable columns retain their widths. Automatic
columns keep a minimum width of 50px; if the container cannot accommodate those
minimums and the fixed columns, the table overflows. Automatic widths are not saved
as user preferences.

Turning `growFullWidth` off restores content-based automatic widths; turning it on
fits them to the container again. Finishing a manual column resize preserves that
column's chosen width and refits the remaining automatic columns.

Call `await table.recalculateColumnWidths()` after a custom content change to wait
for the widths to be sized and rendered. Concurrent requests are combined; changes
requested while sizing are processed before the promise resolves.

Column definitions can be shared between tables. Read sized or manually resized
widths from `table.visibleColumns`; runtime sizing no longer modifies the input
`table.columns` definitions.

Set a column's width through its `width` property: `customStyles` rules that size
`.cell` elements have no effect on the columns, and rules that change the `display`
of the grid, of its subgrids or of the rows break the alignment.

## Large tables

`virtualizer-mode` decides whether the table renders every row or only the rows in and
around the visible area:

- `auto` (default): only those rows from 300 Data Rows on, every row below that. Rows
  being inserted (`insertData`) and group headers don't count toward the 300.
- `always`: only those rows, for any number of rows.
- `never`: every row.

While the table renders only part of its rows, the others aren't in the DOM, so
find-in-page and printing only see the rendered rows. The body renders them in normal
flow between two `.virtualizer-spacer` elements that stand in for the rows above and
below. A private controller decides the range and the spacer heights; contributors
find how it works in the [virtualizer README](../virtualizer/README.md).

The table finds the element that scrolls it on its own. It walks up from the table
through slots and shadow roots, skips `display: contents` elements, and takes the first
element whose `overflow-y` scrolls and whose content overflows it. It stops at
`position: fixed` elements, open popovers and modal dialogs, and falls back to the page.
`scrollTarget` names the scroll container explicitly and turns the detection off;
setting it back to `undefined` or `null` turns it on again. Consumers need it where
detection can't see the container: a scroll box in a closed shadow root, or one that
clips (`overflow: hidden`) and is scrolled by script. Even with a wrong container the
table doesn't stay empty: when an empty part of the table becomes visible, it renders
the missing rows, but a frame later.

`visibleData` holds the Data Rows the table renders, in display order: the visible rows
and a buffer above and below them, or, when the table renders every row, all filtered
Data Rows except those of collapsed groups. Group headers and rows being inserted
aren't part of it. It is set in the same update that renders the rows, so a new range
costs a single update.

Rows can have different heights: details, annotations and multi-line cells are measured
as they render. The rows in view stay in place when rows above them turn out taller or
shorter than estimated, or when a detail above them opens or closes. Open details stay
open when their rows leave the rendered range and come back (`openDetails` tracks them),
and rows with an open detail that haven't rendered yet count with the typical detail
height. In `detail` mode, every rendered row renders its closed detail, so find-in-page
finds detail content in the rendered rows.

## Grouping

With `groupSelector` and `groupList` set, the table body is one list in which each
group's header (`.group-label-container`) is followed by the group's rows while the
group is expanded. [groupedList.js](./groupedList.js) lays that list out. It is
virtualized like an ungrouped table: `virtualizer-mode="auto"` counts the Data Rows
of all groups toward the 300-row threshold, and group headers and insert rows don't
count. Row clicks and selection resolve the row that was rendered, never a position,
and the `rownum` formatter numbers rows within their group. Changing `groupList`,
`groupSelector` or `othersGroupActive` re-renders the table. A cell edit or a mass edit
that changes a row's group moves the row once the value is in the row (written by the
table, or by `autoSetData()` in `handleUpdate`); updates for scrolling don't group the
rows again. Group fields changed in place outside those editors need a new `data` array
(`table.data = [...table.data]`); `requestUpdate()` alone doesn't group the rows again.

## Helper modules (pure logic)

- **Filter domain**: [operatorSemantics.js](./operatorSemantics.js) (single
  owner of operator behavior - in-memory `evaluate` + SQL `toSql`),
  [operators.js](./operators.js) (operator labels),
  [jsonToFilter.js](./jsonToFilter.js) (JSON filter → filter function),
  [jsonToSqlFilter.js](./jsonToSqlFilter.js) (JSON filter → SQL),
  [filterFieldValue.js](./filterFieldValue.js)
- **Sorting**: [jsonToSorters.js](./jsonToSorters.js), [compare.js](./compare.js)
- **Grouping**: [groupedList.js](./groupedList.js) (a grouped table's group headers and
  rows as one list)
- **Export**: [csv.js](./csv.js), [excel.js](./excel.js)
- **Misc**: [resolveFieldPath.js](./resolveFieldPath.js),
  [highlightSearchTerms.js](./highlightSearchTerms.js),
  [localTime.js](./localTime.js),
  [dateParserForJsonDecode.js](./dateParserForJsonDecode.js),
  [overrideHelpers.js](./overrideHelpers.js) (column visibility/order
  overrides), [RowClickEvent.js](./RowClickEvent.js)

## Docs & demos

- [/table/](./OwcTable.rocket.md) - main docs with the full feature tour and API
- [/table-info/](./OwcTableInfo.rocket.md) - action tabs, refresh button, settings tab
- [/table-filter-builder/](./OwcTableFilterBuilder.rocket.md) - JSON filter builder
- [/table-mass-edit/](./OwcTableMassEdit.rocket.md) - bulk editing

## Tests

Browser tests (`npx web-test-runner src/table/`) cover every component:
`OwcTable`, `OwcTableInfo`, `OwcTableHeaderCell`, `OwcTableFilter`,
`OwcTableFilterBuilder`, `OwcTableMassEdit`, `OwcTableSettings`. Logic tests
(`node --test src/table/*.test.js`) cover the helper modules, including the
operator semantics and their SQL-capability matrix.
