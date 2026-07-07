# Changelog

All notable changes to this project will be documented in this file.

## 0.1.0 - Initial release target

- Prepare the package for its first public release as `@open-wc/components`.
- Keep top-level UI component entry points available for the initial release.
- Break loose helper and aggregate type import paths before the initial release so the public
  surface is owned by table, filter, text, Lit, and component namespaces.
- Target MIT licensing for the public package.

### Added

- `OwcInputAutofill.types.ts` export: the option shape (`OwcInputAutofillOption`,
  `OwcInputAutofillData`) is now importable from
  `@open-wc/components/OwcInputAutofill.types.js`.

### Fixed

- `OwcInputAutofill`: fixed a lifecycle bug where `updated()` called `super.update()` instead
  of `super.updated()`, forcing a second render pass on every update.
- `OwcInputAutofill`: options with an empty `label` can now be picked - selection validation
  is based on the option's `value` (the label is display only).
- `OwcInputAutofill`: the `change` event fired when picking an option is now bubbling and
  composed, matching the `change` relayed for committed typed text - previously ancestor
  listeners only saw typed changes, not selections.
- `OwcInputAutofill`: typing in the dropdown's internal search field no longer leaks `input`
  events to consumers (they looked like free-text edits even though the value was unchanged).
- `OwcMultiCheckbox`: options with falsy values (`0`, `false`, `''`) can now actually be
  selected - the submit handler filtered the collected values by truthiness.
- `OwcMultiCheckbox`: toggling a group checkbox no longer mutates the `value` object in
  place; since consumers like the table filter pass their filter object by reference, the
  mutation corrupted their state. The value object is now replaced on every change.
- `OwcMultiCheckbox`: now documented on the docs site under `/multi-checkbox/` (it previously
  only had a scratch demo file, which was removed).
- `OwcClickEditableAutocomplete`: the `clearable` attribute now works - it was forwarded to a
  non-existent `clearable` property on the inner autocomplete instead of `withClear`, so the
  documented clear button never appeared.
- `OwcClickEditable`: Escape now restores the original value instead of the input-formatted
  string (cancelling a date edit previously turned a `Date` value into a string and fired a
  `change` event even when nothing was modified).
- `OwcClickEditable`: a value of `0` no longer renders as the fallback placeholder, is no
  longer cleared when entering edit mode, and submits correctly (several `||` truthiness
  checks became nullish checks).
