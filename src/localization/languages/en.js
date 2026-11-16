export const en = {
  $code: 'en',
  $name: 'English',
  /** @type {'ltr' | 'rtl'} */
  $dir: 'ltr',

  tableAddFilter: 'Add filter',
  tableAnd: 'AND',
  tableAnnotationHint: 'Press F2 to reach its controls',
  /**
   *
   * @param {Number} count
   * @returns {String}
   */
  tableApplyMassEdit: count => `Apply changes to ${count} ${count === 1 ? 'entry' : 'entries'}`,
  tableCancel: 'Cancel',
  tableColumns: 'Columns',
  tableColumnVisibilityHint: 'Columns are displayed in the table when:',
  tableColumnVisibilityLegend: 'What the checkboxes mean',
  /**
   *
   * @param {Number} width
   * @returns {String}
   */
  tableColumnWidth: width => `${width} pixels wide`,
  tableCopyExcel: 'Copy (Excel)',
  tableDeleteFilter: 'Delete filter',
  tableDetails: 'Details',
  tableDetailsClosed: 'Details closed',
  tableDetailsOpened: 'Details opened',
  tableEmptyMessage: 'No data available',
  tableExport: 'Export',
  tableExportCsv: 'Export (CSV)',
  tableFilter: 'Filter',
  tableFilterLexicon: 'Filter lexicon',
  /**
   *
   * @param {String} label
   * @param {Number} count
   * @returns {String}
   */
  tableGroupLabel: (label, count) => `${label}, ${count} ${count === 1 ? 'row' : 'rows'}`,
  tableInteractionHint: 'Press Escape to return to the table',
  tableLabel: 'Table',
  tableMassEdit: 'Bulk edit',
  tableMoveColumn: 'Move column',
  tableMoveColumnDown: 'Move down',
  tableMoveColumnToBottom: 'Move to bottom',
  tableMoveColumnToTop: 'Move to top',
  tableMoveColumnUp: 'Move up',
  tableNegateFilter: 'Negate filter',
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
  tableOpenRow: 'Open row',
  tableOperator: 'Operator',
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
  tablePauseFilter: 'Pause filter',
  tablePreview: 'Preview',
  tableRefresh: 'Refresh',
  tableReset: 'Reset',
  tableResumeFilter: 'Resume filter',
  tableSelectAll: 'Select all',
  tableSelection: 'Selection',
  tableSelectRow: 'Select row',
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
  autoCompleteSearch: 'Search',
  autoCompleteUseFillMode: 'Paste values to select them',
  autoCompleteUseSearch: 'Search instead',
  clickEditableHint: 'Esc to cancel',
  fileUploadLabel: 'Drag files here or click to upload',
  /** @param {string} name @param {string} maxSize */
  fileUploadTooLarge: (name, maxSize) => `${name} is too large. Maximum file size: ${maxSize} MB.`,
  /** @param {string} destination the name of a column */
  pinboardCannotDrop: destination => `Can't drop in ${destination}`,
  /** @param {string} card the name of the card */
  pinboardCannotMove: card => `${card} can't be moved`,
  /**
   * @param {string} destination the name of a column or of a dropzone
   * @param {number} [count] the number of its cards, if it keeps cards
   */
  pinboardDestination: (destination, count) =>
    count === undefined
      ? destination
      : `${destination}, ${count} ${count === 1 ? 'card' : 'cards'}`,
  pinboardDropzoneDelete: 'Delete',
  pinboardDropzoneSuccess: 'Done',
  pinboardInteractionHint: 'Press Escape to return to the card',
  pinboardMoveCancelled: 'Move cancelled',
  /**
   * @param {string} card the name of the card
   * @param {string} destination the name of the column or dropzone it is in now
   * @param {number} [position] its position among the cards there, if it shows there
   * @param {number} [count] the number of cards there
   */
  pinboardMoved: (card, destination, position, count) =>
    position === undefined
      ? `Moved ${card} to ${destination}`
      : `Moved ${card} to ${destination}, ${position} of ${count}`,
  pinboardMoveTo: 'Move to…',
  /** @param {string} card the name of the card */
  pinboardPickedUp: card =>
    `Picked up ${card}. Arrow keys choose a destination, Space drops, Escape cancels.`,
};
