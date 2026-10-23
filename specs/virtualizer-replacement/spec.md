# Replace `@lit-labs/virtualizer` with an in-house in-flow virtualizer

`owc-table` and `owc-autocomplete` stop using `@lit-labs/virtualizer`. Both move to a private, in-house Lit controller that renders rows in normal flow between two spacers ([ADR-0006](../../docs/adr/0006-own-an-in-flow-vertical-virtualizer.md)). `owc-pinboard` follows in a later, separate effort.

This spec is the source of truth for the work; tickets are derived from it. Terms follow the [glossary](../../GLOSSARY.md), in particular **Data Row**, **Public Surface**, **Consumer-Visible Change** and **Migration Handling**.

## Problem

The package's only consumer so far, an internal application, shows large lists that misbehave with `@lit-labs/virtualizer`:

- **The table stays white after scrolling stops.**
  - This happens with or without details, and it has never been fixed.
  - Upstream has open issues for lag at high scroll speed (lit/lit#5006) and for `display: contents` slots (lit/lit#4922).
  - The only fix is an unmerged draft PR, and nothing has been released since 2.1.1.
- **Wrong total height.**
  - Row heights start from a generic estimate and get corrected while scrolling. At 90k Data Rows, a 3px estimate error means a 270,000px height error.
  - The library also caps its size at a hard-coded 8.2M px. Any table that averages more than about 91px per row at 90k rows gets clamped, and its end can't be reached.
- **Wrong column widths.**
  - Script code measures widths from whichever rows happen to be rendered (`recalculateColumnWidths` after `layoutComplete`).
  - After that, the virtualizer gets reset by calling its lifecycle internals.

The complete must-fix list follows. Each item maps to an acceptance check below.

| #   | Problem                                                                                                                                      |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| W   | The table stays white after scrolling stops (top priority).                                                                                  |
| a   | Stutter while scrolling 50k+ rows.                                                                                                           |
| b   | Slow re-render after sorting, filtering or new data.                                                                                         |
| c   | The scroll position or scrollbar jumps when height estimates get corrected.                                                                  |
| d   | Blank gaps or overlapping rows after fast scrolling, or after a row changes height (e.g. a detail opens).                                    |
| e   | Wrong total height, or an empty table on first render or inside a hidden or collapsed container.                                             |
| f   | Wrong or jumping column widths.                                                                                                              |
| g   | Wrong rows under page scrolling when ancestors have `overflow` or `display: contents` (the reason for the repository patch).                 |
| h   | Every change of the rendered range re-renders the whole table, because `visibleData` is set from `rangeChanged` after the rows are rendered. |
| i   | Grouped tables run one virtualizer per group (the TODO in `#renderGroups`).                                                                  |
| j   | The insert flow does nothing when the insert row isn't rendered: it should scroll the new row into view and focus it.                        |
| k   | Autocomplete keyboard navigation can't bring an unrendered option into view, but Enter still selects it.                                     |
| l   | The autocomplete needs the `no-clipping` patch inside its popup, a fixed 300px list height, and a 200-option cap.                            |

Further facts:

- **The patch never reaches consumers.** `patches/@lit-labs+virtualizer+2.1.1.patch` isn't published, and the published `postinstall: patch-package` doesn't apply it.
- **Libraries were already tried.** Two to three, TanStack included (`origin/feat/virtualizer-replacement`), and none beat `@lit-labs/virtualizer`. See ADR-0006.
- **The autocomplete cap is a workaround.** `maxDropdownOptionsVisible` (default 200) was only added because of these problems.
- **Test coverage is small.** No test or demo goes beyond 301 rows today.

## Scale and environment

- **Table:** up to 90k Data Rows today. The target is 100k scrolling smoothly, stretch 250k, with all data in memory as today.
  - No scroll compression: Chromium clamps elements at about 33.5M px, so 250k rows fit at up to about 134px average row height.
- **Autocomplete:** 50k options.
- **Scroll containers:**
  - the document;
  - `owc-layout-sidebar`'s `#content`, which is the internal application's page scroller, with pages slotted across its shadow root;
  - any scroll box a consumer wraps the component in.
- **Browsers:** Chromium is the only required engine and the only CI gate. Firefox and Safari are a bonus: no Chromium-only API is used without a fallback, and they get a manual check before releases.
- **Compatibility:** no compatibility layers or deprecation periods. Removals still get Migration Handling (changelog entries and migration notes).

## Scope

**In this effort:** the private virtualizer, `owc-table`, `owc-autocomplete`, removing the patch and its install hook, docs, changesets and benchmark demos.

**Later, separate effort:** `owc-pinboard` (about 1000 cards per column). Until then it keeps the unpatched `@lit-labs/virtualizer`, and the dependency is removed when it moves.

**Non-goals:**

- Virtualizing columns; every column of a rendered row renders.
- Browser find-in-page for rows that aren't rendered. Small tables below the threshold, and `virtualizer-mode="never"`, keep full find-in-page.
- Printing all rows.
- Server-side rendering. It will come later, so nothing here may block it (see V9).
- Grid or masonry layouts.
- Keeping DOM-only state, such as focus or a half-typed inline edit, for rows that leave the rendered range. State the table tracks itself survives.
- Restoring the scroll position from the URL.
- New ARIA semantics. The table has no table roles today, and the autocomplete keeps its current listbox markup.

## Requirements

### Virtualizer (private shared module)

- **V1 Rendering model:**
  - The controller decides the rendered range and the heights of a top and a bottom spacer.
  - The host renders spacer, the rows in range, spacer, in normal flow, with its own markup.
  - Rows are keyed by identity, so a shifted range only adds and removes rows at its edges.
- **V2 Scroll container detection:** works without configuration.
  - The search walks up the flat tree: assigned slots and shadow hosts.
  - It skips boxless elements (`display: contents`).
  - It takes the first ancestor that scrolls.
  - It stops at `position: fixed` and top-layer elements (open popovers, modal dialogs).
  - If nothing is found, the document is the scroll container.
  - It must work for the document, for `owc-layout-sidebar`'s `#content`, for a consumer scroll box, and for the existing `display: contents` slot fixture.
  - Hosts may pass the scroll container explicitly instead.
- **V3 Coverage, never white:** the rendered rows always cover the intersection of the list with the visible area of its scroll container and the viewport. This is checked:
  - after scrolling stops;
  - after any resize, data change or remeasure.

  On top of that, the browser reports when a spacer is actually visible, and that always triggers a range correction. So a wrong guess in V2 can't leave the table white.

- **V4 Heights:**
  - Unmeasured rows are estimated at the measured typical row height.
  - A row the host reports as having an open detail gets the typical detail height added to its estimate.
  - Every rendered row is measured, and measurements are cached by row identity so they survive sorting.
  - Hosts can invalidate measurements when the layout changes (e.g. column widths).
- **V5 Anchoring:** when the size of rows above the visible ones changes, because a row was measured or a spacer resized, the visible rows stay where they are on screen. The scrollbar may be approximate until irregular rows have been seen.
- **V6 Bounded DOM:** rendered rows are the visible rows plus a buffer in each direction, sized in pixels rather than rows. The count never grows with the total number of rows.
- **V7 Host API:**
  - Hosts get the rendered range (first and last index) and are notified only when it changes.
  - `scrollToIndex(index, options)` brings a row into view and resolves once the row is rendered.
  - Hosts can request a remeasure.
- **V8 Lifecycle:**
  - Connect, disconnect, and reconnect while scrolled down.
  - A host with zero size (hidden) recovers when it becomes visible.
  - Several instances can share one scroll container without interfering.
  - No consumer calls private lifecycle methods.
- **V9 First render and SSR:**
  - The first render already contains a leading slice of rows, so no first render is deferred.
  - The controller never touches the DOM or `window` while rendering. A future server render can then output that leading slice, and the browser takes over.
- **V10 Modes:**
  - Hosts render plainly or virtualized depending on `virtualizer-mode`: `auto` virtualizes from 300 rows or options, plus `always` and `never`.
  - Crossing the threshold in either direction leaves no stale sizing behind.
- **V11 Location:**
  - The module is private: `src/virtualizer/`, with a README for contributors. It is not exported and not part of the Public Surface. Hosts import it by source path.
  - Pure range and offset math gets `*.test.js` node tests; browser behavior gets `*.test-browser.js` tests using a minimal host.
- **V12 Browsers:** see Scale and environment. Chromium is the gate, and nothing breaks Firefox or Safari without a fallback.

### Table

- **T1 One CSS grid:**
  - The header row and every body row are subgrid rows of one grid, so the browser keeps the columns aligned.
  - The sticky header is the grid's first row, with the same offset as today (`top: 0`, or `var(--info-height)`).
  - Group headers, annotations, details and spacers span all columns.
  - Existing class names stay: `.table-header`, `.table-body`, `.row-container`, `.row`, `.cell`, `.cell-content`, `.row-annotation`, `.highlighted`. The generated `nth-child` width rules go away.
- **T2 Column widths:**
  - A configured `width` wins, and drag-resize sets it as today.
  - All other columns are sized by the browser from the header and the first rendered rows, then frozen in px. The existing minimum width still applies.
  - Widths are recalculated only on today's triggers (changes to data, filters, sorters, columns or overrides), on double-click reset, and through `recalculateColumnWidths()`. Never while scrolling.
  - `grow-full-width` keeps filling the available width.
- **T3 Groups as one list:**
  - Group headers are full-width rows within the single list, and look as they do today: colors, count badge, chevron.
  - Collapsing or expanding a group removes or adds its rows. Group order and the "others" group work as today.
  - Row clicks and selection resolve rows by identity, never by position.
  - The `auto` threshold counts Data Rows across all groups; group headers and insert rows don't count.
- **T4 `visibleData`:**
  - It is the Data Rows currently rendered, including the buffer, in display order (grouped tables too).
  - It is set in the same update that renders a new range, so a range change costs exactly one table update.
- **T5 API changes:**
  - Removed: `virtualizer`, `virtualizerHost`, `resetVirtualizer()`.
  - Added: a `scrollTarget` property, an Element that overrides the scroll-container detection (default: detection).
  - Kept: `virtualizer-mode` (unchanged values, `auto` from 300 Data Rows) and `recalculateColumnWidths()`.
- **T6 Details:**
  - `detail` mode stays unchanged: closed detail content renders for every rendered row, so Ctrl+F finds it.
  - `detailDeferred` and `linkWithDetail` stay unchanged.
  - Opening a detail scrolls it into view as today.
  - Async detail content gets measured when it arrives.
  - Open state lives in `openDetails` and survives rows leaving and re-entering the range.
- **T7 Insert flow:** after an insert, the insert row (always last) is scrolled into view through the controller, and its first editable field gets focus. This works with virtualization on too. It replaces the 100ms timeout plus `scrollIntoViewIfNeeded`.
- **T8 Hidden and resized:**
  - A table first rendered in a hidden or collapsed container shows its rows once it becomes visible.
  - Window resizes and host width changes update widths and measurements without any reset of the virtualizer's internals.
- **T9 Row cost:** making the row template cheaper is in scope wherever profiling shows a target being missed, without changing behavior (especially `detail` mode's Ctrl+F guarantee).
- **T10 Horizontal scrolling:** wide tables still scroll horizontally, and the sticky `left` offsets of `#header` and `#info-wrapper` stay unchanged.

### Autocomplete

- **A1 Mode:** add `virtualizer-mode`, with the table's values, default `auto`, virtualizing from 300 options.
- **A2 No cap:** remove `maxDropdownOptionsVisible`, so the dropdown can list every matching option.
- **A3 Own scroll container:** the option list (`#rows`) is passed to the controller as its scroll container, so nothing is detected. The `no-clipping` attribute goes away.
- **A4 Sizing:** the list sizes to its content, up to the popup's available height (`--auto-size-available-height`). The inline `min-height: 300px` goes away.
- **A5 Keyboard:** Arrow Up and Down, Home, End and wrap-around reach every option. The active option is always scrolled into view, so Enter only selects an option that is visible.
- **A6 Removed:** the `virtualizer` and `virtualizerHost` getters.
- **A7 Filtering:** making the filtering of 50k options faster is in scope if it breaks the targets.
- **A8 Dependents keep working:**
  - `OwcTableSettings` (extends `OwcAutocomplete`), the click-editable autocomplete, input autofill, the JSON form enum renderer, data detail, table filter and mass edit.
  - Autocompletes inside table cells (`overflow: hidden`).

### Package

- **P1 Patch removal:**
  - Remove `patches/@lit-labs+virtualizer+2.1.1.patch`.
  - Remove the `patch-package` script hook. It is `postinstall` today, or `prepare` if the separate install fix lands first.
  - Remove the `patch-package` devDependency; there are no other patches.
  - `@lit-labs/virtualizer` stays a runtime dependency, unpatched, for `owc-pinboard` only.
- **P2 Test suppression:** remove the table test's import of `@lit-labs/virtualizer/support/resize-observer-errors.js`; the pinboard test keeps its own. Don't add a new global error suppression.
- **P3 Changesets:** a minor release (pre-1.0 breaking changes are minors). Consumer-Visible Changes:
  - removed APIs (T5, A2, A6);
  - added APIs (`scrollTarget`, autocomplete `virtualizer-mode`);
  - behavior fixes.

  Migration notes cover the removed APIs, and the table's layout change from flex to grid for anyone using `customStyles`.

- **P4 Docs:**
  - Update `src/table/README.md`, `src/table/OwcTable.rocket.md`, `src/autocomplete/README.md` and `src/autocomplete/OwcAutocomplete.rocket.md`.
  - Add `src/virtualizer/README.md` for contributors.
  - Public docs import from package export paths.
  - Demos use generated data and no internal-application names (Release Hygiene).
- **P5 Validation:** regenerate Generated Artifacts (`dist-types/`) through `npm run types`, and pass the Release Gate.

## Acceptance

### CI (Chromium, deterministic)

Tests drive the public `owc-table` and `owc-autocomplete` elements, plus the controller through a minimal test host. They await events and promises (`scrollend`, `updateComplete`) instead of fixed timeouts wherever possible.

- **[W, d, g] Coverage:**
  - Scroll to the top, middle and end, and make random jumps. Once scrolling stops, the rendered rows cover the visible area.
  - Check this for the document, a slotted `owc-layout-sidebar` `#content`, a consumer scroll box, and the `display: contents` slot fixture.
- **[e] Ends:**
  - Scrolling to the end shows the last Data Row of 100k.
  - The 299/300/301-row threshold crossings, and large → small → large data, leave no stale sizing.
  - A table rendered while hidden shows rows once visible.
- **[a] Bounded DOM:** with 100k rows, the rendered row count stays within visible plus buffer.
- **[b, h] Data changes while scrolled down:** sort, filter and replace data while scrolled down. The rows shown are correct, unique and in order, and `visibleData` matches them.
- **[c, d] Height changes:**
  - Opening or closing a detail, and async detail content arriving, reposition the following rows.
  - Visible rows stay put when rows above them change height.
- **[f] Column widths:**
  - Columns fit their content after the first render and don't change while scrolling.
  - Configured widths win.
  - Data and column changes, and double-click reset, recalculate them.
- **[i] Groups:** test several groups, collapsing and expanding. Row clicks and selection resolve the right row.
- **[j] Insert flow:** with a virtualized table, inserting scrolls to the insert row and focuses it.
- **[k, l] Autocomplete:**
  - With 50k options, Home, End and wrap-around reach the first and last options, the active option is visible, and Enter selects it.
  - A list with 5 options sizes to its content.
  - All three modes and the 300-option threshold behave as specified.
- **Regression:** the existing suites of the table, the autocomplete and all their dependents pass.

### Manual (Chromium, public benchmark demos)

There are two demos with generated data, both loaded on a button click so the docs pages stay fast:

- `OwcTable.rocket.md`: 100k rows, about 20 columns with mixed formatters, and annotations on about 1% of rows. Toggles switch between `detail` and `detailDeferred`, and turn grouping on.
- `OwcAutocomplete.rocket.md`: 50k options.

Each demo comes in two versions: page scrolling and inside `owc-layout-sidebar`. Measurements use DevTools Performance recordings.

- **Table, 100k rows:**
  - no white during wheel, trackpad or keyboard scrolling;
  - at most one blank frame when dragging the scrollbar or flinging;
  - no task over 50ms while scrolling;
  - first rows within 200ms of setting the data;
  - re-render within 100ms after a sort or filter, not counting the sort or filter itself.
- **Autocomplete, 50k options:** opening within 100ms; a keystroke updates the list within 50ms.
- **Firefox and Safari:** smoke-test the same demos before a release (not a gate).

## Delivery order

The tickets live in [issues/](issues/).

- **01 is the proof:** it shows the core holds (never white, correct height, speed) on the 100k benchmark demo, and it ends with a go/no-go. Every ticket that builds on the virtualizer is blocked by it. If the proof fails, revisit this spec.
- **02 is independent:** it's a layout refactor that changes no virtualization behavior, so it can land in parallel.

| Ticket                                                                                                                          | Blocked by |
| ------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| [01: Tracer bullet: a 100k-row table that never stays white](issues/01-tracer-bullet-never-white-table.md)                      | —          |
| [02: Table rows on shared CSS grid tracks](issues/02-table-rows-on-shared-grid-tracks.md)                                       | —          |
| [03: Height changes keep the visible rows in place](issues/03-height-changes-keep-rows-in-place.md)                             | 01         |
| [04: Columns sized by the browser and frozen while scrolling](issues/04-browser-sized-frozen-columns.md)                        | 01, 02     |
| [05: Grouped tables virtualize as one list](issues/05-grouped-tables-as-one-list.md)                                            | 01         |
| [06: Inserting into a big table scrolls to the new row](issues/06-insert-scrolls-to-new-row.md)                                 | 01         |
| [07: Table API: `scrollTarget` added, old virtualizer accessors removed](issues/07-table-scroll-target-and-accessor-removal.md) | 05         |
| [08: The 50k-option autocomplete on the new virtualizer](issues/08-autocomplete-on-in-house-virtualizer.md)                     | 01         |
| [09: Remove the patch and the install hook](issues/09-remove-patch-and-install-hook.md)                                         | 07, 08     |

- **Coordinate 04 and 05:** both restructure the table body. Neither gates the other, but running them in parallel risks merge conflicts.
- **Row cost (T9):** making row rendering cheaper only becomes a ticket if a benchmark misses a target.
- **Later, separate effort:** `owc-pinboard`, which also removes `@lit-labs/virtualizer`.

## Design notes

These are guidance, not requirements; the tickets either confirm them or replace them.

- **Fast path:**
  - A passive `scroll` listener on the scroll container computes the range synchronously from cached geometry and requests a host update.
  - Scroll events run before animation frames and Lit updates in a microtask, so new rows paint in the same frame.
- **Safety net:**
  - An `IntersectionObserver` with the implicit root watches both spacers, alongside `scrollend` and `ResizeObserver` triggers.
  - The browser computes clipping through shadow roots, slots and the top layer, so a visible spacer can't go unnoticed.
- **Offsets:** keep per-row heights in a typed array with prefix sums, or in a Fenwick tree for incremental updates. That gives O(log n) index ↔ offset lookups at 250k rows. A full rebuild after sorting or filtering is O(n), which is fine.
- **Typical height:** the median of the measured rows, so open details don't skew it.
- **Anchoring:** choose between native scroll anchoring (`overflow-anchor`; Chromium 56+, now in every engine) and manual compensation with `overflow-anchor: none`, which is what virtua and TanStack do. Ticket 03 decides.
- **Keys:** Lit `repeat`, keyed by the table's row id (`getRowId`) or the autocomplete's option value.
- **Column freezing:**
  - Render the first rows with content-sized tracks, read the resolved px tracks from `getComputedStyle(grid).gridTemplateColumns`, and write them back as explicit tracks.
  - `grow-full-width` can use `minmax(<w>px, <w>fr)` tracks to grow proportionally.
- **Spacers in the grid:** they span all columns (`grid-column: 1 / -1`).
- **Height limits:**
  - Chromium clamps at about 33.5M px.
  - Firefox treats heights from about 17.9M px up as `auto`. That isn't gated, but it bounds Firefox at 250k rows to an average of about 71px per row.

## Current code map

- **`src/table/OwcTable.js`:**
  - `#renderList`, and `#renderListHost` (the keyed host swap).
  - `#handleVirtualizerRangeChanged`: sets `visibleData` and triggers `recalculateColumnWidths` after `layoutComplete`.
  - `#virtualizerReady`: defers the first render.
  - `#scheduleColumnWidths` and `resetVirtualizer()`: the window-resize path.
  - The generated `nth-child` width rules.
  - `#renderGroups`: one list per group, with a group-relative `data-index`.
  - `#handleTableClick`: looks rows up by index.
  - The insert flow: a `setTimeout` plus `scrollIntoViewIfNeeded`.
  - `handleDetailsOpen`.
- **`src/autocomplete/OwcAutocomplete.js`:**
  - `virtualize({ scroller: true, items: this.limitedProcessedData, ... })` on `<div no-clipping id="rows" style="min-height: 300px">`, inside `<wa-popup auto-size="vertical">`.
  - `limitedProcessedData` applies `maxDropdownOptionsVisible`.
  - `updated()` scrolls `.option--current` into view.
  - The `virtualizer` and `virtualizerHost` getters.
- **Tests:**
  - `src/table/OwcTable.test-browser.js`: virtualizer tests with 301 rows, the `TableDisplayContentsHost` fixture, and the lit-labs ResizeObserver suppression import.
  - `src/table/OwcTableSettings.test-browser.js`: waits for the autocomplete's virtualizer.
  - `src/autocomplete/OwcAutocomplete.test-browser.js`.
- **Packaging:** the `package.json` `postinstall: patch-package` hook and `patches/@lit-labs+virtualizer+2.1.1.patch`.

## Decisions and why

- **In-flow rows instead of absolute positioning:** the table can then be one CSS grid sized by the browser, and rows can't overlap or leave gaps.
- **Scroll-container detection without configuration:** the internal application's page scroller is `owc-layout-sidebar`'s `#content`. Explicit-only targets would mean configuring every page.
- **Keep `virtualizer-mode` with the 300 threshold:** small lists stay plain, so find-in-page and printing keep working there.
- **An approximate scrollbar is acceptable:** exact heights would mean rendering every row once.
- **Columns sized by the browser, then frozen:** prefer browser layout over script measurement, and columns never jump while scrolling.
- **Timing targets checked by hand:** timing tests would be flaky in the test runner, which runs one browser test at a time (`concurrency: 1`).
- **No compatibility layers:** the internal application is the only consumer. Migration Handling still applies.

## Related

- [ADR-0006](../../docs/adr/0006-own-an-in-flow-vertical-virtualizer.md): why we build it ourselves.
- **Superseded:** `origin/feat/virtualizer-replacement` (`.scratch/virtualizer-replacement/PRD.md`, TanStack-based). Its user stories make a useful checklist wherever they still apply. Its decisions don't: an explicit-only scroll target and absolutely positioned rows.
- **Separate fixes, independent of this spec:**
  - consumer installs broken by `postinstall: patch-package`;
  - grouped-table row clicks and selection resolving the wrong row.

  P1 and T3 supersede their code once this work lands.
