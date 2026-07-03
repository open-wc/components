Status: ready-for-agent

# Public Surface Helper Cleanup

## Problem Statement

The package is preparing for an Open Source Release as `@open-wc/components`, but several helper and type entry points make the Public Surface look accidental. Generic helpers, table-owned helpers, JSON Filter adapters, Lit test utilities, and unrelated component types are currently exposed through loose top-level package paths.

This creates confusion for package consumers and for internal applications that need Migration Handling before the Initial Release Version. The codebase already prefers component directories, owned helper modules, colocated tests, and deliberate public exports. The remaining loose helper/type exports are the main mismatch.

## Solution

Clean up the helper and type Public Surface before the first publication, even where that requires breaking current package import paths. Keep top-level public UI component exports unchanged for this pass, because those paths are understandable and align with the current `Owc*` symbol convention.

Move helper and type exports into owned public namespaces:

- Table-owned helpers under a table namespace.
- JSON Filter adapters and JSON Filter types under a filter namespace.
- Generic text helpers under a text namespace.
- Lit-specific helpers under a Lit namespace.
- Component-specific types under their owning component namespaces.

Remove the old top-level helper and aggregate type entries rather than leaving deprecated re-export stubs. Document every removed path and replacement path in migration notes so downstream internal applications can update imports deliberately.

## User Stories

1. As a package consumer, I want table-owned helpers to be exported from table-owned paths, so that I can discover them from the table domain.
2. As a package consumer, I want JSON Filter adapters to be exported from filter-owned paths, so that JSON Filter usage is not mixed with table-specific helpers.
3. As a package consumer, I want the table date reviver to be exported from a table-owned path, so that I do not treat it as required JSON Filter serialization behavior.
4. As a package consumer, I want text helpers to be exported from a generic text namespace, so that I can use them outside table features without misleading imports.
5. As a package consumer, I want Lit helpers to be exported from a Lit namespace, so that framework-specific helpers are clearly identified.
6. As a package consumer, I want component-specific types to be exported from component-owned paths, so that type imports match the component or helper family they describe.
7. As a package consumer, I want the old aggregate type export removed, so that unrelated component types are not bundled into a vague public entry point.
8. As a package consumer, I want removed public paths listed in migration notes, so that I can update internal applications efficiently.
9. As a package consumer, I want replacement imports to be exact and complete, so that migration does not require searching through source internals.
10. As a package consumer, I want top-level component imports to remain stable in this pass, so that helper cleanup does not become a full component import migration.
11. As a table consumer, I want CSV export helpers to live under the table public API, so that table data export capabilities are grouped together.
12. As a table consumer, I want Excel export helpers to live under the table public API, so that spreadsheet export capabilities are grouped together.
13. As a table consumer, I want sub-list rendering helpers to live under the table public API, so that table column formatting helpers are grouped with table behavior.
14. As a table consumer, I want table type exports to live under the table public API, so that table configuration types are discoverable next to table helpers.
15. As a JSON Filter consumer, I want Filter Function and SQL Filter adapters to remain public, so that I can continue converting JSON Filters into runtime filters or SQL clauses.
16. As a JSON Filter consumer, I want JSON Filter type exports to live with the filter API, so that filter data structures are documented as part of filter behavior.
17. As a JSON Filter consumer, I want the public JSON Filter shape to remain unchanged, so that import migration does not also become data migration.
18. As a table maintainer, I want saved table filter state parsing to remain table-owned, so that table state serialization does not leak into the JSON Filter domain model.
19. As a package maintainer, I want old top-level helper files deleted, so that consumers cannot keep using unclear paths after the cleanup.
20. As a package maintainer, I want public docs and examples to use only the new public paths, so that docs reflect consumer usage.
21. As a package maintainer, I want the public export audit updated, so that the documented Public Surface matches the package files.
22. As a package maintainer, I want the changelog to call out breaking import-path changes, so that this Consumer-Visible Change has explicit Migration Handling.
23. As a package maintainer, I want the existing helper tests to keep passing, so that path cleanup does not change behavior.
24. As a package maintainer, I want new public entry points covered by type generation, so that generated declarations match the new Package Format.
25. As a release agent, I want package files to exclude removed entries, so that the published package does not contain obsolete compatibility stubs.
26. As a release agent, I want the Release Gate to remain the final validation target, so that the cleanup is safe to ship in the Open Source Release.
27. As a future contributor, I want root-level source files removed unless they are genuinely package-wide shared modules, so that source locality remains clear.
28. As a future contributor, I want no new catch-all helper namespace introduced, so that ownership stays with the closest domain.
29. As a future contributor, I want helper docs to use canonical domain language, so that Public Surface, Migration Handling, JSON Filter, Filter Function, and SQL Filter mean the same things across docs.
30. As a future maintainer, I want this PRD to avoid full component directory API migration, so that the cleanup stays focused on the current source of confusion.

