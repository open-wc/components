Status: ready-for-agent

# Replace Lit Labs Virtualization with an Explicit TanStack Integration

## Problem Statement

As a user of the package's autocomplete, table, and pinboard components, I need large collections to remain responsive and correctly laid out while I scroll, resize, filter, expand content, open and close overlays, and drag cards. The current virtualization dependency can crash during resizing, can render blank or overlapping content, and relies on automatic clipping-ancestor discovery that behaves poorly across nested shadow roots and popups.

The repository currently carries a package patch that introduces an application-specific clipping boundary for autocomplete and table code that resets the virtualizer by calling lifecycle internals after width recalculation. Pinboard browser tests also suppress a ResizeObserver error emitted by the current virtualizer. These workarounds make the package harder to maintain and reduce confidence in the affected public components.

The current dependency is a prerelease Lit Labs package whose support outlook does not justify making upstream contribution or a maintained fork the critical path. At the same time, writing a complete virtualization engine would make the package responsible for difficult scroll measurement, anchoring, dynamic sizing, and observer behavior that is not part of its core value.

As a package maintainer preparing an Open Source Release, I need virtualization to have an explicit, testable boundary that works with the Package Format, does not add a new build step, preserves the established Public Surface, and can be maintained independently of any one rendering engine.

## Solution

Replace `@lit-labs/virtualizer` with a private virtualization integration backed by `@tanstack/lit-virtual`. The package will own the component behavior, rendering markup, scroll-target contract, and measurement policy while TanStack owns the underlying range, size, and scroll calculations.

Every virtualized collection will use an explicit scroll target rather than composed-tree clipping heuristics. Autocomplete will use its existing option-list scroller. Table and pinboard will use an explicit consumer-supplied scroll target when provided and window scrolling by default, without silently searching shadow-root ancestors.

Migrate autocomplete first as the proof of the new integration, then table, then pinboard. Preserve each component's existing public behavior, including autocomplete selection and keyboard navigation, table virtualization modes and `visibleData`, and pinboard drag-and-drop callbacks. Dynamically measure content whose height can change, use stable item identity, and provide a supported remeasurement path for width and content changes.

Publish the TanStack adapter as an exact runtime dependency. It ships compiled ESM and remains unbundled, so this solution respects the Package Format and does not introduce a source compilation or bundling step. After all consumers have migrated, remove the Lit Labs dependency, its package patch, its lifecycle workarounds, and test suppressions that are no longer needed.

## User Stories

