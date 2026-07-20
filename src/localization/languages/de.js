export const de = {
  $code: 'de',
  $name: 'Deutsch',
  /** @type {'ltr' | 'rtl'} */
  $dir: 'ltr',

  tableAddFilter: 'Filter hinzufügen',
  tableAnd: 'UND',
  /**
   *
   * @param {Number} count
   * @returns {String}
   */
  tableApplyMassEdit: count => `${count} ${count === 1 ? 'Änderung' : 'Änderungen'} durchführen`,
  tableCancel: 'Abbrechen',
  tableColumns: 'Spalten',
  tableColumnVisibilityHint: 'Spalten werden in der Tabelle angezeigt, wenn:',
  tableCopyExcel: 'Kopieren (Excel)',
  tableEmptyMessage: 'Keine Daten vorhanden',
  tableExport: 'Export',
  tableExportCsv: 'Exportieren (CSV)',
  tableFilter: 'Filter',
  tableFilterLexicon: 'Filter-Lexikon',
  tableMassEdit: 'Massenbearbeitung',
  tableMoveColumn: 'Spalte verschieben',
  tableNew: 'Neu',
  /**
   *
   * @param {String} field
   * @returns {String}
   */
  tableNoFilterFound: field => `Kein Filter für ${field} gefunden`,
  tableNot: 'NICHT',
  tableOpenDetails: 'Details öffnen',
  tableOperatorBetween: 'zwischen',
  tableOperatorBetweenNoYear: 'zwischen (Jahr ignorieren)',
  tableOperatorEndsWith: 'endet mit',
  tableOperatorEqual: 'gleich',
  tableOperatorEqualNoYear: 'gleich (Jahr ignorieren)',
  tableOperatorEvery: 'jeder',
  tableOperatorGreaterEqualNoYear: 'nach (Jahr ignorieren)',
  tableOperatorGreaterThan: 'größer als',
  tableOperatorGreaterThanOrEqual: 'größer gleich',
  tableOperatorIncludes: 'enthält',
  tableOperatorIsEmpty: 'leer',
  tableOperatorLessEqualNoYear: 'vor (Jahr ignorieren)',
  tableOperatorLessThan: 'kleiner als',
  tableOperatorLessThanOrEqual: 'kleiner gleich',
  tableOperatorNotEqual: 'nicht gleich',
  tableOperatorNotEqualNoYear: 'nicht gleich (Jahr ignorieren)',
  tableOperatorNotIncludes: 'enthält nicht',
  tableOperatorSome: 'mindestens 1',
  tableOperatorStartsWith: 'beginnt mit',
  tableOperatorAfter: 'nach',
  tableOperatorBefore: 'vor',
  tableOthers: 'Andere',
  tableOr: 'ODER',
  tablePreview: 'Vorschau',
  tableRefresh: 'Aktualisieren',
  tableReset: 'Zurücksetzen',
  tableSelectAll: 'Alle auswählen',
  /**
   *
   * @param {Number} count
   * @returns {String}
   */
  tableSelectedEntries: count => `(davon ${count} ausgewählt)`,
  tableSettings: 'Einstellungen',
  /**
   *
   * @param {Number} count
   * @returns {String}
   */
  tableShowAllEntries: count => `Zeige alle ${count} Einträge`,
  tableShowAlways: 'Zeige immer',
  /**
   *
   * @param {Number} current
   * @param {Number} total
   * @returns {String}
   */
  tableShowEntries: (current, total) => `Zeige ${current} von ${total} Einträgen`,
  tableShowNever: 'Zeige nie',
  tableShowWhenFiltered: 'Zeige wenn gefiltert',
  tableSort: 'Sortieren',
  tableSums: 'Summen',
  tableSearch: 'Suche',
};
