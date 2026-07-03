/**@typedef {import("../types/renderer.js").ControlRenderer} Renderer*/

import { html } from 'lit';
import { inputListener } from './inputListener.js';
import { dataPathSegments, resolveDataSchema } from '../resolve.js';
import { processLabel } from '../label/label.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { classMap } from 'lit/directives/class-map.js';

if (!customElements.get('owc-click-editable-input')) {
  import('@open-wc/components/define/owc-click-editable-input.js');
}
if (!customElements.get('owc-click-editable-autocomplete')) {
  import('@open-wc/components/define/owc-click-editable-autocomplete.js');
}
if (!customElements.get('owc-click-editable-textarea')) {
  import('@open-wc/components/define/owc-click-editable-textarea.js');
}

export const percentFormatter = new Intl.NumberFormat('de', {
  style: 'percent',
  maximumFractionDigits: 3,
});

export const currencyFormatter = new Intl.NumberFormat('de', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
});

/**
 *
 * @param {{inputType?: InputType, onSubmit?: () => any, postProcessing?: (arg0: any) => any; fallbackValue?: string}} [options]
 */
export function getInputRenderer(options = {}) {
  return (
    /** @type {import("../types/renderer.js").State} */ state,
    /** @type {{ disabled: boolean; hidden: boolean; }} */ ruleOptions,
    /** @type {any} */ value,
  ) => {
    if (state.uiSchema.options?.multi) {
      return renderTextarea(state, ruleOptions, value, options);
    } else {
      return renderInput(state, ruleOptions, value, options);
    }
  };
}

/**
 *
 * @param {{onSubmit?: () => any, postProcessing?: (arg0: any) => any; multiple?: boolean; fallbackValue?: string}} [options]
 */
export function getAutocompleteRenderer(options = {}) {
  return (
    /** @type {import("../types/renderer.js").State} */ state,
    /** @type {{ disabled: boolean; hidden: boolean; }} */ ruleOptions,
    /** @type {any} */ value,
  ) => renderAutocomplete(state, ruleOptions, value, options);
}

/**
 * @param {{fallbackValue?: string; onSubmit?: () => any, postProcessing?: (arg0: any) => any;}} [options]
 * @returns {import("../types/renderer.js").RendererRecord}
 */
export function getClickEditableRenderers(options = {}) {
  return {
    boolean: undefined,
    checkboxTag: undefined,
    string: getInputRenderer(options),
    date: getInputRenderer({ ...options, inputType: 'date' }),
    time: getInputRenderer({ ...options, inputType: 'time' }),
    datetime: getInputRenderer({
      ...options,
      inputType: 'datetime-local',
    }),
    number: getInputRenderer({ ...options, inputType: 'number' }),
    integer: getInputRenderer({ ...options, inputType: 'number' }),
    enum: getAutocompleteRenderer(options),
    multiEnum: getAutocompleteRenderer({
      ...options,
      multiple: true,
    }),
  };
}

/**@typedef {"number" | "search" | "text" | "date" | "datetime-local" | "email" | "password" | "tel" | "time" | "url"} InputType*/

/**
 * @param {import("../types/renderer.js").State} state
 * @param {{ disabled: boolean; hidden: boolean }} ruleOptions
 * @param {any} value
 * @param {{onSubmit?: () => any; inputType?: InputType ;postProcessing?: (arg0: any) => any; fallbackValue?: string}} options
 * @returns {import("lit").TemplateResult}
 */
