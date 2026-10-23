---
'@open-wc/components': minor
---

`owc-autocomplete` lists every matching option, also when there are 50,000 of them. It renders its options through the package's new in-house virtualizer instead of `@lit-labs/virtualizer`.

- New `virtualizer-mode` attribute (`virtualizerMode` property), with the same values as on `owc-table`: `auto` (the default) renders only the options in and around the visible part of the list from 300 options on, `always` does so for any number of options, and `never` always renders every option.
- The dropdown no longer stops at 200 options. Every option that matches the search is listed.
- Fix keyboard navigation in long lists. Arrow keys, `Home`, `End` and wrap-around reach every option, the highlighted option is always scrolled into view right away (also after a search and when the dropdown opens again), and `Enter` selects the option you see. When you have scrolled the list away from the highlighted option, `Enter` scrolls it back into view instead of selecting it; the next `Enter` selects it.
- The option list grows with its options up to the space available below or above the control, and then scrolls. It no longer takes at least 300px, so short lists get a short dropdown.
- The option list is its own scroll container, so the dropdown works inside table cells and other containers that clip their content, and inside scrolling layouts such as `owc-layout-sidebar`.
- Opening a dropdown with 50,000 options is faster: the widest label, which sets the dropdown's width, is found without measuring every label, and it is remembered until the options change.
- Fix the column settings of `owc-table`: the drag grips for reordering columns stayed hidden until a search had been typed and cleared.

The autocomplete docs have a new Large option lists section with 50,000-option benchmarks, one with page scrolling and one inside `owc-layout-sidebar`.

Migration:

- `maxDropdownOptionsVisible` is removed, together with the `limitedProcessedData` getter that applied it. Every matching option is listed now; `processedData` holds the options the dropdown lists. To render every option at once instead of only the visible ones, set `virtualizer-mode="never"`.
- The `virtualizer` and `virtualizerHost` getters are removed, without a replacement. The option list is the element with the id `rows` in the shadow root.
- The option list no longer has the `no-clipping` attribute or an inline `min-height: 300px`.
- Options are rendered only while the dropdown is open.
