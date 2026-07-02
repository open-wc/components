import { TemplateResult } from 'lit';
import { DirectiveResult } from 'lit/directive.js';

export interface OwcClickEditableOptions {
  formatter?: (arg: unknown) => TemplateResult | DirectiveResult;
  editable?: boolean;
  formAlign?: 'start' | 'center' | 'end';
  type?: valueType;
  readOnly?: boolean;
  showCopyButton?: boolean;
  validator?: (arg: unknown) => { valid: boolean; error?: string };
  fallbackValue?: string;
}

export interface OwcClickEditableAutocompleteOptions extends OwcClickEditableOptions {
  multiple?: boolean;
  clearable?: boolean;
  hideSelectAll?: boolean;
  open?: boolean;
  hasFocus?: boolean;
}

export type OwcClickEditableAutocompleteDataOptions = readonly { label: string; value: unknown }[];

export type valueType =
  | 'number'
  | 'email'
  | 'text'
  | 'search'
  | 'time'
  | 'date'
  | 'datetime-local'
  | 'password'
  | 'tel'
  | 'url';
