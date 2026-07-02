import { OwcComposeEmail } from './OwcComposeEmail.js';
import { OwcTable } from './OwcTable.js';
import { OwcLayoutSidebar } from './OwcLayoutSidebar.js';
import { OwcCardList } from './OwcCardList.js';
export { OwcTableOptions, Column } from '../src/OwcTable.types.js';
export {
  OwcClickEditableOptions,
  OwcClickEditableAutocompleteOptions,
  OwcClickEditableAutocompleteDataOptions,
} from '../src/click-editable/OwcClickEditable.types.js';
export { OwcTableFilter } from '../src/table-filter/OwcTableFilter.js';
export { OwcCardListOptions } from '../src/card-list/CardListTypes.js';
export { OwcDataDetailColumns } from '../src/data-detail/OwcDataDetail.types.js';
declare global {
  interface HTMLElementTagNameMap {
    'owc-table': OwcTable<Record<string, unknown>>;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'owc-compose-email': OwcComposeEmail<Record<string, string> & { user: { email: string } }>;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'owc-layout-sidebar': OwcLayoutSidebar;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'owc-card-list': OwcCardList<Record<string, unknown>>;
  }
}
