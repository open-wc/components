import { TemplateResult } from 'lit';
import { Leaves } from './leaves.js';
import { DataDetailFormatter, EditableOptions } from '../data-detail/OwcDataDetail.types.js';

export interface getFieldPathContentOptions<T> {
  renderType?: 'html' | 'string' | 'compare';
  requiredFields?: Array<Field<T>>;
  render?: (options: { content?: Content; config: FieldPathConfig<T> }) => TemplateResult | string;
  handleUpdate?: (options: HandleUpdateOptions<T>) => Promise<void>;
  additionalFormatterOptions?: (options: { data: T; config: FieldPathConfig<T> }) => object;
  additionalFormatter?: (
    data: T,
    options: { config: FieldPathConfig<T>; content: Content; custom?: Record<string, unknown> },
  ) => Content;
  renderInitiallyAsEditableCondition?: (options: {
    data: T;
    config: FieldPathConfig<T>;
  }) => boolean;
  isInsert?: (options: { data: T; config: FieldPathConfig<T> }) => boolean;
  custom?: Record<string, unknown>;
  compareOverrides?: Record<string, Partial<T>>;
  fallbackValue?: string;
  // formatters
  dateFormatter?: Intl.DateTimeFormat;
  dateTimeFormatter?: Intl.DateTimeFormat;
  numberFormatter?: Intl.NumberFormat;
  currencyFormatter?: Intl.NumberFormat;
  percentFormatter?: Intl.NumberFormat;
}

type Content = TemplateResult | string | number | boolean | Date | unknown;

// additionalFormatter,
// renderInitiallyAsEditableCondition = () => false,
// isInsert = () => false,

export type FieldPathConfig<T> = {
  label: FieldPathLabel | FieldPathLabelDynamic<T>;
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
};

// FIXME: Remove "id" after we removed hardcoded "id" field in csv.js
export type Field<T> = Leaves<T, 3> | `_${string}` | '' | 'id';

export type FieldPathLabel = TemplateResult | string | (() => TemplateResult);

export type FieldPathLabelDynamic<T> = FieldPathLabel | ((row: T) => string | TemplateResult);

export type handleUpdate<T> = (options: HandleUpdateOptions<T>) => Promise<void>;
export interface HandleUpdateOptions<T> {
  field: Field<T>;
  data: T;
  config: FieldPathConfig<T>;
  event: MouseEvent;
  value: unknown;
  allRequiredFieldsAreFilled: (data?: T) => boolean;
  isNewInsert: boolean;
  autoSetData: (data?: T) => void;
}
