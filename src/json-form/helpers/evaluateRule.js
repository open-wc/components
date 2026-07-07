import { Validator } from '@cfworker/json-schema';
import { resolveDataSchema } from '../resolve.js';
import { removeFalseIshAndEmptyProperties } from './validateSchema.js';

/**
 * Evaluates a uiSchema rule (https://jsonforms.io/docs/uischema/rules) against
 * the current form value and returns the resulting render options.
 * @param {{effect: string; condition: {scope: string; schema: object}} | undefined} rule
 * @param {object} value the full form value
 * @returns {{disabled: boolean; hidden: boolean}}
 */
export function evaluateRule(rule, value) {
  const ruleOptions = { disabled: false, hidden: false };
  if (!rule) {
    return ruleOptions;
  }
  const scopedValue = resolveDataSchema(value, rule.condition.scope);
  // @ts-ignore
  const ruleMatches = new Validator(rule.condition.schema, '7', false).validate(
    removeFalseIshAndEmptyProperties(scopedValue),
  ).valid;
  switch (rule.effect) {
    case 'SHOW':
      ruleOptions.hidden = !ruleMatches;
      break;
    case 'HIDE':
      ruleOptions.hidden = ruleMatches;
      break;
    case 'ENABLE':
      ruleOptions.disabled = !ruleMatches;
      break;
    case 'DISABLE':
      ruleOptions.disabled = ruleMatches;
  }
  return ruleOptions;
}
