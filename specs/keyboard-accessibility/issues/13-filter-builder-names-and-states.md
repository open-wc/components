# 13: Filter builder: every filter type named, toggle states exposed

Status: needs-triage

**What to build:** the rest of the filter builder's accessibility beyond what 11 fixed. 11 named the controls of text and number filters and of the global search, and made a filter's buttons show while one has the focus. Not part of the launch gate (C4).

Spec: [Scope](../spec.md#scope), [C4](../spec.md#checks).

**Blocked by:** None.

What 11 left (found while writing the axe check and the smoke test in `OwcTable.toolbar.test-browser.js`):

- **Other filter types aren't checked**: `checkbox` (`owc-multi-checkbox`), `autocomplete`, `array` (a nested builder with its own operator `wa-select`), `boolean`, `custom`, `date` and `datetime` (the two inputs of `between`, which are both named by the column). The axe checks only cover `text` and `number` filters.
- **The pause and negate buttons don't say their state.** The pause button's name changes ("Pause filter" / "Resume filter"), but the negate button is always "Negate filter", and neither has `aria-pressed`. `owc-icon-button` has no `pressed` property; adding one is a public change.
- **The structure isn't announced**: which filters are AND-ed and which OR-ed is only shown by separators (`owc-separator`), and "NOT" by a bar.
- The Filter Lexikon panel (`wa-details`) and the field selector were not looked at beyond axe passing.

- [ ] axe passes for a builder with a filter of every `filterType`, including `between` on dates.
- [ ] Toggle buttons expose their state (`aria-pressed`, through a new `pressed` on `owc-icon-button` or a native button).
- [ ] A screen reader user can tell AND from OR groups and a negated filter (checked by hand, or with names that say it).

## Comments
