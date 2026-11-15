# 11: axe checks, docs and changeset

Status: ready-for-human

Open: the last box, the manual screen reader check (C3), which the user runs. The C5 box was open because 2 of 17 benchmark runs had one task over 50ms; the review's rerun had none in 17 runs per side (see the review's comment at the end).

**What to build:** axe checks over the table and pinboard configurations listed in C2, fixes for what they find in our code, axe and a keyboard smoke test for the out-of-scope parts, the Keyboard sections in the docs pages and READMEs, one minor changeset with migration notes, a second benchmark run, and the manual screen reader check.

Spec: [C2–C5, R1–R3](../spec.md#checks).

**Blocked by:** 02–10.

- [x] axe runs for every configuration in C2 inside `npm test`; disabled rules have written reasons.
- [x] Out-of-scope parts (C4): axe on a table with its info block, the filter builder open and mass edit open; one keyboard smoke test each for the filter builder, the info block's action tabs, mass edit and the add-row button. Gaps beyond that are filed as follow-up tickets in this spec.
- [x] Docs: a Keyboard section with a key table in `OwcTable.rocket.md` and `OwcPinboard.rocket.md`, including how controls in custom formatters are found (K3); new properties in the API sections, `expanded` in `OwcIconButton.rocket.md`; READMEs updated. No conformance claim.
- [x] A `minor` changeset with the migration notes from R2.
- [x] The 100k-row benchmark still meets the targets listed in C5 with everything in place; the numbers are recorded below (C5).
- [x] The Release Gate passes.
- [ ] The user ran the manual check (C3) and recorded it below: VoiceOver + Chrome, the NVDA items of the pinboard, and the Safari and Firefox smoke test.

## Comments

### 2026-11-15: implemented (agent)

Every box is done but two: the manual screen reader check (C3) is the user's, and the C5 box stays open for the long tasks described under C5.

**axe (C2, C4)**

- `src/table/OwcTable.axe.test-browser.js`: simple rows, link rows, `detail`, `detailDeferred` and `linkWithDetail` with a detail open, several details open, selectable with a row selected, selectable with links and details, editable with an insert row (input, textarea, autocomplete and checkbox editors), grouped with the Others group, virtualized and scrolled to the middle (2000 rows), sticky header scrolled, empty, loading, annotations with an open detail.
- `src/pinboard/OwcPinboard.axe.test-browser.js`: by default, with controls in cards and an empty column, dropzones closed and with both lists open, a column of 1000 cards, during pick-up (over a column that takes the card, one that doesn't, and a dropzone), and with the Move to… menu open. The checks of 08 and 10 in the other pinboard suites stay.
- `src/table/OwcTable.toolbar.test-browser.js` (C4): axe on a table with its info block, all built-in action tabs and the add-row button; with the filter builder open (a global search and a filter); with mass edit open, before and after choosing a column. One keyboard smoke test each, with real keys: the global search and the filter builder (Tab to it, type, Enter on "Add filter" focuses the new filter's column selector, Space on "Delete filter"), the action tabs (Tab, Enter opens, Space closes), mass edit (Tab to the tab, Enter, pick a column in the autocomplete with Enter/↓/Enter, type a value, Enter on Preview, Space on Apply changes the selected rows), the add-row button (Tab, Enter adds a row and focuses its first field).
- All three use `expectAccessible` from the new `src/a11y/axe.test-browser.helpers.js`. **No rule is disabled outright.** Three rules are ignored only for the elements a check accepts, each with its reason in the file, and anything else they report fails:
  - `landmark-unique`: an open `wa-details` renders `role="region"` with `aria-labelledby="header"`, but nothing in its shadow tree has that id, so every open `wa-details` is an unnamed region, and two of them are duplicates for axe. Chromium exposes no region for them (checked in its accessibility tree: only the `<details>` group). So 05's note that an open detail contains a region named "Open details" doesn't hold: the region has no name and isn't exposed. Seen with several open table details and with both dropzone lists open.
  - `empty-table-header`: the selector column's header holds only the select-all checkbox. Chromium names the header cell "Select all" by it; axe can't read a `wa-checkbox`'s content (a `<slot>` in the `<label>` of its shadow tree) and finds no text. It does for a native checkbox in a `<label>` (checked with a throwaway page).
  - `label-title-only`: a `wa-select` with a visually hidden `label` (the filter's operator). `wa-select` names its combobox through `aria-labelledby` and always adds `aria-describedby` for its hint; the rule only counts visible `aria-labelledby` text. Chromium names the combobox "Operator". A `wa-input` with the same hidden label passes, since it uses `<label for>`.
- The two existing `empty-table-header` exceptions (03's selection test, 05's notes) now go through the same helper.

**Fixed in our code**

- Closed details (`OwcTable.js`): `aria-required-children` on the grid and the body in every detail mode. A closed `wa-details` is rendered in every row of a detail mode, and the `<details>` in its shadow tree is a group among the rows. The closed `.detail-row` is `aria-hidden` now (test: "is out of the accessibility tree while it is closed").
- The detail toggles' column header (`linkWithDetail`) was empty (`empty-table-header`, our `label: ''`): it is named "Details" by a visually hidden label (`tableDetails`).
- Checkboxes in cells (`getFieldPathContent.js`): `editableOptions.type: 'checkbox'` and `formatter: 'checkbox'` rendered a `wa-checkbox` without a name (`label`, `label-title-only`, 06's note). They are named by the column's `labelString` or string `label` as visually hidden content.
- Filter builder (`OwcTableFilterBuilder.js`, `OwcTableFilter.js`): the delete, pause and negate icon buttons had no names (`button-name`), the global search, the operator select and the value inputs no labels. New terms `tableDeleteFilter`, `tableNegateFilter`, `tableOperator`, `tablePauseFilter`, `tableResumeFilter` (`en`, `de`, the copy in `localization.rocket.md`); the pause button says "Pause filter" or "Resume filter". The value inputs are named by the column. The labels are visually hidden. The filter's buttons only showed on hover (`opacity: 0`), so a keyboard user tabbed to invisible buttons; they show now while one of them has the focus (`#controls:focus-within`), tested.
- Mass edit (`OwcTableMassEdit.js`): the value field had no label; every editor type is named by the column now (visually hidden).

**Follow-ups filed** (`Status: needs-triage`, rows in the spec's ticket table)

- [12](12-settings-dropdown-axe.md): the open settings dropdown still fails axe (07's findings, checked again: `aria-required-children` and `aria-input-field-name` on the autocomplete's listbox, the search field and the visibility checkboxes without names, the `?` button without a name). Not trivial: the listbox wraps things that aren't options.
- [13](13-filter-builder-names-and-states.md): the filter types other than text and number aren't checked; the pause and negate buttons don't expose their state (`aria-pressed`, needs a `pressed` on `owc-icon-button`); AND/OR groups and NOT are only visual.
- [14](14-action-tabs-state.md): the action tabs work with Tab, Enter and Space, but don't say which tab is open.
- [15](15-detail-opened-by-find-in-page.md): a closed detail that find-in-page opens (05's open point) shows, but isn't a row of the grid, and with this ticket's `aria-hidden` it is hidden from assistive technology too.

**Docs and changeset**

- `OwcTable.rocket.md`: a Keyboard section (moving around, rows, headers, groups and details, editing, controls in cells with how controls in custom formatters are found and that closed shadow roots can't be seen, around the table); the API rows of `getSelectorSettings` and `getRowLinkSettings` say what their `aria-label` names; Editing with Checkbox says how the checkbox is named. `OwcPinboard.rocket.md`: a Keyboard section (moving around, moving a card, the Move to… menu, names and identity). `OwcTableInfo.rocket.md`: the keys of the settings tab. `label`, `cardLabel`, `getCardId` and `expanded` were already in their API tables (01, 08, 05). No conformance claim anywhere.
- READMEs: `src/table/README.md` (closed details, the toggles' column name, the axe and toolbar suites), `src/pinboard/README.md` (the axe suite), `src/a11y/README.md` (`expectAccessible`).
- `.changeset/keyboard-accessible-table-and-pinboard.md`: one `minor` changeset with R2's migration notes and the Consumer-Visible Changes 03–10 listed for it, plus this ticket's.

**C5: 100k-row benchmark**

Measured on 2026-11-15 on this ticket's working tree with ticket 01's method and scripts (`probe/benchmark.mjs`, `probe/benchmark-sort.mjs`, `t01/load-only.mjs`, `t01/manual-scroll.mjs`): headless Chromium (Playwright 1.65.1), 1400×900, 1x CPU, Apple M1 Pro, docs served by `rocket start` from the worktree (8391) and from the copy of the base commit `ab422fd` that 01 used (8392), measured in turns. To tell this ticket's share from 02–10's, the commit before this ticket (`49deb3b`, the integration tip with 06) was served too (8393, `git archive`). **Load average 4.5 to 10.7 on 10 cores** the whole time (other agents).

| Target (C5) | `ab422fd` | `49deb3b` (01–10) | This ticket | Met |
| --- | --- | --- | --- | --- |
| First rows within 200ms | median 122 ms (114 to 140, 15 runs); 127 (117 to 139, 15 runs) | median 139 ms (131 to 174, 15 runs) | median 137 ms (130 to 145, 15 runs); 142 (134 to 160, 15 runs) | yes |
| Re-render after a sort within 100ms, without the sort | 56, 40, 56 ms | – | 50, 59, 55 ms | yes |
| Re-render after a filter within 100ms, without the filter | 38, 38, 40 ms | – | 38, 46, 42 ms | yes |
| No white while scrolling (60px and 250px per frame, down, up, up from the end) | 0 frames with gaps (4 runs) | not read | 0 frames with gaps (4 runs) | yes |
| At most one blank frame when dragging the scrollbar or flinging (10 jumps, jump to the end) | at most 1 in a row (4 runs) | not read | at most 1 in a row (4 runs) | yes |
| No task over 50ms while scrolling | 1 run of 17 with one task of 66ms (10 jumps) | 0 of 3 runs | 2 runs of 17 with one task each: 60ms (fling down), 50ms (10 jumps, sidebar layout) | not in every run, see below |
| Wheel and keyboard scrolling (manual monitor, scripted: 120 × 100px and 60 × 600px wheel ticks, 200 × ↓ and 60 × PageDown at 30 keys per second, Ctrl+End then Ctrl+Home, focus on a cell) | 0 gaps, 0 long tasks (keys scroll the page) | – | 0 gaps, 0 long tasks; the focus ends on row 203, 940, 99999 and 0 as it should | yes |

- The scripted scroll ran 17 times per side, alternating with the base: 3 + 3 + 5 times in the page layout and 1 + 5 times in the `owc-layout-sidebar` layout. All lines of the first 4 runs per side are read (the same lines as 01's baseline, except one long task); the 13 later runs were run to see how often long tasks come, and only their long-task counts were read.
- **Long tasks: not met in 2 of 17 runs, and not fixed.** One task of 60ms and one of 50ms (rounded; the observer reports tasks over 50ms), each in a different phase and layout, neither reproduced in the following runs. The base commit had one too (66ms, 1 of 17), and 01 saw none at all under similar load. I put it down to the machine load, but I didn't profile the two tasks, so that is not proven. A run on an idle machine would settle it.
- **First paint is 12 to 15ms slower than the base, and that came with 02–10, not with this ticket**: the commit before it is at 139 ms against 137/142 with it (the two runs of 15 differ by more than that). 01 measured 3ms over the base. Still 55ms under the target. Not looked into further: the benchmark table has no feature that 02–10 render specially (no selector, details, groups, editors), so the candidates are the per-render work around the rows (`aria-selected`, the first data column `find`, `#keepFocusAfterRender`'s checks) and per-row attributes; worth a look by whoever reviews performance.
- This ticket's own per-render cost is the checkbox name in the benchmark's `formatter: 'checkbox'` column (`Active`): one text node per rendered row.
- Not measured: a human on a trackpad, 4x CPU throttling (not a target).

### 2026-11-15: keyboard-accessibility review

- **`empty-table-header` is no exception anymore.** It covered our own select-all header cell, which C2 doesn't allow (exceptions only for Web Awesome internals). The selection column's header cell now holds a visually hidden "Selection" (`tableSelection`, `en` and `de`) before the checkbox, and points to it with `aria-labelledby`, so its name is "Selection" and not "Selection Select all" (the checkbox would add its own name to a name from content). Chromium used to name that header "Select all" by the checkbox. The two other exceptions stay: both are Web Awesome's markup (the unnamed region of an open `wa-details`, and `wa-select` naming its combobox through `aria-labelledby` plus `aria-describedby`).
- **New public API in the changeset and the docs.** `label` on `owc-click-editable-*` was in both; its API row now says it names the input or the textarea (the autocomplete and autofill editors don't use it). The table's formatter list has `checkbox`, with how it is named; the pinboard docs and the changeset say that a board with only one destination has no Move to… button. The review also asked for `OwcTableHeaderCell.cycleSort()`: it isn't Public Surface (`owc-table-header-cell` isn't exported, the export map only has `exports/*`), so it stays in `src/table/README.md` only. The same goes for the checkbox naming in `getFieldPathContent.js`: the function is internal, and what consumers see of it (named checkboxes) is in the formatter list, in Editing with Checkbox and in the changeset's "Checkboxes" note.
- **C5 rerun: no task over 50ms in 17 runs per side.** Same method and scripts as above (`probe/benchmark.mjs`, the demo's "Run scripted scroll" with its own instruments): headless Chromium (Playwright 1.65.1), 1400×900, 1x CPU, Apple M1 Pro, docs served by `rocket start` from this branch's worktree (the review fixes on top of `e7a8a36`, 8391) and from the copy of the base commit `ab422fd` (8392), measured in turns, 12 runs per side in the page layout and 5 in the `owc-layout-sidebar` layout. No test run and no other server of this session ran meanwhile. The machine wasn't idle, though: another session's Playwright runs were going, and the load average was 3.8 to 8.3 on 10 cores (4.5 to 10.7 in the run above).

  | Target (C5), scripted scroll | `ab422fd`, 17 runs | This branch, 17 runs | Met |
  | --- | --- | --- | --- |
  | No task over 50ms while scrolling (all six phases of every run) | 0 runs with one | 0 runs with one | yes |
  | No white (60px and 250px per frame, down, up, up from the end) | 0 frames with gaps | 0 frames with gaps | yes |
  | At most one blank frame when dragging the scrollbar or flinging (10 jumps, jump to the end) | at most 1 in a row | at most 1 in a row | yes |
  | First rows within 200ms | median 118 ms (106 to 136) | median 136 ms (125 to 160) | yes |

  Since no long task came, there was nothing to attribute. To be sure the demo's observer doesn't miss one, three more runs of this branch had a `PerformanceObserver` for `longtask` and `long-animation-frame` (with its script attribution) installed before the page loaded (`wtr/attribution.mjs` in the session's scratchpad): no entry over 50ms either. The two long tasks of the run above (60ms and 50ms, 2 of 17) and the base's one (66ms) didn't come back at a lower load, which fits machine load but doesn't prove it. The sort and filter re-render targets weren't measured again: the review changed nothing on that path but the selection column's header (the benchmark table isn't selectable) and how the checkbox name is hidden (the same declarations, now shared). The first rows are still 18ms slower than the base, as above, and 64ms under the target. The C5 box is ticked.
