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

## Responsive widths

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
for the measured widths to be applied and rendered. Concurrent requests are combined;
changes requested during measurement are processed before the promise resolves.

Column definitions can be shared between tables. Read measured or manually resized
widths from `table.visibleColumns`; runtime sizing no longer modifies the input
`table.columns` definitions.

## Helper modules (pure logic)

- **Filter domain**: [operatorSemantics.js](./operatorSemantics.js) (single
  owner of operator behavior - in-memory `evaluate` + SQL `toSql`),
  [operators.js](./operators.js) (operator labels),
  [jsonToFilter.js](./jsonToFilter.js) (JSON filter → filter function),
  [jsonToSqlFilter.js](./jsonToSqlFilter.js) (JSON filter → SQL),
  [filterFieldValue.js](./filterFieldValue.js)
- **Sorting**: [jsonToSorters.js](./jsonToSorters.js), [compare.js](./compare.js)
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