- `OwcClickEditable`: date handling is unified in shared helpers - the year-1900 boundary is
  consistent now (1900 itself is valid, matching the inputs' `min`), dates at the unix epoch
  are no longer rejected, invalid dates render the fallback instead of throwing in the
  formatter, and a missing validator `error` shows a default message instead of "undefined".
- `OwcClickEditableAutocomplete` / `OwcClickEditableInputAutofill`: fixed invalid `//` CSS
  comments that swallowed the following declaration, and removed an invalid empty `calc()`
  rule.
- `OwcDataDetail`: rendering without (or with empty) `columns` no longer crashes with
  "Invalid array length" (the row count was `Math.max()` of an empty list, i.e. `-Infinity`).
- `OwcDataDetail`: `wa-button` and `wa-details` are now imported by the component instead of
  relying on other components having registered them; `labelBadge` now also renders for
  non-expandable items (it was silently ignored); the function-valued and formatter
  properties are declared as non-attribute properties.
- `OwcInputSlider`: `change` and `input` events are now re-dispatched on the host element -
  previously the documented `change` event never crossed the shadow boundary (native change
  events are not composed), so `@change` listeners never fired. The slider also emits
  `change` on release now.
- `OwcInputSlider`: `absolute-min="0"` / `absolute-max="0"` are treated as real bounds (they
  were ignored by truthiness checks); removed the dead `open` field.
- `WaveController.js` export: `addRequestUpdateReDispatcher` now actually forwards
  `requestUpdate` events (the dispatch helper used to return a function instead of
  dispatching, making the re-dispatcher a silent no-op), and
  `removeRequestUpdateReDispatcher` now removes the forwarder that was added (it previously
  passed a fresh arrow function to `removeEventListener`, which could never match).
- `WaveController`: wave listeners are re-attached when a disconnected host is re-connected
  (previously a detached-and-reattached component silently stopped reacting to waves for
  unchanged property values).
- `WaveController`: the mode can now be passed directly as a string
  (`new WaveController(this, {}, 'updateSendsWave')`) - this form appeared in the docs but
  was silently ignored, falling back to the default mode.
- `WaveController`: renamed the misspelled public field `recieveEvents` to `receiveEvents`.
- `SmallEventTarget`: `removeEventListener` no longer starts its scan out of bounds, and
  `dispatchEvent` returns `true` like the native `EventTarget`.
- Removed `src/waves/ReactiveObject.demo.js` (scratch demo with console logging) from the
  shipped files; the WaveController docs live in `src/waves/WaveController.rocket.md` and
  `src/waves/README.md`.
- `OwcAutocomplete`: pressing `Escape` (or selecting with `Enter`) now actually closes the
  dropdown - the keydown handler previously re-opened it in the same event.
- `OwcAutocomplete`: keyboard navigation no longer throws when the search filters the option
  list down to zero results.
- `OwcAutocomplete`: `show()` no longer closes an already open dropdown.
- `OwcAutocomplete`: the clear button (`with-clear`) now shows up on first render when a value
  is set statically, and the hidden validation input no longer contains the string
  `"undefined"` while nothing is selected (which defeated `required` validation).
- `OwcAutocomplete`: tags of selected options stay visible while the option list is filtered
  by a search term.
- `OwcAutocomplete`: removing a tag whose value is not selected no longer selects it.
- `OwcAutocomplete`: fill mode no longer treats a pasted JSON string (e.g. `"VAV"`) as a list
  of characters, and pasted text now also matches numeric option values. Fill mode,
  select-all, and keyboard navigation now respect a custom `getOptionValue`.
- `OwcAutocomplete`: the `syncWidth` property is now honored (it previously did nothing).
  Removed dead API surface that silently did nothing: `getFirstOption()` and `defaultValue`.
- `OwcTabs`: opening a panel through its `wa-details` now syncs `active` again (the handler
  compared the tag name case-sensitively and never matched), clicks on the tab wrapper (outside
  the actual button) no longer close the active tab, and `wa-button` is now imported by the
  component instead of relying on the consumer to have loaded it.
- `OwcTabs`: `active-changed` is no longer fired for the initial value on first render, and
  `customStyles` is now reactive.
- `OwcTabs`: removed the dead `Tab.customStyle` type field (it was never read by the component).
- `OwcToast`: `new OwcToastComponent()` (e.g. via `<owc-toast-component>` markup) no longer
  throws when constructed without options.
- `OwcToast`: `remove()` is now idempotent, fires `removed` exactly once, and falls back to a
  timer so toasts are removed even when the fade-out animation or progress-bar transition never
  fires (reduced motion, hidden tabs); re-hovering a finished toast no longer restarts the
  countdown into negative progress.
- `OwcToast`: the `icon` property is now reactive (the declared `customIcon` property did not
  exist on the element) and `progress` is typed as a number.
- `OwcTable`: a rejected `handleData` promise no longer leaves the loading spinner on forever.
- `OwcTable`: assigning the `filter` property now reliably re-applies filtering (the update hook
  checked a non-existent `filters` property).
- `OwcTable`: with `save-state-to-url`, cleared filters/sorters are now removed from the URL
  instead of resurrecting on reload, and selections restored from the URL match again (row ids are
  compared as strings on both sides).
- `OwcTable`: the active action tab is synced again (`action-tab-active-changed` handling read a
  non-existent property), and paused filters no longer keep `visible: 'ifFiltered'` columns
  visible.
- `OwcTable`: sorting no longer mutates the caller's row data in `jsonToSorters` array sorting and
  `filterFieldValue` (arrays are copied before sorting).
- `OwcTableFilter`: number "between" filters no longer render `[object Object]` in the "to" input,
  and clearing a number input while typing no longer writes `NaN` into the filter value. `columns`
  is now a reactive property.
- `OwcTableFilterBuilder`: deleting the last filter of a nested group removes the group instead of
  writing `undefined` into the filter structure (which crashed on the next render).
- `OwcTableMassEdit`: mass-editing checkbox columns now writes the checkbox state (`checked`)
  instead of the static form `value`, the preview state is reset after executing edits in all
  cases, and selecting a column that has a visibility override no longer deletes that override.
- `OwcTableSettings`: `firstUpdated` no longer re-runs the full update pipeline
  (`super.update` → `super.firstUpdated`).
- Removed dead API surface that silently did nothing: `OwcTable.insertable`,
  `OwcTable.actionTemplate` (use `actionTabs` with a custom tab instead - the docs were updated),
  `OwcTableFilter.handler`, `OwcTableFilterBuilder.isVertical`, and `OwcTableSettings.saveState`.
- `OwcChartElement` / `OwcPieChartElement`: ApexCharts is now imported as a proper ES module
  instead of relying on the UMD build to set a `window.ApexCharts` global. Charts previously
  failed to render under bundlers that convert the UMD file to a module (no global was set).
- `OwcClickEditable`: the input now actually blurs when submitting an unchanged value (the blur
  call was previously a no-op).
- `OwcToast`: the progress timer is cleared when the toast is removed from the DOM, so dismissed
  toasts no longer keep a timer running.
- `OwcLoadingScreen`: the `autofill` progress timer is started and stopped with the element's
  lifecycle instead of being rescheduled from `render()`, so removed loading screens no longer keep
  re-rendering in the background.

### Migration notes

| Removed import path                                               | Replacement import path                                |
| ----------------------------------------------------------------- | ------------------------------------------------------ |
| `@open-wc/components/csv.js`                                      | `@open-wc/components/table/csv.js`                     |
| `@open-wc/components/excel.js`                                    | `@open-wc/components/table/excel.js`                   |
| `@open-wc/components/subListHelpers.js`                           | `@open-wc/components/table/subListHelpers.js`          |
| `@open-wc/components/filter.js` for `jsonToFilter`                | `@open-wc/components/filter/jsonToFilter.js`           |
| `@open-wc/components/filter.js` for `globalSearchField`           | `@open-wc/components/filter/jsonToFilter.js`           |
| `@open-wc/components/filter.js` for `jsonToSqlFilter`             | `@open-wc/components/filter/jsonToSqlFilter.js`        |
| `@open-wc/components/filter.js` for `dateParserForJsonDecode`     | `@open-wc/components/table/dateParserForJsonDecode.js` |
| `@open-wc/components/highlightSearchTerms.js`                     | `@open-wc/components/text/highlightSearchTerms.js`     |
| `@open-wc/components/lit-helpers.js`                              | `@open-wc/components/lit/litHtmlToString.js`           |
| `@open-wc/components/types.js` for `OwcTable`                     | `@open-wc/components/OwcTable.js`                      |
| `@open-wc/components/types.js` for `OwcComposeEmail`              | `@open-wc/components/OwcComposeEmail.js`               |
| `@open-wc/components/types.js` for `OwcLayoutSidebar`             | `@open-wc/components/OwcLayoutSidebar.js`              |
| `@open-wc/components/types.js` for `OwcCardList`                  | `@open-wc/components/OwcCardList.js`                   |
| `@open-wc/components/types.js` for `owc-table` tag types          | `@open-wc/components/table/types.js`                   |
| `@open-wc/components/types.js` for `owc-compose-email` tag types  | `@open-wc/components/OwcComposeEmail.types.js`         |
| `@open-wc/components/types.js` for `owc-layout-sidebar` tag types | `@open-wc/components/OwcLayoutSidebar.types.js`        |
| `@open-wc/components/types.js` for `owc-card-list` tag types      | `@open-wc/components/OwcCardList.types.js`             |
| `@open-wc/components/types.js` for table types                    | `@open-wc/components/table/types.js`                   |
| `@open-wc/components/types.js` for click-editable types           | `@open-wc/components/OwcClickEditable.types.js`        |
| `@open-wc/components/types.js` for card-list types                | `@open-wc/components/OwcCardList.types.js`             |
| `@open-wc/components/types.js` for data-detail types              | `@open-wc/components/OwcDataDetail.types.js`           |
| `@open-wc/components/types.js` for `OwcTableFilter`               | `@open-wc/components/OwcTableFilterBuilder.js`         |
