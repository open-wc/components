# 02: Table focus survives virtualization

Status: resolved

**What to build:** the grid remembers its focused cell as a row identity plus a column. When the focused row leaves the rendered range (scrolling, sorting, filtering, collapsing a group), focus parks on the grid element; the next navigation key or tabbing back in brings the row back and focuses the cell. Focus is never pulled back from outside the table.

Spec: [F1–F3](../spec.md#table-and-pinboard-focus).

**Blocked by:** 01.

- [x] Focus is tracked by `getRowId`, or object identity for insert rows (F1). The identities for group headers and detail rows are defined here and get their tests in 05, when those rows take focus.
- [x] Scrolling the focused row out of a 100k-row table parks focus on the grid, never on `body`; ↓ restores the next row in the same column (F2).
- [x] Sorting and filtering keep focus on the same row if it's still in the list, else on the row now at its position.
- [x] Re-rendering with new data objects that keep their ids keeps focus.
- [x] Focus that moved outside the table is never pulled back by a render or an async detail (F3).

## Comments

### 2026-11-15: implemented (agent)

All boxes are done. The contributor view is in `src/table/README.md` ("Keyboard and focus": "Focus model" and the new "Focus through renders"); read that first. The identities are in the new pure module `src/table/gridFocus.js` (node tests in `gridFocus.test.js`), the browser tests in `OwcTable.keyboard.test-browser.js` under "owc-table focus that outlives its row".

**Decisions on points the spec leaves open**

- **What counts as an id.** `getRowId` values `undefined`, `null` and `''` are no id, and the row is identified by its object; `0` is an id (the default `getRowId` never returns it, a custom one may). Insert rows are always identified by their object (`isInsert`), also when they carry an id, as the docs' `crypto.randomUUID()` rows do. A row found by its object is still found after it moved from `insertData` to `data` as the same object.
- **`GroupHeader` has a `key` now**: its group's `key`, and `OTHERS_GROUP_KEY` (a symbol, exported from `groupedList.js`) for the Others group. A detail row is `detailIdentity(id)`: its Data Row's identity plus `detail: true`.
- **A navigation key while the focus is parked moves on from the remembered cell**, it doesn't first go back to it: ↓ goes to the row after it (the ticket's wording). Tabbing back in goes to the remembered cell itself.
- **The focus returns to the remembered cell by itself when its row is rendered again** (scrolling back), without a key. F2 only names the key and Tab; this keeps the focus ring where the keys act from. It never scrolls.
- **Following a row doesn't scroll.** After a sort in a table that renders every row, the focus is on the row at its new place, which may be out of view; the next navigation key scrolls as always.
- **The row is gone:** the row now at its index takes the focus, else the next row that can take it, else the one before (`nearestRow` in `gridNavigation.js`); the message in an empty table. The grid keeps what identified the old row until a cell gets the focus, so with the focus outside the table, a row that is filtered out and comes back is still the one Tab returns to.
- **No body row can take the focus** (every group collapsed, until 05): the focus goes to the first header cell.
- **The Tab stop** is the remembered cell while it is rendered, else the grid element, also when the first body row is rendered (01 fell back to the first cell). Otherwise Tab from the parked grid would stop at that cell on its way out. 01's test "goes to the first cell of the first body row when the last focused cell isn't rendered anymore" became "brings the last focused cell back when it isn't rendered anymore".
- **F3 also covers the grid's own waiting**: a navigation key or Tab that waits for `scrollToIndex` no longer focuses its cell when the focus has left the grid meanwhile (01 did). The cell becomes the remembered one.
- **`getRowId` that throws** for a row without an id while the grid looks for the remembered row counts as "not found" (`#indexOfRow`); rendering that row still throws as before.

**How it works, where the README is short**

