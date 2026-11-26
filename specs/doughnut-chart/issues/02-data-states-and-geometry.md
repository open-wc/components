# 02: Handle data states and geometric edge cases

**What to build:** Consumers can trust that the ring, total and data-state presentation describe the
prepared dataset, including genuine zero values, empty data, malformed values and very small shares.

**Blocked by:** 01 — Deliver a working public doughnut chart.

**Status:** resolved

Source: [Doughnut chart spec](../spec.md), especially Numeric and empty states, Geometry, and the
geometry and invalid-data testing decisions.

- [x] Empty prepared categories show “Keine Daten”; all known values zero show a neutral ring and
      zero total without artificial equal shares. These remain distinct from rendering failure.
- [x] Genuine zero-valued categories remain valid input but produce no arc or action tab stop.
      Mixed zero/positive datasets use only positive values for the ring's proportions.
- [x] Negative or nonfinite prepared values and nonfinite category sums make the breakdown
      unavailable. Do not clamp, silently discard or reinterpret these values as missing or zero.
- [x] One positive category fills the entire ring. Two unequal values, a one-cent value beside a
      much larger amount and twenty categories preserve accurate proportions, the 75% inner-radius
      ratio and clockwise supplied order from twelve o'clock.
- [x] Preserve every supplied category without value-based sorting, automatic “Andere” grouping or
      minimum-angle inflation. Omit separators where they would obscure tiny slices.
- [x] Use IDs independently of duplicate or mutable labels, colors and positions. Validate prepared
      presentation input without adding source filtering, financial rounding or conversion logic to
      the renderer.
- [x] Add public-consumer fixtures and Colocated Tests for these states and geometry cases. Use
      independent expected proportions and observable rendered or hit-testable behavior rather than
      copying implementation arc strings or asserting private helper state.
- [x] Document the data states, validation behavior and geometric guarantees alongside the component.

## Answer

Implemented in `0ebae14`. Public browser checks cover empty, neutral zero, malformed values and
totals, duplicate IDs, a full circle, mixed zero/positive input, twenty categories and a tiny share.
The 22 chart checks passed in native and forced-polyfill Chromium. Type generation and component
lint passed. Public Rocket examples document valid empty and known-zero states, validation and
geometry; state labels and the neutral ring color are consumer-configurable. Accepted slots remain.

Follow-up on 26 November 2026: the accepted public contract removes numeric `total`. The chart
derives its denominator from category values, supporting raw amounts and fractional weights that
need not sum to 1. Independently expected totals are validated by the consumer, and formatted
totals remain center-slot content. The original total-mismatch cases above describe the earlier
implementation and are superseded by this correction.
