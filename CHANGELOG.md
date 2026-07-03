# Changelog

All notable changes to this project will be documented in this file.

## 0.1.0 - Initial release target

- Prepare the package for its first public release as `@open-wc/components`.
- Keep top-level UI component entry points available for the initial release.
- Break loose helper and aggregate type import paths before the initial release so the public
  surface is owned by table, filter, text, Lit, and component namespaces.
- Target MIT licensing for the public package.

### Migration notes

| Removed import path                                               | Replacement import path                                |
| ----------------------------------------------------------------- | ------------------------------------------------------ |
| `@open-wc/components/csv.js`                                      | `@open-wc/components/table/csv.js`                     |
| `@open-wc/components/excel.js`                                    | `@open-wc/components/table/excel.js`                   |
| `@open-wc/components/subListHelpers.js`                           | `@open-wc/components/table/subListHelpers.js`          |
| `@open-wc/components/filter.js` for `jsonToFilter`                | `@open-wc/components/filter/jsonToFilter.js`           |
| `@open-wc/components/filter.js` for `globalSearchField`           | `@open-wc/components/filter/jsonToFilter.js`           |
| `@open-wc/components/filter.js` for `jsonToSqlFilter`             | `@open-wc/components/filter/jsonToSqlFilter.js`        |
| `@open-wc/components/filter.js` for `dateParserForJsonDecode`     | `@open-wc/components/table/dateParserForJsonDecode.js` |
| `@open-wc/components/highlightSearchTerms.js`                     | `@open-wc/components/text/highlightSearchTerms.js`     |
| `@open-wc/components/lit-helpers.js`                              | `@open-wc/components/lit/litHtmlToString.js`           |
| `@open-wc/components/types.js` for `OwcTable`                     | `@open-wc/components/OwcTable.js`                      |
| `@open-wc/components/types.js` for `OwcComposeEmail`              | `@open-wc/components/OwcComposeEmail.js`               |
| `@open-wc/components/types.js` for `OwcLayoutSidebar`             | `@open-wc/components/OwcLayoutSidebar.js`              |
| `@open-wc/components/types.js` for `OwcCardList`                  | `@open-wc/components/OwcCardList.js`                   |
| `@open-wc/components/types.js` for `owc-table` tag types          | `@open-wc/components/table/types.js`                   |
| `@open-wc/components/types.js` for `owc-compose-email` tag types  | `@open-wc/components/OwcComposeEmail.types.js`         |
| `@open-wc/components/types.js` for `owc-layout-sidebar` tag types | `@open-wc/components/OwcLayoutSidebar.types.js`        |
| `@open-wc/components/types.js` for `owc-card-list` tag types      | `@open-wc/components/OwcCardList.types.js`             |
| `@open-wc/components/types.js` for table types                    | `@open-wc/components/table/types.js`                   |
| `@open-wc/components/types.js` for click-editable types           | `@open-wc/components/OwcClickEditable.types.js`        |
| `@open-wc/components/types.js` for card-list types                | `@open-wc/components/OwcCardList.types.js`             |
| `@open-wc/components/types.js` for data-detail types              | `@open-wc/components/OwcDataDetail.types.js`           |
| `@open-wc/components/types.js` for `OwcTableFilter`               | `@open-wc/components/OwcTableFilterBuilder.js`         |
