import { LitElement, html, css } from 'lit';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { OwcAutocomplete } from '@open-wc/components/OwcAutocomplete.js';

import '@awesome.me/webawesome/dist/components/input/input.js';

/** @typedef {{ label: string, value: string }} Option */

export class OwcInputAutofill extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'owc-autocomplete': OwcAutocomplete,
  };

  static properties = {
    data: { type: Array },
    value: { type: String },
    label: { type: String },
    placeholder: { type: String },
    open: { type: Boolean, reflect: true },
  };

  constructor() {
    super();
    /** @type {Option[]} */
    (this.data = []);
    this.value = '';
    this.label = '';
    this.placeholder = '';
    this.open = false;
  }

  get _waInput() {
    return /** @type {HTMLInputElement | null} */ (this.renderRoot?.querySelector('wa-input'));
  }
  get _owcAutocomplete() {
    return /** @type {OwcAutocomplete<Option> | null} */ (
      this.renderRoot?.querySelector('owc-autocomplete')
    );
  }

  /**
   * @param {import('lit').PropertyValues} changedProperties
   */
  updated(changedProperties) {
    if (
      (changedProperties.has('value') || changedProperties.has('data')) &&
      this._owcAutocomplete
    ) {
      if (this.data.find(elm => elm.value === this.value)) {
        this._owcAutocomplete.value = this.value;
      } else {
        this._owcAutocomplete.value = '';
      }
    }
    super.update(changedProperties);
  }

  focus() {
    this._waInput?.focus();
  }

  /** Sync input → state, reset active selection */
  _onInput() {
    const el = this._waInput;
    if (!el) {
      return;
    }
    this.value = el.value ?? '';
  }

  /**
   * Full replacement of the input
   * @param {Option} opt
   */
  _applySelection(opt) {
    if (!opt) {
      return;
    }
    this.value = opt.value;
    if (this._waInput) {
      this._waInput.value = opt.value;
      this._waInput.focus?.({ preventScroll: true });
    }
    this.dispatchEvent(new Event('change'));
  }

  /**
   * @param {CustomEvent} event
   */
  _onAutocompleteChange(event) {
    const selectedOption = event.detail;
    if (selectedOption && selectedOption.label && typeof selectedOption.label === 'string') {
      this._applySelection(selectedOption);
    }
  }

  render() {
    return html`
      <div class="wrap">
        <div class="col input-col">
          <wa-input
            class="form"
            .label=${this.label}
            .placeholder=${this.placeholder ?? ''}
            .value=${this.value ?? ''}
            @input=${this._onInput}
          >
          </wa-input>
        </div>

        <div class="col list-col">
          <owc-autocomplete
            fixed-trigger
            aria-label="options"
            class="form"
            .label=${this.label ? ' ' : ''}
            .data=${this.data}
            @change=${(/** @type {{ preventDefault: () => void; }} */ ev) => {
              ev.preventDefault();
            }}
            @autocomplete-selection=${this._onAutocompleteChange}
            ?open=${this.open}
          >
          </owc-autocomplete>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }
    .wrap {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 5px;
      align-items: end;
    }
    .label {
      margin-inline-start: 2px;
      margin-block-end: 6px;
      display: inline-block;
    }
    .col.input-col {
      min-width: 220px;
    }
    .form {
      font-size: inherit;
    }
  `;
}
