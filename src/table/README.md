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

## Virtualized rows

`virtualizerMode` retains its established `always`, `auto`, and `never` modes.
In `auto` mode, tables begin virtualizing at 300 rows; smaller lists render
normally. Virtualized tables use window scrolling by default. Set the additive
`scrollTarget` property to the exact application-shell element that owns
vertical scrolling. The table does not infer a scrolling ancestor.

Rows are measured after rendering and remeasured when column widths change, so
wrapped cells, annotations, details, and grouped lists retain correct heights.
This is an implementation detail: consumers should use the documented table
properties rather than relying on virtualized row markup.

## Tests

Browser tests (`npx web-test-runner src/table/`) cover every component:
`OwcTable`, `OwcTableInfo`, `OwcTableHeaderCell`, `OwcTableFilter`,
`OwcTableFilterBuilder`, `OwcTableMassEdit`, `OwcTableSettings`. Logic tests
(`node --test src/table/*.test.js`) cover the helper modules, including the
operator semantics and their SQL-capability matrix.
