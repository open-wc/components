import { LocalizeController } from '@awesome.me/webawesome/dist/utilities/localize.js';

import '@open-wc/components/register/en.js';

export class OwcLocalizeController extends LocalizeController {
  /**
   * @returns {string}
   */
  lang() {
    // @ts-ignore
    const host =
      /** @type {HTMLElement & { lang?: string; getRootNode?: () => ShadowRoot | Document }} */ (
        this.host
      );

    const candidateElements = [];
    let current = host;
    const seen = new Set();
    while (current && !seen.has(current)) {
      seen.add(current);
      candidateElements.push(current);
      const rootNode = current.getRootNode?.();
      if (rootNode instanceof ShadowRoot && rootNode.host) {
        // @ts-ignore
        current = /** @type {HTMLElement} */ (rootNode.host);
      } else {
        // @ts-ignore
        current = /** @type {HTMLElement | null} */ (current.parentElement);
      }
    }

    for (const candidate of candidateElements) {
      const explicitLang = candidate.getAttribute?.('lang') || candidate.lang;
      if (typeof explicitLang === 'string' && explicitLang.trim()) {
        return explicitLang.toLowerCase();
      }
    }

    return super.lang();
  }
  /**
   * @param {String} key
   * @param {...unknown} args
   */
  term(key, ...args) {
    // @ts-ignore
    return super.term(key, ...args);
  }
}