1. As an autocomplete user, I want a large option list to open reliably, so that I can choose from large datasets without blank content or crashes.
2. As an autocomplete user, I want the option list to work inside nested shadow roots, so that component composition does not break scrolling.
3. As an autocomplete user, I want the option list to work inside a popup, so that clipping ancestors outside the list do not corrupt its viewport calculations.
4. As an autocomplete user, I want repeated opening and closing to remain reliable, so that normal interaction does not leave stale observers or ranges.
5. As an autocomplete user, I want resizing while the dropdown is open to preserve a valid list, so that responsive layouts remain usable.
6. As an autocomplete user, I want filtering a large option set down to a small result and back to remain correct, so that search never leaves blank or stale rows.
7. As an autocomplete user, I want arrow-key navigation to move through virtualized options, so that I can use the component without a pointer.
8. As an autocomplete user, I want the current keyboard option scrolled into view, so that focus and visible content stay synchronized.
9. As an autocomplete user, I want Home, End, Enter, Escape, and Tab behavior preserved, so that the migration does not change established keyboard interaction.
10. As an autocomplete user, I want single and multiple selection to behave as before, so that virtualization remains invisible to my workflow.
11. As an autocomplete user, I want dynamic option content to be measured correctly, so that variable-height options do not overlap.
12. As an autocomplete user, I want `maxDropdownOptionsVisible` to keep limiting the candidate list, so that existing application configuration remains effective.
13. As a table user, I want large tables to scroll smoothly with bounded rendered DOM, so that large datasets remain responsive.
14. As a table user, I want tables below the automatic virtualization threshold to render normally, so that small datasets avoid unnecessary virtualization.
15. As a table user, I want the existing `always`, `auto`, and `never` virtualization modes preserved, so that applications retain control over rendering behavior.
16. As a table user, I want the automatic threshold to remain 300 rows initially, so that the migration does not unexpectedly change when virtualization begins.
17. As a table user, I want switching among 299, 300, and 301 rows to render the correct data, so that the threshold boundary has no gaps or duplicates.
18. As a table user, I want sorting a virtualized table to show rows in the new order, so that recycled positions never display stale data.
19. As a table user, I want filtering a large table down to a small table and back to remain correct, so that virtualization mode transitions do not corrupt rendering.
20. As a table user, I want resizing columns to remeasure affected rows without crashing, so that wrapped and custom content stays aligned.
21. As a table user, I want annotations and other variable-height row content to render without overlap, so that all row content remains readable.
22. As a table user, I want expanding and collapsing detail rows to update following row positions, so that dynamic details do not cover or displace unrelated rows incorrectly.
23. As a table user, I want asynchronously arriving detail content to trigger correct measurement, so that deferred content remains usable.
24. As a table user, I want sticky headers and the established page layout to continue working, so that replacing the engine does not impose a new self-scrolling table UX.
25. As a table user, I want window scrolling to work by default, so that the common page-scrolling case needs no extra configuration.
26. As a package consumer with an app-shell scroller, I want to supply the exact table scroll target, so that virtualization works without ancestor discovery.
27. As a package consumer, I want `visibleData` to keep tracking the virtualizer's rendered range, so that existing Wave Controllers and application behavior continue receiving the expected rows.
28. As a table user, I want grouped tables to virtualize each active list correctly, so that one group's range or measurement does not control another group.
29. As a table user, I want collapsed and expanded groups to maintain correct layout, so that group interaction does not leave stale virtual rows.
30. As a table user, I want row selection, row clicks, sorting, filtering, and detail interaction to behave the same in virtual and non-virtual modes, so that virtualization remains an implementation detail.
31. As a pinboard user, I want large columns to render with bounded DOM, so that boards with many cards remain responsive.
32. As a pinboard user, I want each column to maintain its own virtual range, so that scrolling and measurement in one column do not corrupt another.
33. As a pinboard user, I want cards with different content heights to be positioned correctly, so that cards never overlap.
34. As a pinboard user, I want card identity preserved while data is sorted or moved, so that a card does not inherit another card's rendered state.
35. As a pinboard user, I want dragging a card between columns to keep working, so that virtualization does not break the board's primary interaction.
36. As a pinboard user, I want nearby drop targets to remain mounted while dragging, so that I can complete a drag without targets disappearing.
37. As a pinboard user, I want rejected drop targets to remain visibly disabled during a drag, so that `canDrop` feedback remains reliable.
38. As a pinboard user, I want optional success and delete drop zones to keep working, so that existing board workflows do not regress.
39. As a pinboard user, I want small columns to render without unnecessary virtualization overhead, so that ordinary boards remain simple and responsive.
40. As a package consumer with an app-shell scroller, I want to supply the exact pinboard scroll target, so that board virtualization works in composed layouts.
41. As a package consumer, I want the existing component imports and custom-element names preserved, so that I do not need to migrate imports.
42. As a package consumer, I want existing public properties, events, methods, and option shapes preserved unless this PRD explicitly adds a scroll-target property, so that the engine replacement is otherwise backward compatible.
43. As a package consumer, I want the package to continue shipping unbundled ESM, so that adopting the new virtualization engine does not require a package build architecture change.
44. As a package consumer, I want all runtime JavaScript needed by public components installed through normal package dependencies, so that components work after a normal installation.
45. As a package consumer, I want no TypeScript, decorators, or framework-specific compilation requirement introduced, so that the package remains usable in buildless ESM development environments with bare-specifier resolution.
46. As a package maintainer, I want the rendering engine hidden behind a private integration boundary, so that TanStack implementation details do not become part of the Public Surface.
47. As a package maintainer, I want explicit scroll ownership, so that shadow-root and clipping behavior is understandable and testable.
48. As a package maintainer, I want supported measurement and lifecycle APIs, so that width changes do not require manually disconnecting and reconnecting observers.
49. As a package maintainer, I want stable keys for every virtualized item, so that sorting, filtering, selection, and dragging preserve item identity.
50. As a package maintainer, I want one consistent virtual-list rendering and measurement policy across consumers, so that fixes do not need to be rediscovered in each component.
51. As a package maintainer, I want the TanStack version pinned exactly, so that dependency upgrades are deliberate and reviewable.
52. As a package maintainer, I want the Lit Labs package patch removed, so that installation no longer mutates a third-party virtualization package.
53. As a package maintainer, I want obsolete virtualizer getters, host access, and lifecycle-reset code removed, so that consumers cannot accidentally depend on unstable engine internals.
54. As a package maintainer, I want virtualization failures to surface as test failures rather than being globally suppressed, so that regressions are actionable.
55. As a release agent, I want the dependency replacement and corrected behavior recorded as a Consumer-Visible Change, so that package consumers can understand the release.
56. As a release agent, I want the full Release Gate to pass, so that the migration does not compromise publication readiness.
57. As a future contributor, I want virtualization behavior documented in the owning Component Directories, so that scroll targets, thresholds, and measurement assumptions are discoverable.
58. As a future contributor, I want upgrades isolated from component business behavior, so that the underlying engine can be evaluated or replaced without rewriting every consumer again.

