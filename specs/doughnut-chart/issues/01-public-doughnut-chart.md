# 01: Deliver a working public doughnut chart

**What to build:** A package consumer can import a reusable doughnut chart, supply two prepared
categories and reach either category's details action using a pointer or keyboard. The chart renders
with native HTML-in-Canvas or automatically loads the selected polyfill without consumer setup.

**Blocked by:** None (can start immediately).

**Status:** resolved

Source: [Doughnut chart spec](../spec.md), especially Implementation Decisions and Testing Decisions.

- [x] Expose deliberate public class/define entry points and related types through
      `@open-wc/components`, following the Component Directory, Public Surface and unbundled ESM
      conventions. Ensure the export map resolves the entry points and generated declarations.
- [x] Accept ordered categories with ID, label, numeric value, formatted amount, supplied color,
      optional icon and action availability, plus heading, prepared total, center amount/caption and
      unit/period context. Names and declarations follow repository conventions within this contract.
- [x] Recheck the current HTML-in-Canvas and selected Giuseppe Scotto Lavina polyfill APIs before
      implementation. Use native support when available and automatically load the polyfill only
      when needed; declare it as a normal runtime dependency and update the npm lockfile.
- [x] A two-category fixture renders accurate proportions from twelve o'clock clockwise in supplied
      order, with an inner radius of 75% of the outer radius and the supplied center total/caption.
- [x] Positive actionable slices use native HTML action semantics inside the chart. Pointer click,
      Enter and Space emit the category ID without receiving DOM destinations or navigating directly.
- [x] The working chart exposes its heading, measure and total and the categories' exact supplied
      amounts with unit/period context. Interactive chart content remains available to assistive
      technology; do not introduce a separate visible or hidden substitute legend.
- [x] If initialization or drawing cannot produce a working chart, hide all component output,
      including controls, total and reserved chart space. The deeper failure/lifecycle matrix is
      covered by ticket 05.
- [x] Keep financial preparation, formatting, fetching, assets and destination lookup consumer-owned;
      introduce no general-purpose chart framework or private FiNUM dependency.
- [x] Add a backend-free Rocket example and Colocated Tests through public imports covering the
      two-category rendering and activation path. Document the initial contract and add a Changeset
      for the Consumer-Visible Change in the same change as the new public exports.

## Answer

Implemented on `feat/doughnut-chart` in commit `9159c88` on 25 November 2026.
Stopped after this ticket at the user's request; tickets 02–08 remain unimplemented.

- Public class: `@open-wc/components/OwcDoughnutChart.js`.
- Registration: `@open-wc/components/define/owc-doughnut-chart.js`.
- Types: `OwcDoughnutChartCategory` and `OwcDoughnutChartActivation` from
  `@open-wc/components/OwcDoughnutChart.types.js`.
- Implementation and tests: [component directory](../../../src/doughnut-chart/).
- Contract and backend-free example: [Rocket documentation](../../../src/doughnut-chart/OwcDoughnutChart.rocket.md).
  Run `npm start`, then open `/data/doughnut-chart`; standalone demo:
  `/data/doughnut-chart/_demo/twoCategories/`.

Validation completed with Node 24.15.0:

- `npm run lint`, `npm run test:node`, `npm run types`, and `npm run build` passed.
- The complete existing Web Test Runner browser suite passed: 1,011 tests in 53 files.
- `npx web-test-runner --files src/doughnut-chart/OwcDoughnutChart.test-browser.js`
  passed all four chart checks in Chromium 159.0.8154.6 using native HTML-in-Canvas.
  The same four checks passed with `--disable-blink-features=CanvasDrawElement`, exercising automatic
  polyfill loading. Checks cover sampled geometry, pointer/Enter/Space activation, supplied semantics,
  and complete output removal after a drawing error.
- Reproduced and fixed two pointer regressions: the polyfill retaining a pending ancestor's
  inherited pointer-events override, and the center text's transparent corners intercepting the ring.
- Built standalone Rocket example rendered and reached the consumer's category action on both
  native and forced-polyfill Chromium. Its accessible tree exposed the heading, both native buttons
  with exact amounts/context, and the center summary. Inspected its chart screenshot locally.
- `npm pack --dry-run --ignore-scripts --json`, after type generation, included all chart entry points
  and generated declarations and excluded tests, specs, agent files and scratch material.

The selected polyfill is a normal runtime dependency (`^1.0.4`, locked to 1.0.4); it supplies the
required fallback without consumer setup and has no additional runtime dependencies. Its loader is
imported dynamically only when the native API is missing. Actual installed-consumer download checks
and Firefox/Safari/physical-iPhone acceptance remain tickets 07–08; this ticket makes no release-wide
browser or contrast-compliance claim.

## Comments

Preview correction: replace the `heading`, `amount` and `caption` string properties with a default
center slot and named `heading`/`caption` slots. Keep center markup inside the drawable HTML-in-Canvas
subtree and let users select and copy it. Remove the center's pointer-events suppression and constrain
its box to the hole so slice targets remain available. Numeric `total` and semantic `context` remain
prepared inputs. Updated the public example, migration note, type check and existing browser tests;
the selection regression and the original four chart checks pass through native and polyfilled
Chromium. The built standalone example also passed actual Ctrl+C clipboard copying of the selected
center amount and ring activation on both paths, with the center exposed once in the accessible
tree. Lint, generated types and the Rocket build passed. This is a correction to ticket 01; no
subsequent ticket is started.
