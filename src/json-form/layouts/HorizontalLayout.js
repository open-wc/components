import { LitElement, css } from 'lit';
import { map } from 'lit/directives/map.js';
import { html } from 'lit/static-html.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { JsonForm } from '../form/JsonForm.js';

export class HorizontalLayout extends ScopedElementsMixin(LitElement) {
  static get scopedElements() {
    return { 'json-form': JsonForm };
  }

  static properties = {
    schema: { type: Object },
    uiSchema: { type: Object },
    value: { type: Object },
    validatorState: { type: Object },
    renderers: { type: Object },
    layouts: { attribute: false },
    forceErrors: { type: Boolean },
    readonly: { type: Boolean },
    mode: { type: String },
  };

  static styles = [
    css`
      .flex {
        display: flex;
        gap: 0.5em;
        flex-flow: row wrap;
        align-items: baseline;
      }
      .flex > * {
        flex: 1;
      }
    `,
  ];

  constructor() {
    super();
    /**@type {import("../types/schema.js").JsonSchema7} */
    this.schema = {};
    this.uiSchema = /**@type {import("../types/schema.js").HorizontalLayout} */ ({});
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

  render() {
    return html`<div class="flex">
      ${map(this.uiSchema.elements, elem => {
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
    </div> `;
  }
}
