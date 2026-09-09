/**
 * Shared JSON Filter operator semantics.
 *
 * This module is the single owner of operator behavior for the filter domain:
 * - `evaluate` decides whether a row value matches a search value in memory.
 *   The Filter Function adapter (`jsonToFilter.js`) delegates here.
 * - `toSql` converts an operator into a SQL clause fragment and parameters.
 *   The SQL Filter adapter (`jsonToSqlFilter.js`) delegates here.
 *
 * SQL support is an explicit per-operator capability: operators that cannot be
 * translated to SQL carry `toSql: null` on purpose, so an unsupported operator
 * is a deliberate decision rather than an omission hidden in an adapter.
 *
 * The `some` and `every` operators take nested JSON Filters as their value.
 * In memory they are resolved by the Filter Function adapter (which recurses
 * into the nested filters), so they have no leaf `evaluate` here.
 */

/**
 * @typedef {string | number | boolean | Date | {from: Date, to: Date}} FilterValue
 * @typedef {(value: FilterValue, search: FilterValue) => boolean} EvaluateFn
 * @typedef {(field: string, value: import('./filter.type.js').SqlPrimitive, params: import('./filter.type.js').SqlPrimitive[]) => string} ToSqlFn
 */

/**
 * @param {Date} a
 * @param {Date} b
 * @returns {boolean}
 */
function greaterNoYear(a, b) {
  return (
    a.getMonth() > b.getMonth() || (a.getMonth() === b.getMonth() && a.getDate() > b.getDate())
  );
}

/**
 * @param {Date} a
 * @param {Date} b
 * @returns {boolean}
 */
function lessNoYear(a, b) {
  return (
    a.getMonth() < b.getMonth() || (a.getMonth() === b.getMonth() && a.getDate() < b.getDate())
  );
}

