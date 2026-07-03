# Public Export Audit

This audit accounts for the `exports/` surface kept for the `0.1.0` release of
`@open-wc/components`. The first release preserves the current entry points; directory-layout
cleanup is tracked as follow-up work instead of being mixed into the release metadata cleanup.

## Coverage Summary

- Top-level files under `exports/`: 48
- Custom-element registration files under `exports/define/`: 30
- All UI entry points have a component page, README, or demo note listed below.
- Helper and type entry points are covered by this audit or by an existing module README.
- `OwcTemplateEditorOld` is intentionally retained as a legacy internal implementation used by
  `OwcTemplateEditor`; it is not exported as its own package entry point.

## Top-Level Exports

| Export file                 | Source module                                        | Documentation                                                            | Layout status                                                      |
| --------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `JsonForm.js`               | `src/json-form/`                                     | `src/json-form/JsonForm.rocket.md`, `src/json-form/README.md`            | OK                                                                 |
| `JsonFormTypes.ts`          | `src/json-form/types/renderer.ts`                    | This audit                                                               | OK                                                                 |
| `OwcAutocomplete.js`        | `src/autocomplete/OwcAutocomplete.js`                | `src/autocomplete/OwcAutocomplete.rocket.md`                             | OK                                                                 |
| `OwcCard.js`                | `src/card/OwcCard.js`                                | `src/card/OwcCard.rocket.md`                                             | OK                                                                 |
| `OwcCardList.js`            | `src/card-list/OwcCardList.js`                       | `src/card-list/OwcCardList.rocket.md`                                    | OK                                                                 |
| `OwcChartElement.js`        | `src/chart/OwcChartElement.js`                       | This audit                                                               | Follow-up: add chart docs and split matching export directory.     |
| `OwcClickEditable.js`       | `src/click-editable/`                                | Component variant docs in `src/click-editable/*.rocket.md`               | Follow-up: split variant exports into matching directories.        |
| `OwcComposeEmail.js`        | `src/compose-email/OwcComposeEmail.js`               | `src/compose-email/OwcComposeEmail.rocket.md`                            | OK                                                                 |
| `OwcCountUp.js`             | `src/count-up/OwcCountUp.js`                         | `src/count-up/OwcCountUp.rocket.md`                                      | OK                                                                 |
| `OwcDataDetail.js`          | `src/data-detail/OwcDataDetail.js`                   | `src/data-detail/OwcDataDetail.rocket.md`                                | OK                                                                 |
| `OwcDataDetail.types.ts`    | `src/data-detail/OwcDataDetail.types.ts`             | `src/data-detail/OwcDataDetail.rocket.md`                                | OK                                                                 |
| `OwcDetailCard.js`          | `src/detail-card/OwcDetailCard.js`                   | `src/detail-card/OwcDetailCard.rocket.md`                                | OK                                                                 |
| `OwcFileUpload.js`          | `src/file-upload/OwcFileUpload.js`                   | `src/file-upload/OwcFileUpload.rocket.md`                                | OK                                                                 |
| `OwcGrapeTemplateEditor.js` | `src/template-editor/OwcGrapeTemplateEditor.js`      | `src/template-editor/OwcTemplateEditor.rocket.md`                        | OK                                                                 |
| `OwcIconButton.js`          | `src/icon-button/OwcIconButton.js`                   | `src/icon-button/OwcIconButton.rocket.md`                                | OK                                                                 |
| `OwcInputAutofill.js`       | `src/input-autofill/OwcInputAutofill.js`             | `src/input-autofill/OwcInputAutofill.rocket.md`                          | OK                                                                 |
| `OwcInputSlider.js`         | `src/input-slider/OwcInputSlider.js`                 | `src/input-slider/OwcInputSlider.rocket.md`                              | OK                                                                 |
| `OwcLayoutSidebar.js`       | `src/layout-sidebar/OwcLayoutSidebar.js`             | This audit                                                               | Follow-up: add component docs.                                     |
| `OwcLoadingScreen.js`       | `src/loading-screen/OwcLoadingScreen.js`             | This audit                                                               | Follow-up: add component docs.                                     |
| `OwcMultiCheckbox.js`       | `src/multi-checkbox/OwcMultiCheckbox.js`             | `src/multi-checkbox/OwcMultiCheckbox.demo.js`                            | OK                                                                 |
| `OwcPieChartElement.js`     | `src/chart/OwcPieChartElement.js`                    | This audit                                                               | Follow-up: add pie chart docs and split matching export directory. |
| `OwcPinboard.js`            | `src/pinboard/OwcPinboard.js`                        | `src/pinboard/OwcPinboard.rocket.md`                                     | OK                                                                 |
| `OwcQuestionnaire.js`       | `src/questionnaire/OwcQuestionnaire.js`              | `src/questionnaire/OwcQuestionnaire.rocket.md`                           | OK                                                                 |
| `OwcSeparator.js`           | `src/separator/OwcSeparator.js`                      | This audit                                                               | Follow-up: add component docs.                                     |
| `OwcTable.js`               | `src/OwcTable.js`                                    | `src/OwcTable.rocket.md`                                                 | Follow-up: move table modules under `src/table/`.                  |
| `OwcTable.types.ts`         | `src/OwcTable.types.ts`, filter and field-path types | `src/OwcTable.rocket.md`                                                 | Follow-up: align with table directory move.                        |
| `OwcTableFilterBuilder.js`  | `src/table-filter/OwcTableFilterBuilder.js`          | `src/table-filter/OwcTableFilterBuilder.rocket.md`                       | OK                                                                 |
| `OwcTableInfo.js`           | `src/OwcTableInfo.js`                                | `src/OwcTableInfo.rocket.md`                                             | Follow-up: move under matching component directory.                |
| `OwcTableMassEdit.js`       | `src/OwcTableMassEdit.js`                            | This audit                                                               | Follow-up: add docs and move under matching component directory.   |
| `OwcTabs.js`                | `src/tabs/OwcTabs.js`                                | `src/tabs/OwcTabs.rocket.md`                                             | OK                                                                 |
| `OwcTabs.types.ts`          | `src/tabs/OwcTabs.types.ts`                          | `src/tabs/OwcTabs.rocket.md`                                             | OK                                                                 |
| `OwcTemplateEditor.js`      | `src/template-editor/OwcTemplateEditor.js`           | `src/template-editor/OwcTemplateEditor.rocket.md`                        | OK                                                                 |
| `OwcTemplateEditorTypes.ts` | `src/template-editor/OwcTemplateEditorTypes.ts`      | `src/template-editor/OwcTemplateEditor.rocket.md`                        | OK                                                                 |
| `OwcToast.js`               | `src/toast/OwcToast.js`                              | `src/toast/OwcToast.rocket.md`                                           | OK                                                                 |
| `OwcTooltip.js`             | `src/tooltip/OwcTooltip.js`                          | `src/tooltip/OwcTooltip.rocket.md`                                       | OK                                                                 |
| `RowClickEvent.js`          | `src/RowClickEvent.js`                               | `src/OwcTable.rocket.md`                                                 | Follow-up: align with table directory move.                        |
| `WaveController.js`         | `src/waves/`                                         | `src/waves/WaveController.rocket.md`, `src/waves/ReactiveObject.demo.js` | OK                                                                 |
| `compress.js`               | `src/compress/`                                      | `src/compress/OwcCompress.rocket.md`, `src/compress/compress.demo.js`    | OK                                                                 |
| `csv.js`                    | `src/csv.js`                                         | This audit                                                               | Helper export; add API reference before stable `1.0`.              |
| `docsData.js`               | `exports/docsData.js`                                | This audit                                                               | Public docs metadata.                                              |
| `excel.js`                  | `src/excel.js`                                       | This audit                                                               | Helper export; add API reference before stable `1.0`.              |
| `filter.js`                 | `src/filter/`, `src/dateParserForJsonDecode.js`      | This audit                                                               | Helper export; add API reference before stable `1.0`.              |
| `highlightSearchTerms.js`   | `src/highlight-search-terms/highlightSearchTerms.js` | This audit                                                               | Helper export; add API reference before stable `1.0`.              |
| `jsonFormHelpers.js`        | `src/json-form/`                                     | `src/json-form/README.md`                                                | OK                                                                 |
| `lit-helpers.js`            | `src/lit-helpers/litHtmlToString.js`                 | This audit                                                               | Helper export; add API reference before stable `1.0`.              |
| `subListHelpers.js`         | `src/subListHelpers.js`                              | This audit                                                               | Helper export; add API reference before stable `1.0`.              |
| `templateHelpers.js`        | `src/template-editor/generateValueForData.js`        | `src/template-editor/OwcTemplateEditor.rocket.md`                        | OK                                                                 |
| `types.ts`                  | Aggregated type declarations                         | This audit                                                               | Follow-up: split type-only exports by component.                   |

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

- Table family: `OwcTable`, `OwcTableInfo`, `OwcTableMassEdit`, `RowClickEvent`, and table type exports.
- Chart family: `OwcChartElement` and `OwcPieChartElement`.
- Click-editable variants: input, autocomplete, textarea, and input-autofill.
- Shared helper/type entry points: `types.ts`, `csv.js`, `excel.js`, `filter.js`,
  `highlightSearchTerms.js`, `lit-helpers.js`, and `subListHelpers.js`.
