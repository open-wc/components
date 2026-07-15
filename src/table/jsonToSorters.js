import { resolveFieldPath } from './resolveFieldPath.js';

/**
 * @param {import('./OwcTable.types.js').JsonSorter} jsonSorter
 * @returns {import('./OwcTable.types.js').Sorter}
 */
export function jsonToSorters(jsonSorter) {
  /** @type {import('./OwcTable.types.js').Sorter} */
  function sorter(a, b) {
    if (jsonSorter.order === undefined) return 0;

    let aValue = resolveFieldPath(a, jsonSorter.field);
    let bValue = resolveFieldPath(b, jsonSorter.field);

    if (jsonSorter.order === 'desc') {
      [aValue, bValue] = [bValue, aValue];
    }

    if (jsonSorter.sortType === 'dateNoYear') {
      if (aValue instanceof Date && bValue instanceof Date) {
        aValue = structuredClone(aValue);
        aValue.setFullYear(2000);
        bValue = structuredClone(bValue);
        bValue.setFullYear(2000);
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
