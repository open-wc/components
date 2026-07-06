# Public Export Audit

This audit accounts for the `exports/` surface for the `0.1.0` release target of
`@open-wc/components`. Top-level UI component entry points remain stable for this pass. Loose
helper and aggregate type entries have been removed before the initial release in favor of owned
public namespaces.

## Coverage Summary

- Top-level files under `exports/`: 45
- Owned helper/type files under `exports/table/`, `exports/filter/`, `exports/text/`, and
  `exports/lit/`: 10
- Custom-element registration files under `exports/define/`: 30
- All UI entry points have a component page, README, demo note, or audit note listed below.
- `OwcTemplateEditorOld` is intentionally retained as a legacy internal implementation used by
  `OwcTemplateEditor`; it is not exported as its own package entry point.

## Top-Level Component And Package Exports

| Export file                 | Source module                                         | Documentation                                                            | Layout status                                               |
| --------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `JsonForm.js`               | `src/json-form/`                                      | `src/json-form/JsonForm.rocket.md`, `src/json-form/README.md`            | OK                                                          |
| `JsonFormTypes.ts`          | `src/json-form/types/renderer.ts`                     | This audit                                                               | OK                                                          |
| `OwcAutocomplete.js`        | `src/autocomplete/OwcAutocomplete.js`                 | `src/autocomplete/OwcAutocomplete.rocket.md`                             | OK                                                          |
| `OwcCard.js`                | `src/card/OwcCard.js`                                 | `src/card/OwcCard.rocket.md`                                             | OK                                                          |
| `OwcCardList.js`            | `src/card-list/OwcCardList.js`                        | `src/card-list/OwcCardList.rocket.md`                                    | OK                                                          |
| `OwcCardList.types.ts`      | `src/card-list/CardListTypes.ts`                      | `src/card-list/OwcCardList.rocket.md`                                    | OK                                                          |
| `OwcChartElement.js`        | `src/chart/OwcChartElement.js`                        | `src/chart/OwcChartElement.rocket.md`                                    | Follow-up: split matching export directory.                 |
| `OwcClickEditable.js`       | `src/click-editable/`                                 | Component variant docs in `src/click-editable/*.rocket.md`               | Follow-up: split variant exports into matching directories. |
| `OwcClickEditable.types.ts` | `src/click-editable/OwcClickEditable.types.ts`        | Component variant docs in `src/click-editable/*.rocket.md`               | OK                                                          |
| `OwcComposeEmail.js`        | `src/compose-email/OwcComposeEmail.js`                | `src/compose-email/OwcComposeEmail.rocket.md`                            | OK                                                          |
| `OwcComposeEmail.types.ts`  | `src/compose-email/OwcComposeEmail.js`                | `src/compose-email/OwcComposeEmail.rocket.md`                            | OK                                                          |
| `OwcCountUp.js`             | `src/count-up/OwcCountUp.js`                          | `src/count-up/OwcCountUp.rocket.md`                                      | OK                                                          |
| `OwcDataDetail.js`          | `src/data-detail/OwcDataDetail.js`                    | `src/data-detail/OwcDataDetail.rocket.md`                                | OK                                                          |
| `OwcDataDetail.types.ts`    | `src/data-detail/OwcDataDetail.types.ts`              | `src/data-detail/OwcDataDetail.rocket.md`                                | OK                                                          |
| `OwcDetailCard.js`          | `src/detail-card/OwcDetailCard.js`                    | `src/detail-card/OwcDetailCard.rocket.md`                                | OK                                                          |
| `OwcFileUpload.js`          | `src/file-upload/OwcFileUpload.js`                    | `src/file-upload/OwcFileUpload.rocket.md`                                | OK                                                          |
| `OwcGrapeTemplateEditor.js` | `src/template-editor/OwcGrapeTemplateEditor.js`       | `src/template-editor/OwcTemplateEditor.rocket.md`                        | OK                                                          |
| `OwcIconButton.js`          | `src/icon-button/OwcIconButton.js`                    | `src/icon-button/OwcIconButton.rocket.md`                                | OK                                                          |
| `OwcInputAutofill.js`       | `src/input-autofill/OwcInputAutofill.js`              | `src/input-autofill/OwcInputAutofill.rocket.md`                          | OK                                                          |
| `OwcInputSlider.js`         | `src/input-slider/OwcInputSlider.js`                  | `src/input-slider/OwcInputSlider.rocket.md`                              | OK                                                          |
| `OwcLayoutSidebar.js`       | `src/layout-sidebar/OwcLayoutSidebar.js`              | `src/layout-sidebar/OwcLayoutSidebar.rocket.md`                          | OK                                                          |
| `OwcLayoutSidebar.types.ts` | `src/layout-sidebar/OwcLayoutSidebar.types.ts`        | `src/layout-sidebar/OwcLayoutSidebar.rocket.md`                          | OK                                                          |
| `OwcLoadingScreen.js`       | `src/loading-screen/OwcLoadingScreen.js`              | `src/loading-screen/OwcLoadingScreen.rocket.md`                          | OK                                                          |
| `OwcMultiCheckbox.js`       | `src/multi-checkbox/OwcMultiCheckbox.js`              | `src/multi-checkbox/OwcMultiCheckbox.demo.js`                            | OK                                                          |
| `OwcPieChartElement.js`     | `src/chart/OwcPieChartElement.js`                     | `src/chart/OwcPieChartElement.rocket.md`                                 | Follow-up: split matching export directory.                 |
| `OwcPinboard.js`            | `src/pinboard/OwcPinboard.js`                         | `src/pinboard/OwcPinboard.rocket.md`                                     | OK                                                          |
| `OwcQuestionnaire.js`       | `src/questionnaire/OwcQuestionnaire.js`               | `src/questionnaire/OwcQuestionnaire.rocket.md`                           | OK                                                          |
| `OwcSeparator.js`           | `src/separator/OwcSeparator.js`                       | `src/separator/OwcSeparator.rocket.md`                                   | OK                                                          |
| `OwcTable.js`               | `src/table/OwcTable.js`                               | `src/table/OwcTable.rocket.md`                                           | OK                                                          |
| `OwcTable.types.ts`         | `src/table/OwcTable.types.ts`, field-path table types | `src/table/OwcTable.rocket.md`                                           | OK                                                          |
| `OwcTableFilterBuilder.js`  | `src/table-filter/OwcTableFilterBuilder.js`           | `src/table-filter/OwcTableFilterBuilder.rocket.md`                       | OK                                                          |
| `OwcTableInfo.js`           | `src/table/OwcTableInfo.js`                           | `src/table/OwcTableInfo.rocket.md`                                       | OK                                                          |
| `OwcTableMassEdit.js`       | `src/table/OwcTableMassEdit.js`                       | `src/table/OwcTableMassEdit.rocket.md`                                   | OK                                                          |
| `OwcTabs.js`                | `src/tabs/OwcTabs.js`                                 | `src/tabs/OwcTabs.rocket.md`                                             | OK                                                          |
| `OwcTabs.types.ts`          | `src/tabs/OwcTabs.types.ts`                           | `src/tabs/OwcTabs.rocket.md`                                             | OK                                                          |
| `OwcTemplateEditor.js`      | `src/template-editor/OwcTemplateEditor.js`            | `src/template-editor/OwcTemplateEditor.rocket.md`                        | OK                                                          |
| `OwcTemplateEditorTypes.ts` | `src/template-editor/OwcTemplateEditorTypes.ts`       | `src/template-editor/OwcTemplateEditor.rocket.md`                        | OK                                                          |
| `OwcToast.js`               | `src/toast/OwcToast.js`                               | `src/toast/OwcToast.rocket.md`                                           | OK                                                          |
| `OwcTooltip.js`             | `src/tooltip/OwcTooltip.js`                           | `src/tooltip/OwcTooltip.rocket.md`                                       | OK                                                          |
| `RowClickEvent.js`          | `src/table/RowClickEvent.js`                          | `src/table/OwcTable.rocket.md`                                           | OK                                                          |
| `WaveController.js`         | `src/waves/`                                          | `src/waves/WaveController.rocket.md`, `src/waves/ReactiveObject.demo.js` | OK                                                          |
| `compress.js`               | `src/compress/`                                       | `src/compress/OwcCompress.rocket.md`, `src/compress/compress.demo.js`    | OK                                                          |
| `docsData.js`               | `exports/docsData.js`                                 | This audit                                                               | Public docs metadata.                                       |
| `jsonFormHelpers.js`        | `src/json-form/`                                      | `src/json-form/README.md`                                                | OK                                                          |
| `templateHelpers.js`        | `src/template-editor/generateValueForData.js`         | `src/template-editor/OwcTemplateEditor.rocket.md`                        | OK                                                          |

