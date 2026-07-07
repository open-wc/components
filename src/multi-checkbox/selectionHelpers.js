/** @typedef {import('./OwcMultiCheckbox.types.js').Checkbox} Checkbox */

/**
 * The state of a group checkbox: checked when every group member is selected,
 * indeterminate when only some are.
 *
 * @param {Checkbox[]} group
 * @param {Array<string | number | boolean>} selected
 * @returns {{ checked: boolean, indeterminate: boolean }}
 */
export function getGroupState(group, selected) {
  const checked = group.length > 0 && group.every(checkbox => selected.includes(checkbox.value));
  const indeterminate = !checked && group.some(checkbox => selected.includes(checkbox.value));
  return { checked, indeterminate };
}

/**
 * Toggles a whole group in a selection: deselects all group members when all
 * are selected, otherwise selects the missing ones. Returns a new array - the
 * input is not mutated.
 *
 * @param {Checkbox[]} group
 * @param {Array<string | number | boolean>} selected
 * @returns {Array<string | number | boolean>}
 */
export function toggleGroupSelection(group, selected) {
  const { checked } = getGroupState(group, selected);
  if (checked) {
    return selected.filter(itemValue => !group.some(checkbox => checkbox.value === itemValue));
  }
  const missing = group.map(checkbox => checkbox.value).filter(value => !selected.includes(value));
  return [...selected, ...missing];
}
