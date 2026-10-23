# 06: Inserting into a big table scrolls to the new row

**What to build:** After a row is inserted into a virtualized table, the insert row (always the last one) scrolls into view, and its first editable field gets focus. Today this silently does nothing when the row isn't rendered.

Spec: [T7](../spec.md#table).

**Blocked by:** 01 (Tracer bullet: a 100k-row table that never stays white).

**Status:** ready-for-agent

- [ ] In a virtualized table scrolled to the top, inserting a row scrolls to the insert row and focuses its first editable field.
- [ ] Without virtualization, inserting behaves as before.
- [ ] No fixed timeout drives the flow; it waits until the row is rendered.
- [ ] A browser test covers it, a changeset is added, and the Release Gate passes.
