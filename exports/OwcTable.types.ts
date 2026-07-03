export {
  HandleUpdateOptions,
  handleUpdate,
} from '../src/field-path-helper/getFieldPathContent.types.js';

import { OwcTable } from './OwcTable.js';

export {
  NestedJsonFilters,
  operator,
  dateOperator,
  textOperator,
  numberOperator,
} from '../src/filter/filter.type.js';

export { Column } from '../src/table/OwcTable.types.js';

declare global {
  interface HTMLElementTagNameMap {
    'owc-table': OwcTable<Record<string, unknown>>;
  }
}
