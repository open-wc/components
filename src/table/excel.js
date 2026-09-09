import { filterFieldValue } from './filterFieldValue.js';
import { getFieldPathContent } from '../field-path-helper/getFieldPathContent.js';

/**
 * @template {unknown} T
 * @param {Array<T>} data
 * @param {import('./OwcTable.types.js').ConvertToCsvOptions<T>} options
 */
export function copyAsExcel(data, options) {
  const excelString = convertToExcel(data, options);
  navigator.clipboard.writeText(excelString);
}

/**
 * @template {unknown} T
 * @param {Array<T>} data
 * @param {import('./OwcTable.types.js').ConvertToCsvOptions<T>} options
 * @returns {string}
 */
export function convertToExcel(data, options) {
  const {
    visibleColumns,
    separator = '"\t"',
    jsonFilters = [],
    jsonSorters = [],
    dateFormatter = new Intl.DateTimeFormat('de', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
    dateTimeFormatter = new Intl.DateTimeFormat('de', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }),
    currencyFormatter = new Intl.NumberFormat('de', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2,
    }),
    numberFormatter = new Intl.NumberFormat('de', { maximumFractionDigits: 2 }),
    percentFormatter = new Intl.NumberFormat('de', {
      style: 'percent',
      maximumFractionDigits: 2,
    }),
  } = options;
  const excelData = [];
  const visibleColumnsWithId = [...visibleColumns];
  visibleColumnsWithId.unshift({
    label: 'Id',
    field: 'id',
  });
  const excelColumns = visibleColumnsWithId.filter(
    c => c.includeInExport === undefined || c.includeInExport === true,
  );
  const labels = excelColumns.map(c => c.labelString || c.label);

  excelData.push('"' + labels.join(separator) + '"');

  for (const [index, row] of data.entries()) {
    const excelRowData = [];
    for (const column of excelColumns) {
      // @ts-ignore
      const value = getFieldPathContent(row, column, {
        renderType: 'string',
        additionalFormatterOptions: ({ data, config }) => ({
          fieldValueFiltered: config.field
            ? filterFieldValue(
                data,
                config.field,
                config.fieldFilteredReturn || config.field,
                jsonFilters,
                jsonSorters,
              )
            : [],
        }),
        additionalFormatter: (_data, { config, content, custom }) => {
          if (config.formatter === 'rownum') {
            const index = /** @type {number} */ (custom?.index || 0);
            return `${index + 1}`;
          }
          return content;
        },
        custom: { index },
        dateFormatter,
        dateTimeFormatter,
        currencyFormatter,
        numberFormatter,
        percentFormatter,
      });
      const prefixedValue =
        typeof value === 'string' && value.startsWith('+') ? "'" + value : value;
      excelRowData.push(prefixedValue);
    }
    excelData.push('"' + excelRowData.join(separator) + '"');
  }
  return excelData.join('\n');
}
