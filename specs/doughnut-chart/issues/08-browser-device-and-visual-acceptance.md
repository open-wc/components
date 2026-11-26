# 08: Record browser, device and visual acceptance

**What to build:** Reviewers have reproducible evidence that the integrated chart works in every
required browser and on a physical iPhone, with source-design comparisons and measured contrast gaps
recorded separately from functional and semantic results.

**Blocked by:** 07 — Verify the installed package in real consumers.

**Status:** ready-for-human

Source: [Doughnut chart spec](../spec.md), especially Browser acceptance, Visual evidence, Evidence and
commands, and the linked Figma sources in Further Notes.

- [ ] Verify a working chart in current Chrome using native HTML-in-Canvas and in actual Firefox and
      Safari using the polyfilled path. Record exact browser/OS versions and identify the tested
      package candidate. Forced-polyfill Chromium is supplemental evidence only.
- [ ] Verify Safari on a physical iPhone and record device, OS/browser version and physical-device
      evidence. Simulator or desktop WebKit results do not replace this check.
- [ ] On applicable platforms, check rendering, resize/device-pixel-ratio alignment, pointer/touch
      activation, keyboard operation where available, accessible category/amount context and loader
      behavior. Confirm drawn, pointer and keyboard geometry agree through native/polyfilled paths.
- [x] Check the integrated data-state, annotation, detail-action and independent-instance examples,
      including tiny actionable slices, long text and large exact totals. Fix any chart defects found
      and rerun the affected verification before recording a pass.
- [x] Compare reviewed screenshots with the spec's linked Figma examples at 390px and 1280px. Check
      320px for overflow and usability; retain fluid sizing rather than fixed verification dimensions.
- [x] Inspect actual text, icons, boundaries and focus against rendered backgrounds under both OS
      color preferences while the explicit light theme stays active. Preserve the chosen palette and
      treatments; do not implement declined outlines, adaptive icon colors or theme changes.
- [x] Record measured contrast results and unresolved gaps independently of source fidelity and
      semantic test results. Neither visual matching nor passing semantic automation establishes
      contrast compliance.
- [x] Record public imports, supported states, Figma mappings, runnable commands, reviewed screenshots
      and browser/device evidence in the catalog. Leave unavailable required evidence explicitly
      unmet; hidden output on a required browser does not satisfy the release requirement. Do not
      claim release acceptance until every required browser/device check has passed.

## Answer

Available evidence and reproducible consumer fixtures are in the [catalog](../acceptance.md).
Actual Google Chrome 158.0.8127.88 uses native support; actual Firefox 159.0 loads the polyfill.
The final public chart suite passes 39 checks in each browser, with one scenario-specific loader
test skipped by default and verified separately. Installed consumers also pass in both browsers
and native/forced-polyfill Chromium, including network, external theme/font/icon and DPR checks.

This ticket remains open: the Linux/WSL2 host provides neither actual Safari/macOS nor a physical
iPhone. Desktop WebKit or emulation would not replace those required checks. Touch and Safari
behavior therefore remain unverified. No release acceptance or publication is claimed.

Reviewed 320/390/1280px screenshots and rendered measurements are retained in `../evidence/`.
Source fidelity remains unresolved: the current maximum ring diameter is 288px versus roughly
188px in the selected source. Measured contrast also exposes orange/white, adjacent-fill and subtle
focus gaps. These are recorded separately from passing functional/semantic checks. The declined
palette/theme/outline treatments were not introduced.