## Implementation Decisions

- Own a private virtualization integration backed by `@tanstack/lit-virtual`; do not fork Lit Labs and do not build a new virtualization engine.
- Keep TanStack classes, controller instances, virtual-item shapes, and engine-specific callbacks out of the Public Surface.
- Add `@tanstack/lit-virtual` as an exact runtime dependency. Begin with the verified compiled release `3.13.36` and update the lockfile deliberately rather than using a version range.
- Continue publishing unbundled ESM in accordance with the Package Format decision. The TanStack adapter and its core dependency ship compiled ESM, so no Rollup, TypeScript compilation, decorators transform, or other new build step is introduced.
- Use the package dependency policy: TanStack is required at runtime by public components and therefore remains a dependency rather than a peer or development dependency. Lit retains its existing dependency treatment.
- Provide one private integration contract for vertical collections: item count and identity, explicit element or window scroll target, estimated size, overscan, dynamic measurement, rendered-range notification, supported full remeasurement, and indexed scrolling.
- The integration owns spacer sizing, absolute item placement, measurement attachment, and Lit update coordination. Consumer components own item markup, public state, events, focus, selection, drag behavior, and component-specific policies.
- Do not discover clipping or scroll ancestors by walking the composed tree. A virtualized collection must either own its scroll element or receive the exact element or window explicitly.
- Add a documented scroll-target property to table and pinboard for consumers whose viewport is an app-shell element. Default to window scrolling so existing page-scrolling usage remains straightforward. Autocomplete continues to own its option-list scroller and does not need this property.
- Treat the new scroll-target properties as additive Consumer-Visible Changes. Update public types, owning-module documentation, demos where useful, and the changelog.
- Migrate autocomplete first. Its existing option-list element is the explicit scroll element and the current custom clipping-boundary attribute is removed.
- Give autocomplete options stable identity based on the component's configured option-value resolution. Indexed scrolling must keep keyboard navigation and the current option visible.
- Preserve autocomplete list limiting, single and multiple selection, fill mode, tags, events, validation, fixed-trigger behavior, and popup interaction.
- Measure autocomplete options dynamically when content can change height. Use an accurate estimate to minimize scroll correction while measurements settle.
- Migrate table after autocomplete proves the integration. Preserve `virtualizerMode` and the automatic threshold of 300 rows for the first migration.
- Use the table's existing row-identity function as the virtual item key. Invalid or missing identity continues to follow the table's existing error contract.
- Preserve page-level and app-shell scrolling rather than making the table body a mandatory self-scroller. This protects the established sticky-header and layout behavior.
- Attach dynamic measurement at the complete table-row container, including annotations and details, so the measured size represents everything occupying vertical space for that row.
- Use the supported remeasurement API after column-width recalculation when row observation alone cannot guarantee a complete update. Remove direct calls to engine lifecycle internals.
- Preserve `visibleData` as the rows in the engine-reported rendered range, including overscan rather than only strict pixel intersection. Range updates must be derived from the same item collection and ordering being rendered.
- Give every grouped table list an independent private virtualization instance and range lifecycle. Do not use a single host reference or event listener to represent multiple groups.
- Preserve non-virtual rendering for table lists that do not meet the selected mode and threshold. Mode transitions caused by filtering or replacement data must dispose or initialize virtualization cleanly.
- Migrate pinboard after table. Each column and populated drop-zone detail list owns an independent private virtual-list instance.
- Preserve `keyFunction` as the pinboard's stable card-identity contract and continue sorting before deriving virtual positions.
- Add a meaningful private small-list threshold for pinboard so ordinary columns may render normally while large columns remain virtualized. The threshold is an implementation policy, not a new public mode, unless implementation evidence shows consumers need control.
- Use dynamic card measurement. During an active drag, increase overscan enough to keep the source and nearby targets mounted; return to normal overscan after drag end or drop.
- Preserve pinboard column callbacks, default move behavior, `canDrop`, configured drop zones, card mapping, sorting, and drag styling.
- Keep scroll position stable across measurements when possible. Accurate estimates and stable keys are preferred over manual scroll resets.
- Handle component disconnect and reconnect exclusively through Lit controller/component lifecycle and supported TanStack APIs. No consumer calls an engine's private connected or disconnected methods.
- Once all three components use the new integration, remove `@lit-labs/virtualizer`, remove its package patch, remove the obsolete custom clipping-boundary attribute, and update the lockfile and installation scripts as appropriate.
- Remove obsolete virtualizer instance getters, host accessors, and reset helpers that expose Lit Labs internals but are not part of the documented Public Surface.
- Remove ResizeObserver error suppression added specifically for the old engine when the new behavior no longer emits that error. Do not add a replacement global suppression.
- Update owning-module documentation so it describes component behavior and explicit scroll ownership without exposing TanStack as a consumer API.
- Record the dependency replacement, additive scroll-target properties, and reliability fixes in the changelog as Consumer-Visible Changes. Include Migration Handling only if implementation discovers that an existing documented behavior must change.
- Preserve existing public exports, package entry points, custom-element names, `owc-` element prefix, and Owc Symbol naming.
- Do not hand-edit Generated Artifacts. Regenerate declarations and other output through the existing validation pipeline.
- Apply Release Hygiene to all public docs, package metadata, examples, and shipped content; do not carry forward private branding or application-specific terminology from the earlier integration.
- No new ADR is required because this PRD applies the existing Package Format, Dependency Policy, Public Surface, Component Directory, and Migration Handling decisions. Add an ADR only if implementation must overturn one of those established decisions.

