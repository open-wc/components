import type { Schema } from '@cfworker/json-schema';

/**
 * JSON Schema Draft 7 as consumed by JsonForm.
 *
 * Validation is provided by @cfworker/json-schema, so this type builds on the
 * schema accepted by that validator and adds the annotation fields JsonForm
 * renders directly.
 */
export interface JsonSchema7 extends Schema {
  title?: string;
  description?: string;
  default?: unknown;
  unit?: string;
  readOnly?: boolean;
  writeOnly?: boolean;
  examples?: unknown[];
  errorMessage?: unknown;
}

export type RuleEffect = 'SHOW' | 'HIDE' | 'ENABLE' | 'DISABLE';

export interface Rule {
  effect: RuleEffect;
  condition: {
    scope: string;
    schema: JsonSchema7;
  };
}

export interface LabelDescription {
  text?: string;
  show?: boolean;
}

export type AutofillOption =
  | { label: string; value: string; fill?: never }
  | { label: string; fill: Record<string, unknown>; value?: never };

/** Options understood by JsonForm, plus flags for custom renderers. */
export interface UISchemaOptions {
  autofill?: AutofillOption[];
  danger?: boolean;
  fallbackValue?: string;
  format?: string;
  formatter?: string;
  formatterScope?: string;
  hidePlus?: boolean;
  hideTrash?: boolean;
  label?: string;
  multi?: boolean;
  newLineToBr?: boolean;
  plain?: boolean;
  rating?: boolean;
  readonly?: boolean;
  renderers?: 'default' | 'clickEditable';
  showCopyButton?: boolean;
  size?: string;
  slider?: boolean;
  tabNames?: string[];
  tagVariant?: string;
  toggle?: boolean;
  type?: 'vertical' | 'horizontal';
  [customRenderer: string]: unknown;
}

export interface BaseUISchemaElement {
  type: string;
  rule?: Rule;
  options?: UISchemaOptions;
}

export interface ControlElement extends BaseUISchemaElement {
  type: 'Control';
  scope: string;
  label?: string | boolean | LabelDescription;
}

export interface LabelElement extends BaseUISchemaElement {
  type: 'Label';
  text?: string;
  scope?: string;
}

export interface SeparatorElement extends BaseUISchemaElement {
  type: 'Separator';
}

export interface ElementListLayout extends BaseUISchemaElement {
  type:
    | 'VerticalLayout'
    | 'VerticalLayout2'
    | 'VerticalLayoutGrid'
    | 'HorizontalLayout'
    | 'GroupLayout'
    | 'CheckboxComboLayout'
    | 'TabLayout';
  elements: UISchemaElement[];
  label?: string;
}

export interface VerticalLayout extends ElementListLayout {
  type: 'VerticalLayout';
}

export interface HorizontalLayout extends ElementListLayout {
  type: 'HorizontalLayout';
}

export interface GroupLayout extends ElementListLayout {
  type: 'GroupLayout';
  label: string;
}

export interface ArrayLayoutElement extends BaseUISchemaElement {
  type: 'ArrayLayout';
  scope: string;
  label?: string;
  elements: UISchemaElement;
}

export interface DetailsLayoutElement extends BaseUISchemaElement {
  type: 'DetailsLayout';
  label: string;
  subLayout: Layout;
}

export type Layout = ElementListLayout | ArrayLayoutElement | DetailsLayoutElement;

export type UISchemaElement = ControlElement | LabelElement | SeparatorElement | Layout;
