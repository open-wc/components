```js server
export const config = {
  path: '/components',
  title: 'Components',
  metadata: {
    title: 'Components',
    description: 'Index of @open-wc/components component reference pages.',
    custom: {
      atlasDoc: {
        asideTip: {
          iconName: 'search',
          title: 'Finding a component',
          description:
            'Use this page by UI intent first. Open the component page for the actual demo code.',
        },
      },
    },
  },
  menu: {
    iconName: 'grid-3x3-gap',
    order: 10,
  },
};

import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
import { docsData } from '@open-wc/components/docsData.js';

export const components = atlasDocComponents;
export const layout = pageData => docLayout(pageData, docsData);
```

# Components

Find the component by the interface problem you are solving. The reference pages contain the
copyable demos.

## Core data views

- [Table](/components/table): sortable, filterable tabular data with optional selection and settings.
- [Table Info](/components/table-info): summary metadata around table state or results.
- [Table Mass Edit](/components/table-mass-edit): bulk edits applied to selected table rows.
- [Table Filter Builder](/components/filter-builder): standalone table-style query rules.
- [Chart](/components/chart): line and bar charts from data series.
- [Pie Chart](/components/pie-chart): proportional slices with an optional "other" slice.
- [Data Detail](/components/data-detail): structured detail view for one record.
- [Detail Card](/components/detail-card): compact record card.
- [Card](/components/card): generic card shell.
- [Card List](/components/card-list): repeated cards backed by data.
- [Pinboard](/components/owc-pinboard): pinboard-style collection view.

## Forms and inputs

- [Json Form](/components/json-form): schema-driven form rendering.
- [Autocomplete](/components/autocomplete): searchable option selection.
- [Input Autofill](/components/input-autofill): text input with suggestions or fill behavior.
- [Input Slider](/components/input-slider): numeric input with slider interaction.
- [Click Editable Input](/components/click-editable-input): inline editable text.
- [Click Editable Textarea](/components/click-editable-textarea): inline editable long text.
- [Click Editable Autocomplete](/components/click-editable-autocomplete): inline editable option selection.
- [Click Editable Input Autofill](/components/click-editable-input-autofill): inline editable values with autofill behavior.

## Layout and application shell

- [Layout Sidebar](/components/layout-sidebar): application layout with a resizable navigation sidebar.
- [Loading Screen](/components/loading-screen): centered spinner with progress for application startup.
- [Separator](/components/separator): horizontal or vertical divider with optional label.

## Workflow components

- [Template Editor](/components/template-editor): template editing and generated content workflows.
- [Compose Email](/components/compose-email): email composition surfaces.
- [File Upload](/components/file-upload): upload controls.
- [Tabs](/components/tabs): tabbed content.
- [Tooltip](/components/tooltip): contextual hover or focus help.
- [Toast](/components/toast): transient status messages.
- [Icon Button](/components/icon-button): compact icon-only actions.
- [Count Up](/components/count-up): animated numeric display.
- [Compress](/components/compress): string compression helpers documented with demos.
- [Questionnaire](/components/owc-questionnaire): questionnaire-style UI flows.
- [WaveController](/components/WaveController): reactive controller documentation for wave-style state flows.
