import { LitElement, css } from 'lit';
import { map } from 'lit/directives/map.js';
import { html } from 'lit/static-html.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { JsonForm } from '../form/JsonForm.js';
import '@awesome.me/webawesome/dist/components/tab-panel/tab-panel.js';
import '@awesome.me/webawesome/dist/components/tab-group/tab-group.js';
import '@awesome.me/webawesome/dist/components/tab/tab.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';

/**@typedef {import("../types/schema.js").ElementListLayout & {options: {tabNames: string[]}}} TabLayoutType*/

export class TabLayout extends ScopedElementsMixin(LitElement) {
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

  constructor() {
    super();
    /**@type {import("../types/schema.js").JsonSchema7} */
    this.schema = {};

    this.uiSchema = /**@type {TabLayoutType}} */ ({});
    this.value = {};
    /**@type {import("@cfworker/json-schema").ValidationResult} */
    this.validatorState = { valid: true, errors: [] };
    /**@type {import("../types/renderer.js").RendererRecord} */
    this.renderers = /**@type {import("../types/renderer.js").RendererRecord} */ ({});
    /** @type {import('../types/renderer.js').LayoutRecord} */
    this.layouts = {};
    this.forceErrors = false;

    /**@type {Record<string, boolean>} */
    this.errorMap = {};
    this.readonly = false;
    /**@type {'form' | 'schema'} */
    this.mode = 'form';
  }

  /**
   * @param {import('lit').PropertyValues} changedProperties
   */
  update(changedProperties) {
    if (changedProperties.has('validatorState') || changedProperties.has('forceErrors')) {
      if (!this.validatorState.valid) {
        // Give some time for errors to settle
        setTimeout(() => {
          const jsonForms = this.shadowRoot?.querySelectorAll('json-form');
          this.errorMap = {};
          jsonForms?.forEach(form => {
            const typedForm = /**@type {import('../form/JsonForm.js').JsonForm}*/ (form);
            const firstInvalid = typedForm.getFirstInvalid();
            if (firstInvalid) {
              this.errorMap[form.id] = true;
            }
          });
          this.requestUpdate();
        }, 100);
      } else {
        this.errorMap = {};
      }
    }
    super.update(changedProperties);
  }

  render() {
    return html`
      <wa-tab-group id="enumeration" .active=${this.uiSchema?.options?.tabNames?.[0] || 0}>
        ${map(this.uiSchema.elements, (elem, index) => {
          return html` <wa-tab
              slot="nav"
              ?active=${index === 0}
              panel=${this.uiSchema?.options?.tabNames?.[index] || index}
              >${this.uiSchema?.options?.tabNames?.[index] || index}
              ${
                this.errorMap[`form-${index}`]
                  ? html`
                      <wa-icon
                        name="exclamation-octagon"
                        style="color: var(--wa-color-danger-50); margin: 0"
                      ></wa-icon>
                    `
                  : ''
              }
            </wa-tab>
            <wa-tab-panel
              ?active=${index === 0}
              name=${this.uiSchema?.options?.tabNames?.[index] || index}
            >
              <json-form
                id="form-${index}"
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
              ></json-form
            ></wa-tab-panel>`;
        })}
      </wa-tab-group>
    `;
  }

  static styles = [css``];
}
