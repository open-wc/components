---
'@open-wc/components': minor
---

`owc-table` renders a grouped table as one list, virtualized by the in-house virtualizer like an ungrouped table. No table renders through `@lit-labs/virtualizer` anymore.

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
