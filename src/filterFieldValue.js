import { getFieldPath } from './field-path-helper/getFieldPath.js';
import { jsonToFilter } from './filter/jsonToFilter.js';
import { jsonToSorters } from './jsonToSorters.js';

/**
 * Don't know if my thoughts about what this is supposed to do are correct but here we go
 * For the given filters, gets all fieldFilteredReturn Objects that are filtered by field in which these filters evaluate to true.
 * @template {Record<string, unknown>} T
 * @param {T} row
 * @param {import('./field-path-helper/getFieldPathContent.types.js').Field<T>} field
 * @param {import('./field-path-helper/getFieldPathContent.types.js').Field<T>} fieldFilteredReturn
 * @param {import('./filter/filter.type.js').NestedJsonFilters} jsonFilters
 * @param {import('./OwcTable.types.js').JsonSorter[]} [jsonSorters]
 * @returns {Array<T[field]>}
 */
export function filterFieldValue(row, field, fieldFilteredReturn, jsonFilters, jsonSorters = []) {
  let data = /**@type {T[field][]} */ (getFieldPath(row, fieldFilteredReturn));
  if (!Array.isArray(data)) {
    return [];
  }

  let dataFiltered = /**@type {T[field][]} */ ([]);

  if (jsonFilters.length === 0) {
    dataFiltered = data;
  }
  for (const filter of jsonFilters) {
    if (Array.isArray(filter)) {
      continue;
    }

    if (fieldFilteredReturn.startsWith(filter.field)) {
      // sub filter
      let subFilter = undefined;
      if (filter.field === fieldFilteredReturn) {
        // Single sub filter
        // @ts-ignore
        subFilter = jsonToFilter([{ ...filter, field: '' }]);
      } else {
        // @ts-ignore
        subFilter = jsonToFilter(filter.value);
      }
      dataFiltered = data.filter(obj => dataFiltered.includes(obj) || subFilter(obj));
    }
  }

  data = dataFiltered;

  const sorter = jsonSorters.find(elm => elm.field === field);
  if (sorter) {
    const sorterCopy = {
      ...sorter,
      field: sorter?.field.replace(fieldFilteredReturn + '.', ''),
    };
    const sorterFunction = jsonToSorters(sorterCopy);
    // @ts-ignore
    data.sort(sorterFunction);
  }
  return data;
}
