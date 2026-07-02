/**
 * @typedef {string | number | boolean | Date | {from: Date, to: Date}} f
 * @param {f | Array<f>} value
 * @param {f | Array<f>} search
 * @param {import('./filter.type.js').operator} operator
 * @returns {boolean}
 */
export function compare(value, search, operator) {
  if (Array.isArray(search)) {
    return search.some(bEntry => compare(value, bEntry, operator));
  }
  if (Array.isArray(value)) {
    return value.includes(search);
  }
  if (typeof value === 'string' && typeof search === 'string') {
    if (operator === 'endsWith') {
      return value.endsWith(search);
    }
    if (operator === 'startsWith') {
      return value.startsWith(search);
    }
    if (operator === 'includes') {
      return value.toLowerCase().includes(search.toLowerCase());
    }
    if (operator === 'notIncludes') {
      return !value.toLowerCase().includes(search.toLowerCase());
    }
  }

  if (typeof value === 'number' && typeof search === 'string') {
    if (operator === 'includes') {
      return String(value).includes(search.toLowerCase());
    }
    if (operator === 'notIncludes') {
      return !String(value).includes(search.toLowerCase());
    }
  }

  if (operator.startsWith('between') && value instanceof Date) {
    const { from, to } = /** @type {{from: Date; to: Date}} */ (search);
    if (operator === 'between') {
      return value >= from && value <= to;
    }
    if (operator === 'betweenNoYear') {
      if (from > to) {
        return greaterNoYear(value, from) || lessNoYear(value, to);
      }
      return greaterNoYear(value, from) && lessNoYear(value, to);
    }
  }

  if (value instanceof Date && search instanceof Date) {
    if (operator === 'equal') {
      return value.getTime() === search.getTime();
    }
    if (operator === 'notEqual') {
      return value.getTime() !== search.getTime();
    }
    if (operator === 'greaterEqualNoYear') {
      return greaterNoYear(value, search);
    }
    if (operator === 'lessEqualNoYear') {
      return lessNoYear(value, search);
    }
    if (operator === 'equalNoYear') {
      return value.getMonth() === search.getMonth() && value.getDate() === search.getDate();
    }
    if (operator === 'notEqualNoYear') {
      return value.getMonth() !== search.getMonth() || value.getDate() !== search.getDate();
    }
  }

  if (operator === 'greaterThan') {
    return value > search;
  }
  if (operator === 'greaterThanOrEqual') {
    return value >= search;
  }
  if (operator === 'lessThan') {
    return value < search;
  }
  if (operator === 'lessThanOrEqual') {
    return value <= search;
  }

  if (operator === 'equal') {
    return value === search;
  }
  if (operator === 'notEqual') {
    return value !== search;
  }
  if (operator === 'isEmpty') {
    return !value;
  }
  return false;
}

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
