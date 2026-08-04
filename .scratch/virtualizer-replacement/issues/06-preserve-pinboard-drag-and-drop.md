# Preserve drag-and-drop across virtualized pinboard columns

Status: ready-for-agent

## What to build

Complete the pinboard migration by preserving its drag-and-drop behavior while columns and populated
drop zones are virtualized. During a drag, keep the source and nearby viable targets mounted with
temporary overscan, then restore the normal policy after drag end or drop. Existing callbacks,
default movement, rejection feedback, configured drop zones, card identity, and styling remain the
component's responsibility rather than leaking into the virtualization integration.

User stories covered: 35-38, 49, and 50.

## Acceptance criteria

- [ ] A card can be dragged between virtualized columns and the existing lift/drop callbacks receive the correct card and source or destination column.
- [ ] Default card movement remains correct when consumers do not replace the callback behavior.
- [ ] The source card and nearby drop targets remain mounted while dragging and scrolling, with overscan returning to its normal value after drop or drag end.
- [ ] `canDrop` rejection remains visibly and behaviorally reliable throughout a drag, including after virtual ranges change.
- [ ] Optional success and delete drop zones continue to accept configured drops, and their populated detail lists retain stable card identity.
- [ ] Sorting, card mapping, variable-height measurement, drag styling, and card identity remain correct after a move or rejected drop.
- [ ] Public-component browser tests cover cross-column movement, rejected targets, success and delete zones, drag end, and scrolling during a drag with large virtualized columns.
- [ ] Drag interactions produce no blank ranges, disappearing required targets, stale rendered cards, or uncaught observer errors.

## Blocked by

- [05 - Virtualize pinboard columns with explicit scroll ownership](./05-virtualize-pinboard-columns.md)
