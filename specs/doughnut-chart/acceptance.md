# Doughnut chart verification

Follow-up on 26 November 2026: domain-specific prepared demos and the
`examples/doughnut-chart.js` export were removed at the owner's request. The retained reproduction
fixtures now use generic categories, consumer-owned styles and category activation directly through
the public chart API. Candidate identities, financial screenshots and measurements below record
the earlier candidate; they are historical evidence, not results for the revised fixtures.

Integration branch: `feat/doughnut-chart`. Functional implementation and review fixes are integrated.
Release acceptance remains **unmet** until actual Safari, a physical iPhone and the visual gaps below
are resolved. No package was published and no production dependency was changed.

## Candidate

- Packed name/version: `@open-wc/components@0.4.0`, an unpublished local candidate.
- Runtime source: integration `d06b8bf`, including review fix `42af86d`.
- Tarball: `/tmp/open-wc-components-0.4.0.tgz`, 471382 bytes, unpacked 1918379 bytes.
- SHA-1: `42c0dcc6ac9e891c958ddaeadeeb6e09b20ea2ea`.
- Integrity: `sha512-75ySoVhXtVt1urvLPRVuHWkPXnQfq1lInxR7VJw+GxxKlqMIy2afsh8JLneRzE31qh44L/jW8a7Ua4CPSgI0vA==`.

Verification ran on Ubuntu 22.04.3 LTS / WSL2, kernel `6.18.58.1-microsoft-standard-WSL2`,
Node 24.15.0, on 25 November 2026. The final package also includes the completed loading-verification
documentation. Later evidence-only commits do not change this tarball.

Release gate results: `npm run lint`, `npm test`, `npm run types` and `npm run build` passed.
The final full test command ran both Node and browser suites successfully. Actual Chrome and
Firefox each passed 39 chart checks with one fault-scenario test intentionally skipped outside its
dedicated configuration. All three loader configurations passed separately. Packed contents contain
the public entries, declarations and component docs, with no specs, tests, agent files or private
theme/assets/references. Package dry-run and the real pack were reviewed; nothing was published.

## Follow-up verification — 26 November 2026

The working tree now uses automatic 400 ms eased value transitions and generic demos. Initial,
structural, empty and all-zero updates remain immediate. Amount strings are consumer-formatted;
only proportions and attached annotations interpolate. Updates during motion start at the current
position, and switching to reduced motion finishes immediately.

The chart suite passed 45 checks in native Chromium and 45 with `CanvasDrawElement` disabled to
force the polyfill (two scenario-specific checks skipped in each default run). The separate
reduced-motion configuration passed two checks, with four motion-only checks skipped:

```sh
npx web-test-runner --files 'src/doughnut-chart/*.test-browser.js'
npx web-test-runner --config src/doughnut-chart/motion.test-browser.config.js
```

A Playwright clock check on the standalone animation demo verified eased intermediate pixels,
matching pointer activation, keyboard activation, attached amounts, interrupted retargeting and
live reduced-motion changes on both rendering paths at device-pixel ratio 2. The shared Rocket
demo/code rendering, standalone icons and documentation layout were checked at desktop, 390 px
and 320 px widths. API tables scroll within keyboard-accessible named regions without page overflow.

Types, lint, Node tests and the Rocket build passed. The package dry-run contained no removed
prepared demos, tests, specs or agent/check scripts. The new Atlas renderer-binding check is part
of the existing lint command and CI; contribution guidance records the page structure convention.
These follow-up checks do not close the outstanding Safari, physical-device or visual release gates.

## Public contract and installed consumer

Public imports verified by the temporary consumer and its TypeScript check:

```js
import { OwcDoughnutChart } from '@open-wc/components/OwcDoughnutChart.js';
import '@open-wc/components/define/owc-doughnut-chart.js';
```

```ts
import type {
  OwcDoughnutChartCategory,
  OwcDoughnutChartActivation,
} from '@open-wc/components/OwcDoughnutChart.types.js';
```

The consumer installs the tarball and runtime dependencies in `/tmp/doughnut-consumer`, rather than
importing the component's private sources. It renders three independent Lit charts in a shadow root
under the existing consumer-owned theme, with a locally served Outfit font and a generic SVG icon.
It also composes the public DetailCard API. The existing private theme is read by the temporary
consumer only; no private theme/assets/business code enter package documentation or packed files.
Committed application dependencies remain unchanged. Navigation in these fixtures uses native
disclosure summaries/group headings through the same public category activation contract.