## Implementation Decisions

- This is a breaking Public Surface cleanup before the Initial Release Version.
- Respect the updated ADR decision that breaking export cleanup is allowed before first release when it produces a clearer public surface and includes Migration Handling.
- Keep top-level public UI component entries unchanged in this pass.
- Remove old top-level helper and aggregate type entries instead of leaving deprecated stubs.
- Replace loose table-related helper entries with table-owned public entries for CSV export, Excel export, sub-list rendering, table date-state parsing, and table types.
- Replace the loose filter entry with filter-owned public entries for JSON Filter adapters and JSON Filter types.
- Keep the current JSON Filter shape unchanged.
- Keep `jsonToFilter`, `jsonToSqlFilter`, and `globalSearchField` public, but expose them through filter-owned paths.
- Treat `dateParserForJsonDecode` as table-owned because current usage revives serialized table filter state; do not present it as a general JSON Filter serialization contract.
- Move generic search highlighting to a text-owned public entry.
- Move Lit template stringification to a Lit-owned public entry.
- Remove the aggregate type entry and replace it with owned component/type entries.
- Do not introduce a new catch-all helper namespace.
- Update public docs and examples that import removed paths.
- Update public export audit documentation so it reflects the new Public Surface rather than the old preserved-export model.
- Update changelog or migration notes with a before/after mapping for each removed import path.
- Update package export/package content assumptions only as needed for the new entries to generate declarations and publish correctly.
- Do not hand-edit generated artifacts. Regenerate declaration output through the type pipeline when validation requires it.
- Leave unrelated untracked or dirty files alone.

## Testing Decisions

- Highest seam: package consumers should be able to import every new public entry point through the package export surface.
- Behavior seam: existing helper behavior should remain covered by the current colocated tests for CSV export, Excel export, sub-list rendering through table export tests, JSON Filter adapters, search highlighting, Lit template stringification, and component type checks.
- Type seam: owned type exports should be verified through the existing TypeScript build, not by testing private declaration internals.
- Good tests assert external behavior and public importability, not private file layout.
- Existing CSV tests are prior art for table CSV behavior and sub-list string rendering behavior.
- Existing Excel tests are prior art for table Excel behavior and sub-list string rendering behavior.
- Existing JSON Filter and SQL Filter tests are prior art for Filter Function and SQL Filter adapter behavior.
- Existing search highlight tests are prior art for text helper behavior.
- Existing Lit helper tests are prior art for Lit helper behavior.
- Existing type-test patterns are prior art for public type expectations.
- Add focused import-surface tests if current validation does not prove that the new package paths resolve.
- Run focused tests for changed helper domains after implementation.
- Run the full Release Gate before publication: lint, test, types, build, package-content review, and public hygiene scan.

## Out of Scope

- Full component directory API migration for entries such as top-level component exports.
- Renaming `Owc*` classes, files, or public component symbols.
- Changing custom element tag names.
- Changing JSON Filter data shape or introducing normalized JSON Filter representation.
- Changing JSON Filter operator semantics.
- Changing Filter Function or SQL Filter behavior.
- Designing a broader JSON Filter serialization contract.
- Adding deprecated compatibility stubs for removed helper/type paths.
- Changing runtime dependency policy.
- Editing generated artifacts by hand.
- Implementing the code cleanup as part of PRD creation.

## Further Notes

- The agreed scope is the narrow helper/type cleanup, not the full directory API cleanup.
- The old top-level helper/type entries to remove include the loose sub-list, CSV, Excel, filter, search-highlight, Lit helper, and aggregate type exports.
- The migration notes should include exact replacement imports for every removed public path.
- ADR-0001 has already been updated in this conversation to allow breaking public-surface cleanup before first release.
- The existing open-source-release PRD still contains older preservation language; implementation should reconcile release docs so the final release plan and ADR agree.