## Testing Decisions

- Use one highest existing behavior seam: mount the public `owc-autocomplete`, `owc-table`, and `owc-pinboard` custom elements in their colocated browser suites and observe rendered behavior, public state, public events, and user interaction.
- Good tests assert external behavior and failure absence: the correct items are rendered at the correct time, scrolling reaches expected data, interaction remains possible, DOM stays bounded for large collections, and resize/open/filter/reconnect sequences produce no uncaught errors or blank/overlapping ranges.
- Do not assert TanStack controller classes, virtual-item records, spacer implementation, transform values, ResizeObserver wiring, or private integration markup when the same outcome can be verified through the public components.
- Do not add direct tests of the private integration by default. Add a lower seam only when a shared behavior cannot reasonably be driven through any public component, and keep that seam focused on the missing contract.
- Extend the existing autocomplete browser suite as prior art for popup lifecycle, option rendering, filtering, selection, and keyboard behavior.
- Test autocomplete with a large option set inside nested shadow-root hosts and its popup. Repeatedly open, close, resize, filter to a small result, restore the large result, disconnect, reconnect, and reopen while asserting usable rendered options and no uncaught exceptions.
- Verify autocomplete keyboard navigation across ranges, including Arrow keys, Home, End, and Enter. Assert the current option becomes visible and the selected value and public events remain correct.
- Verify autocomplete variable-height content without asserting row transforms. Visible option content must not overlap and scrolling must reach both the beginning and end of the limited result set.
- Extend the existing table browser suite as prior art for rendered rows, sorting, filtering, selection, events, and component configuration.
- Test table data sizes of 299, 300, and 301 rows under automatic mode, plus explicit `always` and `never` modes. Assert correct row content and a bounded DOM only where virtualization applies.
- Test a large table filtered to a small collection and restored, as well as sorting and replacing data while scrolled. Assert no stale, duplicate, missing, or misidentified rows.
- Test column resizing repeatedly while virtualized and assert there are no uncaught errors, blank ranges, or overlapping rows after content reflows.
- Test annotations, expanded details, collapsed details, and asynchronously changing detail height. Assert following rows reposition correctly through observable layout and remain interactive.
- Test `visibleData` through its public property at the component seam. Assert it follows the rendered virtual range and current sort/filter ordering rather than a stale source collection.
- Test grouped tables with multiple groups, group expansion changes, and independent virtual ranges. Exercise more than one group so a single-instance implementation cannot pass accidentally.
- Test table disconnect and reconnect while scrolled and after resize, then verify scrolling and interaction still work.
- Test both default window scrolling and an explicitly supplied element scroll target, including a target across a shadow-root boundary.
- Extend the existing pinboard browser suite as prior art for column rendering, card mapping, configured drop zones, `canDrop`, and drag-and-drop callbacks.
- Test pinboard columns large enough to virtualize and small enough to use the normal rendering path. Assert all data is reachable, DOM remains bounded for the large case, and variable-height cards do not overlap.
- Test multiple pinboard columns so each range changes independently. Scroll through large columns and verify card identity and mapped content remain correct.
- Test dragging while a column is virtualized, including moving between columns, rejected targets, success/delete drop zones, drag end, and scrolling during the drag. Assert callbacks and default behavior receive the correct card and column.
- Test pinboard disconnect and reconnect and both window and explicit element scroll targets.
- Remove the old global ResizeObserver-error suppression and let uncaught browser errors fail the relevant test suite.
- Preserve existing logic tests for component helpers; no helper test should be rewritten merely because the rendering engine changes.
- Run focused browser suites while migrating each component, then run the Release Gate: formatting, lint, full tests, public type validation, and package/docs build.
- Run the browser behavior suites in the repository's supported Chromium, Firefox, and WebKit configurations before completing the migration, because resizing and measurement behavior can differ by engine.
- Verify the built docs and package continue resolving the unbundled TanStack ESM dependency through ordinary bare-specifier resolution; do not introduce a bundled-output assertion.
- Use public-surface type tests as prior art for any new scroll-target property types and to prove existing public imports remain intact.
- Treat performance checks as behavioral bounds rather than timing microbenchmarks: large collections must keep rendered DOM proportional to the viewport plus overscan, not total item count.

