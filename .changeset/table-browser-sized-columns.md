---
'@open-wc/components': minor
---

`owc-table` is laid out as one CSS grid. The header row and every body row are subgrid rows of it, and the browser sizes the columns that have no configured `width`.

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
