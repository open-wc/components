# Doughnut chart

Status: ready-for-human

Functional implementation is complete. Required browser/device and visual acceptance remains open in
[ticket 08](./issues/08-browser-device-and-visual-acceptance.md); see the [evidence catalog](./acceptance.md).

Design and the public-consumer testing seam were confirmed on 25 November 2026.
The ticket 01 preview review replaces the heading, center amount and caption string properties with
consumer-owned markup slots: a default center slot within the drawable HTML-in-Canvas subtree,
a `heading` slot above the ring and a `caption` slot below it. Center text must support native
selection and copying, as must visible outer amount labels; do not place a separate text overlay
over the canvas. Slice unit/period
`context` remains prepared data. On 26 November 2026, the follow-up review removed the numeric
`total` property: derive proportions from each value divided by the category sum, accepting raw
amounts or normalized weights. Displayed totals and reconciliation against an independently
expected amount belong to the consumer. These corrections control the interface described below.
The same follow-up removes the domain-specific prepared-example page and
`examples/doughnut-chart.js` factory export. Public demos cover generic chart data, icons and
animation. The financial scenarios below describe consumer context, not package-owned examples
or preparation rules.
The subsequent animation review replaces the consumer-owned animation experiment with automatic
400 ms ease-out transitions for value changes with the same category IDs in the same order. Shared
geometry keeps slices, icons, labels, leaders and hit areas aligned. Interrupted updates start from
the current proportions. Initial, structural, empty, all-zero and reduced-motion updates are
immediate; formatted amount strings and center markup are never interpolated by the component.
This spec is the implementation contract for the reusable chart in
`@open-wc/components`. FiNUM requirements describe consumer context; financial
preparation, theme, assets and host navigation remain outside this package.
The [interview record](./design-interview.md) preserves the original design and
accepted follow-up corrections. Current implementation verification is recorded in the evidence
catalog; the remaining device and visual acceptance work stays in ticket 08.

## Problem Statement

Clients need to understand how their wealth, monthly savings and insurance premiums
are distributed, and reach the relevant details without relying on color recognition
or precise pointer interaction. Developers need one reliable chart contract for the
Vermögen and Versicherungen pages instead of separate financial charts with different
ordering, totals and accessibility behavior.

The Figma designs show the intended ring, palette, icons, labels and related card
markers, but their illustrative amounts and slice angles are not consistently aligned.
The current components branch has no chart implementation despite an old export
inventory listing one. FiNUM's legacy pie wrapper does not establish the required
doughnut, category identity or keyboard contract. Missing source information
must not silently become zero or cause other usable records in its category to disappear.

## Solution

Deliver a reusable doughnut chart in `@open-wc/components`, demonstrated through
backend-free Rocket examples using public package imports. Render the chart itself,
including its center text, outer amount labels, leader lines and ring icons where
they fit. Do not add a separate category list or legend. Hide the component's output
if native rendering and the polyfill cannot provide a working chart. FiNUM can mount
independent instances for Vermögen and Versicherungen on their separate pages and
exercise monthly savings separately.
There is no switching UI.

Show a consistent total, accurate proportions, readable category information and a
keyboard-accessible route to the matching details. Preserve the chosen Figma palette
and appearance while recording actual contrast results. Keep financial preparation,
assets, formatting and navigation in the consumer. Public package examples must use
generic data and contain no private FiNUM imports, assets or service assumptions.

## User Stories

