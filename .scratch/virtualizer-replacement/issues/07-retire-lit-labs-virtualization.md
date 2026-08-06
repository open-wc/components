# Retire Lit Labs virtualization and complete release readiness

Status: implemented-awaiting-review

## What to build

Finish the package-wide engine replacement after all three public components use the private
TanStack-backed integration. Remove Lit Labs, its package patch, obsolete clipping and lifecycle
workarounds, and the global ResizeObserver error suppression. Complete the Consumer-Visible Change
documentation and validate that the Package Format, Public Surface, dependency installation, and
full Release Gate remain ready for publication.

User stories covered: 52-58, with package-wide verification of 41-51.

## Acceptance criteria

- [ ] `@lit-labs/virtualizer` is removed from package metadata and the lockfile after confirming there are no remaining runtime or test imports.
- [ ] The Lit Labs package patch and obsolete custom clipping-boundary behavior are removed, and installation no longer mutates that virtualization package.
- [ ] Obsolete virtualizer getters, host accessors, and manual lifecycle-reset workarounds are removed without deleting documented Public Surface.
- [ ] The old global ResizeObserver-error suppression is removed and uncaught virtualization failures fail the relevant browser suites.
- [ ] Owning Component Directory documentation explains scroll targets, table and pinboard thresholds, and dynamic measurement assumptions without exposing TanStack as a consumer API.
- [ ] The changelog records the dependency replacement, additive table and pinboard scroll-target properties, and reliability fixes as Consumer-Visible Changes, with Migration Handling if implementation changed documented behavior.
- [ ] Existing public exports, type exports, package entry points, custom-element names, the `owc-` prefix, and Owc Symbol naming remain intact, including public type validation for the new properties.
- [ ] A normal package installation resolves all runtime JavaScript through exact dependencies, and the built package and docs continue to consume unbundled ESM through ordinary bare-specifier resolution without a new build step.
- [ ] Browser behavior suites pass in the repository's supported Chromium, Firefox, and WebKit configurations, including the autocomplete, table, and pinboard migration scenarios.
- [ ] Formatting is applied, then the Release Gate passes: lint, full tests, public types, and build.
- [ ] Release Hygiene finds no private branding, application-specific terminology, private URLs, registry assumptions, secrets, or scratch material in public docs, metadata, examples, or shipped files; Generated Artifacts are regenerated rather than hand-edited.

## Blocked by

- [03 - Remeasure dynamic table rows without lifecycle resets](./03-remeasure-dynamic-table-rows.md)
- [04 - Isolate grouped-table virtual ranges](./04-isolate-grouped-table-ranges.md)
- [06 - Preserve drag-and-drop across virtualized pinboard columns](./06-preserve-pinboard-drag-and-drop.md)