Verified behavior includes prepared wealth/savings/premiums, exact amounts, empty/invalid/known-zero
states, caller order and colors, tiny actions, keyboard and pointer activation, identity-based focus
retention, host detail navigation, complete rendering failure, independent instances, annotation
omission and large-center relocation. Center selection/copy is supported inside the drawable subtree.

At device scale factor 2, a 357×320 CSS canvas produced a 714×640 bitmap. The consumer retained
`rgb(75, 76, 79)` text, Outfit and supplied icons without horizontal page overflow at 320, 390 or
1280 CSS pixels. Host actions opened/focused the requested detail destination and retained totals.

The actual split consumer bundle contains a roughly 664.5 kB unminified polyfill-core chunk, a
4.8 kB loader chunk and separate engine/bridge chunks. The consumer entry is roughly 252.7 kB and
also includes Lit and the public card composition. Native pages requested **zero core chunks**;
three concurrent charts on missing-support paths requested **one shared core chunk**. These are
consumer network observations, rather than an inference from the library's unbundled output.

The sole new runtime dependency is the explicitly selected HTML-in-Canvas polyfill, `^1.0.4`.
It must be a normal dependency so installed consumers work without setup; its lazy module loader
preserves the native-first download behavior. The library retains its existing unbundled ESM format.

## Browser and device evidence

| Browser / device | Rendering path | Result |
| --- | --- | --- |
| Google Chrome 158.0.8127.88, Linux | Native API confirmed before importing chart | 39 chart checks and final installed consumer pass; zero core downloads |
| Playwright Chromium 159.0.8154.6, Linux | Native | Public chart suite and installed consumer pass |
| Playwright Chromium 159.0.8154.6, Linux | Forced polyfill, `--disable-blink-features=CanvasDrawElement` | Supplemental layout, actions, loader, failure and consumer checks pass |
| Actual Firefox 159.0, Playwright build 1572, Linux | Automatically loaded polyfill | 39 chart checks and final installed consumer pass |
| Safari on macOS | Required polyfill path | **Unmet:** no Safari/macOS runtime on this Linux host |
| Safari on physical iPhone | Required polyfill path and touch | **Unmet:** no physical device attached or available |

Desktop WebKit, emulated touch and forced-polyfill Chromium are not substitutes for the two unmet
Safari rows. Hidden output in a required browser would be a failure, not a passing fallback.

Initial runs exposed a full-ring external-label overlap; review fix `42af86d` adds a visible-layout
regression and rejects any label rectangle intersecting the ring. Both rendering paths passed the
affected checks after the fix. A full-suite run also exceeded the data tests' default two-second
Mocha deadline; the suite now allows ten seconds to match its explicit asynchronous render waits.
One earlier polyfill browser-start timeout passed when rerun with a longer startup allowance.

## Source design and reviewed screenshots

