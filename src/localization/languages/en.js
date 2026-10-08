export const en = {
  $code: 'en',
  $name: 'English',
  /** @type {'ltr' | 'rtl'} */
  $dir: 'ltr',

  tableAddFilter: 'Add filter',
  tableAnd: 'AND',
  /**
   *
   * @param {Number} count
   * @returns {String}
   */
  tableApplyMassEdit: count => `Apply changes to ${count} ${count === 1 ? 'entry' : 'entries'}`,
  tableCancel: 'Cancel',
  tableColumns: 'Columns',
  tableColumnVisibilityHint: 'Columns are displayed in the table when:',
  tableCopyExcel: 'Copy (Excel)',
  tableEmptyMessage: 'No data available',
  tableExport: 'Export',
  tableExportCsv: 'Export (CSV)',
  tableFilter: 'Filter',
  tableFilterLexicon: 'Filter lexicon',
  tableMassEdit: 'Bulk edit',
  tableMoveColumn: 'Move column',
  tableNew: 'New',
  /**
   *
   * @param {String} field
   * @returns {String}
   */
  tableNoFilterFound: field => `No filter found for ${field}`,
  tableNot: 'NOT',
  tableNotFound: 'not found',
  tableOpenDetails: 'Open details',
  tableOperatorBetween: 'between',
  tableOperatorBetweenNoYear: 'between (ignore year)',
  tableOperatorEndsWith: 'ends with',
  tableOperatorEqual: 'equals',
  tableOperatorEqualNoYear: 'equals (ignore year)',
  tableOperatorEvery: 'every',
  tableOperatorGreaterEqualNoYear: 'after (ignore year)',
  tableOperatorGreaterThan: 'greater than',
  tableOperatorGreaterThanOrEqual: 'greater than or equal',
  tableOperatorIncludes: 'contains',
  tableOperatorIsEmpty: 'empty',
  tableOperatorLessEqualNoYear: 'before (ignore year)',
  tableOperatorLessThan: 'less than',
  tableOperatorLessThanOrEqual: 'less than or equal',
  tableOperatorNotEqual: 'does not equal',
  tableOperatorNotEqualNoYear: 'does not equal (ignore year)',
  tableOperatorNotIncludes: 'does not contain',
  tableOperatorSome: 'at least one',
  tableOperatorStartsWith: 'starts with',
  tableOperatorAfter: 'after',
  tableOperatorBefore: 'before',
  tableOthers: 'Others',
  tableOr: 'OR',
  tablePreview: 'Preview',
  tableRefresh: 'Refresh',
  tableReset: 'Reset',
  tableSelectAll: 'Select all',
  /**
   *
   * @param {Number} count
   * @returns {String}
   */
  tableSelectedEntries: count => `(${count} selected)`,
  tableSettings: 'Settings',
  /**
   *
   * @param {Number} count
   * @returns {String}
   */
  tableShowAllEntries: count => `Showing all ${count} entries`,
  tableShowAlways: 'Show always',
  /**
   *
   * @param {Number} current
   * @param {Number} total
   * @returns {String}
   */
  tableShowEntries: (current, total) => `Showing ${current} of ${total} entries`,
  tableShowNever: 'Show never',
  tableShowWhenFiltered: 'Show when filtered',
  tableSort: 'Sort',
  tableSums: 'Sums',
  tableSearch: 'Search',
  jsonFormArrayAddCard: 'Add Entry',
  jsonFormRenderSyncWarning: 'Value is not automatically synchronized',
  jsonFormErrorInvalid: 'Please check this value.',
  jsonFormErrorRequired: 'Please fill in this field.',
  jsonFormErrorNumber: 'Please enter a number.',
  jsonFormErrorInteger: 'Please enter a whole number.',
  jsonFormErrorSelection: 'Please select an available option.',
  jsonFormErrorEmail: 'Please enter a valid email address.',
  jsonFormErrorDate: 'Please enter a valid date.',
  jsonFormErrorTime: 'Please enter a valid time.',
  jsonFormErrorDateTime: 'Please enter a valid date and time.',
  /** @param {number} count @param {string} formatted */
  jsonFormErrorMinimum: (count, formatted) => `Please enter at least ${formatted}.`,
  /** @param {number} count @param {string} formatted */
  jsonFormErrorMaximum: (count, formatted) => `Please enter at most ${formatted}.`,
  /** @param {number} count @param {string} formatted */
  jsonFormErrorExclusiveMinimum: (count, formatted) =>
    `Please enter a value greater than ${formatted}.`,
  /** @param {number} count @param {string} formatted */
  jsonFormErrorExclusiveMaximum: (count, formatted) =>
    `Please enter a value less than ${formatted}.`,
  /** @param {number} count @param {string} formatted */
  jsonFormErrorMinLength: (count, formatted) =>
    `Please enter at least ${formatted} ${count === 1 ? 'character' : 'characters'}.`,
  /** @param {number} count @param {string} formatted */
  jsonFormErrorMaxLength: (count, formatted) =>
    `Please enter at most ${formatted} ${count === 1 ? 'character' : 'characters'}.`,
  /** @param {number} count @param {string} formatted */
  jsonFormErrorMinItems: (count, formatted) =>
    `Please provide at least ${formatted} ${count === 1 ? 'entry' : 'entries'}.`,
  /** @param {number} count @param {string} formatted */
  jsonFormErrorMaxItems: (count, formatted) =>
    `Please provide at most ${formatted} ${count === 1 ? 'entry' : 'entries'}.`,
  autoCompleteSelectAll: 'Select all',
  autoCompleteRemoveAll: 'Remove all',
  clickEditableHint: 'Esc to cancel',
  fileUploadLabel: 'Drag files here or click to upload',
};
