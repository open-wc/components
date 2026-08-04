# Virtualize pinboard columns with explicit scroll ownership

Status: ready-for-agent

## What to build

Migrate pinboard rendering to the private virtualization integration. Each board column and populated
drop-zone detail list owns an independent range, while small lists use a normal rendering path based
on a meaningful private threshold. Preserve sorted stable card identity and dynamically measure cards
of different heights. Window scrolling remains the default, with an additive public property for an
exact consumer-supplied app-shell scroll target.

This slice establishes correct pinboard rendering and scroll ownership. Drag-specific overscan and
drop behavior are completed by the dependent drag-and-drop issue.

User stories covered: 31-34, 39-50, excluding the drag-specific behavior in 35-38.

## Acceptance criteria

- [ ] Large pinboard columns render bounded DOM while allowing every card to be reached, and small columns render normally without virtualization overhead.
- [ ] Every column and populated drop-zone detail list owns an independent private range and lifecycle.
- [ ] `keyFunction` remains the stable card-identity contract, and sorting occurs before virtual positions are derived.
- [ ] Variable-height cards are dynamically measured and do not overlap or inherit another card's rendered state after sorting or data movement.
- [ ] Window scrolling works by default, and an explicitly supplied element scroll target works across a shadow-root boundary without ancestor discovery.
- [ ] The scroll-target property is an additive Consumer-Visible Change covered by public type validation and owning-module documentation; the private small-list threshold does not become a public mode.
- [ ] Disconnecting and reconnecting the pinboard preserves correct ranges, measurement, and interaction through supported lifecycle APIs.
- [ ] Public-component browser tests cover large and small columns, multiple independently changing columns, variable-height cards, sorting, populated drop zones, both scroll-target modes, and reconnect behavior.
- [ ] Existing imports, custom-element names, card mapping, column configuration, and non-drag callbacks remain compatible.

## Blocked by

- [03 - Remeasure dynamic table rows without lifecycle resets](./03-remeasure-dynamic-table-rows.md)
- [04 - Isolate grouped-table virtual ranges](./04-isolate-grouped-table-ranges.md)
