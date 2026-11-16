---
'@open-wc/components': minor
---

`owc-table` and `owc-pinboard` work with the keyboard alone, and tell screen readers what they show. The keys are listed in the new Keyboard sections of their docs.

Interaction mode reaches controls in open shadow roots and assigned slots, including nested slots, in their rendered order. Tab and Shift+Tab cycle through them without adding stops to the page's normal Tab order; Escape returns to the cell or card.

`owc-table` is an ARIA data grid with one Tab stop:

- The arrow keys, Home, End, Ctrl+Home, Ctrl+End, PageUp and PageDown move the focus from cell to cell, also to rows a large table hasn't rendered yet. The focus stays on its row through sorting, filtering and scrolling, and Tab returns to the cell that had it last.
- Enter on a cell triggers the row's action: it follows the link of a link row (Ctrl, Cmd and Shift work as on a link), opens or closes a row's detail, or fires `rowClick`. Shift+Space selects the row.
- Header cells sort with Enter and Space, and resize with Shift+← and Shift+→ (Shift+Backspace resets the width). Group headers expand and collapse with Enter, Space, → and ←. An open detail is a row of its own.
- A cell with one link, button, checkbox or editable field gives the focus to it. A cell with several controls, or with a text field, takes the focus itself: Enter or F2 goes to its controls, Tab moves between them, Escape comes back.
- Editable cells start editing with Enter or Space; Enter keeps the value, Escape drops it. In a row that is being added, Tab moves from field to field.
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

- **Tab order.** The selection checkboxes, editable cells, detail toggles and the sort buttons of the headers are no longer Tab stops of their own; the table is one Tab stop, and the arrow keys reach them. Controls inside cells, open details and pinboard cards are no Tab stops either (`tabindex="-1"`). In rows that are being added (`insertData`), Tab still moves from field to field. In `owc-table-settings`, Tab moves through the dropdown instead of closing it.
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
- **New localization terms**, in `en` and `de`: `tableColumnVisibilityLegend`, `tableColumnWidth`, `tableDeleteFilter`, `tableDetails`, `tableDetailsClosed`, `tableDetailsOpened`, `tableGroupLabel`, `tableInteractionHint`, `tableLabel`, `tableMoveColumnDown`, `tableMoveColumnToBottom`, `tableMoveColumnToTop`, `tableMoveColumnUp`, `tableNegateFilter`, `tableOpenRow`, `tableOperator`, `tablePauseFilter`, `tableResumeFilter`, `tableSelection`, `tableSelectRow`, `autoCompleteSearch`, `autoCompleteUseFillMode`, `autoCompleteUseSearch`, and `pinboardCannotDrop`, `pinboardCannotMove`, `pinboardDestination`, `pinboardDropzoneDelete`, `pinboardDropzoneSuccess`, `pinboardInteractionHint`, `pinboardMoveCancelled`, `pinboardMoved`, `pinboardMoveTo`, `pinboardPickedUp`. Language packs of your own fall back to English for them until you add them.
