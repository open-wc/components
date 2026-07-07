/**
 * Filters options by a case-insensitive substring match on the option label.
 *
 * An empty query returns the data unchanged. Options without a string label
 * are matched against their stringified label.
 *
 * @template {Record<string, unknown>} T
 * @param {Array<T>} data
 * @param {string} query
 * @returns {Array<T>}
 */
export function filterOptionsByLabel(data, query) {
  if (!query) {
    return data;
  }
  const needle = query.toLocaleLowerCase();
  return data.filter(row => {
    if (!row) {
      return false;
    }
    const label = typeof row.label === 'string' ? row.label : String(row.label ?? '');
    return label.toLocaleLowerCase().includes(needle);
  });
}
