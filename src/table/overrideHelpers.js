/** @typedef {import('./OwcTable.types.js').Visibility} Visibility */

/**
 * The next state in the column-visibility cycle:
 * always → ifFiltered → never → always.
 *
 * @param {Visibility} visibility
 * @returns {Visibility}
 */
export function nextVisibility(visibility) {
  return visibility === 'always' ? 'ifFiltered' : visibility === 'ifFiltered' ? 'never' : 'always';
}

/**
 * Merges URL and localStorage visibility overrides into one map.
 * Local entries win over URL entries for the same column.
 *
 * @param {{ [column: string]: Visibility }} local
 * @param {{ [column: string]: Visibility }} url
 * @returns {{ [column: string]: Visibility }}
 */
export function mergeVisibility(local, url) {
  return { ...url, ...local };
}
