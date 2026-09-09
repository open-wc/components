/**
 * Splits pasted text into the most plausible list of tokens.
 *
 * A JSON array (e.g. `["100", "104"]`) is used as-is (keeping the element
 * types, so `[100, 104]` yields numbers). Otherwise the text is split by
 * comma, semicolon, tab, newline and space — whichever separator produces
 * the most tokens wins, which matches what copying from Excel or CSV
 * sources produces.
 *
 * @param {string} text
 * @returns {unknown[]}
 */
export function parseFillInput(text) {
  const trimmed = text.trim();
  if (trimmed === '') {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // not JSON - fall through to separator based splitting
  }

  const candidates = [',', ';', '\t', '\n', ' '].map(separator => trimmed.split(separator));
  const best = candidates.reduce((longest, current) =>
    current.length > longest.length ? current : longest,
  );
  return best.map(token => token.trim()).filter(token => token !== '');
}

/**
 * Matches pasted text against a list of options and returns the values of
 * all matched options.
 *
 * A token matches an option when it equals the option label, the option
 * value, or the stringified option value (so the pasted text "100" selects
 * an option with the numeric value 100).
 *
 * @template {Record<string, unknown>} T
 * @param {string} text
 * @param {Array<T>} data
 * @param {(row: T) => unknown} [getOptionValue]
 * @returns {unknown[]}
 */
export function matchFillInput(text, data, getOptionValue = row => row.value) {
  const tokens = parseFillInput(text);
  const matched = new Set();
  for (const token of tokens) {
    for (const entry of data) {
      if (!entry) {
        continue;
      }
      const value = getOptionValue(entry);
      if (token === entry.label || token === value || String(token) === String(value)) {
        matched.add(value);
      }
    }
  }
  return [...matched];
}
