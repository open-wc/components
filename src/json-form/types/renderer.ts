import { ValidationResult } from '@cfworker/json-schema';
import { TemplateResult } from 'lit';
import { ControlElement, JsonSchema7 } from './schema.js';

export type ControlRenderer = (
  state: State,
  ruleOptions: { disabled: boolean; hidden: boolean },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any,
) => TemplateResult;

export type RendererKind =
  | 'autofill'
  | 'checkboxTag'
  | 'date'
  | 'time'
  | 'datetime'
  | 'string'
  | 'boolean'
  | 'number'
  | 'integer'
  | 'enum'
  | 'multiEnum';

export type { AutofillOption } from './schema.js';

export type RendererRecord = Partial<Record<RendererKind, ControlRenderer>>;
export type FullRendererRecord = Record<RendererKind, ControlRenderer>;

export interface State {
  schema: JsonSchema7; // only the part of the schema that the control sees, eg. { type: string, options: {...}, title: "Input"}
  uiSchema: ControlElement; // only the part of the schema that the control sees, eg. { type: 'Control', scope: "#/props/input"}
  validatorState: ValidationResult;
  required: boolean;
  renderers?: RendererRecord;
  forceErrors: boolean;
}
