# 06: Inserting into a big table scrolls to the new row

**What to build:** After a row is inserted into a virtualized table, the insert row (always the last one) scrolls into view, and its first editable field gets focus. Today this silently does nothing when the row isn't rendered.

Spec: [T7](../spec.md#table).

**Blocked by:** 01 (Tracer bullet: a 100k-row table that never stays white).

**Status:** resolved

- [x] In a virtualized table scrolled to the top, inserting a row scrolls to the insert row and focuses its first editable field.
- [x] Without virtualization, inserting behaves as before.
- [x] No fixed timeout drives the flow; it waits until the row is rendered.
- [x] A browser test covers it, a changeset is added, and the Release Gate passes.

## Comments

### 2026-10-12: implementation (branch `virtualizer/06-insert-scrolls`)

**Built**

- `owc-table`'s **New** button runs `#handleInsertClick()`. It adds the row from `handleInsert`, waits for the table update, and brings the new row into view:
  - in a virtualized table, through the controller: `scrollToIndex(index, { block: 'nearest' })` renders the row, scrolls to it and resolves once the list has settled;
  - in a table that renders every row, with `scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })` on the row container.

  It then focuses the first editable field (`[editable]`) of the new row. The 100ms timeout and the window-only `scrollIntoViewIfNeeded` are gone from this flow.
- Tests in `src/table/OwcTable.virtualization.test-browser.js` (`owc-table inserting rows`), all of which wait for `focusin` and the rows to settle, not for a timeout:
  - a 10k-row table scrolled to the top, in each of the four scroll containers (the document, a consumer scroll box, a `display: contents` slot, `owc-layout-sidebar`). Two inserts: the new row is rendered and fully visible, its First Name field has focus, and the visible area stays covered;
  - a 20-row table without virtualization, two inserts, with the same checks;
  - a grouped table, as a regression check for the flow it keeps (see below).
- Docs: the Adding Rows section of `OwcTable.rocket.md` describes the behavior. The changeset is `.changeset/table-insert-scrolls-to-new-row.md`. The 06 bullet in `src/virtualizer/README.md` → For later tickets now says what's left for 05.
- Checked on the docs page, which uses `scroll-behavior: smooth`, in headless Chromium at 1280×900. Real mouse clicks on **New**:
  - in the Adding Rows demo, the new row is already visible, so the page doesn't move, and its First Name field gets focus;
  - in a 100k-row table appended to the page and scrolled to its top, row 100,000 ends flush with the bottom of the viewport with its First Name field focused. A second insert does the same for row 100,001.

  No console errors or warnings.

**Deviations**

- **Grouped tables keep the previous flow** (`#focusFirstEditableField()`: a 100ms timeout, then the first `[editable]` in the whole table, scrolled into view against the window only). They render through `@lit-labs/virtualizer` until 05, as the run instructions said. So the "no fixed timeout" box holds for ungrouped tables, virtualized or not. For grouped tables it still needs doing: once 05 makes them one list, they should take the controller path with the new row's index in that list. The docs and the changeset say "without grouping" until then.
- **`block: 'nearest'`** instead of the old `end`/`start` choice, so a fully visible row doesn't move, and a row below the visible area ends at its bottom edge. This is the old "if needed" behavior, applied to the row and to whatever element scrolls the table.
- **The row is scrolled into view, not the field.** Before, the field's bottom was aligned, which cut off the rest of the row: in the RED run, 15px of the row stayed hidden.
- **Focus goes to the new row's first editable field**, not the first `[editable]` in the table. Before, a second insert focused the earlier insert row again.
- **Instant scrolling without virtualization too.** `scrollToIndex` always scrolls instantly. Without `behavior: 'instant'`, pages with `scroll-behavior: smooth` would animate the scroll and then have it interrupted by the focus, so plain and virtualized tables now end in the same position.

**Unchecked:** none.

### 2026-10-12: resolved

Merged into `feat/virtalizer` in `178739a`. The code review fixes for the whole spec landed afterwards in `72f3b74`.
