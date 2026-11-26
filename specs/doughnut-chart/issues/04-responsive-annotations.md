# 04: Fit chart annotations to the available space

**What to build:** The chart preserves the designed ring, exact amounts and useful annotations across
narrow and wide containers, omitting annotations that cannot fit without introducing another list.

**Blocked by:** 01 — Deliver a working public doughnut chart.

**Status:** resolved

Source: [Doughnut chart spec](../spec.md), especially Amounts and summary, Ring annotations and layout,
Appearance and contrast, and Labels and responsiveness.

- [x] Render supplied outer amount labels, leader lines and optional ring icons where they fit.
      Omit the whole outer-label set on collision and omit individual icons that cannot fit.
- [x] Keep the exact supplied total and measure/caption centered when they fit; move them below the
      ring when necessary. Do not truncate, over-shrink or abbreviate financial amounts.
- [x] Fit or wrap long chart text and large captions within the available container. Preserve true
      slice proportions and fluid sizing rather than treating verification widths as fixed sizes.
- [x] Exercise long German text, duplicate display names, large totals and dense annotations at
      320px, 390px and wider containers including 1280px. Check resize behavior, annotation omission
      and absence of unintended horizontal scrolling.
- [x] Preserve the selected source palette and treatments when supplied by the consumer. Do not add
      outlines, adaptive icon colors, the proposed darker focus role or shared-theme changes.
- [x] Do not add a category list, visible or hidden substitute legend, tooltip or measure-switching UI
      to compensate for omitted annotations.
- [x] Add responsive public-consumer examples and Colocated Tests for relocation and omission through
      observable layout. Document annotation behavior; final Figma comparisons and rendered contrast
      evidence are recorded in ticket 08.

## Answer

Implemented in `eff876f`. Exact amount labels and leader lines render only when their complete set
fits; each optional 16px icon must fit inside its true annular slice. Oversized center content moves
below the ring inside the drawable subtree. Container resize, font readiness and slotted content
changes trigger measurement. Public examples and six layout checks cover 320px, 390px and 1280px.

The 32 chart checks passed on native Chromium and forced-polyfill Chromium across the recorded
runs. One combined polyfill run timed out starting the data-test browser under host load; rerunning
that file with a longer startup allowance passed all 17 data checks. This is supplemental Chromium
evidence, not the final browser/device acceptance or a Figma fidelity claim.

## Comments

- Review fix `42af86d` adds a public layout regression and prevents an outer label rectangle from
  intersecting the ring. All seven layout checks passed natively and with the forced polyfill.
