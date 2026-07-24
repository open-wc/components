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
  autoCompleteSelectAll: 'Select all',
  autoCompleteRemoveAll: 'Remove all',
  clickEditableHint: 'Esc to cancel',
};