- Chromium fires `focusout` with `relatedTarget: null` on a focused element that a render removes or moves, during the render. `#handleGridFocusout` can't tell that from the focus leaving, so it isn't what decides: `update()` notes `#hasRovingFocus()` before rendering (`#hadFocusBeforeRender`), and `updated()` only acts on that.
- Rows of a virtualized or grouped table are keyed by their object (`repeat`), so new objects with the same ids make new elements for every row, and a sort moves elements, which drops the focus too. Rows of other tables aren't keyed: the focused element stays and shows another row. `#keepFocusAfterRender` handles all three the same way: it compares the cell the focus is in with the cell of the remembered row.
- In a row a render has just created, `controlsIn` doesn't see the controls yet (their shadow trees render later), so the focus lands on the cell and is handed on to the control in the next animation frame, if it is still on that cell.
- Looking for a row asks `getRowId` about every row before it: about 1.2ms for 100,000 rows with the default `getRowId` (Node 26, M1 Pro). It happens once per new list, and only once the grid remembers a cell; scrolling doesn't do it (`#remembered.items`).

**For 03 (row actions, links, selection)**

- While the focus is parked, keys arrive with the grid as their target and no cell (`#cellIn` finds none); the navigation keys take `#rememberedPosition()` then. Enter and Shift+Space have no rendered row to act on in that state: decide whether they act on the remembered row or do nothing.
- `#remember(position)` is the one place that writes the remembered row, `#rememberedPosition()` the one that reads it.

**For 05 (groups, details, annotations)**

- `rowIdentity` already returns the group identity for a `GroupHeader`, and `indexOfRow` finds it, so a group header that becomes a cell is remembered without more work once `#positionOf` knows its cell.
- Details aren't items of the list: `#remember` and `#rememberedPosition` only know list items. A detail cell needs `detailIdentity(id)` in `#remember`, and a position of its own. `indexOfRow` returns the Data Row's index for a detail identity, which is where the focus belongs when the detail is closed (K8).
- `#hasRovingFocus()` only counts cells and the grid element. Focus inside a detail, an annotation or a group header isn't kept through a render until those are cells.
- Collapsing a group with the pointer while the focus is in one of its rows: the click on the header moves the focus to the page first (the header isn't focusable yet), so the render doesn't move it (F3). Collapsing through `groupList` with the focus in the group moves the focus to the next row that takes it (tested). Once group headers take focus, "nearest" lands on the group's header if it is at the row's old index.
- The test "isn't taken back when a detail finishes loading" passes without any detail code today (`until()` doesn't render the table); it is there for the focus handling 05 adds.

**For 06 (editing)**

- Scrolling the row of an active editor away commits the edit, as before this ticket: the editor commits on blur, and Chromium blurs a removed element. Now the blur comes from parking the focus before the render. Half-typed input in other cells of the row is still lost.
- `#handleInsertClick` is unchanged and isn't guarded by F3: it focuses the new row's field after its waits, wherever the focus is by then.

**Not done, not verified**

- The C5 benchmark wasn't run again (11 does). Per render while scrolling, this ticket adds one `activeElement` check before the render and replaces 01's `indexOf` over the rendered rows with a cached index.
- Screen readers: what VoiceOver says when the focus is parked on the grid and when it returns to a cell by itself after scrolling back is for the manual check (C3); `manual-screen-reader-check.md` has an item for it now.

### 2026-11-15: insert rows go by their id once they have one (keyboard-accessibility review)

The review found that "Insert rows are always identified by their object" above departs from F1 ("object identity for insert rows until they have an id"): a saved insert row that came back as a new object lost the focus. Now every row goes by its `getRowId` id when it has one, insert rows included, and by its object while it has none (also where `getRowId` throws, as the default does for a row without an `id`). A row remembered by its object that has an id by the time the grid looks for it (the consumer set `row.id` on save) is found by that id, so it is found among new objects too. `rowIdentity` lost its `isInsert` option; `indexOfRow` skips rows `getRowId` throws for, instead of the table catching it for the whole search. The browser test "follows an insert row by its object, since its id is not final" became "follows an insert row by its id, and by its object until it has one", plus "stays on an insert row without an id that is saved and comes back as a new object with its id".
