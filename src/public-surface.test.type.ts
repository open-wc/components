import { Column, OwcTableOptions } from '@open-wc/components/table/types.js';
import { JsonFilter, NestedJsonFilters } from '@open-wc/components/filter/types.js';
import { OwcClickEditableOptions } from '@open-wc/components/OwcClickEditable.types.js';
import { OwcCardListOptions } from '@open-wc/components/OwcCardList.types.js';
import '@open-wc/components/OwcComposeEmail.types.js';
import '@open-wc/components/OwcLayoutSidebar.types.js';
import { OwcDataDetailColumns } from '@open-wc/components/OwcDataDetail.types.js';
import { OwcTableFilter } from '@open-wc/components/OwcTableFilterBuilder.js';
import { OwcComposeEmail } from '@open-wc/components/OwcComposeEmail.js';
import { OwcLayoutSidebar } from '@open-wc/components/OwcLayoutSidebar.js';
import '@open-wc/components/OwcCardList.types.js';
import '@open-wc/components/OwcComposeEmail.types.js';
import '@open-wc/components/OwcLayoutSidebar.types.js';
import '@open-wc/components/OwcTable.types.js';

type Row = { name: string };

export const column: Column<Row> = {
  label: 'Name',
  field: 'name',
};

export const tableOptions: OwcTableOptions<Row> = {
  columns: [column],
};

export const filter: JsonFilter = {
  field: 'name',
  operator: 'includes',
  value: 'Ada',
};

export const nestedFilters: NestedJsonFilters = [filter];

export const clickEditableOptions: OwcClickEditableOptions = {
  editable: true,
};

export const cardListOptions: OwcCardListOptions<Row> = {
  title: 'Names',
  fields: {
    body: row => row.name,
  },
};

export const dataDetailColumns: OwcDataDetailColumns<Row> = [
  [
    {
      label: 'Name',
      field: 'name',
    },
  ],
];

export const tableFilter = OwcTableFilter;
export const composeEmail = OwcComposeEmail;
export const layoutSidebar = OwcLayoutSidebar;
