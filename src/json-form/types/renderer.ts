import { ValidationResult } from '@cfworker/json-schema';
import { ControlElement, JsonSchema7 } from '@jsonforms/core';
import { TemplateResult } from 'lit';

export type ControlRenderer = (
  state: State,
  ruleOptions: { disabled: boolean; hidden: boolean },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any,
) => TemplateResult;

export type RendererKind =
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

export type RendererRecord = Record<RendererKind, ControlRenderer | undefined>;
export type FullRendererRecord = Record<RendererKind, ControlRenderer>;

export interface State {
  schema: JsonSchema7; // only the part of the schema that the control sees, eg. { type: string, options: {...}, title: "Input"}
  uiSchema: ControlElement; // only the part of the schema that the control sees, eg. { type: 'Control', scope: "#/props/input"}
  validatorState: ValidationResult;
  required: boolean;
  renderers?: RendererRecord;
  forceErrors: boolean;
}
