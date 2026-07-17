import { LocalizeController } from '@awesome.me/webawesome/dist/utilities/localize.js';

// Register the table's English terms with the same localization registry that
// Web Awesome uses. This makes English the fallback for table-specific terms.
import '../translations/en.js';
import '../translations/de.js';

/**
 * @param {import('lit').ReactiveControllerHost & HTMLElement} host
 */
export function createTableLocalizer(host) {
  return new LocalizeController(host);
}

/**
 * @param {ReturnType<typeof createTableLocalizer>} localize
 * @param {string} key
 * @param {...unknown} args
 */
export function tableTerm(localize, key, ...args) {
  return /** @type {any} */ (localize).term(key, ...args);
}
