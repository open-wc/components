import { evaluateOperator } from './operatorSemantics.js';

/**
 * Compatibility adapter: operator evaluation lives in `operatorSemantics.js`,
 * which owns the shared JSON Filter semantics for all adapters.
 *
 * @typedef {string | number | boolean | Date | {from: Date, to: Date}} f
 * @param {f | Array<f>} value
 * @param {f | Array<f>} search
 * @param {import('./filter.type.js').operator} operator
 * @returns {boolean}
 */
export function compare(value, search, operator) {
  return evaluateOperator(value, search, operator);
}
