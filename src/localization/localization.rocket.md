```js server
export const config = {
  path: '/utilities/localization',
  title: 'Localization',
  menu: {
    parent: '/utilities',
    order: 10,
    iconName: 'translate',
  },
};
import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
import { docsData } from '@open-wc/components/docsData.js';

export const components = atlasDocComponents;
export const layout = pageData => docLayout(pageData, docsData);
```

# Localization

Owc Components use an extended localization class from Webawesome to translate the components. currently, there's only support for german and english. you can add additional languages to it by adding your own language packs ([See Webawesome Localization](https://webawesome.com/docs/localization)).

## JsonForm validation terms

JsonForm uses the following terms for field validation. Register a translation and set `lang` on
the form or an ancestor; missing terms fall back to English. The raw validator output is preserved.

- `jsonFormErrorInvalid`: generic message for unsupported rules or unresolved constraints.
- `jsonFormErrorRequired`: missing required value.
- `jsonFormErrorNumber`, `jsonFormErrorInteger`: expected numeric type.
- `jsonFormErrorSelection`: value outside the available options.
- `jsonFormErrorEmail`, `jsonFormErrorDate`, `jsonFormErrorTime`, `jsonFormErrorDateTime`: invalid format.
- `jsonFormErrorMinimum`, `jsonFormErrorMaximum`: inclusive numeric bounds.
- `jsonFormErrorExclusiveMinimum`, `jsonFormErrorExclusiveMaximum`: exclusive numeric bounds.
- `jsonFormErrorMinLength`, `jsonFormErrorMaxLength`: text length bounds.
- `jsonFormErrorMinItems`, `jsonFormErrorMaxItems`: entry count bounds.

Bound and count terms are functions receiving `(count, formatted)`: the numeric constraint for
pluralization and its localized string for display. For example:

```js
const validationTerms = {
  jsonFormErrorMinItems: (count, formatted) =>
    `Please provide at least ${formatted} ${count === 1 ? 'entry' : 'entries'}.`,
};
```

## Other component terms

The following English language pack lists the other component terms:

```js
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
  autoCompleteSelectAll: 'Select all',
  autoCompleteRemoveAll: 'Remove all',
  autoCompleteSearch: 'Search',
  autoCompleteUseFillMode: 'Paste values to select them',
  autoCompleteUseSearch: 'Search instead',
  clickEditableHint: 'Esc to cancel',
  pinboardCannotDrop: destination => `Can't drop in ${destination}`,
  pinboardCannotMove: card => `${card} can't be moved`,
  pinboardDestination: (destination, count) =>
    count === undefined
      ? destination
      : `${destination}, ${count} ${count === 1 ? 'card' : 'cards'}`,
  pinboardDropzoneDelete: 'Delete',
  pinboardDropzoneSuccess: 'Done',
  pinboardInteractionHint: 'Press Escape to return to the card',
  pinboardMoveCancelled: 'Move cancelled',
  pinboardMoved: (card, destination, position, count) =>
    position === undefined
      ? `Moved ${card} to ${destination}`
      : `Moved ${card} to ${destination}, ${position} of ${count}`,
  pinboardMoveTo: 'Move to…',
  pinboardPickedUp: card =>
    `Picked up ${card}. Arrow keys choose a destination, Space drops, Escape cancels.`,
};
```

because of how the project is structured, the registration of the language is being done somewhere else, so you have to register your translation on your own:

```js
import { registerTranslation } from '@awesome.me/webawesome/dist/utilities/localize.js';

registerTranslation(/** your language here **/);
```

you can use those by simply importing that language pack. it is important, that you name the file after the language you're using. for example, this is the code for importing a language pack for spanish.

```html
<html lang="es">
  <head>
    <script type="module" src="/path/to/es.js"></script>
  </head>

  <body>
    ...
  </body>
</html>
```

you can also overwrite existing translations by simply replacing the existing translation by your own. this can be for example done for the `noDataAvailable` message in the owc table. to do this, you simply need to reregister the part you want to be replaced.

```js
import { registerTranslation } from '@awesome.me/webawesome/dist/utilities/localize.js';
import { en } from '@open-wc/components/languages/en.js';

registerTranslation({
  ...en,
  tableEmptyMessage: 'MY OWN No data available',
  tableShowAllEntries: count =>
    count !== 0 ? `Showing all ${count} entries` : `MY CUSTOM no current entry available function`,
});
```

```js client
import { registerTranslation } from '@awesome.me/webawesome/dist/utilities/localize.js';
import { html, nothing } from 'lit';
import '@open-wc/components/define/owc-table.js';

import { en } from '@open-wc/components/languages/en.js';

registerTranslation({
  ...en,
  tableEmptyMessage: 'MY OWN No data available',
  tableShowAllEntries: count =>
    count !== 0 ? `Showing all ${count} entries` : `MY CUSTOM no current entry available function`,
});
```

```js demo
export const simpleTable = () => {
  return html`
    <div style="height: 60vh; overflow: auto; ">
      <owc-table
        lang="en"
        selectable
        filter-mode="global-search-with-builder"
        sticky-header
        show-info
        .actionTabs=${{
          export: { visible: true },
          settings: { visible: true },
        }}
        .columns=${[
          {
            label: 'First Name',
            field: 'firstName',
            filterable: true,
          },
          {
            label: 'Last Name',
            field: 'lastName',
            filterable: true,
          },
          {
            label: 'Profession',
            field: 'profession',
            filterable: true,
          },
          {
            label: 'Age',
            field: 'age',
            formatter: 'number',
            showInCalculateSums: true,
            filterable: true,
          },
          {
            label: 'Monthly Pay',
            field: 'monthlyPay',
            formatter: 'number',
          },
          {
            label: 'Birthdate',
            field: 'birthDate',
            formatter: 'date',
          },
        ]}
        .data=${[]}
      ></owc-table>
    </div>
  `;
};
```