## Owned Helper And Type Exports

| Export file                        | Source module                                        | Ownership                 |
| ---------------------------------- | ---------------------------------------------------- | ------------------------- |
| `table/csv.js`                     | `src/table/csv.js`                                   | Table CSV export helpers  |
| `table/excel.js`                   | `src/table/excel.js`                                 | Table Excel export helper |
| `table/subListHelpers.js`          | `src/subListHelpers.js`                              | Table column rendering    |
| `table/dateParserForJsonDecode.js` | `src/table/dateParserForJsonDecode.js`               | Table saved-state parsing |
| `table/types.ts`                   | `src/table/OwcTable.types.ts`, field-path types      | Table configuration types |
| `filter/jsonToFilter.js`           | `src/filter/jsonToFilter.js`                         | JSON Filter adapter       |
| `filter/jsonToSqlFilter.js`        | `src/filter/jsonToSqlFilter.js`                      | SQL Filter adapter        |
| `filter/types.ts`                  | `src/filter/filter.type.ts`                          | JSON Filter types         |
| `text/highlightSearchTerms.js`     | `src/highlight-search-terms/highlightSearchTerms.js` | Text highlighting helper  |
| `lit/litHtmlToString.js`           | `src/lit-helpers/litHtmlToString.js`                 | Lit test/helper utility   |

