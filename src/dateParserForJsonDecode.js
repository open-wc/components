// Matches strings like "2024-01-20T20:41:42.098Z"
const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

/**
 * @param {string} key
 * @param {unknown} value
 * @returns {Date | unknown}
 */
export function dateParserForJsonDecode(key, value) {
  return typeof value === 'string' && isoDateRegex.test(value) ? new Date(value) : value;
}
