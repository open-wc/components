# 05: Table groups, details and annotations

Status: resolved

**What to build:** group headers and open details become rows of the grid with one full-width cell, which 01 skipped. Group headers hold a `<button aria-expanded>`; Enter, Space, → and ← expand or collapse. Open details have one interaction-mode cell. The expanded state of a detail sits on its toggle button, or on the row's first data cell where there is no toggle. Annotations are announced through the live region when focus enters their row.

Spec: [K7–K9, and K2 for full-width rows](../spec.md#table-keyboard).

**Blocked by:** 04 (needs 01; waits for 04 because both extend the same keydown handler).

- [x] Group headers and open details are rows with one `gridcell` across all columns (`aria-colspan`). ←/→ don't move off it, and ↑/↓ come back to the column the user left (K2).
- [x] Group header button named "<label>, <n> rows", with `aria-expanded`; Enter/Space toggle, → expands, ← collapses; the Others group too.
- [x] Row counts and indices stay right while groups collapse and expand and details open and close (G2).
- [x] An open detail is a full-width row reachable with ↓, and a row only while it is open; Enter/F2 enter it, Escape leaves; closing it from inside moves focus to its Data Row.
- [x] `linkWithDetail`: the toggle button has `aria-expanded`, through a new `expanded` property on `owc-icon-button` with its own test.
- [x] `detail` and `detailDeferred`: the row's first data cell has `aria-expanded`, and the live region announces every toggle.
- [x] No `aria-controls` anywhere in the table.
- [x] Moving focus into an annotated row from another row announces the annotation's text, from the first cell, from a later cell and from a cell whose focus target is a control. The Data Row references the annotation with `aria-describedby`.

## Comments

### 2026-11-15: implemented (agent)

All boxes are done. The contributor view is in `src/table/README.md` ("Keyboard and focus": the new "Rows with one cell", "Groups", "Details" and "Annotations"); read that first. The tests are in `OwcTable.keyboard.test-browser.js` under "owc-table groups", "owc-table details" and "owc-table annotations" (real keys, real clicks), in `gridNavigation.test.js` ("with open details"), `gridFocus.test.js` (`isSameRow`) and `OwcIconButton.test-browser.js` (`expanded`).

**Decisions on points the spec leaves open**

- **A detail row lives in its Data Row's `.row-container`**, after the `.row`, as `div.detail-row`, and the `wa-details` in it is its one cell (`.full-width-cell`). `role="row"`, `aria-rowindex`, `role="gridcell"`, `aria-colspan` and `tabindex="-1"` are only rendered while the detail is open (`openDetails`); closed, `.detail-row` is `role="none"`. In `detail` mode, every rendered row still renders its closed detail, so find-in-page finds it.
- **Positions of details**: `GridPosition` has an optional `detail: true`, at the `row` of the Data Row. `moveInGrid` gets `hasDetail(row)` and puts the detail between its Data Row and the next row: ↓/↑ stop on it, Ctrl+End goes to the detail of the last row if it is open, Ctrl+Home, PageUp and PageDown land on Data Rows (a page counts list items, not details).
- **Enter on a detail without controls does nothing.** A detail is no Data Row (`#dataRowOf`), so it has no row action and Shift+Space selects nothing there.
- **Closing a detail while the focus is on it or in it** (its own `closeDetail`, Enter on a toggle, `openDetails` from outside) moves the focus to its Data Row, in the column the user came from.
- **Group headers**: the draft's design stays. A click anywhere in the header toggles the group (the listener moved from `div.row-click` to `.group-label-container`). The group button is the cell's single simple control and takes the focus; Enter and Space press it natively. ← and → are taken (`preventDefault`) also where they change nothing, like every navigation key. With Shift they are left alone.
- **The toggle button of `linkWithDetail` is named "Details"** (new term `tableDetails`) and has `expanded`. It no longer takes the `aria-label` of `getSelectorSettings`, which gave it the same name as the row's checkbox.
- **"Details opened"/"Details closed" is said on every user toggle in `detail`/`detailDeferred`**: Enter, the click on the row, and `closeDetail` from the detail's content (`#toggleDetail`, `#closeDetail`). Not when a consumer sets `openDetails`, and not in `linkWithDetail`, where the focused toggle's `aria-expanded` says it.
- **Annotations are said when the roving focus comes into their row from another row** (`isSameRow` on what the grid remembered before the focus move): not again while the focus moves within the row, not when it comes back to the same row from outside the table or after a render, and not for a detail (another row). The first focus ever counts as coming from another row. When the same focus move enters interaction mode (a click into an input), the annotation and the hint are said as one message, since the live region would only say the last of two.
- **The pointer in `detail` rows stays as 03 left it**: a click beside a cell's content toggles, a click on the text doesn't (the text stays selectable), Enter on any cell does. Changed on 2026-11-16: a click on the text toggles too, and a drag over it selects it; see 03.
- **`owc-icon-button`'s `expanded`** is `boolean | undefined`, not reflected; `aria-expanded` is only rendered when it is set, never on a link. As an attribute, `expanded="false"` means collapsed.

**Kept and dropped of the stopped agent's draft**

Kept: the group header (button, keys, styles, scroll margin, focus ring), the `moveInGrid` changes for details, `isSameRow`, `expanded` on `owc-icon-button` with its tests and docs, the four terms, and all its tests. Changed: the test "toggles the detail with Enter on a plain cell" now steps over the open detail. Nothing was dropped.

**Consumer-visible changes, for the changeset (11)**

- The `wa-details` of a row is no longer a child of `.row-container`, but of `.row-container > .detail-row`; it has the class `full-width-cell`, and while open `role="gridcell"`, `aria-colspan` and `tabindex="-1"`. `customStyles` that select `.row-container > wa-details` no longer match.
- Group headers: `.group-label` is a `<button>` (was a `span`) inside a new `.full-width-cell` (`role="gridcell"`); `.group-label-container` has `role="row"`, `aria-rowindex` and takes the click itself; its `div.row-click` lets the pointer through. `.group-label-container` no longer has `align-items: center` (the cell fills it) nor `outline: 0`.
- The detail toggle of `linkWithDetail` is named "Details" and has `aria-expanded` on its inner button; the `aria-label` of `getSelectorSettings` no longer reaches it.
- In `detail`/`detailDeferred`, the first data cell has `aria-expanded`.
- Annotated Data Rows have `aria-describedby`, and `.row-annotation` an id (`row-annotation-<data-index>`).
- ↓ from a row with an open detail goes to the detail, not to the next row. Arrow keys stop on group headers; ← and → on a group header collapse and expand it.
- Controls inside an open detail are no Tab stops anymore (`tabindex="-1"`); Enter or F2 on the detail goes in, Escape comes back.
- New terms: `tableDetails`, `tableDetailsOpened`, `tableDetailsClosed`, `tableGroupLabel` (`en`, `de`, and the copy in `localization.rocket.md`).
- New public property `expanded` on `owc-icon-button` (API row in its docs).

**For 06 (editing)**

- `#handleGridKeydown` now runs `#handleGroupKey` right after `#handleHeaderKey`; both only take keys from their own cells. A detail cell is a cell of the grid now: keys from its content arrive with the detail cell as `cell`, and in interaction mode the grid takes Tab, Shift+Tab and Escape from them unless an inner listener prevented them (an `owc-table` nested in a detail does for its own keys). An editor inside a detail is covered by `isActiveEditor` as before.
- `#focusTargetOf` has a third condition (`#isDetailCell`); an insert row never has a detail.
- `#handleGridFocusin` collects what the live region says in `messages` and says it once at the end (`#announceAll`); add to it rather than calling `announce` next to it.

**For 11 (axe, docs, changeset)**

- The Keyboard section needs: group headers (Enter/Space toggle, → expand, ← collapse), details (↓ reaches an open detail, Enter/F2 in, Escape out), and that annotations are said when the focus enters their row.
- `wa-details` renders `role="region"` named by its (hidden) summary, so an open detail's cell contains a region named "Open details". Not changed here; axe may or may not mind a named region inside a gridcell.
- The `summary` inside `wa-details` has `aria-controls`, but is `display: none` (the table hides it), so nothing in the accessibility tree has `aria-controls`; the test checks rendered elements only.
- The C5 benchmark wasn't run. Per rendered row this ticket adds one `find` for the first data column (it was done for link rows only) and, in detail modes, a wrapper element and a few attributes; per focus move one `getAttribute` for the annotation.

**Not done, not verified**

- **Find-in-page opening a closed detail** (Chromium expands a `<details>` it finds text in): `wa-details` opens, but `openDetails` doesn't know, so the detail isn't a row of the grid and the arrow keys don't reach it. That was already so for `openDetails` before this ticket; syncing `openDetails` from `wa-show` would change which details stay open, so it isn't built.
- Content of a detail that renders later than the table (`detailDeferred`, `until()`) stays in the Tab order until the table renders again (as for cells). Not tested: the detail cell's `tabindex="-1"` should take that content out of the order from outside the grid, but Tab from the focused detail cell itself would go into it.
- Screen readers (C3): the announcements of annotations and detail toggles, and how VoiceOver reads a group header button with `aria-expanded` and a detail row, are for the manual check.
- The look was checked with two screenshots of the docs (a focused group header, a focused open detail), not beyond.
- Safari and Firefox.
