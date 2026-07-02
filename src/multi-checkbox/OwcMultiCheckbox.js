import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { LitElement, css, html } from 'lit';
import { map } from 'lit/directives/map.js';

import '@awesome.me/webawesome/dist/components/tag/tag.js';
import '@awesome.me/webawesome/dist/components/checkbox/checkbox.js';

export class OwcMultiCheckbox extends ScopedElementsMixin(LitElement) {
  static properties = {
    options: { type: Array },
    value: { type: Object },
  };

  #hasGroupedOptions = false;

  constructor() {
    super();
    /** @type {import('./OwcMultiCheckbox.types.js').OwcMultiCheckboxOptions} */
    this.options = [];
    /** @type {{ value: Array<string | number | boolean>, operator: 'equal', field: string }} */
    this.value = { value: [], operator: 'equal', field: '' };
  }

  /**
   * @param {import('lit').PropertyValues} changedProperties
   */
  update(changedProperties) {
    if (changedProperties.has('options')) {
      this.#hasGroupedOptions = this.options.some(option => Array.isArray(option));
    }
    super.update(changedProperties);
  }

  render() {
    return html` <form
      @submit=${(/** @type {any} */ ev) => {
        ev.preventDefault();
        this.value = {
          ...this.value,
          operator: 'equal',
          value: [...ev.target.querySelectorAll('.checkbox')]
            .map(checkbox => (checkbox.checked ? checkbox.value : undefined))
            .filter(Boolean),
        };
        this.dispatchEvent(new Event('change'));
      }}
    >
      <div class="column">
        ${map(this.options, option => {
          if (Array.isArray(option)) {
            return this.renderGroupCheckbox(option);
          } else {
            return this.renderCheckbox(option);
          }
        })}
      </div>
    </form>`;
  }

  /**
   *
   * @param {import('./OwcMultiCheckbox.types.js').Checkbox[]} group
   * @returns
   */
  renderGroupCheckbox(group) {
    const checked = group.every(checkbox => {
      return this.value.value.includes(checkbox.value);
    });
    const indeterminate =
      !checked &&
      group.some(checkbox => {
        return this.value.value.includes(checkbox.value);
      });
    return html`
      <div class="row">
        <wa-checkbox
          class="group-checkbox"
          name="value"
          ?checked=${checked}
          ?indeterminate=${indeterminate}
          @input=${() => {
            if (checked) {
              this.value.value = this.value.value.filter(
                itemValue => !group.some(checkbox => checkbox.value === itemValue),
              );
            } else {
              this.value.value = [...this.value.value, ...group.map(checkbox => checkbox.value)];
            }
            this.requestUpdate();
            this.updateComplete.then(() => this.shadowRoot?.querySelector('form')?.requestSubmit());
          }}
        ></wa-checkbox>
        <div class="row wrap">${group.map(checkbox => this.renderCheckbox(checkbox, false))}</div>
      </div>
    `;
  }

  /**
   * @param {import('./OwcMultiCheckbox.types.js').Checkbox} checkbox
   * @returns {import('lit').TemplateResult}
   */
  renderCheckbox(checkbox, isIndependent = true) {
    return html`
      <div class="row ${this.#hasGroupedOptions && isIndependent ? 'indentation' : ''}">
        <wa-tag .variant=${checkbox.color || 'brand'} pill>
          <wa-checkbox
            class="checkbox"
            @input=${() => this.shadowRoot?.querySelector('form')?.requestSubmit()}
            size="small"
            name="value"
            .value=${checkbox.value}
            ?checked=${this.value.value.some(itemValue => itemValue === checkbox.value)}
          >
            ${checkbox.label || checkbox.value}
          </wa-checkbox>
        </wa-tag>
      </div>
    `;
  }

  static styles = [
    css`
      :host {
        padding-left: 0.5em;
      }
      .column,
      .row {
        display: flex;
        gap: 0.4em;
      }
      .column {
        flex-direction: column;
      }
      .row {
        align-items: center;
      }
      .wrap {
        flex-wrap: wrap;
      }
      .indentation {
        margin-left: 2.02em;
      }
      wa-checkbox {
        line-height: 1;
      }
      .group-checkbox {
        line-height: 0.9;
      }
    `,
  ];
}
