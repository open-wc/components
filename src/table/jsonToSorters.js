import { resolveFieldPath } from './resolveFieldPath.js';

/**
 * @param {import('./OwcTable.types.js').JsonSorter} jsonSorter
 * @returns {import('./OwcTable.types.js').Sorter}
 */
export function jsonToSorters(jsonSorter) {
  /** @type {import('./OwcTable.types.js').Sorter} */
  function sorter(a, b) {
    if (jsonSorter.order === undefined) {
      return 0;
    }

    let aValue = resolveFieldPath(a, jsonSorter.field);
    let bValue = resolveFieldPath(b, jsonSorter.field);

    if (jsonSorter.order === 'desc') {
      [aValue, bValue] = [bValue, aValue];
    }

    if (jsonSorter.sortType === 'dateNoYear') {
      let aParse = parseDate(aValue);
      let bParse = parseDate(bValue);

      if (aParse !== undefined && bParse !== undefined) {
        aValue = aParse;
        bValue = bParse;
        aValue = structuredClone(aValue);
        aValue.setFullYear(0);
        bValue = structuredClone(bValue);
        bValue.setFullYear(0);
        aValue = aValue.getTime();
        bValue = bValue.getTime();
      }
    }
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
      return aValue.localeCompare(bValue);
    }
    // @ts-expect-error
    return aValue - bValue;
  }

  /** @type {import('./OwcTable.types.js').Sorter} */
  function arraySorter(a, b) {
    const [before, after] = jsonSorter.field.split('[].');

    const subSorter = jsonToSorters({
      field: after,
      order: jsonSorter.order,
      sortType: jsonSorter.sortType,
    });

    // copy before sorting so the rows' own arrays stay untouched
    let aArray = [.../** @type {any[]} */ (resolveFieldPath(a, before))]
      .sort(subSorter)
      .map(v => resolveFieldPath(v, after))
      .filter(Boolean);

    let aValue = aArray.at(0);

    let bArray = [.../** @type {any[]} */ (resolveFieldPath(b, before))]
      .sort(subSorter)
      .map(v => resolveFieldPath(v, after))
      .filter(Boolean);

    let bValue = bArray.at(0);

    if (aValue === undefined || bValue === undefined) {
      return (aValue === undefined ? 1 : 0) + (bValue === undefined ? -1 : 0);
    }
    if (jsonSorter.order === 'desc') {
      [aValue, bValue] = [bValue, aValue];
    }
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
      return aValue.localeCompare(bValue);
    }

    // @ts-ignore
    return aValue - bValue;
  }

  if (jsonSorter.field.includes('[].')) {
    return arraySorter;
  }
  return sorter;
}

/**
 *
 * @param {string | number | boolean | Date | undefined | import('lit').TemplateResult | unknown[]} param
 * @returns {Date | undefined}
 */
function parseDate(param) {
  switch (typeof param) {
    case 'boolean':
    case 'undefined':
    case 'function':
    case 'symbol':
      return undefined;
    case 'string':
      param = Date.parse(param);
    // eslint-disable-next-line no-fallthrough
    case 'bigint':
    case 'number':
      if (isNaN(param)) {
        return undefined;
      }
      return new Date(param);
    case 'object':
      return param instanceof Date ? param : undefined;
  }
}
