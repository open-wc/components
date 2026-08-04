# Preserve flat-table virtualization and explicit scroll ownership

Status: ready-for-agent

## What to build

Migrate the ungrouped table path to the private virtualization integration while preserving the
table's established page layout and behavior. Window scrolling remains the default, and consumers
with an app-shell scroller gain an additive public property for supplying the exact scroll target.
Keep `virtualizerMode`, the 300-row automatic threshold, stable row identity, bounded rendering, and
`visibleData` semantics intact across sorting, filtering, and replacement data.

This slice covers the ordinary flat-table path. Dynamic row reflow and grouped lists are completed
by their dependent issues.

User stories covered: 13-19, 24-27, 30, and the table portions of 40-49.

## Acceptance criteria

- [ ] `always`, `auto`, and `never` modes preserve their existing behavior, with automatic virtualization still beginning at 300 rows.
- [ ] Public-component browser tests exercise 299, 300, and 301 rows and prove correct content with bounded DOM only when virtualization applies.
- [ ] Large ungrouped tables use stable row identity, scroll through the full collection, and preserve sticky headers and the established page-scrolling layout.
- [ ] Sorting, filtering a large collection to a small collection and back, and replacing data while scrolled produce no stale, duplicate, missing, or misidentified rows.
- [ ] `visibleData` contains the current engine-reported rendered range, including overscan, in the same sorted and filtered order being rendered.
- [ ] Row selection, row clicks, sorting, filtering, and detail interaction remain behaviorally consistent between virtual and non-virtual modes.
- [ ] Window scrolling works without additional configuration, and an explicitly supplied element scroll target works across a shadow-root boundary without ancestor discovery.
- [ ] The new scroll-target property is additive to the Public Surface and is covered by public type tests and owning-module documentation.
- [ ] Disconnecting and reconnecting a scrolled table cleanly restores rendering and interaction through supported lifecycle APIs.

## Blocked by

- [01 - Replace autocomplete virtualization through the private integration](./01-replace-autocomplete-virtualization.md)
