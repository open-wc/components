import { compare } from './compare.js';

export const globalSearchField = '::globalField::';

/**
 * @template T
 * @param {T} row
 * @param {string} field
 */
function getValue(row, field) {
  const fieldParts = field.split('.');
  let value = row;
  for (const fieldPart of fieldParts) {
    // If fieldPart is '', row is not an object but a value.
    // This is the case for string[] types for example
    if (fieldPart !== '') {
      // @ts-ignore
      value = value ? value[fieldPart] : undefined;
    }
  }
  return value;
}

/**
 * @template T
 * @param {T} row
 * @param {import('./filter.type.js').JsonFilter} filterObj
 * @returns {boolean}
 */
function singleFilter(row, filterObj) {
  // Handle array subfilters
  if (filterObj.operator === 'every') {
    const list = getValue(row, filterObj.field);
    // @ts-ignore
    const result = list.every(elm => nestedFilter(elm, filterObj.value));
    return !filterObj.negated ? result : !result;
  }
  if (filterObj.operator === 'some') {
    const list = getValue(row, filterObj.field);
    // @ts-ignore
    const result = list.some(elm => nestedFilter(elm, filterObj.value));
    return !filterObj.negated ? result : !result;
  }

  // Handle array single property filters
  if (filterObj.field?.includes('[]')) {
    // Get first array field
    const fieldParts = filterObj.field.split('[]');
    const firstArr = fieldParts.shift();

    // Get row value corresponding to firstArr
    // @ts-ignore
    const list = getValue(row, firstArr);
    // For each element go recursive (some is default)
    // @ts-ignore
    const result = list?.some(elm =>
      singleFilter(elm, {
        ...filterObj,
        field: fieldParts.join('[]'),
        // Set negated false as only top level filter can be negated
        negated: false,
      }),
    );
    return !filterObj.negated ? result : !result;
  }

  // Handle single normal filter
  const value = getValue(row, filterObj.field);
  // @ts-ignore
  const result = compare(value, filterObj.value, filterObj.operator);
  return !filterObj.negated ? result : !result;
}
/**
 * @template T
 * @param {T} row
 * @param {import('./filter.type.js').NestedJsonFilters} filters
 * @param {'and' | 'or'} type
 * @returns {boolean}
 */
function nestedFilter(row, filters, type = 'and') {
  let result = true;
  for (const filter of filters) {
    if (Array.isArray(filter)) {
      const invertedType = type === 'and' ? 'or' : 'and';
      result = nestedFilter(row, filter, invertedType);
    } else {
      if (filter.enabled || filter.enabled === undefined) {
        result = singleFilter(row, filter);
      }
    }
    if (type === 'and' && !result) {
      return false;
    }
    if (type === 'or' && result) {
      return true;
    }
  }
  return result;
}

/**
 * @template T
 * @param {import('./filter.type.js').NestedJsonFilters} filters
 * @returns {import('./filter.type.js').Filter<T>}
 */
function generateFilterFunction(filters) {
  /**
   * @template T
   * @param {T} row
   * @returns {boolean}
   */
  function filterFunction(row) {
    if (filters.length === 0) {
      return true;
    }
    return nestedFilter(row, filters);
  }
  return filterFunction;
}

/**
 * @param {import('./filter.type.js').NestedJsonFilters} filters
 * @returns {import('./filter.type.js').NestedJsonFilters}
 */
function filterActive(filters) {
  return filters
    .filter(
      filterObj =>
        Array.isArray(filterObj) || filterObj.enabled === true || filterObj.enabled === undefined,
    )
    .map(filterObj => {
      if (Array.isArray(filterObj)) {
        return filterActive(filterObj);
      }
      return filterObj;
    });
}

/**
 * @template T
 * @param {import('./filter.type.js').NestedJsonFilters} nestedJsonFilter
 * @param {string[] | null} globalSearch
 * @returns {import('./filter.type.js').Filter<T>}
 */
export function jsonToFilter(nestedJsonFilter, globalSearch = null) {
  let activeFilters = filterActive(nestedJsonFilter);

  if (
    globalSearch !== null &&
    !Array.isArray(activeFilters[0]) &&
    activeFilters[0]?.field === globalSearchField
  ) {
    activeFilters.push(
      globalSearch.map(field => {
        return {
          ...activeFilters[0],
          field,
        };
      }),
    );
    activeFilters = activeFilters.slice(1);
  }

  return generateFilterFunction(activeFilters);
}
