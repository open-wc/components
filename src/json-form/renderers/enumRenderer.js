import { classMap } from 'lit/directives/class-map.js';
import { map } from 'lit/directives/map.js';
import { html, unsafeStatic } from 'lit/static-html.js';

import '@awesome.me/webawesome/dist/components/option/option.js';
import '@awesome.me/webawesome/dist/components/radio-group/radio-group.js';
import '@awesome.me/webawesome/dist/components/radio/radio.js';
import '@awesome.me/webawesome/dist/components/select/select.js';

import { processLabel } from '../label/label.js';
import { inputListener } from './inputListener.js';
import { dataPathSegments, resolveDataSchema } from '../resolve.js';
import { when } from 'lit/directives/when.js';
import { ifDefined } from 'lit/directives/if-defined.js';

if (!customElements.get('owc-autocomplete')) {
  import('@open-wc/components/define/owc-autocomplete.js');
}

/**@type {import("../types/renderer.js").ControlRenderer} */
export const enumRenderer = (state, ruleOptions, value) => {
  const _enum = state.schema.oneOf ? state.schema.oneOf : enumToOneOf(state.schema.enum);
  let staticOuter;
  /**@type {any}*/
  let staticInner;
  if (state.uiSchema.options?.format === 'radio') {
    staticOuter = unsafeStatic('wa-radio-group');
    staticInner = unsafeStatic('wa-radio');
  } else {
    return renderAutocomplete(state, ruleOptions, value);
  }

  const userInteracted = Boolean(resolveDataSchema(value, state.uiSchema.scope) !== null);
  const error = getError(state.uiSchema, state.validatorState);
  const invalid = Boolean(error);
  return html`<${staticOuter}
  ?disabled=${ruleOptions.disabled || state.uiSchema.options?.readonly || false}
    @change=${inputListener(state.uiSchema, 'value', value => (state.schema.type === 'number' ? Number.parseFloat(value) : value))}
    class=${classMap({
      hidden: ruleOptions.hidden,
      invalid: (userInteracted || state.forceErrors) && invalid,
    })}
    .label=${`${processLabel(state)}${state.required ? '*' : ''}`}
    .value=${ifDefined(resolveDataSchema(value, state.uiSchema.scope)).toString()}
  >
    ${map(
      // @ts-ignore
      _enum,
      option =>
        html`<${staticInner} .value=${option.const.toString()}>${option.title}</${staticInner}>`,
    )}
  </${staticOuter}>
  ${when(
    (userInteracted || state.forceErrors) && invalid,
    () => html`<span class="error" slot="hint">${error?.error}</span>`,
  )}
  `;
};

/**
 * @param {import("../types/renderer.js").State} state
 * @param {{ disabled: boolean; hidden: boolean }} ruleOptions
 * @param {any} value
 * @param {{multiple?: boolean; onSubmit?: () => any; postProcessing?: (arg0: any) => any;}} options
 * @returns {import("lit").TemplateResult}
 */
function renderAutocomplete(state, ruleOptions, value, options = {}) {
  const items =
    /**@type {import("@jsonforms/core").JsonSchema7} */ (state.schema.items) || state.schema;
  const _enum = items?.oneOf ? items.oneOf : enumToOneOf(items?.enum);
  const userInteracted = Boolean(resolveDataSchema(value, state.uiSchema.scope) !== null);
  const error = getError(state.uiSchema, state.validatorState);
  const invalid = Boolean(error);

  const data = _enum.map(elm => ({
    value: elm.const,
    label: elm.title,
    accentBarColor: /** @type {any} */ (elm).accentBarColor,
  }));

  const hasAccentBar = data.some(elm => Boolean(elm.accentBarColor));

  return html`
    <owc-autocomplete
      ?accent-bar=${hasAccentBar}
      ?disabled=${ruleOptions.disabled || state.uiSchema.options?.readonly || false}
      .multiple=${options.multiple}
      .clearable=${!state.required}
      .label=${`${processLabel(state)}${state.required ? '*' : ''}`}
      .validator=${() => {
        const error = getError(state.uiSchema, state.validatorState);
        return { valid: !error, error: error?.error };
      }}
      class=${classMap({
        hidden: ruleOptions.hidden,
        invalid: (userInteracted || state.forceErrors) && invalid,
      })}
      .data=${data}
      .value=${ifDefined(resolveDataSchema(value, state.uiSchema.scope))}
      @change=${function (/** @type {{ target: { value: unknown; }; }} */ ev) {
        // @ts-ignore
        inputListener(state.uiSchema, 'value', options.postProcessing).bind(this)(ev);
        options.onSubmit && options.onSubmit();
      }}
      .hint=${ifDefined(state.schema.description)}
    >
      ${when(
        (userInteracted || state.forceErrors) && invalid,
        () => html`<span class="error" slot="hint">${error?.error}</span>`,
      )}
    </owc-autocomplete>
  `;
}

/**@type {import("../types/renderer.js").ControlRenderer} */
export const multiEnumRenderer = (state, ruleOptions, value) => {
  const items = /**@type {import("@jsonforms/core").JsonSchema7} */ (state.schema.items);
  const _enum = items?.oneOf ? items.oneOf : enumToOneOf(items?.enum);
  const userInteracted = Boolean(resolveDataSchema(value, state.uiSchema.scope) !== null);
  const error = getError(state.uiSchema, state.validatorState);
  const invalid = Boolean(error);
  return html`<owc-autocomplete
    ?disabled=${ruleOptions.disabled || state.uiSchema.options?.readonly || false}
    clearable
    multiple
    @change=${inputListener(state.uiSchema)}
    class=${classMap({
      hidden: ruleOptions.hidden,
      invalid: (userInteracted || state.forceErrors) && invalid,
    })}
    .label=${`${processLabel(state)}${state.required ? '*' : ''}`}
    .data=${_enum.map(elm => ({ value: elm.const, label: elm.title }))}
    .value=${ifDefined(resolveDataSchema(value, state.uiSchema.scope))}
  >
    >${when(
      (userInteracted || state.forceErrors) && invalid,
      () => html`<span class="error" slot="hint">${error?.error}</span>`,
    )}</owc-autocomplete
  >`;
};

/**
 * Transforms enums (["1", "2"]) to oneOf format ([{const: "1", title: "1"}, ...]) so there is just one format
 * @param {string[] | undefined} _enum
 * @returns {{const: string; title: string}[]}
 */
export function enumToOneOf(_enum) {
  if (_enum === undefined) {
    return [];
  }
  return _enum.map((/** @type {any} */ entry) => ({ const: entry, title: entry }));
}

/**
 *
 * @param {import("@cfworker/json-schema").ValidationResult} validatorState
 * @param {import("@jsonforms/core").ControlElement} uiSchema
 * @returns {import("@cfworker/json-schema").OutputUnit | undefined}
 */
function getError(uiSchema, validatorState) {
  const path = '#/' + dataPathSegments(uiSchema.scope).join('/');
  for (const error of validatorState.errors) {
    if (error.keyword === 'required') {
      const propertyName = error.error.match(/"(.*)"/)?.[1];
      if (propertyName && path.startsWith(`${error.instanceLocation}/${propertyName}`)) {
        return error;
      }
    } else if (error.instanceLocation === path) {
      return error;
    }
  }
}