Source: [Chart page](https://www.figma.com/design/M7DpagQMAo9pnBjUSTOhpg?node-id=7366-32719),
[wealth](https://www.figma.com/design/M7DpagQMAo9pnBjUSTOhpg?node-id=7680-38103),
[insurance](https://www.figma.com/design/M7DpagQMAo9pnBjUSTOhpg?node-id=6940-33655).
The Chart page screenshot was inspected; design context was inspected for four-slice node
`7951:46941` and dense node `7951:46972`. The source uses a roughly 188px ring, 75% inner-radius
ratio, 16px icons, 14px outer labels, one-pixel leaders and a 22px center amount.

Reviewed installed-consumer captures:

- [320px overflow/usability](./evidence/consumer-320.png)
- [390px composition](./evidence/consumer-390.png)
- [1280px composition](./evidence/consumer-1280.png)

The captures preserve the ring ratio, supplied colors, 16px generic icons, exact formatted center
amounts, external labels when they fit and normal wrapping. They use consistent financial values
rather than the source's inconsistent illustrative angles/amount assignments. They are generic
fixture compositions under the consumer theme, not screenshots of a deployed private application.

**Unresolved source fidelity:** the current fluid renderer grows to a 288px ring, whereas the selected
source examples show roughly 188px. Generic fixture colors/icons and native disclosure destinations
also do not establish a pixel-for-pixel match to private source screens. Visual acceptance is not
claimed; review these differences with the source before closing ticket 08.

Raw observations: [browser and network results](./evidence/browser-results.json),
[rendered contrast measurements](./evidence/contrast.json).

## Measured contrast, separately from functionality and fidelity

Canvas pixel samples were measured in the installed consumer under both OS color preferences.
The explicit light theme remained active: white page, `#4b4c4f` text, supplied `#3488a0`, `#d88b44`
and `#9772b5` fills. Both OS preferences produced the same measurements.

| Rendered comparison | Ratio |
| --- | --- |
| Text `#4b4c4f` against white | 8.59:1 |
| White icon / teal fill | 4.06:1 |
| White icon / orange fill | 2.73:1 |
| White icon / purple fill | 3.90:1 |
| Teal / orange boundary | 1.49:1 |
| Orange / purple boundary | 1.43:1 |
| Purple / teal boundary | 1.04:1 |
| Focused teal `[47,122,144]` / resting teal `[52,136,160]` | 1.20:1 |

The 2.73:1 orange/background comparison, low adjacent-fill contrasts and subtle focus change are
explicit unresolved gaps. Decorative icons have empty alt text, while native slice semantics expose
category/amount/context; semantic correctness does not establish visual contrast compliance.
Brightness affects the focused icon too (sampled `[230,230,230]` instead of white). No contrast
compliance is claimed. The declined outlines, adaptive icon colors, darker focus role and shared
theme changes were not introduced. The earlier source-palette observations remain in the interview;
these measurements describe actual generic rendered pixels, not every possible consumer palette.

## Reproduce

Use Node 24. The existing repository release commands are:

```sh
npm run lint
npm test
npm run types
npm run build
NPM_CONFIG_CACHE=/tmp/npm-cache npm pack --pack-destination /tmp --json
```

Run all chart checks with the public browser seam:

```sh
npx web-test-runner --files 'src/doughnut-chart/*.test-browser.js'
CHART_SUPPORT=polyfill npx web-test-runner --config src/doughnut-chart/loading.test-browser.config.js
CHART_SUPPORT=refused npx web-test-runner --config src/doughnut-chart/loading.test-browser.config.js
CHART_SUPPORT=rejected npx web-test-runner --config src/doughnut-chart/loading.test-browser.config.js
```

The support-fault test is intentionally skipped in the default run and exercised by the three
dedicated configurations. Network rejection/refusal uses browser platform faults, not private
component test hooks. Each scenario must leave no output, layout reservation or stale controls.

The [verification fixtures](./verification/) retain the temporary-consumer setup and browser
scripts, updated to generic categories and self-contained consumer styles. Copy them into
`/tmp/doughnut-consumer`, install the packed candidate with `npm install --ignore-scripts`, and run
the repository's esbuild binary there with `consumer.js --bundle --splitting --format=esm
--outdir=built --metafile=meta.json`. Type-check `consumer.ts` using the repository's tsc binary with
`--noEmit --strict --skipLibCheck --module nodenext --target esnext`.

Serve the existing font locally as `outfit.ttf`; the consumer uses the same Outfit font as the
existing application stylesheet. The isolated Firefox executable lives at
`/tmp/doughnut-browsers/firefox-1572/firefox/firefox`, installed with
`PLAYWRIGHT_BROWSERS_PATH=/tmp/doughnut-browsers npx playwright install firefox`.
The actual Chrome executable was extracted from Google's stable Debian package into
`/tmp/doughnut-chrome/opt/google/chrome/chrome`, without modifying the system installation.
Adjust these recorded workspace paths on another machine.

Run `node server.mjs` from the temporary consumer, then the retained `verify.mjs`, `verify-docs.mjs`
and `contrast.mjs`. The server mounts the built Rocket site at `/docs/`. Checked pages include
`/data/doughnut-chart` and the standalone generic icon and angle-animation demos.

To finish acceptance on macOS and a physical iPhone, install this exact tarball, serve the split
consumer and check a **working** chart with automatic loading, resize/DPR alignment, touch/pointer,
available keyboard controls, accessible amounts/context, host detail navigation and independent
instances. Record browser/device/OS versions, candidate integrity and screenshots. Revisit source
size and measured contrast gaps separately before marking release acceptance complete.
