import { LitElement, css, nothing } from 'lit';
import { html } from 'lit/static-html.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { JsonForm } from '../form/JsonForm.js';

import '@awesome.me/webawesome/dist/components/checkbox/checkbox.js';
import { dataPathSegments, resolveDataSchema } from '../resolve.js';
import { spreadProps } from '@open-wc/lit-helpers';
import { FormDataChangeEvent } from '../FormDataChangeEvent.js';

export class CheckboxComboLayout extends ScopedElementsMixin(LitElement) {
  static get scopedElements() {
    return { 'json-form': JsonForm };
  }

  static properties = {
    schema: { type: Object },
    uiSchema: { type: Object },
    value: { type: Object },
    renderers: { type: Object },
    layouts: { attribute: false },
    validatorState: { type: Object },
    forceErrors: { type: Boolean },
    readonly: { type: Boolean },
    mode: { type: String },
  };

  static styles = [
    css`
      .flex {
        display: flex;
        gap: 0.2em;
        flex-flow: row wrap;
        align-items: baseline;
        justify-content: center;
      }

      wa-checkbox {
        line-height: 1;
      }
    `,
  ];

  constructor() {
    super();
    /**@type {import("../types/schema.js").JsonSchema7} */
    this.schema = {};
    this.uiSchema = /**@type {import("../types/schema.js").ElementListLayout} */ ({});
    this.value = {};
    /**@type {import("@cfworker/json-schema").ValidationResult} */
    this.validatorState = { valid: true, errors: [] };
    /**@type {import("../types/renderer.js").RendererRecord} */
    this.renderers = /**@type {import("../types/renderer.js").RendererRecord} */ ({});
    /** @type {import('../types/renderer.js').LayoutRecord} */
    this.layouts = {};
    this.forceErrors = false;
    this.readonly = false;
    /**@type {'form' | 'schema'} */
    this.mode = 'form';
  }

  getCheckedState() {
    const checkboxes = [];
    for (const elem of this.uiSchema.elements) {
      const typedElem = /**@type {import("../types/schema.js").ControlElement}*/ (elem);
      checkboxes.push(resolveDataSchema(this.value, typedElem.scope));
    }
    const countChecked = checkboxes.filter(_ => _).length;
    const countTotal = checkboxes.length;

    const comboCheckbox = {};

    if (countChecked === 0) {
      comboCheckbox.checked = false;
      comboCheckbox.indeterminate = false;
    } else if (countChecked < countTotal) {
      comboCheckbox.indeterminate = true;
      comboCheckbox.checked = false;
    } else {
      comboCheckbox.checked = true;
    }
    return comboCheckbox;
  }

  /**
   * @param {Event} event
   */
  activateAll(event) {
    for (const elem of this.uiSchema.elements) {
      const typedElem = /**@type {import("../types/schema.js").ControlElement}*/ (elem);
      const segments = dataPathSegments(typedElem.scope);
      let currentBlock = this.value;
      for (let i = 0; i < segments.length - 1; i++) {
        const segment = segments[i];
        const typedSegment = /**@type {keyof currentBlock} */ (segment);
        if (!currentBlock[typedSegment]) {
          // @ts-ignore
          currentBlock[typedSegment] = {};
        }
        currentBlock = currentBlock[typedSegment];
      }
      // @ts-ignore
      currentBlock[segments.at(-1)] = event.target.checked;
    }
    this.dispatchEvent(new FormDataChangeEvent('formDataChange', '', undefined)); // update the entire form
  }

  render() {
    return html`
      ${this.uiSchema.label ? html`<label>${this.uiSchema.label}:</label>` : nothing}
      <div class="flex">
        <wa-checkbox
          @input=${this.activateAll}
          ${spreadProps(/**@type {{[key: string]: any}}*/ (this.getCheckedState()))}
        >
        </wa-checkbox>
        ${this.uiSchema.elements.map(elem => {
          const schema = this.schema;
          if (elem.type !== 'Control') {
            throw new TypeError('CheckboxComboLayout can only contain checkboxes');
          }
          return html`<json-form
            .schema=${schema}
            .uiSchema=${elem}
            .value=${this.value}
            .validatorState=${this.validatorState}
            .renderers=${this.renderers}
            .layouts=${this.layouts}
            .rootForm=${false}
            ?forceErrors=${this.forceErrors}
            ?readonly=${this.readonly}
            .mode=${this.mode}
          ></json-form>`;
        })}
      </div>
    `;
  }
}
