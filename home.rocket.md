```js server
export const config = {
  path: '/',
  title: '@finum/data-table',
  metadata: {
    title: '@finum/data-table',
    description: 'Developer documentation for Finum data, form, and workflow Web Components.',
    custom: {
      atlasDoc: {
        asideTip: {
          iconName: 'clipboard-check',
          title: 'Fast path',
          description:
            'Start from /components, pick the component, then copy the smallest demo that matches your use case.',
        },
      },
    },
  },
  menu: {
    iconName: 'house',
    order: 0,
  },
};

import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
import { docsData } from '@finum/data-table/docsData.js';

export const components = atlasDocComponents;
export const layout = pageData => docLayout(pageData, docsData);
```

# @finum/data-table

Web Components for data-heavy Finum interfaces: tables, detail views, form controls, workflow UI,
and the helper components around them.

This documentation is written for internal developers first. It should still be readable for future
open source maintainers and package users, but the main job is practical: get from "I need this UI"
to a working component example quickly.

## Start here

1. Open [Components](/components).
2. Pick the component by UI pattern.
3. Copy the smallest working demo from the reference page.
4. Replace the demo data with application data.

## Basic usage

Register the component through its `define` export:

```js
import '@finum/data-table/define/owc-table.js';
```

Use it with concrete data. This example is intentionally complete enough to paste into a Lit view:

```js
import { html } from 'lit';
import '@finum/data-table/define/owc-table.js';

const columns = [
  { label: 'First name', field: 'firstName', filterable: true },
  { label: 'Last name', field: 'lastName', filterable: true },
];

const rows = [
  { id: '1', firstName: 'Max', lastName: 'Mustermann' },
  { id: '2', firstName: 'Lisa', lastName: 'Musterfrau' },
];

export const view = () => html` <owc-table .columns=${columns} .data=${rows}></owc-table> `;
```

## What is documented

- Data-heavy components such as [Table](/components/table), [Data Detail](/components/data-detail),
  and [Card List](/components/card-list).
- Form and input helpers such as [Json Form](/components/json-form),
  [Autocomplete](/components/autocomplete), and [Input Autofill](/components/input-autofill).
- Workflow UI components such as [Template Editor](/components/template-editor),
  [File Upload](/components/file-upload), and [Compose Email](/components/compose-email).

## Maintenance notes

Component reference pages live next to the component source where possible. Keep examples small,
copyable, and close to real application usage. Prefer static Markdown pages with `js demo` blocks
unless a page truly needs request-time behavior.
