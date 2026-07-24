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
  const groupValues = group.map(x => x.value);
  const outsideGroup = selected.filter(v => !groupValues.includes(v));

  if (checked) {
    return outsideGroup;
  }
  return [...outsideGroup, ...groupValues];
}
