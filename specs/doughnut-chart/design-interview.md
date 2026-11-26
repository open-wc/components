# Doughnut chart design interview

Status: design confirmed; spec ready-for-agent.

This is a historical interview and inspection record. The [spec](./spec.md) is the
current implementation contract. Earlier recommendations below are superseded by the
recorded user corrections; local checkout paths describe the inspection environment,
not required paths for another developer's checkout. The record originated in FiNUM
and moved here with the spec after Q22 on 25 November 2026. Earlier local-first delivery
decisions are historical and are superseded by that answer.

## Scope and sources

Design the doughnut chart and category legend used by Vermögen and Versicherungen.
Record decisions as the interview progresses and confirm shared understanding before
implementation. Discuss implementation and library choices only after behavior is settled.

- Design file: [FiNUM design system](https://www.figma.com/design/M7DpagQMAo9pnBjUSTOhpg).
- Read the current `client-app-ui` skill, foundation, catalog and inventory from
  `/home/benwo/.codex/worktrees/client-app-design-system-pr/finum-it`, commit
  `cd87a09e05076e3ba60f2b7e45920fcfbee4712c`. These files are absent from the
  initiating checkout at `/home/benwo/project/finum-it`, commit `ee20bc088`.
- Read the design-system spec and ADR 0014. The current worktree retains the same
  chart ownership boundary and requirement for separate complex-component grilling.
- User selected the newest upstream branch `feat/ui/action-card-summary` on
  23 November 2026. A successful remote fetch verified tip
  `4769035a03f21ea8791f793e12f0911ac66f60ac`; matching worktree:
  `/home/benwo/.codex/worktrees/action-card-summary-pr/components`.

## Verified evidence

- Upstream package version is `@open-wc/components` 0.4.0. Actual source and export
  files on the requested branch contain no chart implementation or chart exports.
  `docs/public-exports.md` lists chart paths that do not exist and is not API evidence.
- The requested upstream branch provides `OwcDetailCard` category rails through
  caller-supplied `accent-color`, structured summary slots and an `open` disclosure
  state. It has no category registry; the application must keep chart/legend/card
  identity and colors aligned. `OwcActionCard` supplies layout and native slotted
  actions, not chart selection or navigation behavior.
- Legacy chart source exists separately in FiNUM at
  `feat/data-table/src/chart/OwcPieChartElement.js`. It renders a pie, takes
  positional name/value data, supplies an internal bottom legend and pointer
  callbacks, and does not establish the requested doughnut/accessibility contract.
- Read-only Figma inspection and screenshots cover mobile Vermögen `7740:30729`,
  desktop Vermögen `7875:67057`, filled desktop Vermögen `7938:58657`, mobile
  Versicherungen `7885:88285`, desktop Versicherungen `7885:89854`, and the zero
  insurance state `7884:85770`.
- Vermögen has separate Gesamtvermögen and Monatliche Sparrate chart views. The
  sample uses Pension and Weltreise goal icons. Mobile chart/card rails reuse
  `7864:27997` (Depot) and `7864:28002` (LV), despite those tokens naming asset
  types rather than goals. The filled desktop goal-card rails instead bind to
  `5160:1977` and `5160:1976`. Category identity and color mapping require a decision.
- Versicherungen shows a monthly total while rows retain their payment periods.
  The four-category example uses Haushalt `7864:27977`, Recht `7864:27976`,
  Kranken `7864:27917`, and Unfall `7864:27970`. The matching row rails visibly
  reuse those category colors.
- The insurance example's chart labels are associated with different categories
  from the rows: chart Haushalt 35.07, Recht 9, Kranken 8.33, Unfall 54; rows
  Haushalt 108/year, Recht 25/quarter, Kranken 54/month, Unfall 35.07/month.
  The chart total 106.40 matches the rounded sum but does not validate those
  category assignments. Do not copy this inconsistency into fixtures.
- Figma Chart behavior `7366:32720`, annotation `7738:29806`, states that clicking
  a chart segment scrolls to and expands the corresponding card.
- Designed charts use a center total/caption, icons within the ring, and external
  amount labels with leader lines. The zero insurance example has neutral segments
  and category icons. These are design evidence, not yet accepted edge-case rules.
- The foundation preserves existing colors while separate contrast decisions
  remain pending. The accepted hint-color exception does not approve chart colors,
  labels, graphic boundaries or keyboard focus contrast.
- Goal persistence investigation found an existing per-contract free-text `target`
  field mapped to Salesforce `target__c`, not a standalone savings-goal identity or
  stored goal-color assignment. See `feat/core/src/contract/types/ContractData.ts`,
  `feat/core/src/contract/src/general/mapper/contractMapper.js` and
  `feat/core/src/contract/src/detail/ContractDetail.js`. The client-app `get-data`
  endpoint supplies clients/contracts, with no goal collection or goal-color payload. Mutable
  or duplicate goal labels cannot serve as durable color-assignment keys. The current
  inventory supplies asset-type chart tokens, not a persisted per-goal palette key.
- Missing-value possibility is now verified from source, not from production data:
  `paymentAmount`, `paymentInterval` and `cashValue` are optional in
  `feat/core/src/contract/types/ContractData.ts`. Missing fields remain absent through
  mapping; present invalid numeric input can become `NaN` and serialize to `null`.
  The client-app endpoint does not validate completeness before returning contracts.
  `Contract.averageMonthlyPaymentAmount` defaults missing amount/interval information
  to zero-producing values. That helper cannot establish known-zero versus unknown
  semantics for the new application adapter. This finding establishes possible inputs,
  not how often they occur or which existing value field is the correct wealth metric.

## Decision tree

Rounds 1 and Q4–Q8 of round 2 are confirmed. The user explicitly deferred Q9:
stable colors and their persistence remain open and must not be implemented.
Q10–Q13, Q15 and Q16 are confirmed. Q17 preserves the existing design instead of
the proposed contrast alterations. Q18 uses independent instances on separate pages
without switching. Q14 filters individual source records missing key information
before aggregation; it does not discard the whole category. Q19 is confirmed.
The behavior interview is complete within the explicitly deferred color/persistence
scope. Q20's final direction keeps initial implementation local and movable; Q21's
verification plan is confirmed. The shared-understanding gate is complete.

1. Meaning: category identity and grouping; metric, unit, period, eligibility and
   treatment of unallocated wealth; intended activation outcome.
2. Data: stable IDs and color reuse; completeness; total/rounding consistency;
   caller order and relation to cards; presentation versus financial calculation.
3. Presentation: shared behavioral contract; center and outer labels; legend
   ownership and contents; many categories, tiny slices, long labels and narrow layout.
4. Interaction: navigation targets for grouped categories; selection versus
   highlighting; pointer/touch tooltips; keyboard and focus behavior; nonvisual equivalent.
5. States: zero, empty, missing, invalid and negative data; partial results;
   unavailable targets; updates; reduced motion.
6. Delivery after behavior: generic versus FiNUM ownership under ADR 0014,
   verified upstream capabilities, implementation/library trade-offs and public exports.
7. Acceptance: backend-free local-fixture Rocket demos using public imports;
   geometry, interaction, keyboard/nonvisual and contrast checks; Figma comparison
   at 390/1280px and overflow/usability at 320px; inline and standalone previews.

## Confirmed constraints

- No implementation before recorded decisions and a shared-understanding confirmation.
- Keep financial calculations and fetching outside chart rendering.
- Use actual upstream source/exports from the user-selected branch.
- Follow ADR 0014 for reusable structure, behavior and accessibility; FiNUM domain
  composition and appearance stay in FiNUM.
- Make documentation edits directly and preserve unrelated work in both repositories.
- Keep the chosen design and palette. Do not implement the proposed new outlines,
  adaptive icon colors or darker focus treatment from Q17. Measure and record actual
  contrast outcomes without treating source preservation as contrast compliance.
- Use independent chart instances for Vermögen and Versicherungen on their separate
  pages. Do not add measure switching, a selector or carousel behavior. Separate local
  fixture examples can exercise the agreed measures without a switching UI.
- Do not implement stable color assignments, stored palette keys, deterministic
  ID-derived color assignment or color persistence. Whether colors should remain
  stable across sessions or devices is explicitly open for both goals and insurance.
  Fixture-supplied colors may demonstrate the chart and match its legend/card markers
  within the same rendered example; that does not establish a persistence policy.

## Decisions

### Round 1 — confirmed 23 November 2026

The user answered yes to Q1, Q2 and Q3.

- **Q1 — Category meaning:** Vermögen groups by savings goal, with an
  “Anlagen ohne Ziel” category for unallocated assets. Versicherungen groups by
  insurance category, combining contracts of the same category. Stable goal/category
  identity connects slices, legend entries and card markers. Asset-type token names
  and array positions do not determine category identity. Color assignment remains open.
- **Q2 — Measures:** Support separate current-wealth, monthly-savings-contribution
  and monthly-equivalent-insurance-premium breakdowns. Include unallocated assets in
  wealth totals. Insurance describes contractual premiums of displayed active
  contracts, including external/manual contracts, regardless of payer; applications
  and recommendations are excluded. Original payment periods remain in contract rows.
  Use premiums rather than personal expenditure as the insurance measure. The
  application supplies normalized values; rendering performs no financial conversion
  or fetching. Numeric representation, precision and total reconciliation remain open.
- **Q3 — Activation intent:** Activating a slice reveals the corresponding details
  by scrolling to and expanding them; it does not filter categories or change totals.
  Legend controls provide the same action through the keyboard. Destinations for
  grouped categories and focus movement remain open.

### Round 2 — Q4–Q8 confirmed 23 November 2026

- **Q4 — Shared presentation contract:** All three breakdowns use prepared chart
  title, measure/currency/period, ordered categories with stable IDs, labels, amounts,
  colors and optional icons, and a total. These EUR views receive whole cents after
  financial conversion and category aggregation. The application rounds each category
  once and supplies a total equal to the displayed category amounts. Rendering derives
  proportions and presentation only; eligibility, financial rounding and fetching stay
  outside it.
- **Q5 — Data states:** Known zero differs from unknown. All known amounts zero
  produces a neutral ring and zero total, without artificial equal slices. Zero-valued
  categories remain in the legend without arcs. Missing values produce an explicitly
  incomplete breakdown and known subtotal, not a complete-total claim. Negative or
  nonfinite values make the breakdown unavailable rather than being clamped or discarded.
  The missing-input policy is subsequently refined by Q14: filter individual incomplete
  source records before aggregation; do not introduce unknown slices or a special
  incomplete-doughnut mode. The total and legend describe the included records.
- **Q6 — Order:** Preserve the application's stable category order in slices, legend
  and corresponding detail overview; “Anlagen ohne Ziel” is last. Do not sort by amount
  or automatically group small categories into “Andere.” Keep every category.
- **Q7 — Legend and labels:** The chart presentation owns a visible legend generated
  from the same dataset. Entries show marker, full category name, amount and unit/period
  context, and expose the details action. Center text shows total and measure. Retain
  outer amount labels and ring icons where they fit; the legend is the complete readable
  reference. Cards supply details rather than being the only legend. Explicit category
  names beside the chart are an accepted addition to the inspected Figma screens.
- **Q8 — Navigation destinations:** For several contracts, reveal and scroll to their
  category group, then focus its heading; individual disclosures stay closed. For one
  expandable card, open it and focus its summary. Stay in the overview. Missing
  destinations yield plain legend entries without an action.
- **Q9 — Explicitly open, implementation deferred:** The user clarified that the
  intended goal field has not yet been added and must also be added as product work.
  The existing per-contract free-text `target` is not evidence that the intended
  goal model is complete. Record the goal-field addition as an integration requirement;
  its schema and persistence design are not settled here, and no field is implemented
  during this interview. The user is unsure whether stable colors across devices
  are needed, including for insurance. Do not implement stable colors or color
  persistence. The earlier saved-palette-key recommendation is not accepted.
  Distinguish category identity, needed to connect entries and navigation in the
  supplied dataset, from an unapproved durable category-to-color policy.

### Round 3 — Q10–Q13 confirmed 23 November 2026

- **Q10:** Legend controls are the keyboard entry points; hover/focus highlights the
  corresponding slice, with no persistent selection or center-total replacement.
  Pointer slice activation has the same details action. No tooltip is proposed because
  the legend supplies the information.
- **Q11:** The visible legend supplies the full nonvisual equivalent, including
  measure, total/subtotal, completeness, category names and known/unknown amounts.
  Ring graphics and icons are decorative rather than duplicate announcements.
- **Q12:** Preserve true slice proportions; omit icons that cannot fit and omit the
  outer-label set if labels collide. Keep the full wrapping legend. Stack chart above
  legend at 320/390px; use a side-by-side arrangement only where the container fits it.
- **Q13:** Empty data says “Keine Daten”; a total/category mismatch makes the breakdown
  unavailable. Preserve focus by category ID on updates, never navigate automatically,
  announce user-requested measure changes concisely and respect reduced motion without
  automatic slice animations.

The user answered yes to Q10, Q11, Q12 and Q13. These confirmations do not change
the explicit deferral of stable colors in Q9.

### Round 4 — responses recorded 23 November 2026

- **Q14 — Clarification requested:** The user asked how an unknown value could happen.
  Imported assets without recorded valuation or contracts without premium/payment-period
  data are hypothetical examples only; investigate actual types/mapping before claiming
  they are current app behavior. A failed fetch is an unavailable request, not evidence
  of one unknown category. The proposed incomplete neutral-ring presentation is not yet
  confirmed.
  Subsequent source inspection verified that contribution amount and payment interval
  are optional and can be absent. Without either, a monthly equivalent cannot always be
  calculated. Some legacy helpers conceal missing information as zero; the chart adapter
  must distinguish unknown input from genuine zero. No production records were inspected.
  **Subsequent user direction:** “just not show it in the doughnut if we're missing
  key information.” Omit the affected entry from the ring rather than suppressing
  the entire otherwise usable breakdown with a neutral ring. This replaces the
  neutral-ring proposal for mixed complete/incomplete data. Retaining an explicit
  unknown legend entry follows the earlier Q5/Q11 decisions. Confirm whether the
  affected entry means an entire aggregated category when one constituent contract
  is incomplete, and confirm the center wording for the sum of rendered categories.
  **Final clarification:** The user rejected omitting the entire category and directed
  “just filter it out.” Filter only the source contract/asset missing required information,
  before financial normalization and category aggregation. Keep the category if other
  usable records remain. Ring proportions, total and legend use the included records;
  do not create unknown slices or synthetic unknown legend entries for filtered records.
  This supersedes the earlier special incomplete-ring/subtotal proposals. If filtering
  leaves no chart data, use the already-agreed empty-data behavior. Known zeros remain
  valid input. Financial preparation and filtering remain outside the generic renderer.
- **Q15 — Confirmed:** Retain a 75% inner-radius ratio with accurate data-derived
  angles. Start at twelve o'clock, proceed clockwise in supplied order, and use a full
  ring for one positive category. Do not inflate tiny slices; omit separators that
  would obscure them. Every category keeps its usable legend representation.
- **Q16 — Confirmed:** These EUR views use two decimal places and German-style grouping,
  for example `€ 1.234,56`, with explicit measure/period context. Move a total/caption
  below the ring when it cannot fit rather than truncating, over-shrinking or abbreviating
  an exact amount.
- **Q17 — Design preserved:** The user directed keeping the design and already-chosen
  palette. The proposed additional outlines, adaptive icon-color treatment and darker
  legend focus role are not approved. Preserve source design values; retain contrast
  measurements and unresolved outcomes as evidence, without silently recoloring.
- **Q18 — Switching rejected:** Use independent chart instances on the separate app
  pages; there is no measure switching. Do not introduce a demo selector, automatic
  cycling or carousel contract. The earlier proposed focus fallback for a removed
  category is resolved by Q19 below.

### Round 5 — Q14 clarification and Q19 confirmed 23 November 2026

- **Q14:** Filter the individual incomplete source record, not its whole category.
  Use remaining records consistently for category values, proportions, legend and total.
  Missing inputs are not converted to zero. If nothing remains, use “Keine Daten.”
- **Q19 — Confirmed:** Keep focus on the same category after updates when
  it exists; if the focused category is removed, move focus to the chart heading.
  There is no switching UI and no automatic navigation to details on data updates.

## Delivery decisions

- **Q20 — Final user direction:** Keep the initial chart/legend implementation in
  `finum-it` to review the implementation and any dependencies first. Design it so it
  can move to `components` later. This replaces initial upstream placement; record the
  scoped exception to ADR 0014 in the spec. Keep rendering/legend/geometry isolated
  from FiNUM financial preparation, assets, formatting, fetching and navigation.
  Use existing Lit/SVG facilities; no new runtime dependency is planned. Do not add
  upstream chart exports, package changes or a release in this iteration. A later move
  requires a separate extraction decision and normal upstream package requirements.
- **Q21 — Confirmed:** The user accepted the local-fixture Rocket and geometry,
  interaction, accessibility, contrast and 320/390/1280px verification plan. Adjust
  package-specific checks to the final local scope; upstream chart release/pack checks
  are deferred rather than creating an artificial upstream change. Existing unreleased
  controls may still need temporary-pack consumer verification if used by the demos.
- **Shared understanding confirmed:** All behavior and delivery decisions are recorded
  in the consolidated spec. Stable colors and goal-field persistence remain explicitly
  open; do not implement them. No runtime implementation was performed in this interview.

The consolidated [spec](./spec.md) is the current design and delivery contract.

## Contrast evidence; existing design preserved

Read-only sRGB contrast calculations against the current inventory's opaque white
and `#f5f5f4` surfaces found:

- Depot `#f4e1b1`: 1.29:1 against white, 1.18:1 against the default surface.
- Without Goal `#fbf8ef`: 1.06:1 against white, 1.03:1 against the default surface.
- Unfall/current focus `#b6d2e6`: 1.57:1 against white, 1.44:1 against the
  default surface; that focus color is 1.00:1 against the Unfall fill.
- Existing normal text `#4b4c4f`: 8.59:1 against white, 7.87:1 against the
  default surface. It does not work on every category fill.
- Existing brand `#144569`: 10.07:1 against white, 9.23:1 against the default surface.
- Existing Neutral/05 `#101219` is a dark candidate for light fills. Text/White
  resolves to `#f5f5f4`, not literal white; no one icon/text color fits the entire palette.

Source: current foundation `colorInventory.js` and `clientAppTheme.js`, inspected
without edits. Actual gradient/translucent backgrounds, adjacent fills and rendered
boundaries still require verification. These measurements are not visual acceptance.

## Geometry evidence for the confirmed rendering contract

Scoped read-only Figma inspection found 186.3834px ellipse geometry for selected
mobile wealth and insurance slices, inner-radius ratio 0.75, and ring thickness
23.2979px. Rendered group bounds are approximately 188px. Ring icons are 16×16px;
outer amount labels are Outfit Regular 14px with approximately 16.8px line height.
Center amounts are 22px/22px and captions 14px/16px; selected amount font weights
differ between the two source screens and the foundation's approved typography.

The illustrative source angles are not quantitatively reliable: the selected wealth
slice spans total 363.60° before their different rotations/offsets, while the selected
insurance spans total 354.24° and do not match the displayed amount proportions.
Do not reproduce those angle inconsistencies as a rendering contract.

## Planned local-fixture verification

This plan is confirmed under Q21, adapted to Q20's local implementation scope. No runtime
implementation or browser validation has been performed during the interview.

- Independent local examples for wealth, monthly savings and insurance premiums; no
  switching UI, backend requests or credentials. Demonstrate two separately mounted
  chart instances without cross-instance highlighting, duplicated control IDs or actions.
- Use consistent category identities, amounts and supplied fixture colors across each
  chart, legend and matching card markers. Do not add stable-color assignment/persistence.
  Insurance fixture: Unfall 3507 cents, Kranken 5400, Recht 833, Haushalt 900; total
  10640 cents. Original card periods remain 35.07/month, 54/month, 25/quarter and 108/year.
  These are prepared fixtures, not conversion logic embedded in the chart.
- Geometry cases: a single positive category; two unequal values; all known zero;
  mixed zero/positive; a one-cent tiny slice alongside a much larger category; and
  twenty categories. Check accurate proportional geometry, 75% inner-radius ratio,
  clockwise caller order, no phantom zero arcs or angle inflation, and readable legend.
- Data cases: empty array; incomplete source record filtered before aggregation while
  other records of the same category remain; all source records filtered; negative,
  nonfinite and mismatched totals. Verify explicit state messages and no coercion to zero.
- Layout cases: long German category names, repeated display names with distinct IDs,
  large totals/captions that move outside the ring, and outer-label/icon omission when
  they cannot fit. Keep full labels and exact amounts available in the visible legend.
- Interaction cases: pointer slice action, legend hover/focus highlight, native keyboard
  activation, single-card expansion/focus, multi-contract group heading/focus and absent
  destinations. Verify no filtering, persistent selection, tooltips or changed totals.
- Accessibility cases: meaningful chart title, unit/period and summary; a complete
  nonvisual equivalent through the visible legend; decorative ring graphics; known zero
  versus missing source data; focus retention on reorder/update; reduced-motion behavior.
  Test heading-focus fallback after removal.
- Inspect inline and standalone Rocket examples through public consumer imports,
  including ordinary Lit shadow-root consumers under the external FiNUM theme. Check
  explicit light appearance under light and dark OS preferences.
- Compare screenshots with linked Figma examples at 390px and 1280px; check 320px
  for overflow, lost actions, wrapped labels and usable legend targets. Layout is fluid
  between those verification widths.
- Measure actual text, icon, graphic and focus contrast on rendered backgrounds.
  Preserve the selected design/palette per Q17 and report measured gaps separately;
  semantic/keyboard test success does not establish visual contrast compliance.
- Run the relevant consumer browser checks and actual shared Rocket static build.
  Record reproducible commands and reviewed evidence with the catalog entry. Upstream
  chart/package checks are deferred with extraction. Verify an existing unreleased
  components package only if needed by the demos; inspect the local renderer's dependency
  footprint and separation from FiNUM business code before considering an upstream move.

## HTML-in-Canvas follow-up — 25 November 2026

The user explicitly selected [HTML-in-Canvas](https://github.com/WICG/html-in-canvas)
and named [Giuseppe Scotto Lavina's polyfill](https://github.com/GiuseppeScottoLavina/html-in-canvas-polyfill).
This reopens the original SVG/no-new-runtime-dependency decision. The user subsequently
asked to inspect `open-wc/components` ADRs and guidelines because initial upstream
implementation is also a possibility. That reopens the local-placement exception and
its release boundary; it does not yet select upstream placement.

The existing behavior, financial preparation, category identity, palette and deferred
goal/color-persistence decisions remain the starting contract. No runtime code has
been implemented or browser checks performed in this follow-up. New recommendations
below await answers and shared-understanding confirmation.

### Source observations

- [Chrome's guidance](https://developer.chrome.com/docs/modern-web-guidance/guides/visual-design/expose-canvas-content-to-browser-features)
  documents support from Chrome 157 and the current `content="drawable"`, `drawable`,
  `drawElementImage()` and `paint` API shape. WICG describes a living proposal; do not
  assume older `layoutsubtree` examples match the current API.
- The [polyfill README](https://github.com/GiuseppeScottoLavina/html-in-canvas-polyfill#browser-support)
  reports desktop Firefox 155+ and Safari 27+ support. Physical iPad and Android
  devices were tested; physical iPhone support is unqualified. Older Firefox/Safari,
  iOS before 26, Firefox for Android and in-app web views are refused.
- The same README reports approximately 130 KB gzipped for the core and 6 KB for a
  native-first loader. Its bundler loader uses split dynamic imports. Rendering can
  lag the DOM by one or more frames; canvas children move into an invisible live
  layer. Cross-origin fonts/images need CORS and strict CSP needs `img-src data:`.
- The polyfill's [framework guide](https://github.com/GiuseppeScottoLavina/html-in-canvas-polyfill/blob/main/docs/guides/FRAMEWORKS.md)
  reports Lit 3 open-shadow-root coverage in headless Chrome. That is not evidence
  for this chart's FiNUM theme, fonts, icons or native/polyfilled Safari/Firefox
  behavior; those need consumer verification.
- Modern Web Guidance search matched `expose-canvas-content-to-browser-features` and
  `html`. CLI retrieval gated the canvas guide as volatile; no project opt-in
  configuration was changed. The user explicitly named the feature, so the skill's
  named-feature exception permits direct primary-source investigation. The general
  HTML guide was retrieved; no UI code was written.

### Upstream ownership and package guidance

Inspected the local `open-wc/components` checkout on `feat/ui/insurance-disclosure`
at `fd3b807`, without modifying it. This is a source snapshot, not a claim about the
published package or every upstream branch. It declares version 0.4.0 and contains
ActionCard/DetailCard sources; no chart implementation was found.

- FiNUM ADR 0014 (`docs/adr/0014-client-design-system-component-ownership.md` in `finum-it`)
  places generally useful structure, behavior and accessibility upstream; FiNUM
  theme, assets and domain composition stay in FiNUM. Initial upstream chart placement
  would follow that policy and replace the previously accepted exception.
- Upstream `CONTRIBUTING.md`, `AGENTS.md`, `GLOSSARY.md` and
  `docs/release-validation.md` require a component directory, deliberate class/define
  exports and types, export-map entries, colocated Rocket docs using public imports,
  colocated tests and a Changeset for consumer-visible additions. Runtime libraries
  needed by public exports belong in dependencies by default; peer dependencies
  need a compatibility reason, normally recorded in an ADR. Dependency optimization
  and eager versus lazy download remain separate questions.
- Upstream ADR 0003 publishes unbundled ESM and leaves dependency optimization to
  consuming applications. This makes consumer bundle verification necessary before
  promising that native browsers avoid downloading the polyfill core.
- Upstream ADR 0001 requires deliberate migration handling for public-surface
  cleanup. ADR 0004 separates contributor guidance from agent workflow instructions.
  ADR 0006's private virtualizer choice and ADR 0007's table-specific single-tab-stop
  grid do not impose a chart rendering or keyboard model. No inspected ADR requires
  a chart library, prohibits this polyfill or replaces the accepted legend-button
  keyboard contract.
- Current upstream browser configuration launches Chromium only. Existing release
  checks (`lint`, `test`, `types`, `build`, package dry run) alone cannot establish
  actual Firefox/Safari or physical iPhone compatibility for this feature.

### Follow-up answers

- **Q22 — Confirmed:** The user answered yes to initial implementation in
  `open-wc/components` and directed that the spec live here as well. Work continues
  in a dedicated worktree of the local `../components` repository, based on
  `feat/ui/insurance-disclosure` at `fd3b807`. This supersedes Q20's FiNUM-local
  placement and deferred-upstream-package boundary. It does not authorize publication.
- **Q23 — Clarification requested:** The user asked “what legend?” The original
  Q7/spec used that word for a separate visible category list: color marker, full
  category name and amount, with an action to the corresponding details. It was an
  explicit addition to the inspected Figma screens. Explain that concrete UI before
  asking whether to retain it or where to render it. No new answer has been accepted.
- **Q24 — Clarification requested:** The user asked “what summary amounts and so on?”
  Here “summary” meant the center total and measure/caption, and “amounts” meant
  values of the categories in the existing spec. It did not mean another report or
  new financial data. Explain those elements and defer choosing their failure
  presentation until the desired category-list/center presentation is clear.

### Chart-only correction — Q23/Q24 settled

The user directed: “if the chart doesnt work let's just not show anything also the
legend I don't want just do the chart”.

- Remove the separate visible category list and its actions. This supersedes Q7
  and every earlier legend-dependent layout, interaction and test requirement.
- If native rendering and the polyfill cannot produce a working chart, hide the
  component's output. Do not replace it with a list, standalone total, message or
  controls, or leave an empty chart-sized placeholder. Surrounding page content is
  outside the chart component.
- Preserve the designed chart: center total/caption, proportional ring, outer amount
  labels, leader lines and icons where they fit. This response does not remove those
  chart elements or change valid known-zero/empty-data semantics.
- Reopen the working chart's keyboard and nonvisual contract: the old model relied
  on native legend buttons and a decorative-only ring. Do not quietly remove
  keyboard access or add a hidden substitute legend. Confirm chart semantics directly.

### Q25/Q26 confirmed

The user answered yes to both questions.

- **Q25:** Actionable slices are reachable with Tab/Shift+Tab in supplied category
  order. Enter/Space opens the same details as clicking. Each slice announces its
  category and amount with unit/period context. Keep those semantics in the working
  HTML-in-Canvas chart, with no separate visible or hidden substitute legend. The
  former blanket decorative-ring assumption is superseded; icons and repeated drawn
  text remain decorative. Preserve category-based focus and the heading fallback
  when a focused slice disappears while the chart remains visible.
- **Q26:** The component automatically uses native support or lazily loads the named
  polyfill when needed. If initialization fails, hide the chart. The owning package
  declares its required runtime library normally under CONTRIBUTING's dependency
  policy. Verify native-first chunking in a real consumer rather than claiming
  unbundled ESM guarantees it. Initialization is shared across chart instances;
  disconnecting one chart must not uninstall shared support used by another.

### Q27 confirmed

The user answered yes to requiring successful rendering in current Chrome, Firefox
and Safari, including Safari on a physical iPhone, before release. Verify native
Chrome and actual polyfilled Firefox/Safari. Record exact tested versions and device
evidence. A forced-polyfill Chromium run is additional evidence, not a replacement
for actual engine and iPhone checks. The accepted hide-on-failure runtime behavior
does not satisfy a required browser's release check by itself.

### Final shared-understanding gate

Q22–Q27 are settled. The user confirmed the complete revised design on 25 November
2026: “Jep sounds good”, and invoked `to-spec` to synthesize the implementation
contract. This completes the shared-understanding gate, including the public-consumer
test seam and native/polyfilled browser requirements. Goal persistence and durable
color assignment remain explicitly deferred. Public names and declaration details
can follow repository conventions within the confirmed prepared-data contract.

The [spec](./spec.md) is published to this repository's local Markdown issue tracker
with `Status: ready-for-agent`. It uses the to-spec sections and consolidates the
accepted design without reopening the interview. No runtime implementation, browser
validation, package publication, commit or push has occurred in this synthesis.
No new domain term or durable architectural trade-off warrants a glossary entry or
new ADR in this follow-up.
