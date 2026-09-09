/** @typedef {{ label?: unknown, value?: unknown }} DataOption */

/**
 * The label of the option matching the value. Matching is loose on purpose
 * so '100' finds an option with the numeric value 100 and vice versa.
 *
 * @param {readonly DataOption[]} data
 * @param {unknown} value
 * @returns {string | undefined}
 */
export function labelForValue(data, value) {
  const option = data.find(elm => elm.value == value);
  return option ? String(option.label) : undefined;
}

/**
 * Joined labels for a list of values. Values without a matching option are
 * skipped so they leave no stray separators; no match at all returns ''.
 *
 * @param {readonly DataOption[]} data
 * @param {readonly unknown[]} values
 * @returns {string}
 */
export function labelsForValues(data, values) {
  return values
    .map(value => labelForValue(data, value))
    .filter(label => label !== undefined)
    .join(', ');
}
