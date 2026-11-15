# The table is an ARIA data grid with one Tab stop

`owc-table` follows the WAI-ARIA Authoring Practices **data grid** pattern rather than the static table pattern. The table has selection, inline editing, row links, row details, sorting, grouping and virtualization of 100k rows. With the static pattern every checkbox, editor, toggle and link would stay its own Tab stop, so a keyboard user would Tab through thousands of controls to leave the table. As a grid, the table is one Tab stop, arrow keys move a roving focus between cells, and the controls inside cells leave the Tab order and are reached through their cell. Insert rows are the one exception: their fields render as open editors, so Tab still moves from field to field there. The grid stays flat (`role="grid"`, not `treegrid`): groups are one level deep, and screen reader support for `treegrid` is weaker. A group header's expanded state therefore sits on a button inside its cell, since ARIA 1.2 only allows `aria-expanded` on rows of a `treegrid`.

This is hard to reverse: it changes the Tab order and the semantics every consumer, test and assistive technology user relies on, and it is a migration for anyone who tabs through the table's controls today.

## Considered Options

- **Static table pattern** (`role="table"`, native Tab order): simplest, and screen reader browse mode reads it well. Rejected because Tab would visit every interactive control of every rendered row, and virtualization would make that order change while scrolling.
- **`treegrid`** for grouped tables: conveys the group hierarchy with `aria-level` and allows `aria-expanded` on rows. Rejected for weaker screen reader support and because only grouped tables would need it, which would give the table two different keyboard models.
- **Row focus instead of cell focus**: fewer focus stops, but editable cells, links and checkboxes would need a second navigation mode inside the row anyway, and sorting needs focusable header cells.
