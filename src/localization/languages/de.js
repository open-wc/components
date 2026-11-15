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
  tableColumnVisibilityLegend: 'Was die Kästchen bedeuten',
  /**
   *
   * @param {Number} width
   * @returns {String}
   */
  tableColumnWidth: width => `${width} Pixel breit`,
  tableCopyExcel: 'Kopieren (Excel)',
  tableDeleteFilter: 'Filter löschen',
  tableDetails: 'Details',
  tableDetailsClosed: 'Details geschlossen',
  tableDetailsOpened: 'Details geöffnet',
  tableEmptyMessage: 'Keine Daten vorhanden',
  tableExport: 'Export',
  tableExportCsv: 'Exportieren (CSV)',
  tableFilter: 'Filter',
  tableFilterLexicon: 'Filter-Lexikon',
  /**
   *
   * @param {String} label
   * @param {Number} count
   * @returns {String}
   */
  tableGroupLabel: (label, count) => `${label}, ${count} ${count === 1 ? 'Zeile' : 'Zeilen'}`,
  tableInteractionHint: 'Escape drücken, um zur Tabelle zurückzukehren',
  tableLabel: 'Tabelle',
  tableMassEdit: 'Massenbearbeitung',
  tableMoveColumn: 'Spalte verschieben',
  tableMoveColumnDown: 'Nach unten',
  tableMoveColumnToBottom: 'Ans Ende',
  tableMoveColumnToTop: 'An den Anfang',
  tableMoveColumnUp: 'Nach oben',
  tableNegateFilter: 'Filter umkehren',
  tableNew: 'Neu',
  /**
   *
   * @param {String} field
   * @returns {String}
   */
  tableNoFilterFound: field => `Kein Filter für ${field} gefunden`,
  tableNot: 'NICHT',
  tableNotFound: 'nicht gefunden',
  tableOpenDetails: 'Details öffnen',
  tableOpenRow: 'Zeile öffnen',
  tableOperator: 'Operator',
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
  tablePauseFilter: 'Filter pausieren',
  tablePreview: 'Vorschau',
  tableRefresh: 'Aktualisieren',
  tableReset: 'Zurücksetzen',
  tableResumeFilter: 'Filter fortsetzen',
  tableSelectAll: 'Alle auswählen',
  tableSelection: 'Auswahl',
  tableSelectRow: 'Zeile auswählen',
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
  jsonFormArrayAddCard: 'Eintrag hinzufügen',
  jsonFormRenderSyncWarning: 'Wert wird nicht automatisch synchronisiert',
  jsonFormErrorInvalid: 'Bitte diese Eingabe prüfen.',
  jsonFormErrorRequired: 'Bitte dieses Feld ausfüllen.',
  jsonFormErrorNumber: 'Bitte eine Zahl eingeben.',
  jsonFormErrorInteger: 'Bitte eine ganze Zahl eingeben.',
  jsonFormErrorSelection: 'Bitte eine verfügbare Option auswählen.',
  jsonFormErrorEmail: 'Bitte eine gültige E-Mail-Adresse eingeben.',
  jsonFormErrorDate: 'Bitte ein gültiges Datum eingeben.',
  jsonFormErrorTime: 'Bitte eine gültige Uhrzeit eingeben.',
  jsonFormErrorDateTime: 'Bitte ein gültiges Datum und eine gültige Uhrzeit eingeben.',
  /** @param {number} count @param {string} formatted */
  jsonFormErrorMinimum: (count, formatted) => `Bitte mindestens ${formatted} eingeben.`,
  /** @param {number} count @param {string} formatted */
  jsonFormErrorMaximum: (count, formatted) => `Bitte höchstens ${formatted} eingeben.`,
  /** @param {number} count @param {string} formatted */
  jsonFormErrorExclusiveMinimum: (count, formatted) =>
    `Bitte einen Wert größer als ${formatted} eingeben.`,
  /** @param {number} count @param {string} formatted */
  jsonFormErrorExclusiveMaximum: (count, formatted) =>
    `Bitte einen Wert kleiner als ${formatted} eingeben.`,
  /** @param {number} count @param {string} formatted */
  jsonFormErrorMinLength: (count, formatted) => `Bitte mindestens ${formatted} Zeichen eingeben.`,
  /** @param {number} count @param {string} formatted */
  jsonFormErrorMaxLength: (count, formatted) => `Bitte höchstens ${formatted} Zeichen eingeben.`,
  /** @param {number} count @param {string} formatted */
  jsonFormErrorMinItems: (count, formatted) =>
    `Bitte mindestens ${formatted} ${count === 1 ? 'Eintrag' : 'Einträge'} angeben.`,
  /** @param {number} count @param {string} formatted */
  jsonFormErrorMaxItems: (count, formatted) =>
    `Bitte höchstens ${formatted} ${count === 1 ? 'Eintrag' : 'Einträge'} angeben.`,
  autoCompleteSelectAll: 'Alle auswählen',
  autoCompleteDeselectAll: 'Alle abwählen',
  autoCompleteSearch: 'Suche',
  autoCompleteUseFillMode: 'Werte einfügen, um sie auszuwählen',
  autoCompleteUseSearch: 'Stattdessen suchen',
  clickEditableHint: 'Esc zum abbrechen',
  fileUploadLabel: 'Dateien hierher ziehen oder klicken, um hochzuladen',
  /** @param {string} name @param {string} maxSize */
  fileUploadTooLarge: (name, maxSize) => `${name} ist zu groß. Maximal erlaubt sind ${maxSize} MB.`,
  /** @param {string} destination the name of a column */
  pinboardCannotDrop: destination => `Ablegen in ${destination} nicht möglich`,
  /** @param {string} card the name of the card */
  pinboardCannotMove: card => `${card} kann nicht verschoben werden`,
  /**
   * @param {string} destination the name of a column or of a dropzone
   * @param {number} [count] the number of its cards, if it keeps cards
   */
  pinboardDestination: (destination, count) =>
    count === undefined
      ? destination
      : `${destination}, ${count} ${count === 1 ? 'Karte' : 'Karten'}`,
  pinboardDropzoneDelete: 'Löschen',
  pinboardDropzoneSuccess: 'Erledigt',
  pinboardInteractionHint: 'Escape drücken, um zur Karte zurückzukehren',
  pinboardMoveCancelled: 'Verschieben abgebrochen',
  /**
   * @param {string} card the name of the card
   * @param {string} destination the name of the column or dropzone it is in now
   * @param {number} [position] its position among the cards there, if it shows there
   * @param {number} [count] the number of cards there
   */
  pinboardMoved: (card, destination, position, count) =>
    position === undefined
      ? `${card} nach ${destination} verschoben`
      : `${card} nach ${destination} verschoben, ${position} von ${count}`,
  pinboardMoveTo: 'Verschieben nach…',
  /** @param {string} card the name of the card */
  pinboardPickedUp: card =>
    `${card} aufgenommen. Pfeiltasten wählen ein Ziel, Leertaste legt ab, Escape bricht ab.`,
};
