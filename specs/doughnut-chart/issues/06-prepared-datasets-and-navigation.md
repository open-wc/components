# 06: Demonstrate prepared datasets and detail navigation

Scope removed in the follow-up review on 26 November 2026. The owner requested removing these
domain-specific package demos, their public template-factory export and preparation tests.
Generic chart, state, icon and animation demos remain. Financial preparation and host detail
navigation belong in consuming applications. The original delivery record below is historical.

**What to build:** Reviewers can use backend-free examples of wealth, monthly savings and insurance
premiums, activate categories and reach the matching details while the chart's totals stay unchanged.

**Blocked by:** 01 — Deliver a working public doughnut chart.

**Status:** resolved

Source: [Doughnut chart spec](../spec.md), especially Measures and eligibility, Missing input,
Financial preparation, Activation and navigation, and Fixture composition.

- [x] Provide independent local wealth and insurance examples and a separate monthly-savings fixture
      using public package imports. Use generic public data and assets without production APIs,
      credentials, private FiNUM imports or service assumptions. Do not add switching UI.
- [x] Demonstrate wealth grouped by supplied savings-goal IDs with unallocated assets last, and
      insurance grouped by category. Preserve caller order and reuse supplied colors for chart and
      corresponding card markers without inventing a durable color policy or goal schema.
- [x] Demonstrate the consumer boundary with local fixtures: filter only an individual source record
      missing information required for the selected measure, retain usable contributions in its
      category, and prepare categories, labels and total from the same included records. Include
      all-filtered and genuine-zero preparation examples without treating missing values as zero.
- [x] Use already-prepared whole-cent EUR values, with category amounts rounded once after aggregation
      and a total equal to displayed category amounts. Supply two-decimal German-style formatting
      and explicit measure/period context; keep financial operations outside the renderer.
- [x] The insurance fixture uses Unfall 3507 cents, Kranken 5400, Recht 833 and Haushalt 900, totaling
      10640 cents. Detail rows retain 35.07/month, 54/month, 25/quarter and 108/year respectively.
- [x] Fixtures demonstrate inclusion of displayed active external/manual contracts regardless of
      payer and exclusion of applications/recommendations. Describe premiums rather than personal
      expenditure without introducing a production adapter or new financial source mappings.
- [x] Consumer-owned category activation scrolls to, opens and focuses a single expandable card's
      summary. A category with several contracts reveals its group and focuses its heading while
      leaving inner disclosures closed. Stay in the overview and leave chart amounts unchanged.
- [x] An absent destination supplies no action. Resolve destinations by category ID outside the
      renderer and reuse verified current public DetailCard/other control capabilities as needed.
- [x] Add public-consumer checks for preparation results and pointer/keyboard detail actions, and
      document the prepared-data and host-navigation boundary. Rendered data-state behavior belongs
      to ticket 02; update/focus retention belongs to ticket 03.

## Answer

Implemented in `45e291c`. Public chart consumers demonstrate independent wealth, monthly savings and insurance preparation, all-filtered and known-zero inputs, caller-owned colors/order and absent destinations. Native HTML disclosures supply public opening/focus behavior without another component's private internals. Four browser checks passed: exact prepared cents and original insurance periods, selected-measure filtering, eligibility, pointer/keyboard host navigation and unchanged totals. Documentation lives at `/data/doughnut-chart/examples`.
