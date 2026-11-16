# 06: Table editing in the grid

Status: resolved

**What to build:** editable cells work inside the grid: their `owc-click-editable-*` element is the cell's single control; Enter or Space starts editing, the editor owns all keys while editing, Enter commits, Escape cancels, and focus returns to the cell's control. The insert flow's new field becomes the remembered cell, and Tab moves between the fields of an insert row.

Spec: [K10](../spec.md#table-keyboard).

**Blocked by:** 05 (needs 01; waits for 05 because both extend the same keydown handler).

- [x] Arrow keys inside an active text input, textarea or autocomplete don't move grid focus.
- [x] Enter commits and Escape cancels, both returning focus to the cell; ↓ then continues grid navigation.
- [x] In an insert row, Tab and Shift+Tab move from field to field, and leave the grid from the last or first field.
- [x] After inserting a row and leaving the grid, tabbing back in returns to the insert row's field.

## Comments

### 2026-11-15: implemented (agent)

All boxes are done. The contributor view is in `src/table/README.md` ("Keyboard and focus": the new "Editing" and "Insert rows"); read that first. The tests are in `OwcTable.keyboard.test-browser.js` under "owc-table editing" (real keys; input, textarea and autocomplete editors), and in `OwcClickEditable.test-browser.js` (Enter in the autocomplete with real keys, the new `label`).

**Decisions on points the spec leaves open**

- **Tab in an insert row goes through the Tab stops of the row's controls**, as a form does, not only through its `owc-click-editable-*` fields: a button in an action column, or a cell with several controls, is part of it. It works from a field, also from one that is editing (the grid takes Tab there before the "keys of an active editor" check), and from a plain cell of the row (Tab goes to the next field after it). From the last or first stop the key is left to the browser, which leaves the grid, since nothing in the grid is a Tab stop while the focus is on a control. In an insert row this comes before interaction mode. Tested with fields and a plain cell; a button or a cell with several controls in an insert row isn't.
- **`src/field-path-helper/getFieldPathContent.js` changed** (outside the table's folder, but it renders the table's editors): it passes the column's label to the editor.
- **A field the focus leaves closes**, as every click-editable does on blur (commit, `editable = false`), and `spreadProps` doesn't open it again for the same element. So Shift+Tab back to a field shows its value (read view), and Enter edits it again. A row rendered anew (scrolled away and back) opens its fields again. Not changed: making visited insert fields stay open would change `owc-click-editable-*` or `getFieldPathContent`, and the spec doesn't ask for it.
- **Link row whose first data column is editable (03's question): left as it is.** The cell has two controls (the link and the editor), so it keeps the focus like any cell with several controls: Enter goes to the link, Tab to the editor, Enter there edits, Escape back to the cell. Both stay reachable, and the row's link is also reachable through Enter on any plain cell of the row. K10's "single control" doesn't hold in that one cell; a special case for it would hide the link from that cell. Tested ("edits in a link row's first data cell ...").
- **While an editor edits outside an insert row, Tab is the editor's**: the browser moves the focus out of the grid and the blur commits, also in interaction mode (tested). Shift+Tab comes back to the cell.
- **Shift+Space**: `src/click-editable` still starts an edit on Space with any modifier. Changing that wouldn't remove the capture listener, which also keeps Shift+Space from pressing buttons, so it stays.
- **The editors' form controls are named by their column**: new `label` property on `owc-click-editable-*` (input and textarea pass it to `wa-input`/`wa-textarea`, whose label part is visually hidden). `getFieldPathContent` sets it from `labelString` or a string `label`; `editableOptions.inputOptions.label` overrides it. axe passes for an insert row with an input, a textarea and an autocomplete editor (tested). The autocomplete needed nothing: its focusable combobox passed axe as it is.

- **The read view shows the focus ring of the theme (S3; 2026-11-16, after the review of the branch):** `.display:focus-visible` in `OwcClickEditable` has `outline: var(--wa-focus-ring, 2px solid Highlight)` and `outline-offset: var(--wa-focus-ring-offset, 1px)`, as `owc-icon-button` does, for all four editors. Until then it had the browser's default ring. In a table cell the ring lies in the padding of `.cell-content` (14px 18px), clear of the cell's `overflow: hidden`; a test compares the ring with everything that clips on its way up to the grid. Where a narrow column cuts the text itself off, it cuts the ring at the same edge.

**Fixed on the way (`owc-click-editable-autocomplete`, also outside the table)**

- Enter in its open dropdown ended the edit without committing: the base `_handleKeyDown` submitted the old value before the dropdown's document listener picked the option, and the pick was then ignored (`editable` was false). Now Enter is left to the dropdown while it is open, the pick commits as a click does, and the read view gets the focus back (closing the dropdown dropped it on `body`). Also after a click on an option, the read view now takes the focus, unless it went somewhere else.

**Consumer-visible changes, for the changeset (11)**

- In insert rows, Tab and Shift+Tab move through the row's fields and controls, and leave the grid from the last or first one (R2 already lists it).
- New property `label` on `owc-click-editable-*` (API row in `OwcClickEditableInput.rocket.md`, README). The table's editors, and `owc-data-detail`'s (it renders them through `getFieldPathContent` too), get their column's or field's label as the accessible name of the input while editing. `wa-input`/`wa-textarea` inside them now render a `label` (visually hidden through `::part(form-control-label)`).
- `owc-click-editable-autocomplete`: Enter on an option commits it (it didn't), and after a pick the focus returns to the read view.
- No new localization terms.

**For 11 (axe, docs, changeset)**

- The Keyboard section needs: Enter or Space on an editable cell starts editing, the editor gets every key while editing, Enter commits, Escape cancels, both back to the cell; Tab/Shift+Tab in insert rows; a visited insert field shows its value and Enter edits it again.
- An editable column of `editableOptions.type: 'checkbox'` renders a plain `wa-checkbox` without a name (not checked by axe here, not part of this ticket). If C2's "editable with an insert row" uses one, it will need a name (its content, like the selection checkboxes).
- The C5 benchmark wasn't run; the benchmark table has no editable columns, and this ticket adds nothing per render (Tab in insert rows is computed per key press).

**Not verified**

- Screen readers (C3): what VoiceOver says for the named editors and when Tab moves between insert fields.
- Safari and Firefox.

### 2026-11-15: fixes from the keyboard-accessibility review

- **One Escape on an editing editor in interaction mode only cancels the edit** (in a link row's first data cell, or in an open detail); the focus stays on the editor's read view, and the next Escape leaves interaction mode. The editor cleared `editable` without `preventDefault`, so the grid's check for an active editor came too late. `OwcClickEditable` now calls `preventDefault` on the Escape it cancels with.
- **The insert flow is guarded by F3:** `#handleInsertClick` no longer focuses the new row's field when the focus left the table while the row was brought in (`scrollToIndex`). Tested in a virtualized table; in a table that renders every row, the field gets the focus in the same task as the click, before a user could move on. "Went elsewhere" means: the focus isn't in the table, and isn't where it was at the click either. A click doesn't focus a button in Safari, so the focus can be on the page when the click comes, and the new field still gets it then; a programmatic `click()` (the virtualization suite's insert tests) is the same case.
