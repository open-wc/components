Status: resolved

## What to build

Audit every current public export and ensure each has the minimum documentation and component directory layout required for the first release while preserving the existing export surface.

## Acceptance criteria

- [x] Every file under `exports/` is accounted for in a documentation coverage audit.
- [x] Every public component is accounted for in a layout audit against the requirement that each component has its own matching `src/` and `exports/` directory.
- [x] Components that do not yet satisfy the directory requirement are listed with concrete move/refactor follow-up work.
- [x] UI exports have component or demo documentation.
- [x] Helper/module exports have a README/API note or equivalent documentation.
- [x] Legacy exports kept for now, including `OwcTemplateEditorOld` if applicable, are clearly identified rather than silently removed.
- [x] Missing documentation is either added or captured as a concrete follow-up blocker before release.

## Blocked by

- 03-rebrand-public-docs-and-examples

## Comments

Resolved with `docs/public-exports.md`.

The audit accounts for all 78 files under `exports/`, including the 30 `exports/define/*`
registration entry points. It documents UI docs/demo coverage, helper/API-note coverage, known
layout mismatches, and follow-up work for table, chart, click-editable, helper, and type entry
points.

`OwcTemplateEditorOld` is identified as a retained legacy internal implementation used by
`OwcTemplateEditor`, not silently removed.