/** @type {Record<import('./filter.type.js').operator, { evaluate: EvaluateFn | null, toSql: ToSqlFn | null }>} */
const OPERATOR_SEMANTICS = {
  equal: {
    evaluate: (value, search) => {
      if (value instanceof Date && search instanceof Date) {
        return value.getTime() === search.getTime();
      }
      return value === search;
    },
    toSql: (field, value, params) => {
      params.push(value);
      return `"${field}" = ?`;
    },
  },

  notEqual: {
    evaluate: (value, search) => {
      if (value instanceof Date && search instanceof Date) {
        return value.getTime() !== search.getTime();
      }
      return value !== search;
    },
    toSql: (field, value, params) => {
      params.push(value);
      return `"${field}" <> ?`;
    },
  },

  greaterThan: {
    evaluate: (value, search) => value > search,
    toSql: (field, value, params) => {
      params.push(value);
      return `"${field}" > ?`;
    },
  },

  greaterThanOrEqual: {
    evaluate: (value, search) => value >= search,
    toSql: (field, value, params) => {
      params.push(value);
      return `"${field}" >= ?`;
    },
  },

  lessThan: {
    evaluate: (value, search) => value < search,
    toSql: (field, value, params) => {
      params.push(value);
      return `"${field}" < ?`;
    },
  },

  lessThanOrEqual: {
    evaluate: (value, search) => value <= search,
    toSql: (field, value, params) => {
      params.push(value);
      return `"${field}" <= ?`;
    },
  },

  includes: {
    evaluate: (value, search) => {
      if (typeof value === 'string' && typeof search === 'string') {
        return value.toLowerCase().includes(search.toLowerCase());
      }
      if (typeof value === 'number' && typeof search === 'string') {
        return String(value).includes(search.toLowerCase());
      }
      return false;
    },
    toSql: (field, value, params) => {
      params.push(`%${value}%`);
      return `"${field}" LIKE ?`;
    },
  },

  notIncludes: {
    evaluate: (value, search) => {
      if (typeof value === 'string' && typeof search === 'string') {
        return !value.toLowerCase().includes(search.toLowerCase());
      }
      if (typeof value === 'number' && typeof search === 'string') {
        return !String(value).includes(search.toLowerCase());
      }
      return false;
    },
    toSql: null,
  },

  startsWith: {
    evaluate: (value, search) =>
      typeof value === 'string' && typeof search === 'string' ? value.startsWith(search) : false,
    toSql: (field, value, params) => {
      params.push(`${value}%`);
      return `"${field}" LIKE ?`;
    },
  },

  endsWith: {
    evaluate: (value, search) =>
      typeof value === 'string' && typeof search === 'string' ? value.endsWith(search) : false,
    toSql: (field, value, params) => {
      params.push(`%${value}`);
      return `"${field}" LIKE ?`;
    },
  },

  isEmpty: {
    evaluate: value => !value,
    toSql: field => {
      return `("${field}" IS NULL)`;
    },
  },

  between: {
    evaluate: (value, search) => {
      if (!(value instanceof Date)) {
        return false;
      }
      const { from, to } = /** @type {{from: Date; to: Date}} */ (search);
      return value >= from && value <= to;
    },
    toSql: (field, value, params) => {
      if (!(typeof value === 'object' && 'from' in value && 'to' in value)) {
        throw new Error(`Invalid between filter on field "${field}" with value ${value}`);
      }
      params.push(value.from, value.to);
      return `"${field}" BETWEEN ? AND ?`;
    },
  },

  betweenNoYear: {
    evaluate: (value, search) => {
      if (!(value instanceof Date)) {
        return false;
      }
      const { from, to } = /** @type {{from: Date; to: Date}} */ (search);
      if (from > to) {
        return greaterNoYear(value, from) || lessNoYear(value, to);
      }
      return greaterNoYear(value, from) && lessNoYear(value, to);
    },
    toSql: null,
  },

  equalNoYear: {
    evaluate: (value, search) =>
      value instanceof Date && search instanceof Date
        ? value.getMonth() === search.getMonth() && value.getDate() === search.getDate()
        : false,
    toSql: null,
  },

  notEqualNoYear: {
    evaluate: (value, search) =>
      value instanceof Date && search instanceof Date
        ? value.getMonth() !== search.getMonth() || value.getDate() !== search.getDate()
        : false,
    toSql: null,
  },

  greaterEqualNoYear: {
    evaluate: (value, search) =>
      value instanceof Date && search instanceof Date ? greaterNoYear(value, search) : false,
    toSql: null,
  },

  lessEqualNoYear: {
    evaluate: (value, search) =>
      value instanceof Date && search instanceof Date ? lessNoYear(value, search) : false,
    toSql: null,
  },

  some: {
    evaluate: null,
    toSql: (field, value, params) => {
      params.push(value);
      return `"${field}" && ?`; // PostgreSQL array overlap
    },
  },

  every: {
    evaluate: null,
    toSql: (field, value, params) => {
      params.push(value);
      return `"${field}" @> ?`; // PostgreSQL contains
    },
  },
};

/**
 * Evaluates a single operator against a row value in memory.
 *
 * Array handling is shared across operators: an array search matches when any
 * entry matches, and an array row value matches when it contains the search.
 *
 * @param {FilterValue | Array<FilterValue>} value
 * @param {FilterValue | Array<FilterValue>} search
 * @param {import('./filter.type.js').operator} operator
 * @returns {boolean}
 */
export function evaluateOperator(value, search, operator) {
  if (Array.isArray(search)) {
    return search.some(searchEntry => evaluateOperator(value, searchEntry, operator));
  }
  if (Array.isArray(value)) {
    return value.includes(search);
  }
  const evaluate = OPERATOR_SEMANTICS[operator]?.evaluate;
  return evaluate ? evaluate(value, search) : false;
}

/**
 * Returns the SQL conversion for an operator, or `undefined` when the operator
 * intentionally has no SQL Filter support.
 *
 * @param {import('./filter.type.js').operator} operator
 * @returns {ToSqlFn | undefined}
 */
export function getSqlOperator(operator) {
  return OPERATOR_SEMANTICS[operator]?.toSql ?? undefined;
}
