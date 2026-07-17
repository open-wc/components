import {
  LocalizeController,
  registerTranslation,
} from '@awesome.me/webawesome/dist/utilities/localize.js';

// Register the table's English terms with the same localization registry that
// Web Awesome uses. This makes English the fallback for table-specific terms.
import '../translations/en.js';
import '../translations/de.js';

class TableLocalizeController extends LocalizeController {
  /**
   * @returns {string}
   */
  lang() {
    // @ts-ignore
    const host = /** @type {HTMLElement & { lang?: string; getRootNode?: () => ShadowRoot | Document }} */ (
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
}

/**
 * @param {import('lit').ReactiveControllerHost & HTMLElement} host
 */
export function createTableLocalizer(host) {
  return new TableLocalizeController(host);
}

/**
 * @param {ReturnType<typeof createTableLocalizer>} localize
 * @param {string} key
 * @param {...unknown} args
 */
export function tableTerm(localize, key, ...args) {
  return /** @type {any} */ (localize).term(key, ...args);
}
