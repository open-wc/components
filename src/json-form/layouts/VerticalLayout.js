import { LitElement, css } from 'lit';
import { map } from 'lit/directives/map.js';
import { html } from 'lit/static-html.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';

export class VerticalLayout extends ScopedElementsMixin(LitElement) {
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
    /**@type {import("@jsonforms/core").JsonSchema7} */
    this.schema = {};

    this.uiSchema = /**@type {import("@jsonforms/core").VerticalLayout} */ ({});
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
      <div id="enumeration">
        ${map(this.uiSchema.elements, elem => {
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
    `;
  }

  static styles = [
    css`
      #enumeration {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: var(--wa-space-s);
      }

      #enumeration > * {
        min-width: 500px;
      }
    `,
  ];
}
