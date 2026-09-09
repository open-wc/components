export {
  Column,
  ConvertToCsvOptions,
  DataOptionsMode,
  FilterRenderer,
  Formatter,
  FormatterFunction,
  FormatterFunctionOptions,
  HandleDataOptions,
  JsonSorter,
  MultiSelectOptions,
  Overrides,
  OwcTableActionTabsRenderOptions,
  OwcTableOptions,
  RenderAnnotation,
  RenderHeaderContent,
  RenderMode,
  RowLinkSettings,
  RowType,
  SelectorSettings,
  Sorter,
  Visibility,
  renderDetail,
  renderDetailPromise,
} from '../../src/table/OwcTable.types.js';

export {
  Field,
  FieldPathLabel,
  HandleUpdateOptions,
  handleUpdate,
} from '../../src/field-path-helper/getFieldPathContent.types.js';

import { OwcTable } from '../OwcTable.js';

declare global {
  interface HTMLElementTagNameMap {
    'owc-table': OwcTable<Record<string, unknown>>;
  }
}
