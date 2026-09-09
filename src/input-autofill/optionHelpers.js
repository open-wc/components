/** @typedef {import('./OwcInputAutofill.types.js').OwcInputAutofillOption} Option */

/**
 * The option whose value matches the given input value exactly, if any.
 * Free text that does not correspond to an option returns undefined.
 *
 * @param {Option[] | undefined | null} data
 * @param {string} value
 * @returns {Option | undefined}
 */
export function findOptionByValue(data, value) {
  if (!Array.isArray(data)) {
    return undefined;
  }
  return data.find(option => option && option.value === value);
}

/**
 * An option can be applied to the input when it carries a string value.
 * The label is only for display, so an empty label stays selectable.
 *
 * @param {unknown} option
 * @returns {option is Option}
 */
export function isSelectableOption(option) {
  return Boolean(option) && typeof (/** @type {Option} */ (option).value) === 'string';
}
