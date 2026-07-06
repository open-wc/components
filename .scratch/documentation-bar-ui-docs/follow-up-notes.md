Status: needs-triage

# Follow-up notes from the public UI documentation pass

Confusing public surface discovered while documenting the chart, pie chart, layout sidebar,
loading screen, separator, and table mass edit modules. Per the PRD, current behavior was
documented as-is; these notes exist so future cleanup can be planned deliberately. None of these
block the 0.1.0 release.

## Chart (`OwcChartElement`)

- `options.dashArray` and `options.strokeWidthArray` are declared in the options type but never
  read; stroke styling actually comes from per-series `dashWidth`/`strokeWidth`. Remove from the
  type or implement.
- The category x-axis label formatter returns the literal strings `'0'` and `'weird'` in edge
  cases (no data / value not found); these can leak into visible axis labels.
- Per-series `zIndex` is only applied for non-`date` x types; it is silently dropped when
  `xType: 'date'`.
- `noData` text is English (`'Loading...'`) while the pie chart uses German (`'Keine Daten'`);
  both embed a hardcoded German locale. A deliberate localization strategy is planned separately.
- `percentFormatter`/`numberFormatter` are exported from the source module but not re-exported
  publicly; the German locale object is duplicated between the two chart files.

## Pie chart (`OwcPieChartElement`)

- `options.otherIndex` cannot be `0` because the check is truthy (`if (this.options.otherIndex)`),
  so an "Other" slice at index 0 is silently ignored. The gray recolor also only applies to the
  first palette cycle (27 entries).
- `STANDARD_COLORS` is private while the line/bar chart's equivalent `colorArr` is public.

## Layout sidebar (`OwcLayoutSidebar`)

- `menuTopTemplate` is a declared reactive property (and part of `OwcLayoutSidebarOptions`) but is
  never rendered. Implement or remove.
- `loadStateFromUrl()` unconditionally overwrites `selected` on every connect, clobbering a
  consumer-preset selection.
- `getFullHref` handles `hrefGETParams` as a string in one code path although the type declares
  `Record<string, string>`.
- `MenuItem` declares all fields required, but the implementation treats `icon`, `hrefGETParams`,
  `visible`, `open`, and `subMenuItemList` as optional. Add `?` modifiers.
- The component renders `<wa-icon>` but does not import it; consumers must register it themselves
  or icons silently don't render (the docs page imports it explicitly).
- `renderMenuItem` duplicates the `wa-details` template because `?open` binding did not work
  (existing TODO in source).

## Loading screen (`OwcLoadingScreen`)

- The positioning contract is implicit: the component absolutely centers itself in the nearest
  positioned ancestor, which nothing in the API signals. Documented on the page.
- `logoSvg` is declared `{ type: Object }` but defaults to `''` and accepts any Lit template, not
  just SVG.

## Separator (`OwcSeparator`)

- The `--width` CSS custom property is declared in JSDoc but never consumed by the stylesheet
  (borders are hardcoded to `1px`, vertical width to `16px`).
- The slot wrapper `<div>` always renders, so a separator without slotted content still shows a
  padded gap between the two lines.

## Table mass edit (`OwcTableMassEdit`)

- There is no `define/owc-table-mass-edit.js` entry; the element is only registered as a scoped
  element inside `OwcTableInfo`. Standalone use requires manual registration (documented on the
  page). Decide whether to add a define entry in a later pass.
- The `operation` property (`'SET' | 'ADD' | 'REMOVE'`) is declared and defaulted but never read;
  only SET semantics are implemented.
- The `needChangeCount` getter reads `this.value.field`/`this.value.value`, but `value` is a
  scalar everywhere else; it always returns 0 and is never called. Dead code candidate.
- The `wa-checkbox` form handler reads `ev.target.value` instead of `ev.target.checked`, so mass
  editing a checkbox column likely never yields a boolean.
- Mixed-language UI strings: "Preview" (English) next to "Abbrechen" / "N Änderungen durchführen"
  (German).
- The `OwcTableInfo` docs demo overrides the mass-edit tab content with a bare
  `<owc-table-mass-edit></owc-table-mass-edit>`, which replaces the built-in content that binds
  `.columns/.data/.allData/.table` — the form in that demo is non-functional (empty column
  picker). Consider rewiring that demo like the new Table Mass Edit page does.