1. As a client, I want wealth grouped by savings goal, so that I can see what each part of my wealth supports.
2. As a client, I want unallocated assets included under “Anlagen ohne Ziel”, so that assets without a savings goal remain represented.
3. As a client, I want monthly savings shown as a distinct measure, so that contributions are not confused with current wealth.
4. As a client, I want insurance premiums grouped by insurance category, so that multiple contracts of the same type contribute to one understandable category.
5. As a client, I want insurance premiums expressed as monthly equivalents, so that different payment periods can be compared.
6. As a client, I want contract rows to retain their original payment periods, so that the monthly overview does not obscure how premiums are actually payable.
7. As a client, I want displayed active external and manually managed contracts included, so that the premium overview is not limited to automatically managed contracts.
8. As a client, I want premiums distinguished from my personal expenditure, so that the chart does not imply that I pay every displayed contract myself.
9. As a client, I want applications and recommendations excluded from the active-contract premium breakdown, so that proposed contracts are not presented as existing premiums.
10. As a client, I want an incomplete source record filtered out, so that missing information is not presented as a zero amount.
11. As a client, I want usable records in the same category retained after filtering, so that one incomplete contract does not remove the entire category.
12. As a client, I want the ring, labels and total to describe the same included records, so that their amounts agree.
13. As a client, I want totals that reconcile with the displayed category amounts, so that the overview is arithmetically understandable.
14. As a client, I want exact EUR amounts with two decimal places and German-style grouping, so that displayed values remain familiar and precise.
15. As a client, I want the measure and period stated explicitly, so that wealth and monthly amounts cannot be confused.
16. As a client, I want a neutral zero ring when all known values are zero, so that no artificial equal shares are implied.
17. As a client, I want genuine zero-valued input retained without inventing arcs, so that the chart does not imply an artificial share.
18. As a client, I want “Keine Daten” when no usable records remain, so that missing data is not described as known zero.
19. As a client, I want invalid prepared values to produce an unavailable state, so that malformed input does not create a misleading chart.
20. As a client, I want accurate slice proportions, so that the graphic represents its amounts rather than illustrative source angles.
21. As a client, I want a single positive category shown as a full ring, so that the complete distribution is clear.
22. As a client, I want tiny values to retain their true proportions, so that the chart does not exaggerate small amounts.
23. As a keyboard user, I want actionable tiny slices reachable with Tab, so that their true proportions do not prevent access to details.
24. As a client, I want categories kept in a consistent supplied order, so that changing amounts do not rearrange the overview.
25. As a client, I want every category retained without automatic “Andere” grouping, so that small categories remain individually understandable.
26. As a client, I want the chart and detail overview to share their category order, so that I can connect their information easily.
27. As a client, I want the designed chart without an additional visible category list or legend, so that the overview follows the agreed chart-only presentation.
28. As a client, I want a chart that cannot render to show nothing, so that a failed rendering does not leave substitute content or controls in the overview.
29. As a client, I want the designed outer amount labels and ring icons where they fit, so that the overview follows the intended visual design.
30. As a client, I want colliding labels and oversized ring icons omitted, so that annotations do not cover or misidentify the data.
31. As a client, I want annotations that do not fit to be omitted without adding another visible category list, so that the chart remains uncluttered.
32. As a client, I want long chart text to fit or wrap within the agreed chart layout on a narrow screen, so that the chart remains readable.
33. As a client, I want a large total moved below the ring when necessary, so that it is neither truncated nor abbreviated.
34. As a mobile client, I want the chart to fit narrow containers without unintended horizontal scrolling, so that I can use it at the agreed mobile widths.
35. As a desktop client, I want the layout to use available container space, so that the overview remains readable without requiring a fixed viewport size.
36. As a client, I want slice activation to reveal the corresponding details, so that I can inspect the category represented by the slice.
37. As a client, I want activation to leave the amounts and total unchanged, so that viewing details does not filter my overview.
38. As a client, I want a single expandable card opened and focused, so that the requested details become immediately available.
39. As a client, I want a category containing several contracts to reveal its group, so that activation does not arbitrarily choose one contract.
40. As a client, I want unavailable destinations presented without an action, so that controls do not promise navigation they cannot perform.
41. As a keyboard user, I want Tab and Shift+Tab to move between actionable slices and Enter or Space to perform the same action as clicking, so that I can reach details without a pointer.
42. As a keyboard user, I want each actionable slice represented once in the tab order following the supplied category order, so that navigation is predictable.
43. As a client, I want hover and keyboard focus to highlight the corresponding slice without adding a separate list, so that I can identify the category I am interacting with.
44. As a client, I want highlighting to preserve the center total without persistent selection, so that transient interaction does not change the measure shown.
45. As a client, I want the chart to avoid tooltips and hover-only content, so that interaction retains the agreed visual design across input methods.
46. As a screen-reader user, I want the working chart to expose its title, measure and total and each slice to announce its category and amount with unit/period context, so that I can understand the chart without relying on pixels.
47. As a screen-reader user, I want decorative icons and repeated drawn text excluded from duplicate narration while interactive chart semantics remain exposed, so that the chart is concise and operable.
48. As a keyboard user, I want focus retained on the same category through updates, so that reordering does not interrupt my work.
49. As a keyboard user, I want focus returned to the chart heading if my focused category disappears, so that focus does not become lost.
50. As a client sensitive to motion, I want value transitions to respect reduced-motion preferences and apply their destination immediately, so that the overview remains comfortable to use.
51. As a client, I want data updates to avoid automatic detail navigation, so that refreshing information does not move me elsewhere.
52. As a designer, I want the chosen palette and source treatments preserved, so that implementation does not introduce unapproved recoloring or contrast treatments.
53. As a reviewer, I want measured contrast gaps recorded separately from semantic test results, so that source fidelity is not mistaken for contrast compliance.
54. As a developer, I want one prepared-data contract for the independent page instances, so that rendering behavior is shared without a switching controller.
55. As a developer, I want financial conversion, filtering, aggregation and fetching outside the renderer, so that domain rules cannot become chart-library behavior.
56. As a maintainer, I want the first implementation and spec in `open-wc/components` with visible dependencies, so that the reusable component is reviewed in its owning repository.
57. As a maintainer, I want rendering and category presentation isolated from FiNUM domain imports, so that any consumer can use the component.
58. As a reviewer, I want local-fixture Rocket examples using public imports, so that I can inspect the real consumer behavior without production access.
59. As a reviewer, I want geometry, interaction, accessibility and responsive checks through the existing browser seam, so that verification reflects what users observe.
60. As a reviewer, I want independent instances tested together, so that highlighting, controls and actions cannot interfere across instances.
61. As a reviewer, I want screenshots compared at 390px and 1280px and usability checked at 320px, so that the agreed layout works across the verification widths.
62. As a maintainer, I want stable-color persistence and the unfinished goal field kept explicitly open, so that this chart work does not silently decide their product or schema design.
63. As a client using native HTML-in-Canvas support, I want the chart to use the browser's implementation, so that I do not download the polyfill core unnecessarily.
64. As a client whose browser needs a polyfill, I want the chart to load it automatically, so that the overview works without application-specific setup.
65. As a developer, I want the required polyfill declared as a runtime dependency, so that an installed public component works out of the box.
66. As a client viewing several charts, I want shared initialization and independent instance state, so that loading or disconnecting one chart does not break another.
67. As a client whose chart rendering fails, I want no blank reserved chart area or leftover focus targets, so that failed output does not interrupt page layout or keyboard navigation.
68. As a keyboard user, I want non-actionable and zero-valued categories to avoid action tab stops, so that navigation does not promise unavailable actions.
69. As a client, I want drawn slices and their pointer, keyboard and accessible geometry to agree, so that interaction reaches the category shown at that location.
70. As a Chrome user, I want the chart verified with native HTML-in-Canvas, so that working polyfill tests do not conceal native-path defects.
71. As a Firefox or Safari user, I want the chart verified in my actual browser engine, so that Chromium-only results do not stand in for the experience I receive.
72. As an iPhone Safari user, I want a physical-device rendering and interaction check before release, so that simulator results alone do not establish mobile support.
73. As a reviewer, I want exact browser versions and device evidence recorded, so that the support claim can be assessed and reproduced.
74. As a package consumer, I want public exports, generated types and colocated examples, so that I can use the chart without depending on private modules.

