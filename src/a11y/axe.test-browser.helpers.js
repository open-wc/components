/**
 * axe for the browser tests of components that render Web Awesome elements.
 * The name keeps the module out of the package and out of the test runs, see
 * `virtualList.test-browser.helpers.js`.
 */
import { expect } from '@open-wc/testing';

/**
 * The rules that report Web Awesome's own markup, which the components can't
 * change. Each is ignored only for the elements its check accepts; anything
 * else it reports still fails the test.
 *
 * @type {Record<string, { reason: string, accepts: (element: Element) => boolean }>}
 */
const WEB_AWESOME_FINDINGS = {
  'landmark-unique': {
    reason:
      'An open `wa-details` renders `role="region"` with `aria-labelledby="header"`, but no ' +
      'element in its shadow tree has that id. So every open `wa-details` is a region without ' +
      'a name, which axe reports as duplicates once there are two. Chromium exposes no region ' +
      'for them (a region needs a name), only the `<details>` group.',
    accepts: element =>
      element.matches('[role="region"][aria-labelledby="header"]') &&
      /** @type {ShadowRoot} */ (element.getRootNode()).host?.localName === 'wa-details',
  },
  'label-title-only': {
    reason:
      'A `wa-select` with a `label` that is hidden visually, like the operator of a filter. ' +
      '`wa-select` names its combobox through `aria-labelledby` to its `<label>`, and always ' +
      'adds `aria-describedby` for its hint. This rule only counts `aria-labelledby` text that ' +
      'is visible on screen, so it reports the combobox as described but not labelled. Chromium ' +
      'names it by the label. (A `wa-input` with the same hidden label passes: it uses `<label for>`.)',
    accepts: element => {
      const host = /** @type {ShadowRoot} */ (element.getRootNode()).host;
      return (
        element.matches('input[part~="display-input"]') &&
        host?.localName === 'wa-select' &&
        Boolean(/** @type {any} */ (host).label)
      );
    },
  },
};

/**
 * Runs axe over an element and fails on every violation, except those of
 * `WEB_AWESOME_FINDINGS` on the elements they accept.
 *
 * @param {Element} element
 */
export async function expectAccessible(element) {
  const rules = Object.keys(WEB_AWESOME_FINDINGS);
  await expect(element).to.be.accessible({ ignoredRules: rules });
  // `accessible()` has loaded axe onto the window
  const { axe } = /** @type {any} */ (window);
  const { violations } = await axe.run(element, { runOnly: rules, elementRef: true });
  for (const violation of /** @type {{ id: string, nodes: { element: Element }[] }[]} */ (
    violations
  )) {
    const { accepts } = WEB_AWESOME_FINDINGS[violation.id];
    for (const { element: reported } of violation.nodes) {
      expect(accepts(reported), `${violation.id} on ${reported.outerHTML.slice(0, 200)}`).to.be
        .true;
    }
  }
}
