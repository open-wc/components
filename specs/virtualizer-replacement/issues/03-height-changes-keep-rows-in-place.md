# 03: Height changes keep the visible rows in place

**What to build:** In a big virtualized table, rows that change height push the rows below them correctly. That includes:

- a detail opening or closing, including detail content that arrives asynchronously;
- annotations;
- cells with multi-line content.

When rows above the visible area turn out taller or shorter than estimated, what the user is looking at doesn't move. The scrollbar may stay approximate until irregular rows have been seen.

Spec: [V4 (open-detail estimate), V5, T6](../spec.md#requirements).

**Blocked by:** 01 (Tracer bullet: a 100k-row table that never stays white).

**Status:** ready-for-agent

- [ ] Opening or closing a detail repositions the rows after it, and async detail content is measured when it arrives (T6).
- [ ] A row with an open detail is estimated with the typical detail height added (V4).
- [ ] When rows above the visible area change height, the visible rows stay where they are on screen (V5). That covers both rows measuring differently than estimated and a detail opening or closing in a row above.
- [ ] Scrolling up through rows with annotations and multi-line cells doesn't jump, and the last row stays reachable.
- [ ] The anchoring approach is chosen (the browser's native scroll anchoring or manual compensation) and recorded in the virtualizer README.
- [ ] `detail` mode still renders closed detail content for every rendered row, so Ctrl+F finds it. `detailDeferred` is unchanged. Open details stay open when their rows leave the rendered range and come back.
- [ ] The benchmark demo gets toggles for `detail` / `detailDeferred` and for annotations. The results are re-recorded under `## Comments`.
- [ ] Browser tests cover the above, a changeset is added, and the Release Gate passes.