`dateParserForJsonDecode` remains table-owned because current usage revives serialized table
filter state. It is not part of the JSON Filter adapter namespace.

## Removed Loose Exports

These files are intentionally absent from `exports/` and must not be shipped as compatibility
stubs:

- `csv.js`
- `excel.js`
- `subListHelpers.js`
- `filter.js`
- `highlightSearchTerms.js`
- `lit-helpers.js`
- `types.ts`

## Define Exports

The following `exports/define/*` files register the matching custom element for the component export
listed above:

- `define/json-form.js`
- `define/owc-autocomplete.js`
- `define/owc-card-list.js`
- `define/owc-card.js`
- `define/owc-chart-element.js`
- `define/owc-click-editable-autocomplete.js`
- `define/owc-click-editable-input-autofill.js`
- `define/owc-click-editable-input.js`
- `define/owc-click-editable-textarea.js`
- `define/owc-compose-email.js`
- `define/owc-count-up.js`
- `define/owc-data-detail.js`
- `define/owc-detail-card.js`
- `define/owc-file-upload.js`
- `define/owc-grape-template-editor.js`
- `define/owc-icon-button.js`
- `define/owc-input-autofill.js`
- `define/owc-input-slider.js`
- `define/owc-layout-sidebar.js`
- `define/owc-loading-screen.js`
- `define/owc-multi-checkbox.js`
- `define/owc-pie-chart-element.js`
- `define/owc-pinboard.js`
- `define/owc-questionnaire.js`
- `define/owc-separator.js`
- `define/owc-table-info.js`
- `define/owc-table.js`
- `define/owc-tabs.js`
- `define/owc-template-editor.js`
- `define/owc-tooltip.js`

## Directory Follow-Up Work

Before a later stable release, move these public components into matching `src/` and `exports/`
directories without changing their public package specifiers until a deprecation plan exists:

- Chart family: `OwcChartElement` and `OwcPieChartElement`.
- Click-editable variants: input, autocomplete, textarea, and input-autofill.
