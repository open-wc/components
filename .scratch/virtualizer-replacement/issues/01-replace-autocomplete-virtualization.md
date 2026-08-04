# Replace autocomplete virtualization through the private integration

Status: ready-for-agent

## What to build

Replace autocomplete's Lit Labs virtualizer with the first consumer of a private,
TanStack-backed vertical-list integration. The autocomplete option-list element remains the
explicit scroll owner. Preserve the component's existing popup, selection, filtering, validation,
and keyboard behavior while adding stable option identity, dynamic measurement, indexed scrolling,
and supported lifecycle handling.

This slice establishes the reusable private contract needed by later table and pinboard work without
exposing TanStack classes, records, callbacks, or types through the Public Surface. Add
`@tanstack/lit-virtual` version `3.13.36` as an exact runtime dependency without introducing a new
compilation or bundling step. Keep Lit Labs installed until its remaining consumers have migrated.

User stories covered: 1-12, 41-49, and 51.

## Acceptance criteria

- [ ] The private integration supports stable item identity, explicit element or window scroll ownership, estimated size, overscan, dynamic measurement, rendered-range notification, supported full remeasurement, indexed scrolling, and Lit lifecycle coordination.
- [ ] TanStack implementation types and controller instances remain private, and the package still ships unbundled ESM without a new TypeScript, decorator, or bundling step.
- [ ] `@tanstack/lit-virtual` is an exact `3.13.36` runtime dependency and the lockfile is updated deliberately.
- [ ] Autocomplete uses its option-list element as the explicit scroller and no longer relies on clipping-ancestor discovery or the custom clipping-boundary attribute.
- [ ] Options use the configured option-value resolution as stable identity, dynamically measured variable-height options do not overlap, and scrolling can reach the start and end of the limited result set.
- [ ] Arrow keys, Home, End, Enter, Escape, and Tab retain their established behavior, and the current keyboard option is scrolled into view across virtual ranges.
- [ ] Single and multiple selection, selection events, fill mode, tags, fixed-trigger and popup behavior, validation, and `maxDropdownOptionsVisible` remain compatible.
- [ ] Public-component browser tests cover a large option set in nested shadow roots and a popup through repeated open, close, resize, filter, restore, disconnect, reconnect, and reopen sequences without blank ranges or uncaught errors.
- [ ] Autocomplete's owning documentation describes its virtualized behavior and measurement assumptions without presenting TanStack as a consumer API.

## Blocked by

None - can start immediately