function renderInput(state, ruleOptions, value, options = {}) {
  const error = getError(state.uiSchema, state.validatorState);
  const userInteracted = Boolean(resolveDataSchema(value, state.uiSchema.scope) !== null);
  const fallbackValue = getFallbackValue(state, options);

  return html`
    <owc-click-editable-input
      class=${classMap({
        hidden: ruleOptions.hidden,
        invalid: Boolean((state.forceErrors || userInteracted) && error),
      })}
      ?read-only=${ruleOptions.disabled || state.uiSchema.options?.readonly || false}
      ?show-copy-button=${state.uiSchema.options?.showCopyButton}
      .fallbackValue=${fallbackValue}
      .formatter=${ifDefined(getUnitFormatter(state, fallbackValue))}
      .validator=${() => {
        const error = getError(state.uiSchema, state.validatorState);
        return { valid: !error, error: error?.error };
      }}
      value=${resolveDataSchema(value, state.uiSchema.scope) || ''}
      @submit=${function (/** @type {{ target: { value: unknown; }; }} */ ev) {
        inputListener(
          state.uiSchema,
          options.inputType === 'number' ? 'parsedValue' : 'value',
          options.postProcessing,
        )
          // @ts-ignore
          .bind(this)(ev);
        options.onSubmit && options.onSubmit();
      }}
      type=${options.inputType || 'text'}
    >
      <span id="form-label" slot="label" style="display: block; min-width: 40ch;"
        >${processLabel(state)}${state.required ? '*' : ''}
        ${
          state.uiSchema.options?.danger
            ? html` <owc-tooltip placement="right"
                >"Wert wird nicht automatisch synchronisiert"
                <wa-icon
                  slot="anchor"
                  name="exclamation-triangle-fill"
                  style="color: red"
                ></wa-icon>
              </owc-tooltip>`
            : ''
        }
        ${
          (state.forceErrors || userInteracted) && error
            ? html` <owc-tooltip placement="right"
                >${error.error}
                <wa-icon
                  slot="anchor"
                  name="exclamation-triangle-fill"
                  style="color: red"
                ></wa-icon>
              </owc-tooltip>`
            : ''
        }
      </span>
      <span slot="hint" class="help-text">${state.schema.description}</span>
    </owc-click-editable-input>
  `;
}

/**
 *
 * @param {import("../types/renderer.js").State} state
 * @param {string} fallbackValue
 * @returns
 */
function getUnitFormatter(state, fallbackValue) {
  if (state.schema.type !== 'number') {
    return undefined;
  }
  // @ts-ignore
  switch (state.schema.unit) {
    case 'euro':
      return (/** @type {number} */ value) =>
        value || value === 0 ? currencyFormatter.format(value) : fallbackValue;
    case 'percent':
      return (/** @type {number} */ value) =>
        value || value === 0 ? percentFormatter.format(value / 100) : fallbackValue;
  }
}

/**
 * @param {import("../types/renderer.js").State} state
 * @param {{ disabled: boolean; hidden: boolean }} ruleOptions
 * @param {any} value
 * @param {{onSubmit?: () => any; inputType?: InputType ;postProcessing?: (arg0: any) => any; fallbackValue?: string}} options
 * @returns {import("lit").TemplateResult}
 */
function renderTextarea(state, ruleOptions, value, options = {}) {
  const error = getError(state.uiSchema, state.validatorState);
  const userInteracted = Boolean(resolveDataSchema(value, state.uiSchema.scope) !== null);
  return html`
    <owc-click-editable-textarea
      class=${classMap({
        hidden: ruleOptions.hidden,
        invalid: Boolean((state.forceErrors || userInteracted) && error),
      })}
      ?read-only=${ruleOptions.disabled || state.uiSchema.options?.readonly || false}
      ?show-copy-button=${state.uiSchema.options?.showCopyButton}
      .fallbackValue=${getFallbackValue(state, options)}
      .validator=${() => {
        const error = getError(state.uiSchema, state.validatorState);
        return { valid: !error, error: error?.error };
      }}
      value=${resolveDataSchema(value, state.uiSchema.scope) || ''}
      @submit=${function (/** @type {{ target: { value: unknown; }; }} */ ev) {
        // @ts-ignore
        inputListener(state.uiSchema, 'value', options.postProcessing).bind(this)(ev);
        options.onSubmit && options.onSubmit();
      }}
    >
      <span slot="label"
        >${processLabel(state)}${state.required ? '*' : ''}
        ${
          state.uiSchema.options?.danger
            ? html` <owc-tooltip placement="right">
                Wert wird nicht automatisch synchronisiert
                <wa-icon
                  slot="anchor"
                  name="exclamation-triangle-fill"
                  style="color: red"
                ></wa-icon>
              </owc-tooltip>`
            : ''
        }
        ${
          (state.forceErrors || userInteracted) && error
            ? html` <owc-tooltip placement="right"
                >${error.error}
                <wa-icon
                  slot="anchor"
                  name="exclamation-triangle-fill"
                  style="color: red"
                ></wa-icon>
              </owc-tooltip>`
            : ''
        }</span
      >
      <span slot="hint" class="help-text">${state.schema.description}</span>
    </owc-click-editable-textarea>
  `;
}

