import { Validator } from '@cfworker/json-schema';

/**
 *
 * @param {import("../types/schema.js").JsonSchema7} schema
 * @param {any} data
 */
export function validateSchemaSystem(schema, data) {
  // @ts-ignore
  const validator = new Validator(schema, '7', false);
  return validator.validate(removeFalseIshAndEmptyProperties(data));
}

/**
 *
 * @param {Object | null} value
 */
export function removeFalseIshAndEmptyProperties(value) {
  if (!value) {
    return null;
  }
  if (typeof value !== 'object') {
    return value;
  }
  /**@type {any} */
  const returnValue = Array.isArray(value) ? [] : {};
  for (const [key, val] of Object.entries(value)) {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      if (Object.keys(val).length !== 0) {
        // If Object is not empty => go recursive
        returnValue[key] = removeFalseIshAndEmptyProperties(val);
      }
    } else if (val && typeof val === 'object' && Array.isArray(val)) {
      const returnArr = [];
      for (const item of val) {
        if (typeof item === 'object') {
          returnArr.push(removeFalseIshAndEmptyProperties(item));
        } else {
          returnArr.push(item);
        }
      }
      returnValue[key] = returnArr;
    } else if ((val || val === false || val === 0) && (typeof val !== 'number' || !isNaN(val))) {
      returnValue[key] = val;
    }
  }
  return returnValue;
}
