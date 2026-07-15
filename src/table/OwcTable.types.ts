import { CSSResult, TemplateResult } from 'lit';
import { DirectiveResult } from 'lit/directive.js';
import { Filter, JsonFilter, NestedJsonFilters } from './filter.type.js';
import { OwcMultiCheckboxOptions } from '../multi-checkbox/OwcMultiCheckbox.types.js';
import {
  Field,
  FieldPathLabel,
  handleUpdate,
} from '../field-path-helper/getFieldPathContent.types.js';
import { EditableOptions } from '../data-detail/OwcDataDetail.types.js';
import { Tabs } from '../tabs/OwcTabs.types.js';

export interface FormatterFunctionOptions<T> {
  index?: number;
  field?: string;
  currencyFormatter: Intl.NumberFormat;
  dateFormatter: Intl.DateTimeFormat;
  dateTimeFormatter: Intl.DateTimeFormat;
  numberFormatter: Intl.NumberFormat;
  percentFormatter?: Intl.NumberFormat;
  fieldValueFiltered?: Array<unknown>; // TODO: this is OwcTable specific, should be moved to OwcTable
  override?: Partial<T>;
}

export type FormatterFunction<T> = (
  row: T,
  options: FormatterFunctionOptions<T>,
) => TemplateResult | string | number;

export type Formatter<T> =
  | FormatterFunction<T>
  | 'datetime'
  | 'date'
  | 'email'
  | 'tickCross'
  | 'rownum'
  | 'currency'
  | 'number'
  | 'percent'
  | 'checkbox';

export type Visibility = 'never' | 'always' | 'ifFiltered';

// type Join<K, P> = K extends string | number
//   ? P extends string | number
//     ? `${K}${'' extends P ? '' : '.'}${P}`
//     : never
//   : never;

// // Taken from https://stackoverflow.com/questions/58434389/typescript-deep-keyof-of-a-nested-object
// export type Paths<T, D extends number = 10> = [D] extends [never]
//   ? never
//   : T extends object
//   ? {
//       [K in keyof T]-?: K extends string | number ? `${K}` | Join<K, Paths<T[K], Prev[D]>> : never;
//     }[keyof T]
//   : '';

// if this is an interface OwcTableSettings breaks
export type Column<T> = {
  label: FieldPathLabel;
  labelString?: string;
  field: Field<T>;
  fieldFilteredReturn?: Field<T>;
  width?: number;
  _calculatedWidth?: number;
  headerSort?: boolean;
  formatter?: Formatter<T>;
  formatterString?: Formatter<T>;
  formatterCompare?: Formatter<T>;
  filterable?: boolean;
  excludeGlobalSearch?: boolean;
  filterType?:
    | 'text'
    | 'number'
    | 'date'
    | 'datetime'
    | 'boolean'
    | 'checkbox'
    | 'autocomplete'
    | 'array'
    | 'custom'; // default to 'text'
  filterOptions?: MultiSelectOptions<T> | OwcMultiCheckboxOptions; // only for type 'enum', 'multiselect' and 'multicheckbox'
  filterOptionsFn?: () => MultiSelectOptions<T> | OwcMultiCheckboxOptions;
  filterRenderer?: FilterRenderer; // only for type 'custom'
  sorter?: JsonSorter[];
  visible?: Visibility; // default to 'always' (ifFiltered means show column only if it is filtered)
  cellClass?: string;
  resizable?: boolean; // default to true
  align?: 'start' | 'center' | 'end' | 'full'; // default to start
  includeInExport?: boolean; // default to true
  description?: string | TemplateResult | (() => TemplateResult);
  subDescription?: string | TemplateResult | (() => TemplateResult);
  type?: RowType;
  editableOptions?: EditableOptions<T>;
  showInCalculateSums?: boolean; // default to false
  deleteButtonOptions?: {
    action: (row: T) => Promise<void>;
  };
  contentSuffix?: (data: T) => TemplateResult;
};

export interface Overrides {
  visibility: { [column: string]: Visibility };
  order?: string[];
}

export type MultiSelectOptions<T> = readonly { value: T | number | string; label: string }[];

export type FilterRenderer = (
  filter: JsonFilter,
  updateFilter: (filter: JsonFilter) => void,
) => TemplateResult;

type SorterParam = Record<string, unknown>;

export type Sorter = (a: SorterParam, b: SorterParam) => number;

export type JsonSorter = {
  field: string;
  order?: 'desc' | 'asc' | undefined;
  sortType?: 'dateNoYear';
};

export interface RowLinkSettings {
  href: string;
  'aria-label'?: string;
}

export interface SelectorSettings {
  'aria-label'?: string;
}

