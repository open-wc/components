import { filterFieldValue } from './filterFieldValue.js';
import { getFieldPathContent } from '../field-path-helper/getFieldPathContent.js';

/**
 * @template {Record<string, unknown>} T
 * @param {Array<T>} data
 * @param {import('./OwcTable.types.js').ConvertToCsvOptions<T>} options
 */
export function downloadAsCsv(data, options) {
  const csvString = convertToCsv(data, options);
  download(csvString);
}

/**
 * @template {Record<string, unknown>} T
 * @param {Array<T>} data
 * @param {import('./OwcTable.types.js').ConvertToCsvOptions<T>} options
 */
export function copyAsCsv(data, options) {
  const csvString = convertToCsv(data, options);
  navigator.clipboard.writeText(csvString);
}

/** @type {HTMLLinkElement} */
let globalLink;

/**
 * @param {string} dataString
 */
function download(dataString) {
  // BOM to force UTF-8 encoding
  const BOM = new Uint8Array([0xef, 0xbb, 0xbf]);
  const blob = new Blob([BOM, dataString], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = globalLink || document.createElement('a');
  if (!globalLink) {
    globalLink = link;
  }
  link.setAttribute('href', url);
  link.setAttribute('download', 'download.csv');
  link.click();
}

/**
 * @template {Record<string, unknown>} T
 * @param {Array<T>} data
 * @param {import('./OwcTable.types.js').ConvertToCsvOptions<T>} options
 * @returns {string}
 */
export function convertToCsv(data, options) {
  const {
    visibleColumns = [],
    separator = ';',
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
  const csvData = [];
  const visibleColumnsWithId = [...visibleColumns];
  visibleColumnsWithId.unshift({
    label: 'Id',
    // FIXME: We shoudln't hardcode id index
    field: 'id',
  });
  const csvColumns = visibleColumnsWithId.filter(
    c => c.includeInExport === undefined || c.includeInExport === true,
  );
  const labels = csvColumns.map(c => c.labelString || c.label);

  csvData.push(labels.join(separator));

  for (const [index, row] of data.entries()) {
    const csvRowData = [];
    for (const column of csvColumns) {
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
      csvRowData.push(value);
    }
    csvData.push(csvRowData.join(separator));
  }
  return csvData.join('\n');
}
