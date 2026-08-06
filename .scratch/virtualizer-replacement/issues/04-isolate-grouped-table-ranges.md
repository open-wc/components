# Isolate grouped-table virtual ranges

Status: implemented-awaiting-review

## What to build

Migrate grouped table rendering so each active group owns an independent private virtual-list
instance and rendered-range lifecycle. Expanding, collapsing, sorting, filtering, and interacting
with one group must not reuse or corrupt another group's item ordering, measurement, or range.

User stories covered: 28-30, 49, and 50.

## Acceptance criteria

- [ ] Every active grouped list has an independent virtualization instance keyed to that group's current rows.
- [ ] Two or more expanded groups can be scrolled and updated without one group's range or measurement controlling another.
- [ ] Collapsing and re-expanding a group disposes and restores its virtualization cleanly without stale rows or broken layout.
- [ ] Sorting, filtering, and replacement data update each group's rendered rows using stable table row identity.
- [ ] Groups below the selected virtualization mode and threshold continue to use the normal rendering path.
- [ ] Selection, row clicks, sorting, filtering, annotations, and detail interaction remain consistent within grouped virtual and non-virtual lists.
- [ ] Public-component browser tests exercise multiple groups, independent ranges, collapse and expansion, ordering changes, and reconnect behavior so a single-instance implementation cannot pass accidentally.
- [ ] Grouped rendering does not depend on a single host query, shared range event, or Lit Labs virtualizer instance.

## Blocked by

- [02 - Preserve flat-table virtualization and explicit scroll ownership](./02-preserve-flat-table-virtualization.md)

## Implementation notes

- Replaced the grouped-table Lit Labs directive with a keyed private `VerticalListController`
  for each active, virtualized group. Collapsed or no-longer-virtualized groups dispose their
  controller; changing the scroll target recreates grouped controllers.
- Browser coverage exercises two expanded virtual groups, independent rendered wrappers,
  collapse/re-expand, sorting, and reconnecting.
- Review follow-up: group lists now calculate their own offset inside the shared window or
  explicit scroll target and subtract it from their virtual item transforms. Group rows retain
  their global processed-data indexes, so selection and row clicks keep addressing the correct
  row after sorting, filtering, or replacement data.
- Focused browser validation is blocked in this environment because the configured Chrome binary
  at `/mnt/c/Program Files/Google/Chrome/Application/chrome.exe` cannot launch. Typechecking has
  no errors in this change; the repo still has pre-existing errors in `OwcTableMassEdit.js` and
  the row-number formatter in `OwcTable.js`.
