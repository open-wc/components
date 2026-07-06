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

## Data

Tables, charts, and record views for displaying application data.

- [Table](/table): sortable, filterable tabular data with optional selection and settings.
- [Table Info](/table-info): summary metadata around table state or results.
- [Table Mass Edit](/table-mass-edit): bulk edits applied to selected table rows.
- [Filter Builder](/filter-builder): standalone table-style query rules.
- [Chart](/chart): line and bar charts from data series.
- [Pie Chart](/pie-chart): proportional slices with an optional "other" slice.
- [Data Detail](/data-detail): structured detail view for one record.
- [Detail Card](/detail-card): compact record card.
- [Card](/card): generic card shell.
- [Card List](/card-list): repeated cards backed by data.
- [Pinboard](/pinboard): pinboard-style collection view.

## Forms

Schema-driven forms and the input controls that compose them.

- [Json Form](/json-form): schema-driven form rendering.
- [Autocomplete](/autocomplete): searchable option selection.
- [Input Autofill](/input-autofill): text input with suggestions or fill behavior.
- [Input Slider](/input-slider): numeric input with slider interaction.
- [Click Editable Input](/click-editable-input): inline editable text.
- [Click Editable Textarea](/click-editable-textarea): inline editable long text.
- [Click Editable Autocomplete](/click-editable-autocomplete): inline editable option selection.
- [Click Editable Input Autofill](/click-editable-input-autofill): inline editable values with autofill behavior.

## Layout

Application shell and page structure.

- [Layout Sidebar](/layout-sidebar): application layout with a resizable navigation sidebar.
- [Tabs](/tabs): tabbed content.
- [Loading Screen](/loading-screen): centered spinner with progress for application startup.
- [Separator](/separator): horizontal or vertical divider with optional label.

## Workflow

Larger task-oriented surfaces.

- [Template Editor](/template-editor): template editing and generated content workflows.
- [Compose Email](/compose-email): email composition surfaces.
- [File Upload](/file-upload): upload controls.
- [Questionnaire](/questionnaire): questionnaire-style UI flows.

## Utilities

Small helpers, feedback elements, and controllers.

- [Toast](/toast): transient status messages.
- [Tooltip](/tooltip): contextual hover or focus help.
- [Icon Button](/icon-button): compact icon-only actions.
- [Count Up](/count-up): animated numeric display.
- [Compress](/compress): string compression helpers documented with demos.
- [Wave Controller](/wave-controller): reactive controller documentation for wave-style state flows.