/**
 * @param {import("../types/renderer.js").State} state
 * @param {{ disabled: boolean; hidden: boolean }} ruleOptions
 * @param {any} value
 * @param {{multiple?: boolean; onSubmit?: () => any; postProcessing?: (arg0: any) => any; fallbackValue?: string}} options
 * @returns {import("lit").TemplateResult}
 */
function renderAutocomplete(state, ruleOptions, value, options = {}) {
  const error = getError(state.uiSchema, state.validatorState);
  const userInteracted = Boolean(resolveDataSchema(value, state.uiSchema.scope) !== null);
  const items =
    /**@type {import("@jsonforms/core").JsonSchema7} */ (state.schema.items) || state.schema;
  const _enum = items?.oneOf ? items.oneOf : enumToOneOf(items?.enum);
  return html`
    <owc-click-editable-autocomplete
      class=${classMap({
        hidden: ruleOptions.hidden,
        invalid: Boolean((state.forceErrors || userInteracted) && error),
      })}
      ?read-only=${ruleOptions.disabled || state.uiSchema.options?.readonly || false}
      ?show-copy-button=${state.uiSchema.options?.showCopyButton}
      .multiple=${options.multiple}
      .clearable=${!state.required}
      .fallbackValue=${getFallbackValue(state, options)}
      .validator=${() => {
        const error = getError(state.uiSchema, state.validatorState);
        return { valid: !error, error: error?.error };
      }}
      .data=${_enum.map(elm => ({ value: elm.const, label: elm.title }))}
      .value=${resolveDataSchema(value, state.uiSchema.scope) || ''}
      @submit=${function (/** @type {{ target: { value: unknown; }; }} */ ev) {
        // @ts-ignore
        inputListener(state.uiSchema, 'value', options.postProcessing).bind(this)(ev);
        options.onSubmit && options.onSubmit();
      }}
    >
      <span slot="label" style="display: block; min-width: 40ch;"
        >${processLabel(state)}${state.required ? '*' : ''}
        ${
          state.uiSchema.options?.danger
            ? html` <owc-tooltip placement="right">
                Wert wird nicht automatisch synchronisiert
                <wa-icon
                  slot="anchor"
                  name="exclamation-triangle-fill"
                  style="color: red"
                ></wa-icon>
              </owc-tooltip>`
            : ''
        }
        ${
          (state.forceErrors || userInteracted) && error
            ? html` <owc-tooltip placement="right"
                >${error.error}
                <wa-icon
                  slot="anchor"
                  name="exclamation-triangle-fill"
                  style="color: red"
                ></wa-icon>
              </owc-tooltip>`
            : ''
        }
      </span>
      <span slot="hint" class="help-text">${state.schema.description}</span>
    </owc-click-editable-autocomplete>
  `;
}

/**
 * @param {import("../types/renderer.js").State} state
 * @param {{fallbackValue?: string}} options
 */
function getFallbackValue(state, options) {
  return state.uiSchema.options?.fallbackValue ?? options.fallbackValue ?? '-';
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

/**
 * Transforms enums (["1", "2"]) to oneOf format ([{const: "1", title: "1"}, ...]) so there is just one format
 * @param {string[] | undefined} _enum
 * @returns {{const: string; title: string}[]}
 */
function enumToOneOf(_enum) {
  if (_enum === undefined) {
    return [];
  }
  return _enum.map((/** @type {any} */ entry) => ({ const: entry, title: entry }));
}
