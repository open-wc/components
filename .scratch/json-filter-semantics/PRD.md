Status: ready-for-agent

# Shared JSON Filter Semantics

## Problem Statement

JSON Filter behavior is currently spread across the table UI, the Filter Function adapter, and the SQL Filter adapter. This makes it hard to understand which operators are supported, which operators can be translated to SQL, and whether adding or changing an operator has been handled consistently across all adapters.

The current Public Surface should stay stable for the Initial Release Version. Consumers and internal modules already rely on JSON Filters, Filter Functions, and SQL Filters. The problem is not the public shape; the problem is that operator semantics and adapter support are shallow and duplicated.

## Solution

Create a shared JSON Filter semantics module under the filter domain. It should centralize operator evaluation and SQL support metadata while preserving the existing JSON Filter public shape and adapter interfaces.

The table UI should continue to edit JSON Filters. The Filter Function adapter should continue to turn JSON Filters into in-memory row filters. The SQL Filter adapter should continue to turn JSON Filters into SQL clauses and parameters. The new shared module sits behind those adapters and becomes the single place for operator behavior and SQL support.

UI labels and localization stay out of this first pass. The table UI can keep its existing labels and ordering until the package has a deliberate multilingual strategy.

## User Stories

1. As a table user, I want existing table filters to behave the same after the refactor, so that filtering remains reliable.
2. As a table user, I want text filters such as contains, starts with, and ends with to keep their current behavior, so that my existing workflows do not change.
3. As a table user, I want numeric filters to keep their current behavior, so that table filtering remains predictable.
4. As a table user, I want date filters to keep their current behavior, including no-year comparisons, so that date-based workflows do not regress.
5. As a table user, I want disabled JSON Filters to remain ignored, so that temporary filter toggles keep working.
6. As a table user, I want negated JSON Filters to remain supported, so that inverse filters keep working.
7. As a table user, I want global search behavior to remain unchanged, so that existing table search behavior does not regress.
8. As a package consumer, I want the current JSON Filter shape to remain supported, so that I do not need Migration Handling for the Initial Release Version.
9. As a package consumer, I want the existing Filter Function adapter interface to stay the same, so that current imports and calls continue to work.
10. As a package consumer, I want the existing SQL Filter adapter interface to stay the same, so that current data adapter code continues to work.
11. As a package consumer, I want unsupported SQL operators to fail explicitly, so that adapter limitations are clear.
12. As a package consumer, I want SQL Filter output to preserve current clause and parameter behavior, so that downstream data code does not change unexpectedly.
13. As a package maintainer, I want operator evaluation to live in one place, so that changing an operator does not require hunting through adapters.
14. As a package maintainer, I want SQL support metadata to live next to operator semantics, so that supported and unsupported SQL operators are visible.
15. As a package maintainer, I want the Filter Function adapter to delegate operator behavior, so that it focuses on adapting JSON Filters to row filtering.
16. As a package maintainer, I want the SQL Filter adapter to delegate operator SQL behavior, so that it focuses on adapting JSON Filters to SQL output.
17. As a package maintainer, I want table UI labels to remain separate for now, so that localization can be solved deliberately later.
18. As a package maintainer, I want no normalized JSON Filter representation introduced in this pass, so that the module does not add an unnecessary second model.
19. As a package maintainer, I want the refactor to be behavior-preserving, so that test failures reveal accidental regressions rather than mixed-in semantic changes.
20. As a package maintainer, I want existing tests around Filter Functions to keep passing, so that in-memory behavior remains covered.
21. As a package maintainer, I want existing tests around SQL Filters to keep passing, so that SQL translation remains covered.
22. As a package maintainer, I want the shared module to improve locality, so that future operator changes are concentrated.
23. As a package maintainer, I want the shared module to improve leverage, so that both adapters benefit from one operator definition.
24. As a future localization implementer, I want this work to avoid hardening current UI labels as domain semantics, so that multilingual labels can be designed later.
25. As a future release agent, I want the Public Surface to remain stable, so that this refactor does not expand release risk.
26. As a future release agent, I want any Consumer-Visible Change avoided unless explicitly planned, so that the Initial Release Version remains low risk.
27. As a future contributor, I want JSON Filter, Filter Function, and SQL Filter terminology to be used consistently, so that the codebase is easier to navigate.
28. As a future contributor, I want unsupported adapter capabilities to be represented intentionally, so that omissions are distinguishable from mistakes.
29. As a future contributor, I want the table UI to remain an authoring adapter rather than the owner of filter semantics, so that UI code does not accumulate domain behavior.
30. As a future contributor, I want the filter domain to own shared semantics, so that new adapters can reuse the same operator behavior.

