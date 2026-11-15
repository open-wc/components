# 16: One roving focus model for the table and the pinboard

Status: needs-triage

**What to build:** the table's grid and the pinboard's board share how they remember, park and restore the roving focus, and how their key handlers get a key press, instead of each having its own copy. Found by the keyboard-accessibility review (its smells 15 and 17), which shared what could be shared without a redesign: `keyName` (the table's `gridKey` is gone) and `handleInteractionKey` in `src/a11y/`. What is left needs a design.

Spec: [F1, F2](../spec.md#table-and-pinboard-focus), [Design notes](../spec.md#design-notes).

**Blocked by:** None.

- **The roving focus scaffolding.** Both components have `#remembered`, `#rememberedPosition()`, `#pendingPosition` and `#setTabStop`, with the same jobs (remember an item identity plus a position, find it again after a render, hold the focus on an element that is always rendered while an item is brought in, keep exactly one Tab stop), but different shapes: the table remembers a `RowIdentity` from `gridFocus.js`, a column and the index the row had, and keeps the found index per list (`#remembered.items`); the pinboard remembers a list key, an index and a card id. The parking and the "focus is still ours" checks (F3) differ in detail too (`#hasRovingFocus` and `#hadFocusBeforeRender` in the table, `#focusHolder` and `#movingWithFocus` in the pinboard). One controller in `src/a11y/` (identity, position type and "find it again" as callbacks) would need both components' focus code rewritten and their focus tests run against it; that is a redesign, not an extraction.
- **The key handlers' arguments.** The table's handlers take a clump of `(event, key, cell)` or `(event, key, cell, path)` (`#handleHeaderKey`, `#tabInInsertRow`, …) and are tried in a chain of `if`s in `#handleGridKeydown`; the pinboard has a `CardKeyPress` object and a list of handlers (`#cardKeyHandlers`). Giving the table a `CellKeyPress` alone moves the clump into an object; making both dispatch the same way is part of the design above.

- [ ] Decide whether the two models should become one, and where the seam is (what stays per component: identities, positions, what is always rendered).
- [ ] If yes: one module in `src/a11y/` with tests at its interface, both components on it, and their keyboard suites unchanged and green.

## Comments