## Implementation Decisions

- **Ownership:** Implement the reusable chart in `@open-wc/components` and maintain its spec in this repository. This follows FiNUM ADR 0014's general ownership policy. FiNUM retains its theme, assets, financial preparation and destination/navigation composition.
- **Reusable responsibilities:** Keep reusable rendering, geometry, responsive labels, category presentation, presentation validation and accessibility together. Keep FiNUM contracts, financial preparation, services, goal storage, category registries, icon assets, formatting and destination lookup outside this package.
- **Rendering approach:** Use the HTML-in-Canvas proposal's current API with existing Lit and the prepared-data/host boundary. Use Giuseppe Scotto Lavina's HTML-in-Canvas polyfill where native support is missing. Render only the chart, without a separate legend. Do not introduce a general-purpose chart framework.
- **Native-first loading:** The component handles capability detection and automatic polyfill loading; consumers do not have to install or initialize it separately. Use the native API when available and lazily load the named polyfill only when needed. Declare the polyfill as a normal package runtime dependency under the Dependency Policy. Keep the core out of the native path's download and verify that behavior in a real consuming bundle; the unbundled package alone cannot guarantee consumer chunking. Coordinate initialization across chart instances, and do not tear down a shared polyfill when one chart disconnects. If initialization fails, apply the hidden-output policy.
- **Rendering failure:** If native support is absent and the polyfill is refused, fails to load or cannot render the chart, show none of the component's UI. Do not leave a standalone total, legend, fallback list, error message, invisible focus targets or blank chart-sized placeholder. This concerns chart-rendering failure; genuine zero and valid empty input remain the separate data states below. Surrounding page content remains the consumer's responsibility.
- **Existing controls:** Reuse actual public ActionCard and DetailCard capabilities when needed by consumer examples. Inspect their current implementations and Public Surface rather than relying on an obsolete chart inventory. The legacy FiNUM pie wrapper is prior art, not this component's contract or a required dependency.
- **One shared contract:** Each independent instance receives prepared ordered categories with identity, label, numeric value, formatted amount, supplied color, optional icon and action availability, together with chart heading, center total/caption and unit context. There is no numeric `total` property; derive slice proportions from the category sum. Expose deliberate public class/define entry points and types through `@open-wc/components`, with export-map entries and colocated Rocket docs. Formatting and labels are supplied presentation, not hardcoded FiNUM financial semantics. Choose public names and declarations during implementation using repository conventions within this contract.
- **Category identity and order:** Wealth groups by savings goal, with unallocated assets last; insurance combines contracts of the same category. IDs connect slices and navigation independently of duplicate or mutable display names, colors and array positions. Preserve caller order, including in the corresponding detail overview; do not sort by value or group small categories into “Andere.” This identity contract does not authorize durable color assignment.
- **Measures and eligibility:** Support separate current-wealth, monthly-savings-contribution and monthly-equivalent-insurance-premium datasets. The insurance preparation layer includes displayed active contracts, including external/manual contracts and independently of payer, while excluding applications and recommendations. Contract rows keep their original payment periods. Describe premiums rather than personal expenditure.
- **Missing input:** Filter only the individual source record missing information required for the selected measure, before normalization and aggregation. Retain usable records in that category. Derive category values, total, labels and proportions from the same included records. Do not coerce missing information to zero, drop the entire category because of one incomplete record, invent unknown slices or add a special incomplete-doughnut mode.
- **Financial preparation:** Conversion, filtering, eligibility, category aggregation and financial rounding belong outside rendering. For EUR views, prepare whole cents, aggregate before rounding each category once, and display a total equal to the displayed category amounts through the center slot. The consumer validates independently expected totals. Rendering derives proportions and validates prepared presentation input; it performs no fetching or financial calculation. Use already-prepared local fixtures for this delivery, without connecting production financial sources.
- **Numeric and empty states:** Preserve genuine zero input values without arcs. When all known values are zero, show a neutral ring and consumer-supplied center content without equal artificial slices. Empty data, including when all source records are filtered out, shows “Keine Daten.” Negative/nonfinite prepared chart values or a nonfinite sum make the breakdown unavailable rather than being clamped or silently discarded. Nonnegative weights may use any common scale; they need not sum to 1. Fetch failures remain the surrounding page's responsibility.
- **Geometry:** Use an inner radius of 75% of outer radius, start at twelve o'clock and proceed clockwise in caller order. Derive angles accurately from values rather than copying illustrative Figma angles. One positive category fills the ring. Do not inflate tiny slices; omit separators that would obscure them. Positive actionable slices retain keyboard access regardless of their visual size. Zero values create no arc or slice tab stop.
- **Amounts and summary:** EUR views use two decimal places and German-style grouping, such as € 1.234,56, with explicit measure and period context. Keep the total and measure in the center when they fit; otherwise move them below the ring. Do not truncate, over-shrink or abbreviate exact financial amounts.
- **Ring annotations and layout:** Preserve designed external amount labels, leader lines and optional ring icons where they fit. Omit the outer-label set when it collides and individual icons when they cannot fit. Do not compensate with a separate visible category list. Keep true proportions and responsive chart sizing at 320/390px and wider containers; verification widths are not fixed component sizes.
- **No legend:** Do not implement a separate visible category list, legend entries or actions, chart/legend arrangements or a fallback legend. Chart annotations and the chart's own accessible semantics provide the agreed presentation.
- **Activation and navigation:** Slice activation emits the category ID. The FiNUM host handles destinations, scrolling, disclosure and focus; DOM destinations and raw financial records do not enter the renderer. Open and focus a single expandable card's summary. For several contracts, reveal the group, scroll to it and focus its heading while leaving inner disclosures closed. Stay in the overview. An absent destination must not promise an action.
- **Highlighting:** Hover/focus highlights the associated slice without changing the center total, filtering data or creating persistent selection. Keep the existing no-tooltip scope.
- **Keyboard and nonvisual behavior:** Use real native HTML action semantics within the HTML-in-Canvas chart. Tab/Shift+Tab visits each actionable slice once in supplied category order, and Enter/Space emits the same category activation as a pointer click. Each slice exposes its category name and exact supplied amount with unit/period context; slices without destinations do not promise an action or create an action tab stop. Expose the chart title, measure and total without duplicate narration from decorative icons or repeated drawn text. Do not hide the interactive canvas subtree from assistive technology or substitute a hidden legend. Synchronize visual, pointer and keyboard geometry. Preserve focus by category ID on updates; if the focused slice disappears while the chart remains, focus its heading. Do not navigate automatically on data updates. Ease value updates over 400 ms and apply their destination immediately with reduced motion. Failed/hidden charts expose no stale content or focus targets; any recovery into surrounding page content belongs to the host, and must not pull focus back from elsewhere.
- **Independent instances:** Verify multiple generic chart instances together. Separate financial pages and measures remain consumer composition. Do not introduce switching, a measure selector, automatic cycling or a carousel contract. Ensure instances do not share highlight state, control IDs or activation destinations.
- **Appearance and contrast:** Preserve the selected Figma palette and source treatments. Additional outlines, adaptive icon-color treatments and the proposed darker focus role were not approved. Do not change Figma visuals or the shared theme. Measure rendered contrast and record unresolved results; preserved source colors and passing semantic tests do not establish contrast compliance.
- **Color policy:** Fixtures supply colors and reuse them across a rendered chart and corresponding card markers. Cross-session/device color stability for goals and insurance, saved palette keys and ID-derived color generation remain explicitly open and must not be implemented.
- **Goal field:** The intended goal field still needs separate product and schema work. Existing per-contract free-text “Ziel” is not a verified savings-goal entity. Do not add a goal schema, persistence or production integration as part of this chart implementation.
- **Package delivery:** Follow contributor guidance for a Component Directory, deliberate Public Surface and types, Colocated Tests, owning-component Rocket docs, dependency justification and a Changeset for the Consumer-Visible Change. Follow ADR 0003's unbundled ESM Package Format. Verify consumer integration with a temporary packed package; FiNUM committed dependencies remain normally published versions. Public docs and package contents must meet Release Hygiene and contain no private FiNUM imports, assets or service assumptions.

