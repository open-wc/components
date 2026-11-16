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

A column's configured `width` wins, and dragging the edge of its header cell sets it, as
do Shift+← and Shift+→ on the header cell.
The browser sizes every other column to its content in the header and in the rendered
rows: the widest content that can't wrap, which is the whole text of a cell by default,
and at least 50px. The table then freezes these widths in px, so they don't change
while rows with other content scroll into view. In a large table, the rendered rows are
the ones in and around the visible area when the widths are sized.

The widths are sized again when the data, the filters, the sorters, the columns or the
`overrides` change, when you double-click a column's resize handle or press
Shift+Backspace on its header cell (which also drops a width the user set), when the
window gets wider or narrower, and when you call
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

## Keyboard and focus

The table is an ARIA data grid with one Tab stop
([ADR-0007](https://github.com/open-wc/components/blob/main/docs/adr/0007-table-is-an-aria-data-grid.md)
explains why a grid and not a table). The keys are listed for users in the Keyboard
section of the table's docs; this section describes how the code is laid out.

**Roles.** `#data-table` is the `grid`, `.table-header` and `.table-body` are
`rowgroup`s, every `.row` is a `row`, header cells are `columnheader`s and body cells
`gridcell`s. The containers in between (`#virtualize-container`, `.row-container`, the
spacers) are `role="none"`. An empty table shows its message as a row with one cell
across all columns (`.full-width-cell`, `aria-colspan`). `aria-rowcount` and
`aria-rowindex` count the whole list, not the rendered rows:
[gridRows.js](./gridRows.js) has the math. Group headers and open details are rows with
one cell across all columns too (see Groups and Details below).

**Focus model.** The focus roves over cells. What the grid remembers is a cell
(`#remembered`): what identifies its row plus the index of its column, never an element,
a row object or an index of the list. [gridFocus.js](./gridFocus.js) says what
identifies a row: `getRowId` for Data Rows and insert rows; the object for a row
without an id (`undefined`, `null` or `''`, or `getRowId` throws), such as an insert row
that isn't saved yet, which is found by its id once the object has one; the group's key
for a group header (`OTHERS_GROUP_KEY` for the Others group); and the Data Row's id plus
a `detail` mark for an open detail. The header row and the empty message are symbols.
The grid also keeps the index the row had in the list when it last found it, but only
to know which row takes its place when it is gone. `#rememberedPosition()` is the one
place that turns all that into a position in the current list; it looks through the
list once after the list changed, never while scrolling.

Three rules keep the grid one Tab stop:

- Every cell has `tabindex="-1"`, and at most one element in the grid has
  `tabindex="0"`: the Tab stop. It is the remembered cell while it is rendered (the
  first cell of the first body row before the grid remembers one), never a control.
  While that cell isn't rendered, the grid element itself is the Tab stop, and moves the
  focus on to the cell when it gets it from Tab, which brings the row back in.
- Controls in cells never are Tab stops. After every render, `keepOutOfTabOrder` puts
  `tabindex="-1"` on the native controls and on every custom element in the cells'
  content (`.cell-text`, `.cell-full` and the header cells' labels). On a shadow host
  that takes its whole shadow tree out of the Tab order. The pass shares a composed-tree
  traversal with control discovery, including open shadow roots and assigned slots;
  it only changes attributes on elements it hasn't handled yet or that made themselves Tab stops again.
  Controls that render later than the table, like the content of an `until()`, stay Tab
  stops until the table renders again.
- When a cell gets the focus, the grid decides from the cell's rendered content where
  the focus belongs (`#focusTargetOf`, from `controlsIn`): on the cell, or on its control
  if it has exactly one simple control (a link, button, checkbox or
  `owc-click-editable-*`). Navigation keys focus that element directly. Focus that lands on the cell another way, from Tab or
  from a click beside the control, is handed on to the control. For a press of the mouse
  button that happens when the button comes up (`#forwardFocusOnRelease`): moving the focus
  during the press would keep it from starting a text selection. While the focus is on a
  control, the cell has `tabindex="-1"` too, so nothing in the grid is a Tab stop:
  otherwise Shift+Tab would stop at the cell and be handed back to the control.

A cell with several controls, or with one that isn't simple, keeps the focus itself.
Enter or F2 enters **interaction mode** (`#interactionCell`): the cell's controls get
every key, Tab and Shift+Tab cycle through their Tab stops, and Escape returns to the
cell (`handleInteractionKey` of the [a11y helpers](../a11y/README.md), as in the
pinboard). Focusing one of the controls with the pointer enters it too. On entry, the live
region says how to leave.

**Keys.** One `keydown` listener on the grid, `#handleGridKeydown`, handles all of
them but Shift+Space (see Selection). It finds the cell the key comes from in the event's path and ignores keys from
anywhere else in the grid (annotations), keys another listener
has handled (`defaultPrevented`), and keys from an editable cell's editor while it
edits, except Tab in an insert row (see Editing). `keyName` of the [a11y helpers](../a11y/README.md) names the key (like `Control+Home`),
and [gridNavigation.js](./gridNavigation.js) says where a navigation key moves the focus (`moveInGrid`), as a
position of a row (`HEADER_ROW`, or an index of the list) and a column. `#focusPosition`
then focuses that cell. If its row isn't rendered, it asks the virtualizer for it
(`scrollToIndex`), and the grid element holds the focus meanwhile, so keys keep arriving:
the next key continues from the position that is on its way (`#pendingPosition`).

**Focus through renders.** A render can take the focused cell's element away (its row
left the rendered rows, was filtered out, or its group collapsed), move it (a sort), or
show another row in it (rows of a table that isn't virtualized or grouped aren't keyed).
So `update()` notes whether the roving focus is in the grid before it renders, and if it
is, `updated()` puts it where the remembered cell is now (`#keepFocusAfterRender`):

- on the cell of the remembered row, found by what identifies it, so the focus follows
  a row through a sort and through new row objects with the same ids;
- if the row is gone from the list, on the row that is at its index now, else the next
  row that takes focus, else the one before; on the message if the table is empty;
- if that cell isn't rendered, on the grid element: the focus is **parked**. Parking
  doesn't scroll and says nothing in the live region. When the render is about to take
  the row out of the rendered rows, the focus is parked before the render
  (`#parkFocusBeforeRender`), so it goes from the cell to the grid and is never on the
  page in between.

While the focus is parked, a navigation key moves on from the remembered cell (↓ goes to
the row after it) and brings that row in, and the focus returns to the remembered cell
by itself when its row is rendered again, e.g. after scrolling back. In a row a render
has just created, the controls haven't rendered their shadow trees yet, so the focus
lands on the cell first and moves on to the cell's control a frame later.

The grid never takes the focus from outside: all of this only happens when the focus
was on a cell, in a cell or parked on the grid before the render. A move that waits for
its row (`#focusPosition`) is dropped when the focus has left the grid meanwhile; its
cell becomes the remembered one, so tabbing back in goes there.

The grid still works out where a key comes from through the element that has the focus;
it uses what it remembers for the Tab stop, for keys while the focus is parked, and
after a render.

**Row actions.** Enter on a cell that has the focus itself and no controls triggers the
action of its Data Row (`#triggerRowAction`), which is what a click on the row does:

- A row with a link follows it. The link is a real `<a class="row-click">` in the row's
  first data cell (the first column that isn't the selector or the detail toggle), as the
  cell's first child, before `.cell-content`. It is positioned against `.row`, so it
  covers the whole row, and it counts as a control of its cell: alone, it takes the
  cell's focus, and the row shows the focus ring for it (`.row::after`, above the cells
  that lie above the link); next to another control, like an editor, the cell keeps the
  focus and Enter goes into it. Enter on another cell
  dispatches a `click` on the link (`followLink`) with the key's Ctrl, Cmd and Shift, so
  they open the link as they do on the link itself. That click bubbles through the row,
  which fires `rowClick` as for a pointer click.
- `detail` and `detailDeferred` rows toggle their detail and fire `rowClick`.
- Other rows fire `rowClick`, also the rows of a link mode whose `getRowLinkSettings`
  returns nothing.
- Insert rows, the header row and the message of an empty table have no action.

The link is named by the `aria-label` of `getRowLinkSettings`. Without one, it has
`aria-labelledby` for the content of its cell (`.cell-text` or `.cell-full`, which gets
the id `row-link-name-<data-index>`) and the term `tableOpenRow` as its `aria-label`:
browsers fall back to the `aria-label` when the content has no text, like an icon. For
content that is empty when it renders, there is no `aria-labelledby` at all.

**Pointer and rows.** Every `.row` still has a first child under its cells
(`renderRowMode`: `.row-no-click`, or `div.row-click` in rows that toggle their detail),
which the three `:nth-child(2)` border rules and the hover rule rely on. It lets the
pointer through (`pointer-events: none`), so a click reaches the cell it is on, which
moves the focus there. `#handleRowClick` on the row does the rest: it toggles the
selection for a click in the selector cell, opens the row for a click anywhere else in
it (it follows the row's link, or toggles the detail of a `detail` or `detailDeferred`
row), and fires `rowClick`.

A click on what a cell shows (`.cell-text`, `.cell-full`) opens the row like a click
beside it, unless it is for something else:

- a click for a control of the cell, a `label` or a `summary` (`#isForCellContent`), or
  one that something in the cell handled (`defaultPrevented`);
- a drag. The browser fires `click` for a drag too when the button comes up in the
  element it went down in, or in the row for a drag across cells. `#endsDrag` compares
  the click with where the button went down (`#pressedAt`, more than `DRAG_DISTANCE`
  pixels away), so a drag that selects text only selects;
- the second and third click of a double or triple click on what a cell shows
  (`detail` above 1), which select a word or a line. The first click has opened the
  row, and these don't close it again or follow the link a second time.

All of them still fire `rowClick`, as they do in simple rows. What the cells show keeps
the text cursor, which shows where a selection starts; the hand shows beside it.

In a row with a link, the link takes the clicks beside what the cells show. What the
cells show paints above the link (`.cell-text` and `.cell-full` are positioned and come
after it) and takes the pointer itself, so its text can be selected and controls keep
working. `#handleRowClick` passes a click on it on to the link (`followLink`, with the
click's Ctrl, Cmd and Shift). The selector cell and the cell of the detail toggle come
before the link and would be covered by it, so they have a `z-index`. A click on the
link itself focuses the link, so the roving focus goes to the row's first data cell; a
click on what a cell shows moves it to that cell.

**Selection.** A selectable table has `aria-multiselectable` on the grid and
`aria-selected` on every Data Row; insert rows can't be selected and have none.
Shift+Space toggles the row of the focused cell, also from a control in the cell. It is
the one key with a listener of its own (`#selectionKeyListener`, on `.table-body`): it
runs on the key's way down (`capture`) and stops it, so the control never gets the key.
Otherwise a button would be pressed, and an editable cell's read view, which takes Space
with any modifier in its own `keydown` listener, would start to edit. The listener
leaves the key alone where it is a space (an editor that is editing, the controls of a
cell in interaction mode) and on the row's own checkbox: that one toggles natively, and
its click selects the row like a pointer click. `#toggleSelection` is the one place that
changes the selection of a row. A `wa-checkbox` names its input by its content, not by
an `aria-label` on itself, so the selection checkboxes render their names
(`tableSelectAll`; `tableSelectRow` or the `aria-label` of `getSelectorSettings`) as
content, which `::part(label)` hides visually.

While the focus is parked on the grid, Enter and Shift+Space do nothing: there is no
rendered row to act on, and acting on a row the user doesn't see would surprise.

**Headers.** A header cell (`.cell` with `role="columnheader"`) takes the focus itself.
`#handleHeaderKey` has its keys, and runs before the keys of other cells:

- **Sorting.** `jsonSorters` is the table's sort state, and the header row renders from
  it: `aria-sort` on the header cell of every column that can be sorted (`ascending`,
  `descending`, or `none`; no attribute on the others: `headerSort: false`, `rownum`,
  the selector and the detail toggle), and `order` on its `owc-table-header-cell`, which
  shows the arrow. A column with a `sorter` of its own is sorted when `jsonSorters` has
  the first of its sorters (`#sortOrderOf`). Enter and Space on the cell call
  `cycleSort()` of the `owc-table-header-cell`, which is all its click handler does, so
  keys and clicks go on from the same state. The sort button inside it is for the
  pointer only (`aria-hidden`, `tabindex="-1"`), so the cell is named by its label alone.
- **Focus.** The header cell of a column that can be sorted keeps the focus also when
  its label has one simple control: Enter and Space sort there, and F2 goes to the
  control, as in a cell with several controls. Other header cells follow the rule
  above, so the select-all checkbox takes the focus of its cell. That header cell is named
  "Selection" (`tableSelection`) by a visually hidden span it points to with
  `aria-labelledby`: from its content, the checkbox would add "Select all" to the name,
  and axe can't read the checkbox's name, so the cell would count as empty.
- **Resizing.** On a column that can be resized, Shift+← and Shift+→ change its width
  by 10px, down to the minimum of 50px, and Shift+Backspace resets it. They do what the
  pointer does (`#setColumnWidth` and `#columnResized` for a drag, `#resetColumnWidth`
  for a double-click on the handle), from the cell or from its control, and then say the
  width in the live region (`tableColumnWidth`), after a reset once the columns are
  sized again.
- Columns that can't be sorted or resized leave these keys to the page.

**Sticky header.** With `sticky-header`, the header row and the info block stick over the
top of the scroll container, which can be the page or a box of the consumer's, so
`scroll-padding` isn't the table's to set. Instead, what scrolls into view has a
`scroll-margin-top` of what sticks: `.row-container` (`scrollToIndex`, an opened detail),
and the body's cells, since the grid scrolls the focused cell into view itself and a
native focus only looks at the margin of the focused element. The margin is
`--_owc-table-sticky-height` on `#data-table`: 0 without `sticky-header`, else the height
of the header row (`--_owc-table-header-height`, kept by a `ResizeObserver` on
`.table-header`) plus `--info-height` if there is an info block. `.group-label-container`
and `.full-width-cell` (the cell of a detail and of the empty message) have it too. New
kinds of rows and cells that take the focus need the same margin.

**Rows with one cell.** Group headers, open details and the empty message are rows with
one `.full-width-cell` across all columns (`aria-colspan`). `moveInGrid` keeps ←, →,
Home and End on such a cell, and the position keeps the column the focus came from, so
↑ and ↓ go back to it.

**Groups.** A group header (`.group-label-container`, an item of the list) is a row
whose cell holds a `<button class="group-label">` with `aria-expanded`, named
"<label>, <n> rows" (`tableGroupLabel`); the Others group's too. The button is the
cell's single simple control, so it takes the focus. Enter and Space press it, and the
click toggles the group, as a click anywhere in the header does. `#handleGroupKey` has
→ (expand) and ← (collapse), which do nothing when the group is that way already. A
group header is remembered by its group's key, so the focus stays on it when the groups
are new objects.

**Details.** An open detail is a row of the grid, but no item of the list: it is
rendered inside its Data Row's `.row-container`, after the row, as `.detail-row`, since
the virtualizer counts every element between its spacers as one item. The `wa-details`
in it is its one cell. A position on it is the Data Row's `row` with `detail: true`
(`#positionOf`, `#cellAt`), and `moveInGrid` puts it between its Data Row and the next
row (`hasDetail` in `#gridShape`, from `#openDetailRows.has`). The grid remembers it as
`detailIdentity`; `#rememberedPosition()` finds it where its Data Row is, and turns it
into the Data Row's cell once the detail is closed, so closing it while the focus is in
it moves the focus to the Data Row (`#keepFocusAfterRender`).

- `role="row"`, `aria-rowindex` (the Data Row's plus one), `role="gridcell"`,
  `aria-colspan` and `tabindex` are only there while the detail is open. Every rendered
  row of a detail mode renders its `wa-details`, and in `detail` mode its content too, so
  find-in-page finds its text. Closed, the detail is no row, takes no focus, and is
  `aria-hidden`: the `<details>` in the shadow tree of `wa-details` is a group, which
  would be a child of the row group that isn't a row. (When find-in-page opens a closed
  detail, `wa-details` shows it, but the table doesn't know: it stays hidden from
  assistive technology and out of the grid until `openDetails` has it.)
- Its content is arbitrary, so its cell always keeps the focus (`#isDetailCell` in
  `#focusTargetOf`): Enter or F2 go into its controls, Escape comes back. Enter on a
  detail without controls does nothing; a detail is no Data Row (`#dataRowOf`), so it
  has no row action and no selection. Its controls are kept out of the Tab order like
  the cells' (`CELL_CONTENT`), except content that renders later than the table, like
  that of an `until()`.
- The expanded state: `linkWithDetail` rows say it on their toggle button
  (`owc-icon-button` with `expanded`, named "Details", `tableDetails`). The column of the
  toggles is named "Details" too, by a visually hidden label (`.visually-hidden`), so its
  header cell isn't empty. `detail` and
  `detailDeferred` rows have no toggle, so their first data cell has `aria-expanded`, and
  every toggle (Enter, a click, `closeDetail` from the detail's content) says "Details
  opened" or "Details closed" in the live region (`#toggleDetail`, `#closeDetail`).
- There is no `aria-controls`: the detail row follows its Data Row directly.

**Annotations.** An annotation (`.row-annotation`, with the id
`row-annotation-<data-index>`) is no row: it describes its Data Row
(`aria-describedby`). `aria-describedby` doesn't reach controls in shadow roots and isn't
reliably read for a cell, so `#handleGridFocusin` says the annotation's text in the
live region when the focus comes into its row from another row (`isSameRow` on what the
grid remembered before), whichever cell or control gets the focus. Not again while the
focus moves within the row, nor when it comes back to the row from outside the table.
With the interaction hint in the same focus move, both are said as one message.

**Editing.** An editable cell renders an `owc-click-editable-*` element
(`getFieldPathContent`), which is the cell's single simple control, so it takes the
focus: on its read view (`.display`) while it doesn't edit, in its form control while it
does. The editor does the editing itself, and the grid stays out of its way:

- Enter or Space on the read view start editing in the editor's own `keydown` listener,
  which prevents the key, so the grid leaves it alone (`defaultPrevented`).
- While it edits (`editable`, the property: the attribute is reflected later), every key
  is the editor's (`isActiveEditor`): the arrow keys move the caret, or the option of an
  autocomplete, never the grid's focus. Enter commits, Escape cancels, and both put the
  focus back on the read view, so ↓ moves on from the cell. An invalid value keeps
  editing. The editor runs before the grid's listener, so by the time the grid sees a
  committing Enter or an Escape, `editable` is already false; neither is a key of the
  grid there. Blur commits too, so the focus leaving the cell, and its row leaving the
  rendered rows, commit the edit.
- The autocomplete editor leaves Enter to its dropdown while it is open: the pick
  commits (`change`), and the read view gets the focus back, since closing the dropdown
  takes the focus with it.
- The form control is named by the column (`label` of `owc-click-editable-*`, set from
  `labelString` or a string `label` by `getFieldPathContent`, overridable through
  `editableOptions.inputOptions.label`). It isn't shown.

**Insert rows** render their fields as open editors (`editable: true`), which is why Tab
works there as in a form, the one exception to the grid being one Tab stop:
`#tabInInsertRow` moves
Tab and Shift+Tab to the next or the previous Tab stop of the row's controls, from a
field, also from one that edits, or from a cell of the row. From the last or the first
one, the key is left to the browser: nothing in the grid is a Tab stop while the focus is
on a control, so it leaves the grid. In an insert row this comes before interaction mode,
whose Tab would cycle within one cell. A field the focus leaves commits and closes like
any editor (`spreadProps` sets `editable` only once per element), so coming back to it
shows its value, and Enter edits it again; a row rendered again (scrolled away and back)
opens its fields again. `#handleInsertClick` focuses the new row's first open field,
which makes that cell the remembered one, so tabbing back into the grid returns there.

In a row with a link whose first data column is editable, that cell holds two controls,
the link and the editor. It keeps the focus itself, like any cell with several
controls: Enter goes in (to the link), Tab reaches the editor, Enter there edits. While
it edits, Tab is the editor's and leaves the grid (the edit commits), as from any editor
outside an insert row.

The controls of cells and the live region come from the private
[a11y helpers](../a11y/README.md), which the pinboard uses too.

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
- **Grid**: [gridRows.js](./gridRows.js) (`aria-rowcount` and `aria-rowindex` over the
  whole list), [gridNavigation.js](./gridNavigation.js) (where the navigation keys move
  the focus), [gridFocus.js](./gridFocus.js) (what identifies the row the focus is on)
- **Export**: [csv.js](./csv.js), [excel.js](./excel.js)
- **Misc**: [resolveFieldPath.js](./resolveFieldPath.js),
  [highlightSearchTerms.js](./highlightSearchTerms.js),
  [localTime.js](./localTime.js),
  [dateParserForJsonDecode.js](./dateParserForJsonDecode.js),
  [overrideHelpers.js](./overrideHelpers.js) (column visibility/order
  overrides), [RowClickEvent.js](./RowClickEvent.js)

### SQL selection values

`jsonToSqlFilter` from `@open-wc/components/filter/jsonToSqlFilter.js` accepts an
array of search values for scalar comparisons, matching the Filter Function's
any-choice semantics. For example, `{ field: 'name', operator: 'equal',
value: ['Anna', 'Ben'] }` produces `("name" = ? OR "name" = ?)` with separate
parameters. Negation applies to the complete selection. An empty selection
matches nothing; its negation matches everything. Existing nested AND/OR groups
are preserved, and `some`/`every` retain their native SQL array operands.

## Docs & demos

- [/table/](./OwcTable.rocket.md) - main docs with the full feature tour and API
- [/table-info/](./OwcTableInfo.rocket.md) - action tabs, refresh button, settings tab
- [/table-filter-builder/](./OwcTableFilterBuilder.rocket.md) - JSON filter builder
- [/table-mass-edit/](./OwcTableMassEdit.rocket.md) - bulk editing

## Tests

Browser tests (`npx web-test-runner src/table/`) cover every component:
`OwcTable`, `OwcTableInfo`, `OwcTableHeaderCell`, `OwcTableFilter`,
`OwcTableFilterBuilder`, `OwcTableMassEdit`, `OwcTableSettings`.
The grid's roles and keys are covered by one suite per part:
`OwcTable.grid.test-browser.js` (roles, row and column counts),
`OwcTable.keyboard.test-browser.js` (one Tab stop, the navigation keys, what gets the
focus in a cell, visible focus), `OwcTable.focus.test-browser.js` (focus through renders
and virtualization), and `OwcTable.rowActions`, `.selection`, `.headers`, `.groups`,
`.details`, `.annotations` and `.editing.test-browser.js`. They press real keys
(`sendKeys` from `@web/test-runner-commands`) and click (`sendMouse`) instead of calling
handlers, and share their fixtures and helpers in `OwcTable.test-browser.helpers.js`,
as the pinboard's suites do. `OwcTable.axe.test-browser.js` runs axe over every configuration of the grid:
each `render-mode`, selectable, editable with an insert row, grouped with the Others
group, virtualized, with a sticky header, empty, loading, with annotations and an open
detail, and with the column settings open. `OwcTable.toolbar.test-browser.js` runs it
over the parts around the grid (filter builder, action tabs, mass edit, add-row button),
with one keyboard smoke test each. Both use `expectAccessible` from the
[a11y helpers](../a11y/README.md), which ignores only findings in Web Awesome's markup. Logic tests
(`node --test src/table/*.test.js`) cover the helper modules, including the
operator semantics and their SQL-capability matrix.
