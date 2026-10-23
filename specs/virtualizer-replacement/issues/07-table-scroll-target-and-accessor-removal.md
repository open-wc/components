# 07: Table API: `scrollTarget` added, old virtualizer accessors removed

**What to build:** Consumers can name the table's scroll container explicitly through a documented `scrollTarget` property. The accessors that handed out `@lit-labs/virtualizer` internals are removed: `virtualizer`, `virtualizerHost` and `resetVirtualizer()`.

Spec: [T5](../spec.md#table).

**Blocked by:** 05 (Grouped tables virtualize as one list).

**Status:** ready-for-agent

- [ ] `scrollTarget` (an element) overrides the automatic detection; leaving it unset keeps detection on. It is typed and documented in the table's API docs.
- [ ] Browser tests cover an explicit scroll target, including one inside a shadow root.
- [ ] `virtualizer`, `virtualizerHost` and `resetVirtualizer()` are gone from runtime, types and docs, and the table no longer imports `@lit-labs/virtualizer`.
- [ ] The table README and docs page describe virtualization as it now works:
  - the modes and the threshold;
  - scroll-container detection and `scrollTarget`;
  - `visibleData`.
- [ ] The changeset has migration notes for the removed accessors, and the Release Gate passes.