## Testing Decisions

- **Confirmed primary seam:** Exercise the real chart through public package imports in the existing backend-free Rocket/Web Test Runner environment. Use this consumer seam for the chart, automatic loader, validation, responsive annotations, keyboard/nonvisual behavior and category activation. Verify FiNUM-specific theme, card composition and host navigation through the same public consumer contract using a packed package. This seam was accepted in the design interview and final confirmation; no new test service or private hook is required.
- **Good tests:** Establish externally observable correctness: amounts and order, rendered geometry, data states, absence of UI on rendering failure, user actions, focus destinations, nonvisual output and responsive behavior. Avoid copying the implementation's arc strings, inspecting private helper state or asserting a private shadow-tree arrangement. Use independent expected proportions and visible/hit-testable behavior for geometric checks.
- **Rendering failure:** Exercise unavailable native support, refused/failed polyfill loading and drawing failure. Verify no chart, leftover total, list, message, blank reserved space or hidden focusable controls remain. Verify one failed instance does not suppress another working instance. Keep these cases distinct from known zero and valid empty input.
- **Loader:** In a real consumer, verify native support downloads no polyfill core, missing support triggers automatic loading, and concurrent instances share initialization. Verify disconnecting one chart leaves other instances working. Exercise rejected loading without unhandled errors or visible fallback UI.
- **Browser acceptance:** Require a working chart in current Chrome, Firefox and Safari, including Safari on a physical iPhone, before release. Verify the native Chrome path and actual polyfilled Firefox/Safari paths; Chromium with a forced polyfill does not replace those engine/device checks. Check rendering, resize/device-pixel-ratio alignment, pointer/touch activation, keyboard behavior where a keyboard is available, accessible category/amount semantics and loader behavior on the applicable platforms. Record exact browser/OS versions and physical-device evidence at verification time. The polyfill author's unqualified iPhone status requires project verification. If required browser/device evidence is unavailable, record the gap and do not claim the release requirement passed. Hidden output remains the runtime response to unsupported configurations or rendering failure.
- **Fixture composition:** Keep public examples generic: prepared category weights and amounts, empty and zero states, icons and automatic value transitions. Do not ship financial aggregation, wealth/savings/insurance templates or a public example-factory export. Verify inline and standalone demos and an ordinary Lit consumer with consumer-owned styles, fonts, icons and category activation.
- **Geometry and volume:** Exercise one positive category, two unequal values, all zero, mixed zero/positive, a one-cent value beside a much larger amount and twenty categories. Check the 75% inner-radius ratio, clockwise supplied order, proportional shapes, full-circle case, absence of phantom zero arcs and no tiny-slice inflation or automatic grouping.
- **Filtering and invalid data:** Use generic prepared inputs to cover empty data, genuine zero, negative/nonfinite values and a nonfinite category sum. Verify equivalent geometry for raw amounts and normalized fractions, including weights that do not sum to 1, and updates that change the sum without changing consumer-owned center content. Source filtering, financial preparation and independently expected totals are verified by their consumers; reject malformed prepared chart data without converting it into missing or zero.
- **Labels and responsiveness:** Use long German labels, duplicate display names with different IDs and very large totals/captions. Verify center-text relocation, annotation omission, no extra legend and the agreed chart actions. Compare screenshots with linked Figma examples at 390px and 1280px; check 320px for overflow and usability. These widths are verification points, not fixed component sizes.
- **Interactions and focus:** Exercise pointer slice activation, hover/focus highlighting, Tab/Shift+Tab order and Enter/Space parity, single-card opening and summary focus, grouped-category heading focus, unavailable destinations and retention of totals. Check focus by category ID through reorder/update and heading recovery after removal. Verify a tiny actionable slice can receive keyboard focus without inflating its arc, non-actionable/zero slices create no action tab stops, and focus visibility matches the drawn slice. Mount two instances together to catch state, ID or action interference.
- **Accessibility:** Verify the working chart's meaningful title, measure, period, total and slice category/amount names; real action semantics; and absence of decorative duplicate narration. Verify reduced-motion behavior and native/polyfilled geometry alignment. Hidden failed charts must not expose stale amounts or controls. No separate legend, tooltip, persistent-selection or switching behavior should appear.
- **Visual evidence:** Inspect actual colors, text, icons, boundaries and focus against their rendered backgrounds under both OS color preferences while the explicit light theme remains active. Preserve the selected design and report measured contrast gaps separately. Semantic automation and source fidelity do not close those gaps.
- **Prior art:** Reuse the current foundation's public-consumer design-system browser checks, existing core/client-app Web Test Runner and Chromium patterns, and inline/standalone Rocket demos. The current DetailCard summary checks provide prior art for native disclosure, focus, long-label and accessibility verification. Inspect real current sources rather than treating obsolete export documentation as an available component.
- **Build and dependency checks:** Run this repository's Release Gate, package dry-run checks and the feature's agreed browser checks. Review package contents and the dependency footprint, verify Release Hygiene and absence of FiNUM business imports, and verify consumer integration through a packed package. No runtime validation has been performed for this documentation-only change.
- **Evidence and commands:** Record the public imports, supported states, Figma mappings, exact runnable commands, reviewed screenshots and unresolved contrast findings in the catalog. Do not describe planned browser/runtime checks as completed by this documentation-only spec PR.