## Out of Scope

- Contributing the current clipping-boundary patch or a new generic API to Lit Labs as the critical path for this migration.
- Maintaining a private fork of `@lit-labs/virtualizer`.
- Writing a new range calculation, scroll anchoring, or dynamic-measurement engine from scratch.
- Exposing TanStack controllers, core APIs, virtual item records, or package types through the Public Surface.
- Bundling the package or adding Rollup, Vite, a TypeScript source build, decorator compilation, or another packaging architecture.
- Renaming existing custom elements, Owc Symbols, exports, or unrelated public properties.
- Changing autocomplete selection semantics, option filtering semantics, fill mode, validation, or popup library.
- Redesigning table sorting, JSON Filter semantics, selection, editing, grouping, details, export, or Wave Controller behavior beyond what is necessary to preserve virtualization behavior.
- Changing the table's automatic threshold from 300 rows during the initial migration.
- Making the table a mandatory self-scroller or redesigning sticky headers and page layout.
- Redesigning pinboard card mapping, column configuration, drag-and-drop callbacks, drop zones, or default card movement.
- Adding horizontal or grid virtualization.
- Preserving focus, media playback, or arbitrary transient DOM state for items that leave the rendered range; unmounting off-range content is inherent to virtualization.
- Guaranteeing zero scroll correction for dynamic-height content before it has been measured.
- Automatically discovering scroll or clipping ancestors across composed trees.
- Performing unrelated component cleanup or public package restructuring.
- Editing Generated Artifacts by hand.

## Further Notes

- The confirmed test design uses one seam category across all affected modules: existing colocated browser tests at the public custom-element boundary. A private integration seam is intentionally avoided unless a behavior cannot be exercised through a consumer component.
- Autocomplete is the first migration because it owns a simple scroll viewport and directly exercises the nested-shadow-root and popup failure that required the current package patch.
- Table is the highest-risk migration because it combines window or app-shell scrolling, dynamic row height, width recalculation, grouped lists, and public `visibleData` state.
- Pinboard follows after the shared behavior is proven. Its per-column instances and drag lifecycle should use the same private integration rather than embedding engine-specific code in the board.
- The published TanStack Lit adapter is compiled but not bundled. That is compatible with the repository's Package Format and current bare-specifier resolution; consumers still need ordinary npm module resolution, as they already do for Lit and other runtime dependencies.
- The package should own the integration and behavior, not the scrolling mathematics. Exact version pinning and the private boundary make a future core upgrade or implementation replacement deliberate and localized.
- The current repository differs from the earlier investigation in one important respect: table width recalculation presently calls the manual virtualizer reset. Removing that live workaround is therefore part of the migration, not merely dead-code cleanup.
