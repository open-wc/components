import { TemplateResult, nothing } from 'lit-html';
import {
  OwcClickEditableOptions,
  OwcClickEditableAutocompleteOptions,
  OwcClickEditableAutocompleteDataOptions,
} from '../click-editable/OwcClickEditable.types.js';
import {
  Field,
  FieldPathLabelDynamic,
  handleUpdate,
} from '../field-path-helper/getFieldPathContent.types.js';

export interface OwcDataDetailOptions<T> {
  data: T;
  columns: OwcDataDetailColumns<T>;
  openColumns?: openColumns<T>;
  fallbackValue?: string;
  handleUpdate?: handleUpdate<T>;
}

export type openColumns<T> = Array<Field<T>>;
export type OwcDataDetailColumns<T> = Array<Array<OwcDataDetailItem<T>>>;

export interface OwcDataDetailItem<T> {
  label: FieldPathLabelDynamic<T>;
  field: Field<T>;
  fieldFilteredReturn?: Field<T>;
  labelBadge?: (data: T) => TemplateResult | string | number;
  contentSuffix?: (data: T) => TemplateResult | string | number;
  contentExpanded?: (data?: T) => TemplateResult;
  type?: 'html' | 'string' | 'editable' | 'expandable';
  editableOptions?: EditableOptions<T>;
  formatter?: DataDetailFormatter<T>;
  formatterString?: DataDetailFormatter<T>;
  formatterCompare?: DataDetailFormatter<T>;
  visible?: boolean | ((data: T) => boolean);
}

export interface DataDetailFormatterFunctionOptions<T> {
  field?: string;
  currencyFormatter: Intl.NumberFormat;
  dateFormatter: Intl.DateTimeFormat;
  dateTimeFormatter: Intl.DateTimeFormat;
  numberFormatter: Intl.NumberFormat;
  override?: Partial<T>;
}

export type DataDetailFormatter<T> =
  | DataDetailFormatterFunction<T>
  | 'datetime'
  | 'date'
  | 'email'
  | 'tickCross'
  | 'currency'
  | 'number'
  | 'percent'
  | 'checkbox'
  | 'rownum'; // TODO: this is OwcTable specific, should be moved to OwcTable

export type DataDetailFormatterFunction<T> = (
  row: T,
  options: DataDetailFormatterFunctionOptions<T>,
) => TemplateResult | typeof nothing | string | number | undefined | null;

export interface EditableOptions<T> {
  massEdit?: boolean;
  type?: 'input' | 'textarea' | 'autocomplete' | 'checkbox';
  inputOptions?: OwcClickEditableOptions | OwcClickEditableAutocompleteOptions;
  insertInputOptions?: OwcClickEditableOptions | OwcClickEditableAutocompleteOptions;
  data?: OwcClickEditableAutocompleteDataOptions; // only for click editable autocomplete
  dataFn?: (row: T) => OwcClickEditableAutocompleteDataOptions; // only for click editable autocomplete
  required?: boolean;
}
