import { LitElement, css } from 'lit';
import { html } from 'lit/static-html.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';

import '@awesome.me/webawesome/dist/components/card/card.js';

export class GroupLayout extends ScopedElementsMixin(LitElement) {
  static properties = {
    schema: { type: Object },
    uiSchema: { type: Object },
    value: { type: Object },
    validatorState: { type: Object },
    forceErrors: { type: Boolean },
    renderers: { type: Object },
    readonly: { type: Boolean },
    mode: { type: String },
  };

  constructor() {
    super();
    /**@type {import("@jsonforms/core").JsonSchema7} */
    this.schema = {};
    this.forceErrors = false;
    this.uiSchema = /**@type {import("@jsonforms/core").GroupLayout} */ ({});
    this.value = {};
    /**@type {import("@cfworker/json-schema").ValidationResult} */
    this.validatorState = { valid: true, errors: [] };
    /**@type {import("../types/renderer.js").RendererRecord} */
    this.renderers = /**@type {import("../types/renderer.js").RendererRecord} */ ({});
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
