# 12: Settings dropdown passes axe

Status: resolved

**What to build:** the open settings dropdown of the table (`owc-table-settings`, an `owc-autocomplete` underneath) passes axe without disabled rules, and its controls have names. Found by 07 and checked again in 11. The column settings are in this effort's scope (spec Scope: keyboard column reordering in `OwcTableSettings`), so C2's rule applies: violations in our own code get fixed.

Spec: [Scope](../spec.md#scope), [C2](../spec.md#checks).

**Blocked by:** None.

What axe reports on an open settings dropdown with two columns (2026-11-15, axe-core 4.14):

- `aria-required-children` and `aria-input-field-name`: `#listbox` (`role="listbox"`) of the autocomplete wraps the search field, the column rows with their grips and checkboxes, and the footer buttons, which aren't options; the listbox has no name.
- `label` and `label-title-only`: the search field has only a placeholder, and the visibility checkboxes (`wa-checkbox` without content) have no name.
- `button-name`: the footer's `?` icon button has no name.

None of it is on the grips or their menus (07).

- [x] The column list isn't a `listbox` of things that aren't options (a list of rows, or a listbox of options with the controls outside it); the change stays inside `OwcTableSettings` or is an option of `owc-autocomplete` that other autocompletes don't notice.
- [x] The search field, every visibility checkbox ("Visibility: <label>" or similar, saying the current state) and the `?` button are named, with localization terms in `en` and `de`.
- [x] axe passes on the open dropdown, with and without a search, in a browser test.

## Comments

### 2026-11-15: resolved in the keyboard-accessibility review (agent)

The review pointed out that this ticket isn't a follow-up of an out-of-scope part: `OwcTableSettings` is in the spec's Scope, and C4's out-of-scope list doesn't name it. So it is fixed now, without disabled rules and without a redesign of `owc-autocomplete`.

- **Structure:** `owc-autocomplete` has a new `listRole` property, `'listbox'` by default (unchanged). `OwcTableSettings` sets `'list'`: the dropdown (`#listbox`) is a `role="group"` named by the label or the placeholder ("Columns"), without `aria-expanded` and `aria-multiselectable`; the column list (`#rows`) is `role="list"`, and each column row `role="listitem"`. Other autocompletes don't notice.
- **Names:** every autocomplete's search field has a visually hidden label ("Search", `autoCompleteSearch`), and the search/fill mode button is named by what it switches to (`autoCompleteUseFillMode`, `autoCompleteUseSearch`). A visibility checkbox is named by its column and its visibility ("First Name: Show when filtered"), as visually hidden content, and the name follows Space. The `?` button is named "What the checkboxes mean" (`tableColumnVisibilityLegend`); it had the text "?", which axe accepted, but which says nothing. The legend's example checkboxes have their text as content and are no Tab stops anymore (they did nothing).
- **Tests:** `OwcTable.axe.test-browser.js`, "with the column settings open" (all columns, and with the legend shown and a search); `OwcTableSettings.test-browser.js`, "names the search field, and each visibility checkbox by its column and what Space made of it".
- Docs: `OwcAutocomplete.rocket.md` (`listRole`), `OwcTableInfo.rocket.md` (what screen readers hear), the changeset (migration notes "Settings dropdown" and the new terms).

Not done: the plain `owc-autocomplete` still renders options without `role="option"` in its `listbox`; that is the autocomplete's own and not part of this effort.