export interface OwcTableOptions<T> {
  /**
   * The prefix of the store name to save the state of the table (used for saving the state of the table in the URL & localstorage)
   * Defaults to: 'owc-table'
   */
  storeNamePrefix?: string;
  columns?: Array<Column<T>>;
  filter?: Filter<Record<string, T>>;
  /** compare functions applied to the data - use `jsonSorters` for the declarative form */
  sorters?: Array<Sorter>;
  jsonFilters?: NestedJsonFilters;
  jsonSorters?: Array<JsonSorter>;
  filterMode?: 'hidden' | 'global-search' | 'global-search-with-builder' | 'builder';
  getRowLinkSettings?: (row: T) => RowLinkSettings | undefined;
  getSelectorSettings?: (row: T) => SelectorSettings;
  selectable?: boolean;
  showInfo?: boolean;
  stickyHeader?: boolean;
  saveStateToUrl?: boolean;
  actionTabs?: Tabs<OwcTableActionTabsRenderOptions<T>>;
  actionTabActive?: string;
  emptyMessage?: TemplateResult;
  handleInsert?: () => T;
  handleUpdate?: handleUpdate<T>;
  handleData?: (options: { jsonFilters: NestedJsonFilters }) => Promise<Array<T>>;
  handleDataOptions?: Partial<HandleDataOptions>;
  renderMode?: RenderMode;
  renderDetail?: renderDetail<T> | renderDetailPromise<T>;
  renderAnnotation?: RenderAnnotation<T>;
  renderHeaderContent?: RenderHeaderContent;
  groupList?: {
    label: string;
    key: string;
    priority?: number;
    active?: boolean;
    backgroundColor?: string;
    textColor?: string;
  }[];
  groupSelector?: (row: T) => string;
  /**
   * Here you can pass custom styles that are injected into the tables shadow DOM.
   * You can use this to style your OWN css classes you are settings via formatters.
   *
   * WARNING: If you style any classes that are part of the table itself then there is NO GUARANTEE that this will work in the future.
   */
  customStyles?: CSSResult;
  // formatters
  dateFormatter?: Intl.DateTimeFormat;
  dateTimeFormatter?: Intl.DateTimeFormat;
  numberFormatter?: Intl.NumberFormat;
  currencyFormatter?: Intl.NumberFormat;
  percentFormatter?: Intl.NumberFormat;
  virtualizerMode?: 'always' | 'never' | 'auto';
}

/**
 * Options for handling data in the table.
 */
export interface HandleDataOptions {
  /**
   * The mode in which data handling should operate.
   * Defaults to 'initiallyOnce'.
   */
  mode: DataOptionsMode;

  /**
   * The debounce time in milliseconds to wait before processing data.
   * Defaults to 500.
   * If mode is 'initiallyOnce', this option is ignored.
   * You can set it to 0 to disable debouncing.
   */
  debounceTime: number;

  /**
   * A condition function that determines whether to proceed with data handling.
   * It can either be a simple function returning a boolean or a function that
   * takes an options object containing `jsonFilters` and returns a boolean.
   */
  condition?:
    | (() => boolean)
    | ((options: { jsonFilters: NestedJsonFilters; oldFilters?: NestedJsonFilters }) => boolean);

  /**
   * A refresh button that fetches the data again when clicked
   */
  refreshButton?: boolean;
}

// NOTE: 'initiallyAndAnyFilterChange' is not implemented yet in OwcTable
export type DataOptionsMode = 'initiallyOnce' | 'initiallyAndAnyFilterChange' | 'anyFilterChange';

export type renderDetail<T> = (
  row: T,
  options: { jsonFilters: NestedJsonFilters; closeDetail: () => void },
) => TemplateResult;

export type renderDetailPromise<T> = (
  row: T,
  options: { jsonFilters: NestedJsonFilters; closeDetail: () => void },
) => Promise<TemplateResult>;

export type RenderAnnotation<T> = (row: T) => TemplateResult | DirectiveResult;
export type RenderHeaderContent = (options: {
  // formatters
  dateFormatter: Intl.DateTimeFormat;
  dateTimeFormatter: Intl.DateTimeFormat;
  numberFormatter: Intl.NumberFormat;
  currencyFormatter: Intl.NumberFormat;
  percentFormatter: Intl.NumberFormat;
}) => TemplateResult | DirectiveResult;

export interface ConvertToCsvOptions<T> {
  visibleColumns: Array<Column<T>>;
  separator?: string;
  jsonFilters?: NestedJsonFilters;
  jsonSorters?: Array<JsonSorter>;
  // formatters
  dateFormatter?: Intl.DateTimeFormat;
  dateTimeFormatter?: Intl.DateTimeFormat;
  numberFormatter?: Intl.NumberFormat;
  currencyFormatter?: Intl.NumberFormat;
  percentFormatter?: Intl.NumberFormat;
}

export type RowType = 'html' | 'string' | 'editable';

export type RenderMode = 'simple' | 'link' | 'detail' | 'detailDeferred' | 'linkWithDetail';

export interface OwcTableActionTabsRenderOptions<T> {
  selectedData: Array<T>;
  processedData: Array<T>;
  columns: Array<Column<T>>;
  // formatters
  dateFormatter: Intl.DateTimeFormat;
  dateTimeFormatter: Intl.DateTimeFormat;
  numberFormatter: Intl.NumberFormat;
  currencyFormatter: Intl.NumberFormat;
  percentFormatter: Intl.NumberFormat;
}
