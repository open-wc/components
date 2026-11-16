/**
 * axe for the browser tests of components that render Web Awesome elements.
 * The name keeps the module out of the package and out of the test runs, see
 * `virtualList.test-browser.helpers.js`.
 */
import { expect } from '@open-wc/testing';

/**
 * What axe says about one element: the element, and the checks that failed
 * with the elements each of them points at.
 *
 * @typedef {object} Finding
 * @property {Element} element
 * @property {{ data?: { messageKey?: string }, relatedNodes: { element: Element }[] }[]} any
 */

/**
 * The findings the tests accept: Web Awesome's own markup, which the
 * components can't change, and one decision about our own (the controls of a
 * table's annotation). Each rule is ignored only for the findings its check
 * accepts; anything else it reports still fails the test.
 *
 * @type {Record<string, { reason: string, accepts: (element: Element, finding: Finding) => boolean }>}
 */
const ACCEPTED_FINDINGS = {
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
  'aria-required-children': {
    reason:
      'The controls in an annotation of an `owc-table` (`renderAnnotation`). An annotation is ' +
      'no row of the grid (K9 of the keyboard accessibility spec), so its controls are in the ' +
      'grid, but in no row, which this rule reports as children that are not allowed. Making ' +
      'it pass means rendering annotations outside the grid, over space reserved in it. That ' +
      'was decided against on 2026-11-16: what counts is that the keyboard and a screen reader ' +
      'work with the annotation where it is, which the keyboard tests and the manual check ' +
      'cover. Accepted only when every reported child is in an annotation.',
    accepts: (element, finding) =>
      finding.any.every(
        check =>
          check.data?.messageKey === 'unallowed' &&
          check.relatedNodes.every(
            ({ element: child }) =>
              child.closest('.row-container > .row-annotation') &&
              /** @type {ShadowRoot} */ (child.getRootNode()).host?.localName === 'owc-table',
          ),
      ),
  },
};

/**
 * Runs axe over an element and fails on every violation, except those of
 * `ACCEPTED_FINDINGS` that their checks accept.
 *
 * @param {Element} element
 */
export async function expectAccessible(element) {
  const rules = Object.keys(ACCEPTED_FINDINGS);
  await expect(element).to.be.accessible({ ignoredRules: rules });
  // `accessible()` has loaded axe onto the window
  const { axe } = /** @type {any} */ (window);
  const { violations } = await axe.run(element, { runOnly: rules, elementRef: true });
  for (const violation of /** @type {{ id: string, nodes: Finding[] }[]} */ (violations)) {
    const { accepts } = ACCEPTED_FINDINGS[violation.id];
    for (const finding of violation.nodes) {
      const { element: reported } = finding;
      expect(
        Boolean(accepts(reported, finding)),
        `${violation.id} on ${reported.outerHTML.slice(0, 200)}`,
      ).to.be.true;
    }
  }
}
