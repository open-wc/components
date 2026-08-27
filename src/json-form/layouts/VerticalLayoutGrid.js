import { LitElement, css } from 'lit';
import { html } from 'lit/static-html.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';

export class VerticalLayoutGrid extends ScopedElementsMixin(LitElement) {
  static properties = {
    schema: { type: Object },
    uiSchema: { type: Object },
    value: { type: Object },
    validatorState: { type: Object },
    renderers: { type: Object },
    forceErrors: { type: Boolean },
    readonly: { type: Boolean },
    mode: { type: String },
  };

  constructor() {
    super();
    /**@type {import("../types/schema.js").JsonSchema7} */
    this.schema = {};

    this.uiSchema = /**@type {import("../types/schema.js").VerticalLayout} */ ({});
    this.value = {};
    /**@type {import("@cfworker/json-schema").ValidationResult} */
    this.validatorState = { valid: true, errors: [] };
    /**@type {import("../types/renderer.js").RendererRecord} */
    this.renderers = /**@type {import("../types/renderer.js").RendererRecord} */ ({});
    this.forceErrors = false;
    this.readonly = false;
    /**@type {'form' | 'schema'} */
    this.mode = 'form';
  }

  render() {
    return html`
      <div id="grid">
        ${this.uiSchema.elements.map(
          elem =>
            html` <json-form
              .schema=${this.schema}
              .uiSchema=${elem}
              .value=${this.value}
              .renderers=${this.renderers}
              .validatorState=${this.validatorState}
              .rootForm=${false}
              ?forceErrors=${this.forceErrors}
              ?readonly=${this.readonly}
              .mode=${this.mode}
            ></json-form>`,
        )}
      </div>
    `;
  }

  static styles = [
    css`
      #grid {
        gap: 10px;
        display: grid;
        align-items: center;
        /* grid-template-columns: auto 1fr auto 1fr; */
        grid-template-columns: repeat(1, auto);
      }
    `,
  ];
}
