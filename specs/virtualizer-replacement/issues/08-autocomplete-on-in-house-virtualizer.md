# 08: The 50k-option autocomplete on the new virtualizer

**What to build:** The autocomplete can list all 50k options.

- Its own option list is the scroll container, so nothing gets detected and neither popups nor table cells can confuse it.
- The list sizes to its content.
- The keyboard reaches every option, and the active option is always visible.
- It gets the same `virtualizer-mode` as the table, and the 200-option cap goes away.

Spec: [A1–A8](../spec.md#autocomplete).

**Blocked by:** 01 (Tracer bullet: a 100k-row table that never stays white).

**Status:** resolved

- [x] The autocomplete has `virtualizer-mode`: `auto` from 300 options, `always` and `never`. It is typed and documented (A1).
- [x] `maxDropdownOptionsVisible` is removed, so every matching option can be listed (A2).
- [x] The option list is passed to the virtualizer as its scroll container, and the `no-clipping` attribute is gone (A3).
- [x] The list sizes to its content, up to the popup's available height, and the fixed minimum height is gone (A4).
- [x] With 50k options, Arrow keys, Home, End and wrap-around reach the first and the last option. The active option is visible, and Enter selects it (A5).
- [x] The `virtualizer` and `virtualizerHost` getters are removed (A6).
- [x] Everything built on the autocomplete keeps working, and their suites pass (A8):
  - table settings, table filter and mass edit;
  - the click-editable autocomplete;
  - input autofill;
  - the JSON form enum renderer;
  - data detail;
  - autocompletes inside table cells.

  The table-settings test no longer waits on the old virtualizer.

- [x] A 50k-option demo exists in the autocomplete docs: loaded on a button click, with page scrolling and inside `owc-layout-sidebar`.
- [x] Opening the dropdown within 100ms and a keystroke updating the list within 50ms are measured and recorded under `## Comments`. If either misses, the filtering is made faster (A7).
- [x] The changeset has migration notes for the removed property and getters, and the Release Gate passes.

## Comments

### 2026-10-12: implementation (branch `virtualizer/08-autocomplete`)

**Built**

- `owc-autocomplete` renders its options through `VirtualizerController` with the option list (`#rows`) as the explicit scroll container. A `ref` callback sets it while Lit commits the render, so even the first `hostUpdated` attaches to it and nothing is detected. `virtualizer-mode` (`auto` from 300 options in `processedData`, `always`, `never`) is a typed property with an attribute. `maxDropdownOptionsVisible`, the `limitedProcessedData` getter that applied it, the `virtualizer` and `virtualizerHost` getters, `no-clipping` and the inline `min-height: 300px` are gone.
- The listbox is a flex column: the search field and the footer keep their size, and `#rows` sizes to its options up to what the popup's `--auto-size-available-height` leaves (`flex: 0 1 auto; min-height: 0; overflow-y: auto`).
- The active option is kept in view with `scrollToIndex(index, { block: 'nearest' })`, or by scrolling only `#rows` for plain lists: on Arrow keys, Home, End and wrap-around, after each search (the active option if it still matches, else the first match), and when the dropdown opens (active option, else the first option).
- Opening speed: the dropdown width came from `measureText` over all 50,000 labels on every opening (130 to 165ms). The new pure helper `widestLabelWidth.js` estimates labels from per-character widths and measures the 20 widest exactly, and the result is cached per data array and font. The `selectedOption` and `valueLabel` getters no longer rebuild `value` once per option on every render.
- Tests: 15 new browser tests in `OwcAutocomplete.test-browser.js`, replacing the `maxDropdownOptionsVisible` test: 50k options (list end, keyboard, Enter), sizing (5 options, available height), all three modes and the 299/300 threshold, crossing the threshold by searching, the first frame after reopening (checked from a `ResizeObserver` callback, after layout and before paint), search reveal, page scroll, the dropdown width, and an autocomplete in a table cell of a 500-row virtualized `owc-table`. Node tests for `widestLabelWidth.js`. The settings test awaits `updateComplete` instead of 50ms.
- Docs: a Large option lists section in `OwcAutocomplete.rocket.md` with two 50,000-option benchmarks (page scrolling, `owc-layout-sidebar`), loaded on a click. They report opening and keystroke latency until the next paint, and have a scripted test. API table, keyboard section, both READMEs and the changeset are updated.

**Deviations**

- Options render only while the dropdown is open, so the controller is idle while it's closed. The old virtualizer rendered nothing in the hidden popup either.
- Options are keyed by their object, as in the table (ticket 01), not by option value as the spec's design note suggests: duplicate or missing values can't break `repeat`, and measurements survive filtering.
- "Always visible" also covers reopening and searching. Chromium resets a hidden popover's scroll position, so without a reveal the first frame after reopening showed a spacer. Reveals wait until the popup has set `--auto-size-available-height`: before that, `#rows` is as tall as all its options and `scrollIntoView` scrolled the page (577px in a test). The active option now scrolls into view instantly instead of smoothly, so Enter never selects an option that is still scrolling in.
- A7: the opening target was missed because of the width measurement, not the filtering, so that is what got faster. Filtering was already within target and is unchanged.
- The table-settings grips for reordering columns were always hidden (`wa-input` reports `null` until typed into, and `null !== ''`), before and after this change. Fixed in `OwcTableSettings.js` with a test, so the drag-and-drop could be checked: with real mouse input, rows reorder, `overrides.order` follows, no duplicate rows, and the order survives reopening.
- The table-cell test lives in the autocomplete suite, because 03 to 07 edit the table test files in parallel.
- No controller changes. `src/virtualizer/README.md` gained a Hosts section with the popup findings above.

**Unchecked:** none.

**Measurements** (A7; spec: Acceptance → Manual). Headless Chromium (Playwright 1.62), 1280×900, Apple Silicon. The demos' own instruments measure from the input event's timestamp (a real `mousedown` on the combobox, real key presses into the search field) until the next paint. Per configuration: 5 openings and 90 keystrokes (typing "golden la" and deleting it: 50,000 → 32,432 → 6,250 → … → 781 options). Another worktree's 4x table benchmark ran on the same machine at the same time.

| Production build (`npm run build`) | Opening: first / again | Keystroke: min to max (median) | End / Home (scripted) |
| ---------------------------------- | ---------------------- | ------------------------------ | --------------------- |
| Page scrolling, 1x CPU             | 39ms / 8ms             | 5 to 17ms (7ms)                | 11ms / 8ms            |
| `owc-layout-sidebar`, 1x CPU       | 38ms / 8ms             | 6 to 17ms (7ms)                | 12ms / 9ms            |
| Page scrolling, 4x CPU throttling  | 151ms / 34 to 36ms     | 23 to 69ms (29ms)              | 41ms / 33ms           |
| `owc-layout-sidebar`, 4x           | 163ms / 34 to 37ms     | 24 to 72ms (29ms)              | 41ms / 30ms           |

The dev server (Lit dev build) gave 40 to 41ms / 8 to 9ms and 6 to 29ms at 1x, and 174 to 187ms / 32 to 46ms and 24 to 79ms at 4x. Both targets are met at 1x: opening within 100ms, a keystroke within 50ms. Before the width change, every opening took 128 to 164ms at 1x.

At 4x, the first opening and the first one-letter keystroke miss. A CPU profile of the first opening shows about 90ms in measuring label widths, which happens once per data array. The first keystroke spends about 20ms in the filter (lowercasing 50,000 labels) and the rest rendering and rebuilding sizes for 32k options. If slow devices matter: measure the widths in idle time after `data` changes, and cache lowercased labels per data array.

### 2026-10-12: resolved

Merged into `feat/virtalizer` in `9a05e5e`. The code review fixes for the whole spec landed afterwards in `72f3b74`.
