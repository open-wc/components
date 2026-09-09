import { LocalizeController } from '@awesome.me/webawesome/dist/utilities/localize.js';

import '@open-wc/components/register/en.js';

export class OwcLocalizeController extends LocalizeController {
  /** @type {string | undefined} */
  #termLanguage;

  /**
   * @returns {string}
   */
  lang() {
    if (this.#termLanguage) {
      return this.#termLanguage;
    }

    const candidateElements = [];
    /** @type {HTMLElement | null} */
    let current = this.host;
    const seen = new Set();
    while (current && !seen.has(current)) {
      seen.add(current);
      candidateElements.push(current);
      const rootNode = current.getRootNode();
      if (rootNode instanceof ShadowRoot && rootNode.host) {
        current = /** @type {HTMLElement} */ (rootNode.host);
      } else {
        current = current.parentElement;
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
   * @param {string} key
   * @param {...unknown} args
   * @returns {string}
   */
  term(key, ...args) {
    // @ts-expect-error Owc translation keys extend Web Awesome's closed Translation interface.
    if (!super.exists(key, { lang: this.lang() })) {
      // @ts-expect-error Owc translation keys extend Web Awesome's closed Translation interface.
      if (super.exists(key, { lang: 'en' })) {
        this.#termLanguage = 'en';
        try {
          // @ts-expect-error Owc translation keys extend Web Awesome's closed Translation interface.
          return super.term(key, ...args);
        } finally {
          this.#termLanguage = undefined;
        }
      }
    }

    // @ts-expect-error Owc translation keys extend Web Awesome's closed Translation interface.
    return super.term(key, ...args);
  }
}
