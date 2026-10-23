import { Column, OwcTableOptions } from '@open-wc/components/table/types.js';
import { JsonFilter, NestedJsonFilters } from '@open-wc/components/filter/types.js';
import { OwcClickEditableOptions } from '@open-wc/components/OwcClickEditable.types.js';
import { OwcCardListOptions } from '@open-wc/components/OwcCardList.types.js';
import '@open-wc/components/OwcLayoutSidebar.types.js';
import { OwcDataDetailColumns } from '@open-wc/components/OwcDataDetail.types.js';
import { OwcTableFilter } from '@open-wc/components/OwcTableFilterBuilder.js';
import { OwcLayoutSidebar } from '@open-wc/components/OwcLayoutSidebar.js';
import { OwcTable } from '@open-wc/components/OwcTable.js';
import '@open-wc/components/OwcCardList.types.js';
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

export function useScrollTarget(table: OwcTable<Row>, root: ShadowRoot) {
  table.scrollTarget = root.querySelector('.scroll-area');
  table.scrollTarget = undefined;
  // @ts-expect-error removed with the in-house virtualizer
  void table.virtualizer;
  // @ts-expect-error removed with the in-house virtualizer
  void table.virtualizerHost;
  // @ts-expect-error removed with the in-house virtualizer
  table.resetVirtualizer();
}

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
export const layoutSidebar = OwcLayoutSidebar;