## Implementation Decisions

- Preserve the current Public Surface for the Initial Release Version. This PRD must not remove or rename existing public adapter interfaces.
- Preserve the current JSON Filter public shape. Do not introduce a new normalized JSON Filter representation as part of this work.
- Treat JSON Filter as the central concept. Filter Functions and SQL Filters are adapters derived from JSON Filters.
- Add a shared JSON Filter semantics module in the filter domain.
- Move operator evaluation behavior into the shared semantics module.
- Move SQL operator translation behavior into the shared semantics module.
- Represent SQL support as explicit per-operator capability. Operators that cannot become SQL Filters should be unsupported intentionally, not by absence hidden in an adapter.
- Keep the Filter Function adapter interface unchanged. It should delegate operator evaluation to the shared semantics module.
- Keep the SQL Filter adapter interface unchanged. It should delegate SQL operator conversion to the shared semantics module.
- Keep the table UI label module unchanged for the first pass.
- Keep localization out of scope. Current labels remain where they are until a multilingual design exists.
- Preserve current behavior exactly. Do not use this refactor to fix mismatches between Filter Functions and SQL Filters.
- If mismatches are discovered during implementation, document them or test them as current behavior rather than silently changing them.
- Respect ADR-0001, which preserves the current export surface for the first release.
- Respect ADR-0005, which records the decision to share JSON Filter semantics without normalizing the public shape.
- Keep implementation private unless an existing public export already exposes the adapter behavior.

## Testing Decisions

- Test at the highest existing seam: JSON Filter input to Filter Function output, and JSON Filter input to SQL Filter output.
- Do not test the shared semantics module primarily through implementation details if the same behavior can be verified through the existing adapters.
- Existing Filter Function tests are prior art for in-memory behavior and should continue to cover operator evaluation, nested JSON Filters, global search, enabled filters, arrays, and date behavior.
- Existing SQL Filter tests are prior art for SQL output and should continue to cover clauses, parameters, allowed fields, disabled filters, negation, global search handling, unsupported operators, and nested AND/OR behavior.
- Keep `compare` behavior covered as a compatibility adapter where tests already exist.
- Add targeted tests only where extraction creates a new observable risk, such as explicit unsupported SQL operator handling.
- Good tests should assert externally visible behavior: which rows are included by a Filter Function, or which SQL clause and parameters are produced by a SQL Filter.
- Avoid tests that lock in private object shapes inside the shared semantics module unless there is no higher seam for the behavior.
- Run the focused filter test set after implementation.
- Run the full Release Gate before this ships as part of the Open Source Release.

## Out of Scope

- Changing the JSON Filter public shape.
- Adding a normalized intermediate representation.
- Renaming public adapter functions.
- Changing public exports.
- Changing table UI labels.
- Designing localization or multilingual label infrastructure.
- Fixing semantic mismatches between Filter Functions and SQL Filters.
- Reworking table filter UI authoring behavior.
- Reworking field-path traversal beyond what is required to preserve existing behavior.
- Changing package metadata or release documentation except where normal release workflow requires it.

## Further Notes

- This PRD comes from the architecture review candidate “Deepen the Filter Query module,” later renamed to the project’s preferred term: JSON Filter.
- The chosen design is “JSON Filter with adapters”: JSON Filters are edited by table UI and adapted into Filter Functions or SQL Filters.
- The rejected design was a normalization-first module. That may become useful later, but the current adapters can consume the straight JSON Filter shape, and adding another model is not justified for the first pass.
- ADR-0005 already records the core decision.
