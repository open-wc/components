import { LitElement, css } from 'lit';
import { html } from 'lit/static-html.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { OwcCard } from '@open-wc/components/OwcCard.js';
import { resolveDataSchema, resolveSchema } from '../resolve.js';
import { getError } from '../helpers/getError.js';
import { inputListener } from '../renderers/inputListener.js';
import { OwcIconButton } from '../../icon-button/OwcIconButton.js';
import { OwcTooltip } from '../../tooltip/OwcTooltip.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import { OwcLocalizeController } from '@open-wc/components/localization.js';

/**
 *
 * @param {import("@jsonforms/core").VerticalLayout & {scope: string}} uiSchema
 * @param {number} index
 */
function deepScopeReplace(uiSchema, index) {
  const scopeSearch = uiSchema.scope;
  const uiSchemaCopy = structuredClone(uiSchema);
  return executeDeepScopeReplace(uiSchemaCopy, scopeSearch, index);
}

/**
 *
 * @param {import("@jsonforms/core").VerticalLayout} uiSchema
 * @param {string} scopeSearch
 * @param {number} index
 */
function executeDeepScopeReplace(uiSchema, scopeSearch, index) {
  if (!Array.isArray(uiSchema.elements)) {
    const element = uiSchema.elements;
    // @ts-ignore
    if (element.scope) {
      // @ts-ignore
      element.scope = element.scope.replace(scopeSearch, `${scopeSearch}/${index}`);
    }
    // @ts-ignore
    if (element.rule?.condition?.scope) {
      // @ts-ignore
      element.rule.condition.scope = element.rule.condition.scope.replace(
        scopeSearch,
        `${scopeSearch}/${index}`,
      );
    }
    // @ts-ignore
    if (element.elements) {
      executeDeepScopeReplace(element, scopeSearch, index);
    }
    return uiSchema;
  }

  for (const element of uiSchema.elements) {
    // @ts-ignore
    if (element.scope) {
      // @ts-ignore
      element.scope = element.scope.replace(scopeSearch, `${scopeSearch}/${index}`);
    }
    // @ts-ignore
    if (element.rule?.condition?.scope) {
      // @ts-ignore
      element.rule.condition.scope = element.rule.condition.scope.replace(
        scopeSearch,
        `${scopeSearch}/${index}`,
      );
    }
    // @ts-ignore
    if (element.elements) {
      // @ts-ignore
      executeDeepScopeReplace(element, scopeSearch, index);
    }
  }
  return uiSchema;
}

export class ArrayLayout extends ScopedElementsMixin(LitElement) {
  #localize = new OwcLocalizeController(this);
  static scopedElements = {
    'owc-card': OwcCard,
    'owc-icon-button': OwcIconButton,
    'owc-tooltip': OwcTooltip,
  };

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

    this.uiSchema =
      /**@type {import("@jsonforms/core").VerticalLayout & {scope: string, label?: string}} */ ({});
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
    // @ts-ignore
    const error = getError(this.uiSchema, this.validatorState);
    return html`
      <div class="header ${error ? 'invalid' : ''}">
        <h3>
          ${this.uiSchema.label}
          ${
            error?.error
              ? html`<owc-tooltip>
                  ${error.error}
                  <wa-icon
                    slot="anchor"
                    name="exclamation-octagon"
                    style="color: var(--wa-color-danger-50)"
                  ></wa-icon
                ></owc-tooltip>`
              : ''
          }
        </h3>

        ${
          this.uiSchema.options?.hidePlus || this.readonly
            ? ''
            : html`<wa-button
                variant="brand"
                appearance="accent"
                @click=${() => {
                  const newValue =
                    // @ts-ignore
                    resolveSchema(this.schema, this.uiSchema.scope, this.value)?.items?.type ===
                    'object'
                      ? {}
                      : '';
                  // @ts-ignore
                  resolveDataSchema(this.value, this.uiSchema.scope)?.push(newValue);
                  this.requestUpdate();
                }}
              >
                <wa-icon style="margin-inline-end: 0" slot="start" name="plus-lg"></wa-icon>
                ${this.#localize.term('jsonFormArrayAddCard')}</wa-button
              >`
        }
      </div>
      <div id="enumeration">
        ${resolveDataSchema(this.value, this.uiSchema.scope)
          // @ts-ignore
          ?.map((/** @type {any} */ _elem, /** @type {number} */ index) => {
            return html` <owc-card>
              <div class="card-body">
                ${
                  this.uiSchema?.options?.hideTrash || this.readonly
                    ? ``
                    : html`<owc-icon-button
                        style="color: var(--wa-color-danger-50)"
                        name="trash"
                        @click=${
                          // @ts-ignore
                          ev => {
                            // @ts-ignore
                            resolveDataSchema(this.value, this.uiSchema.scope)?.splice(index, 1);
                            inputListener().bind(this)(ev);
                          }
                        }
                      ></owc-icon-button>`
                }
                <json-form
                  .schema=${this.schema}
                  .uiSchema=${deepScopeReplace(this.uiSchema, index).elements}
                  .value=${this.value}
                  .renderers=${this.renderers}
                  .validatorState=${this.validatorState}
                  .rootForm=${false}
                  ?forceErrors=${this.forceErrors}
                  ?readonly=${this.readonly}
                  .mode=${this.mode}
                ></json-form>
              </div>
            </owc-card>`;
          })}
      </div>
    `;
  }

  static styles = [
    css`
      :host() {
        display: block;
      }
      #enumeration {
        display: flex;
        flex-direction: column;
        flex-wrap: wrap;
        gap: var(--wa-space-s);
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .card-body {
        display: flex;
        flex-direction: column;
      }

      .card-body owc-icon-button {
        align-self: end;
      }

      owc-card::part(body) {
        display: block;
      }
    `,
  ];
}
