import { LitElement, css } from 'lit';
import { html } from 'lit/static-html.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { JsonForm } from '../form/JsonForm.js';

import '@awesome.me/webawesome/dist/components/card/card.js';

export class GroupLayout extends ScopedElementsMixin(LitElement) {
  static get scopedElements() {
    return { 'json-form': JsonForm };
  }

  static properties = {
    schema: { type: Object },
    uiSchema: { type: Object },
    value: { type: Object },
    validatorState: { type: Object },
    forceErrors: { type: Boolean },
    renderers: { type: Object },
    layouts: { attribute: false },
    readonly: { type: Boolean },
    mode: { type: String },
  };

  constructor() {
    super();
    /**@type {import("../types/schema.js").JsonSchema7} */
    this.schema = {};
    this.forceErrors = false;
    this.uiSchema = /**@type {import("../types/schema.js").GroupLayout} */ ({});
    this.value = {};
    /**@type {import("@cfworker/json-schema").ValidationResult} */
    this.validatorState = { valid: true, errors: [] };
    /**@type {import("../types/renderer.js").RendererRecord} */
    this.renderers = /**@type {import("../types/renderer.js").RendererRecord} */ ({});
    /** @type {import('../types/renderer.js').LayoutRecord} */
    this.layouts = {};
    this.readonly = false;
    /**@type {'form' | 'schema'} */
    this.mode = 'form';
  }

  render() {
    return html`<wa-card class="card">
      <h3 slot="header">${this.uiSchema.label}</h3>
      <div id="enumeration">
        ${this.uiSchema.elements.map(elem => {
          return html`<json-form
            .schema=${this.schema}
            .uiSchema=${elem}
            .value=${this.value}
            .renderers=${this.renderers}
            .layouts=${this.layouts}
            .validatorState=${this.validatorState}
            .rootForm=${false}
            ?forceErrors=${this.forceErrors}
            ?readonly=${this.readonly}
            .mode=${this.mode}
          ></json-form>`;
        })}
      </div>
    </wa-card> `;
  }
  static styles = [
    css`
      .card {
        display: block;
      }
      #enumeration {
        display: flex;
        flex-direction: column;
        flex-wrap: wrap;
        gap: var(--wa-space-s);
      }
    `,
  ];
}
