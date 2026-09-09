/**
 * https://jsonforms.io/docs/labels
 * Takes the current state and gives back the label as a string
 * @param {import("../types/renderer.js").State} state
 * @return {string}
 */
export function processLabel(state) {
  const label = state.uiSchema.label;
  if (typeof label === 'string') {
    return label;
  }
  if (typeof label === 'boolean') {
    return label ? noLabelField(state) : '';
  }
  if (label?.show === false) {
    return '';
  }
  if (label?.show && label.text) {
    return label.text;
  }
  return noLabelField(state);
}

/**
 * Finds the label if the uiSchema doesn't have a label field
 * @param {import("../types/renderer.js").State} state
 * @returns {string}
 */
function noLabelField(state) {
  if (state.schema.title) {
    return `${state.schema.title}${state.schema?.type !== 'boolean' ? ':' : ''}`;
  }
  return labelFromPropertyName(
    state.uiSchema.scope.slice(state.uiSchema.scope.lastIndexOf('/') + 1),
  );
}

/**
 * Generates the label from the property name
 * @param {string} property
 * @returns {string}
 */
function labelFromPropertyName(property) {
  let labelName = '';
  for (const char of property) {
    if (char === char.toUpperCase()) {
      labelName += ' ';
    }
    labelName += char;
  }
  return labelName.slice(0, 1).toUpperCase() + labelName.slice(1);
}