## Out of Scope

- Production-page migration, production fetching or connecting the demos to live financial sources. This implementation delivers the reusable package component and local-fixture examples.
- A separate legend or category list, and fallback UI when chart rendering cannot work.
- Adding the unfinished goal field, choosing its schema or creating goal persistence.
- Stable color assignments for goals or insurance, saved palette keys, ID-derived color generation or guarantees across sessions/devices.
- Changing the chosen palette, source Figma visuals, shared theme or Dark values; contrast-driven recoloring and additional treatments that the user declined.
- Adding a general-purpose chart library or unrelated runtime dependency. The named HTML-in-Canvas polyfill is the accepted runtime dependency and loads automatically only when native support is missing. Package publication and production rollout are separate from this implementation contract.
- Switching between measures, a selector, carousel behavior, automatic cycling, persistent selection, filtering on activation or tooltips.
- Automatic “Andere” grouping, arbitrary minimum slice angles, truncated labels or abbreviated financial amounts.
- Inventing financial source mappings, defining new production conversion rules inside the renderer, or treating legacy zero defaults as known-zero evidence.
- Unrelated changes, controls, schema migrations or dependency upgrades in either repository.

## Further Notes

- Source design: [FiNUM design system](https://www.figma.com/design/M7DpagQMAo9pnBjUSTOhpg). Relevant pages: [Chart](https://www.figma.com/design/M7DpagQMAo9pnBjUSTOhpg?node-id=7366-32719), [Vermögen](https://www.figma.com/design/M7DpagQMAo9pnBjUSTOhpg?node-id=7680-38103) and [Versicherungen](https://www.figma.com/design/M7DpagQMAo9pnBjUSTOhpg?node-id=6940-33655).
- Provenance: the original spec lived in `FinumAt/finum-it`, commit `31ada984e`, based on [foundation PR #2244](https://github.com/FinumAt/finum-it/pull/2244). It moved here during the 25 November follow-up; historical findings and accepted corrections remain in the interview record.
- FiNUM ADR 0014 places reusable behavior upstream. Initial implementation in this repository follows that ownership policy.
- The requested components branch was fetched and inspected at `4769035a03f21ea8791f793e12f0911ac66f60ac`, declaring version 0.4.0. It has real ActionCard/DetailCard capabilities but no chart source or exports; refresh those facts before implementation and preserve concurrent work.
- Selected source rings share a 75% inner-radius ratio, roughly 188px rendered ring bounds and 16px icons. The selected wealth angles total about 363.60° before rotation/offset effects; insurance angles and category-to-amount assignments also disagree with the displayed values. Preserve the visual ring intent while computing correct geometry and using consistent fixtures.
- Some source bindings use asset-type-named wealth tokens for savings goals; their names do not establish goal identity or a persistence policy. The insurance chart and row markers reuse category colors, but the illustrated amounts are assigned inconsistently. Do not copy those data inconsistencies into the implementation.
- Contribution amount and payment interval are optional in the current contract data. Some legacy helpers hide missing information as zero; this is evidence for explicit source filtering, not a verified production frequency or an agreed wealth-value source mapping.
- Rendering references: the [WICG HTML-in-Canvas proposal](https://github.com/WICG/html-in-canvas), [Chrome's guidance](https://developer.chrome.com/docs/modern-web-guidance/guides/visual-design/expose-canvas-content-to-browser-features), the [selected polyfill](https://github.com/GiuseppeScottoLavina/html-in-canvas-polyfill), and its [framework guidance](https://github.com/GiuseppeScottoLavina/html-in-canvas-polyfill/blob/main/docs/guides/FRAMEWORKS.md). Recheck current API shape and support when implementing; older examples may use earlier proposal names. Polyfill resource loading, shadow-root styling and native-first bundling need verification with the actual consumer.
- The [interview record](./design-interview.md) preserves source observations and accepted corrections. Earlier proposals in that record are historical; this confirmed spec controls implementation. The FiNUM glossary retains savings-goal, unallocated-asset and monthly-equivalent-premium terms; they are consumer domain language, not new package concepts.
