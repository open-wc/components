/**
 * @param {import('@jsonforms/core').ControlElement} uiSchema
 * @returns {Array<{label: string, value: string, fill: Record<string, unknown>}>}
 */
export function normalizeAutofillOptions(uiSchema) {
  const autofill = uiSchema.options?.autofill;
  if (!Array.isArray(autofill)) {
    throw new Error(`The autofill option for ${uiSchema.scope} must be an array.`);
  }

  return autofill.map((option, index) => {
    if (!option || typeof option.label !== 'string') {
      throw new Error(`Autofill option ${index} for ${uiSchema.scope} requires a string label.`);
    }
    const hasValue = Object.hasOwn(option, 'value');
    const hasFill = Object.hasOwn(option, 'fill');
    if (hasValue === hasFill) {
      throw new Error(
        `Autofill option ${index} for ${uiSchema.scope} requires exactly one of value or fill.`,
      );
    }
    const fill = hasValue ? { [uiSchema.scope]: option.value } : option.fill;
    if (!fill || typeof fill !== 'object' || Array.isArray(fill)) {
      throw new Error(`Autofill option ${index} for ${uiSchema.scope} requires a fill object.`);
    }
    if (!Object.hasOwn(fill, uiSchema.scope)) {
      throw new Error(
        `The fill of autofill option ${index} must include the control scope ${uiSchema.scope}.`,
      );
    }
    const inputValue = fill[uiSchema.scope];
    if (typeof inputValue !== 'string') {
      throw new Error(
        `The value for ${uiSchema.scope} in autofill option ${index} must be a string.`,
      );
    }
    return { label: option.label, value: inputValue, fill };
  });
}
