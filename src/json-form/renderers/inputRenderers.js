import { spread } from '@open-wc/lit-helpers';
import { html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { when } from 'lit/directives/when.js';
import { html as staticHtml, unsafeStatic } from 'lit/static-html.js';
import { processLabel } from '../label/label.js';
import { resolveDataSchema } from '../resolve.js';
import { getError } from '../helpers/getError.js';
import { inputListener } from './inputListener.js';

import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/checkbox/checkbox.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/slider/slider.js';
import '@awesome.me/webawesome/dist/components/rating/rating.js';
import '@awesome.me/webawesome/dist/components/switch/switch.js';
import '@awesome.me/webawesome/dist/components/textarea/textarea.js';
import '@awesome.me/webawesome/dist/components/tooltip/tooltip.js';
import '@awesome.me/webawesome/dist/components/radio/radio.js';

/**@typedef {import("../types/renderer.js").ControlRenderer} Renderer*/

/**@type {Renderer} */
export const textRenderer = (state, ruleOptions, value) => {
  return renderInput(state, ruleOptions, value, {
    attributes: {
      minlength: state.schema.minLength,
      maxlength: state.schema.maxLength,
    },
    altTag: state.uiSchema.options?.multi ? 'wa-textarea' : 'wa-input',
    preProcessing: state.uiSchema.options?.newLineToBr
      ? val => val?.replace(/<br>/g, '\n') || ''
      : undefined,
    postProcessing: state.uiSchema.options?.newLineToBr
      ? val => val?.replace(/\n/g, '<br>')
      : undefined,
  });
};

/**@type {Renderer} */
export const checkboxRenderer = (state, ruleOptions, value) => {
  const userInteracted = Boolean(resolveDataSchema(value, state.uiSchema.scope) !== null);
  const error = getError(state.uiSchema, state.validatorState);
  const invalid = Boolean(error);
  const staticTag = unsafeStatic(state.uiSchema.options?.toggle ? 'wa-switch' : 'wa-checkbox');

  const checkbox = staticHtml`
  <div class=${classMap({
    hidden: ruleOptions.hidden,
  })} style="display: flex; align-items:center">
  <div class=${classMap({
    hidden: ruleOptions.hidden,
  })} style="min-width: 45ch;">${`${processLabel(state)}:${state.required ? '*' : ''}`}    ${
    state.uiSchema.options?.danger
      ? html` <owc-tooltip placement="right"
          >Wert wird nicht automatisch synchronisiert
          <wa-icon slot="anchor" name="exclamation-triangle-fill" style="color: red"></wa-icon>
        </owc-tooltip>`
      : ''
  }</div>
  <${staticTag}
    @input=${inputListener(state.uiSchema, 'checked')}
    ?disabled=${ruleOptions.disabled || state.uiSchema.options?.readonly || false}
    .size=${state.uiSchema.options?.size || 'medium'}
    ?checked=${resolveDataSchema(value, state.uiSchema.scope)}
    class=${classMap({
      hidden: ruleOptions.hidden,
      invalid: (userInteracted || state.forceErrors) && invalid,
    })}>
      
  </${staticTag}>
  </div>
  ${when(
    (userInteracted || state.forceErrors) && invalid,
    () => html`<span class="error" slot="hint">${error?.error}</span>`,
  )}
  `;

  if (state.schema.description) {
    return html`<owc-tooltip
      >${state.schema.description} <span slot="anchor">${checkbox}</span></owc-tooltip
    >`;
  }
  return checkbox;
};

/**@type {Renderer} */
export const checkboxTagRenderer = (state, ruleOptions, value) => {
  return html`<wa-tag pill .variant=${state.uiSchema.options?.tagVariant || 'brand'}>
    ${checkboxRenderer(
      {
        ...state,
        uiSchema: { ...state.uiSchema, options: { size: 'small', ...state.uiSchema.options } },
      },
      ruleOptions,
      value,
    )}
  </wa-tag>`;
};

/**@type {Renderer} */
export const numberRenderer = (state, ruleOptions, value) => {
  if (state.uiSchema.options?.slider) {
    return sliderRenderer(state, ruleOptions, value);
  }
  if (state.uiSchema.options?.rating) {
    return ratingRenderer(state, ruleOptions, value);
  }
  return renderInput(state, ruleOptions, value, {
    inputType: 'number',
    dataField: 'value',
    attributes: {
      min: state.schema.minimum,
      max: state.schema.maximum,
      step: state.schema.type === 'integer' ? 1 : 0.1,
    },
    postProcessing: num => {
      return typeof num === 'string' && num ? Number.parseFloat(num) : undefined;
    },
  });
};

/**@type {Renderer} */
const ratingRenderer = (state, ruleOptions, value) => {
  return renderInput(state, ruleOptions, value, {
    dataField: 'value',
    attributes: {
      min: state.schema.minimum,
      max: state.schema.maximum,
    },
    altTag: 'wa-rating',
  });
};

/**@type {Renderer} */
const sliderRenderer = (state, ruleOptions, value) => {
  return renderInput(state, ruleOptions, value, {
    dataField: 'value',
    attributes: {
      min: state.schema.minimum,
      max: state.schema.maximum,
    },
    altTag: 'wa-slider',
  });
};

/**@type {Renderer} */
export const dateRenderer = (state, ruleOptions, value) => {
  return renderInput(state, ruleOptions, value, { inputType: 'date' });
};

/**@type {Renderer} */
export const timeRenderer = (state, ruleOptions, value) => {
  return renderInput(state, ruleOptions, value, {
    inputType: 'time',
    postProcessing: time => {
      if (time.length === 5) {
        // 00:00
        return time + ':00';
      } else {
        return time;
      }
    },
  });
};

/**@type {Renderer} */
export const dateTimeRenderer = (state, ruleOptions, value) => {
  return renderInput(state, ruleOptions, value, { inputType: 'datetime-local' });
};

/**@typedef {"number" | "search" | "text" | "date" | "datetime-local" | "email" | "password" | "tel" | "time" | "url"} InputType*/

/**
 * @param {import("../types/renderer.js").State} state
 * @param {{ disabled: boolean; hidden: boolean }} ruleOptions
 * @param {any} value
 * @param {{inputType?: InputType; dataField?: string; attributes?: Record<string,any>; altTag?: string; preProcessing?: (arg0: any) => any; postProcessing?: (arg0: any) => any;}} options
 * @returns {import("lit").TemplateResult}
 */
function renderInput(state, ruleOptions, value, options = {}) {
  const error = getError(state.uiSchema, state.validatorState);
  const userInteracted = Boolean(resolveDataSchema(value, state.uiSchema.scope) !== null);
  const invalid = Boolean(error);
  const staticTag = unsafeStatic(options.altTag || 'wa-input');
  return staticHtml`<${staticTag}
    class=${classMap({
      hidden: ruleOptions.hidden,
      invalid: (userInteracted || state.forceErrors) && invalid,
    })}
    ?disabled=${ruleOptions.disabled || state.uiSchema.options?.readonly || false}
    .type=${options.inputType || 'text'}
    .label=${`${processLabel(state)}${state.required ? '*' : ''}`}
    .value=${
      options.preProcessing
        ? options.preProcessing(resolveDataSchema(value, state.uiSchema.scope))
        : resolveDataSchema(value, state.uiSchema.scope)
    }
    @change=${inputListener(state.uiSchema, options.dataField || 'value', options.postProcessing)}
    @input=${inputListener(state.uiSchema, options.dataField || 'value', options.postProcessing)}
    ${spread(options.attributes || {})}>
    ${when(
      (userInteracted || state.forceErrors) && invalid,
      () => html`<span class="error" slot="hint">${error?.error}</span>`,
    )}
    ${
      state.schema.description
        ? html`<span slot="hint" class="help-text">${state.schema.description}</span>`
        : ''
    }
  </${staticTag} >`;
}
