```js server
export const config = {
  path: '/localization',
  title: 'Localization',
  menu: {
    parent: 'utilities',
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

if you wanna add your own language, here are the additional keys you need to map, the following is the english language pack:

```js
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
