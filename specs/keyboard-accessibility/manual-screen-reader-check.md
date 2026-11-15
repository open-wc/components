# Manual screen reader check

Run before the table and pinboard launch posts, against the docs pages (`npm start`). Required: VoiceOver + Chrome on macOS, and NVDA + Chrome on Windows for the items marked NVDA. Nice to have: NVDA + Chrome for the rest. Record the date, versions and any failures under `## Comments` of [ticket 11](issues/11-axe-docs-changeset.md).

## Table (`OwcTable.rocket.md`)

- [ ] Tabbing into the Simple Example announces the grid's name, its row and column count, and the focused cell with its column header.
- [ ] ↑/↓/←/→ announce the new cell; moving to another column announces its header.
- [ ] Rows as Links: a row is announced as a link named by its first data cell; Enter opens it; Cmd+Enter opens it in a new tab.
- [ ] Rows as Links, without a screen reader: with the focus on a row's link, the focus ring surrounds the whole row; from another cell of the row, Enter opens the link, Cmd+Enter (Ctrl+Enter on Windows) opens it in a new tab and Shift+Enter in a new window, as they do on the link itself.
- [ ] Selectable rows: the checkbox and the row's selected state are announced; Shift+Space toggles it.
- [ ] Sorting: a sortable header is announced with its label and sort state, without a separate "Sort" button; Enter announces the new sort direction.
- [ ] Resizing: Shift+→ on a header announces the new width.
- [ ] Grouping Rows: a group header announces its name, row count and expanded state; ← and → collapse and expand it.
- [ ] Row Details with a toggle (`linkWithDetail`): the toggle announces expanded or collapsed; ↓ reaches the open detail; Enter enters it, and the "Press Escape" hint is read.
- [ ] Row Details without a toggle (`detail`): Enter on any cell of the row announces "Details opened" or "Details closed".
- [ ] Row Annotations: the warning text is read when focus enters an annotated row, from the first cell, from a later cell and from a checkbox.
- [ ] Editable cells: Enter starts editing, the input is announced, Escape returns to the cell.
- [ ] Insert row: after adding a row, Tab moves from field to field and leaves the table after the last one.
- [ ] Benchmark (100k rows): Ctrl+End announces the last row with the right row number out of the total.
- [ ] Benchmark (100k rows): with the focus on a cell, scrolling its row far out of view with the mouse or trackpad moves the screen reader's focus to the grid (its name is read, nothing else); ↓ then announces the cell of the next row, and scrolling back instead announces the cell again.

## Pinboard (`OwcPinboard.rocket.md`)

- [ ] Tabbing into the board announces the column list's name and the card's name and position ("2 of 5").
- [ ] Space announces the pick-up; ←/→ announce each destination, including "can't drop" columns; Space announces the drop; Escape announces the cancel.
- [ ] After a drop, focus is on the moved card and its new position is announced.
- [ ] Shift+F10 opens the Move to… menu; disabled destinations are announced as dimmed or unavailable.
- [ ] Enter on a card with links or buttons enters it, the Escape hint is read, and Escape returns to the card.
- [ ] The Done and Delete dropzones are announced as buttons with their expanded state.
- [ ] An open dropzone list is announced with its name, and → from the last column reaches its cards.
- [ ] NVDA, browse mode: a card's Move to… button is found with the virtual cursor, opens its menu, and moves the card; the dropzone buttons are found the same way.
- [ ] NVDA, focus mode (Insert+Space): the arrow keys and pick-up mode work as with VoiceOver.

## Without a screen reader

- [ ] Every focus target shows a clearly visible focus ring: table cells, header cells, group buttons, controls in cells, cards, dropzones and the Move to… button.
- [ ] Safari and Firefox (not a gate): Tab into the table and the board, move with the arrow keys, sort a column, pick up and drop a card.
