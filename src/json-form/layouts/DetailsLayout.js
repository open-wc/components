import { LitElement, css } from 'lit';
import { html } from 'lit/static-html.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { resolveDataSchema } from '../resolve.js';

import '@awesome.me/webawesome/dist/components/details/details.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import { replaceValues } from '../../template-editor/generateValueForData.js';

export class DetailsLayout extends ScopedElementsMixin(LitElement) {
  static properties = {
    schema: { type: Object },
    uiSchema: { type: Object },
    value: { type: Object },
    validatorState: { type: Object },
    renderers: { type: Object },
    forceErrors: { type: Boolean },
    open: { type: Boolean },
    readonly: { type: Boolean },
    mode: { type: String },
  };

  constructor() {
    super();
    /**@type {import("@jsonforms/core").JsonSchema7} */
    this.schema = {};

    this.uiSchema =
      /**@type {{type: 'DetailLayout', label: string, subLayout: import('@jsonforms/core').Layout, options?: {formatter?: string, formatterScope?: string}} }} */ ({});
    this.value = {};
    /**@type {import("@cfworker/json-schema").ValidationResult} */
    this.validatorState = { valid: true, errors: [] };
    /**@type {import("../types/renderer.js").RendererRecord} */
    this.renderers = /**@type {import("../types/renderer.js").RendererRecord} */ ({});
    this.forceErrors = false;
    this.open = false;
    this.readonly = false;
    /**@type {'form' | 'schema'} */
    this.mode = 'form';
  }

  getContent() {
    if (!this.uiSchema.options?.formatter) {
      return '';
    }
    const scope = this.uiSchema.options.formatterScope || '#';
    const data = resolveDataSchema(this.value, scope);
    return replaceValues(this.uiSchema.options.formatter, data || {}, {});
  }

  render() {
    return html` <div class="grid">
      <wa-button
        @click=${() => {
          this.open = !this.open;
        }}
        class="label expandable-label"
        appearance="outlined"
        variant="neutral"
      >
        <div>${this.uiSchema.label}</div>
        ${
          this.open
            ? html`<wa-icon slot="end" name="chevron-up"></wa-icon>`
            : html`<wa-icon slot="end" name="chevron-down"></wa-icon>`
        }
      </wa-button>

      <div class="content">${this.getContent()}</div>
      <wa-details ?open=${this.open} class="details">
        <json-form
          .schema=${this.schema}
          .uiSchema=${this.uiSchema.subLayout}
          .value=${this.value}
          .renderers=${this.renderers}
          .validatorState=${this.validatorState}
          .rootForm=${false}
          ?forceErrors=${this.forceErrors}
          ?readonly=${this.readonly}
          .mode=${this.mode}
        ></json-form>
      </wa-details>
    </div>`;
  }

  static styles = [
    css`
      .grid {
        display: grid;
        align-items: center;
        /* grid-template-columns: auto 1fr auto 1fr; */
        grid-template-columns: repeat(1, auto);
        justify-items: start;
        width: fit-content;
      }

      .label {
        white-space: nowrap;
      }
      .expandable-label {
        padding: 0;
      }

      .details {
        grid-column: 1 / -1; /* Row goes across all columns */
      }
      .expandable-label {
        cursor: pointer;
      }

      /* wa-button overrides */
      wa-button::part(base) {
        border: none;
        padding: 0 5px 0 0;
      }
      wa-button::part(label) {
        padding: 0 5px 0 0;
      }

      wa-button::part(end) {
        margin-inline-start: 0;
      }

      /* wa-detail overrides */
      wa-details::part(base) {
        border: none;
        padding: 0;
        box-shadow: none;
      }
      wa-details::part(icon) {
        display: none;
      }
      wa-details::part(summary) {
        padding: 0;
        margin: 0;
        display: none;
      }
      wa-details::part(header) {
        padding: 0;
        display: none;
      }
      wa-details::part(content) {
        --border-color: var(--wa-color-neutral-80);
        --border-radius: var(--wa-border-radius-m);
        --border-width: 1px;

        padding: 5px;
        margin: 0;
        border: solid var(--border-width) var(--border-color);
        border-radius: var(--border-radius);
      }
    `,
  ];
}
