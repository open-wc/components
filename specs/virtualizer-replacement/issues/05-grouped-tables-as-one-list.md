# 05: Grouped tables virtualize as one list

**What to build:** A grouped table renders as one virtualized list in which group headers are rows.

- Collapsing or expanding a group removes or adds its rows.
- Clicks and selection find the right row by id.
- No table list renders through `@lit-labs/virtualizer` anymore.

This supersedes the separate minimal fix for grouped rows resolving the wrong row, if that fix has landed. 04 also restructures the table body, so coordinate with it to avoid merge conflicts.

Spec: [T3, T4](../spec.md#table).

**Blocked by:** 01 (Tracer bullet: a 100k-row table that never stays white).

**Status:** ready-for-agent

- [ ] Group headers render as rows inside the single list and look as they do today: colors, count badge, chevron. Group order and the "others" group work as today.
- [ ] Collapsing or expanding a group removes or adds its rows, also while scrolled down.
- [ ] Row clicks and selection resolve the right row in every group. The test uses groups whose rows are interleaved in the data.
- [ ] The `auto` threshold counts Data Rows across all groups; group headers and insert rows don't count (T3).
- [ ] `visibleData` holds the rendered Data Rows in display order for grouped tables too (T4).
- [ ] Grouped tables pass the same "covered once scrolling stops" checks as 01.
- [ ] No table list renders through `@lit-labs/virtualizer` anymore. Its accessors are removed in 07.
- [ ] The benchmark demo gets a grouping toggle. A changeset is added, and the Release Gate passes.
