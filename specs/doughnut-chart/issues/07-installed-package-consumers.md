# 07: Verify the installed package in real consumers

Follow-up on 26 November 2026: the package no longer exports financial example factories.
The retained verification fixture now supplies generic categories and consumer-owned styles
directly through the public chart API. The candidate and results below describe the original
delivery; the removed examples are not part of the current public contract.

**What to build:** A temporary packed package works through its documented public imports in real
consumers, with complete examples, generated types and evidence that native browsers avoid the
polyfill core download.

**Blocked by:** 02 — Handle data states and geometric edge cases; 03 — Complete highlighting and focus
behavior; 04 — Fit chart annotations to the available space; 05 — Keep loading, failures and multiple
instances independent; 06 — Demonstrate prepared datasets and detail navigation.

**Status:** resolved

Source: [Doughnut chart spec](../spec.md), especially Package delivery and the primary-seam, loader,
build, dependency and evidence testing decisions.

- [x] Pack and install a temporary package into a real consumer, verifying public class/define
      imports, documented types and required runtime dependencies without private source imports or
      manual polyfill setup. Preserve the existing unbundled ESM Package Format.
- [x] Verify inline and standalone Rocket examples and an ordinary Lit consumer beneath an external
      theme ancestor. Exercise shadow-root styling, fonts and icons through the real rendering path.
- [x] Verify FiNUM-specific theme, card composition and host navigation through the same public
      contract using the temporary packed package in consumer-owned verification. Keep private theme,
      assets and business code outside public package docs and contents, and leave committed FiNUM
      dependencies on normally published versions.
- [x] Inspect actual consumer bundle/network behavior: native HTML-in-Canvas loads no polyfill core,
      missing support loads it automatically and concurrent charts share initialization. Do not infer
      consumer chunking from the library's unbundled ESM output alone.
- [x] Complete component documentation with public imports, supported states, prepared-data contract,
      keyboard behavior, loading/failure policy and reproducible verification commands. Reconcile the
      feature's Changeset with the final Consumer-Visible Change and justify the dependency footprint.
- [x] Review packed contents and perform Release Hygiene checks for private references, assets,
      services, accidental agent/scratch material and unintended dependencies. Run package dry-run
      checks and the Release Gate: lint, tests, generated types and build.
- [x] Record commands, results and the packed candidate identity for the browser acceptance in ticket
      08. Package verification does not establish the required browser/device evidence and does not
      authorize package publication or production rollout.

## Answer

The [evidence catalog](../acceptance.md) records the exact packed candidate, commands, results,
consumer network observations and release hygiene. The isolated installed consumer verifies public
class/define/type/example imports, generated declarations, external consumer-owned theme, local
Outfit font, supplied icons, public DetailCard composition and host navigation. Committed private
application dependencies were not changed. Inline and standalone Rocket examples render without
page errors.

Final candidate SHA-1: `42c0dcc6ac9e891c958ddaeadeeb6e09b20ea2ea`. Its installed integrity matches
the tarball and package dry-run. The 726 packed files contain no specs, tests, agent files or private
chart references/assets. `npm run lint`, `npm test`, `npm run types` and `npm run build` pass.
Actual Chrome 158 and Firefox 159 each pass 39 chart checks; dedicated loader fault scenarios and
installed native/polyfilled consumer checks also pass. Native consumers download zero polyfill cores;
three concurrent polyfilled charts share one core download. Publication and ticket 08's required
Safari/iPhone/visual acceptance remain separate and are not claimed.
