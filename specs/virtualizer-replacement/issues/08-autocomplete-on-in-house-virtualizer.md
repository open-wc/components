# 08: The 50k-option autocomplete on the new virtualizer

**What to build:** The autocomplete can list all 50k options.

- Its own option list is the scroll container, so nothing gets detected and neither popups nor table cells can confuse it.
- The list sizes to its content.
- The keyboard reaches every option, and the active option is always visible.
- It gets the same `virtualizer-mode` as the table, and the 200-option cap goes away.

Spec: [A1–A8](../spec.md#autocomplete).

**Blocked by:** 01 (Tracer bullet: a 100k-row table that never stays white).

**Status:** ready-for-agent

- [ ] The autocomplete has `virtualizer-mode`: `auto` from 300 options, `always` and `never`. It is typed and documented (A1).
- [ ] `maxDropdownOptionsVisible` is removed, so every matching option can be listed (A2).
- [ ] The option list is passed to the virtualizer as its scroll container, and the `no-clipping` attribute is gone (A3).
- [ ] The list sizes to its content, up to the popup's available height, and the fixed minimum height is gone (A4).
- [ ] With 50k options, Arrow keys, Home, End and wrap-around reach the first and the last option. The active option is visible, and Enter selects it (A5).
- [ ] The `virtualizer` and `virtualizerHost` getters are removed (A6).
- [ ] Everything built on the autocomplete keeps working, and their suites pass (A8):
  - table settings, table filter and mass edit;
  - the click-editable autocomplete;
  - input autofill;
  - the JSON form enum renderer;
  - data detail;
  - autocompletes inside table cells.

  The table-settings test no longer waits on the old virtualizer.

- [ ] A 50k-option demo exists in the autocomplete docs: loaded on a button click, with page scrolling and inside `owc-layout-sidebar`.
- [ ] Opening the dropdown within 100ms and a keystroke updating the list within 50ms are measured and recorded under `## Comments`. If either misses, the filtering is made faster (A7).
- [ ] The changeset has migration notes for the removed property and getters, and the Release Gate passes.
