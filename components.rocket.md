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

- [Table](/data/table): sortable, filterable tabular data with optional selection and settings.
- [Chart](/data/chart): line and bar charts from data series.
- [Pie Chart](/data/pie-chart): proportional slices with an optional "other" slice.
- [Data Detail](/data/data-detail): structured detail view for one record.
- [Detail Card](/data/detail-card): compact record card.
- [Card](/data/card): generic card shell.
- [Card List](/data/card-list): repeated cards backed by data.
- [Pinboard](/data/pinboard): pinboard-style collection view.

## Forms

Schema-driven forms and the input controls that compose them.

- [Json Form](/forms/json-form): schema-driven form rendering.
- [Autocomplete](/forms/autocomplete): searchable option selection.
- [Input Autofill](/forms/input-autofill): text input with suggestions or fill behavior.
- [Input Slider](/forms/input-slider): numeric input with slider interaction.
- [Click Editable Input](/forms/click-editable-input): inline editable text.
- [Click Editable Textarea](/forms/click-editable-textarea): inline editable long text.
- [Click Editable Autocomplete](/forms/click-editable-autocomplete): inline editable option selection.
- [Click Editable Input Autofill](/forms/click-editable-input-autofill): inline editable values with autofill behavior.
- [Multi Checkbox](/forms/multi-checkbox): checkbox with more functionality.

## Layout

Application shell and page structure.

- [Layout Sidebar](/layout/layout-sidebar): application layout with a resizable navigation sidebar.
- [Tabs](/layout/tabs): tabbed content.
- [Loading Screen](/layout/loading-screen): centered spinner with progress for application startup.
- [Separator](/layout/separator): horizontal or vertical divider with optional label.

## Utilities

Small helpers, feedback elements, and controllers.

- [Toast](/utilities/toast): transient status messages.
- [Tooltip](/utilities/tooltip): contextual hover or focus help.
- [Icon Button](/utilities/icon-button): compact icon-only actions.
- [Count Up](/utilities/count-up): animated numeric display.
- [Compress](/utilities/compress): string compression helpers documented with demos.
- [Wave Controller](/utilities/wave-controller): reactive controller documentation for wave-style state flows.

## Workflow

Larger task-oriented surfaces.

- [Template Editor](/workflow/template-editor): template editing and generated content workflows.
- [Compose Email](/workflow/compose-email): email composition surfaces.
- [File Upload](/workflow/file-upload): upload controls.
- [Questionnaire](/workflow/questionnaire): questionnaire-style UI flows.

## Internal components

those components are not key features but rather components used inside of other components. some documentation exist but might not be finished.

- [Table Info](/internal/table-info): summary metadata around table state or results.
- [Table Mass Edit](/internal/table-mass-edit): bulk edits applied to selected table rows.
- [Filter Builder](/internal/filter-builder): standalone table-style query rules.
