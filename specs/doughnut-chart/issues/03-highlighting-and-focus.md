# 03: Complete highlighting and focus behavior

**What to build:** Pointer, keyboard and screen-reader users can identify and activate the same
category, and retain a predictable place when the supplied data changes.

**Blocked by:** 01 — Deliver a working public doughnut chart.

**Status:** resolved

Source: [Doughnut chart spec](../spec.md), especially Highlighting, Keyboard and nonvisual behavior,
and Interactions and focus.

- [x] Tab and Shift+Tab visit each positive actionable slice exactly once in supplied category order.
      Non-actionable and zero-valued categories create no action tab stops or promised actions.
- [x] Pointer activation, Enter and Space emit the same category ID exactly once. An actionable tiny
      positive slice remains keyboard reachable without enlarging its arc.
- [x] Hover and keyboard focus highlight the corresponding slice while preserving the center total
      and dataset. Do not add persistent selection, filtering, tooltips or hover-only information.
- [x] The chart exposes meaningful heading, measure, period and total semantics, and each slice
      exposes its category and exact supplied amount with context. Decorative icons and repeated
      drawn text do not produce duplicate narration; the interactive chart subtree stays exposed.
- [x] Drawn, pointer and keyboard geometry agree, including visible focus on the relevant slice.
      Preserve the selected visual treatments without adding the unapproved contrast treatments.
- [x] Reordering, renaming or updating amounts preserves focus by category ID. When the focused
      category disappears while the chart remains visible, focus moves to the chart heading.
- [x] Data updates never activate details automatically or pull focus back from elsewhere. Respect
      reduced-motion preferences and introduce no automatic slice animation.
- [x] Add public-consumer interaction and nonvisual checks, including duplicate labels with distinct
      IDs, unavailable actions, reorder/update/removal and a tiny actionable slice. Update the owning
      component's keyboard and accessibility documentation without making unverified contrast claims.

## Answer

Implemented in `e6d33a7`. The chart suite passed 26 checks on native and forced-polyfill Chromium,
including drawn hover/focus changes, two-way tab order, tiny-share actions, ID-based focus retention,
heading recovery and updates while focus stays elsewhere. Type generation, component lint and
formatting passed. Highlighting changes brightness transiently without a new palette role, outlines,
tooltips, persistent selection or motion. Contrast acceptance remains ticket 08.
