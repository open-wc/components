import { LitElement, html, css } from 'lit';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { OwcAutocomplete } from '@open-wc/components/OwcAutocomplete.js';

import { findOptionByValue, isSelectableOption } from './optionHelpers.js';

import '@awesome.me/webawesome/dist/components/input/input.js';

/** @typedef {import('./OwcInputAutofill.types.js').OwcInputAutofillOption} Option */

/**
 * A free-text input paired with an autocomplete dropdown: typing stays free text,
 * picking an option replaces the input with the option's value.
 *
 * @fires input - while the user types free text (relayed from the inner input)
 * @fires change - when an option is picked from the dropdown or typed text is committed
 */
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
    this.data = [];
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
   * Mirror the value into the dropdown so a matching option shows as selected;
   * free text that matches no option clears the dropdown selection.
   *
   * @param {import('lit').PropertyValues} changedProperties
   */
  updated(changedProperties) {
    super.updated(changedProperties);
    if (
      (changedProperties.has('value') || changedProperties.has('data')) &&
      this._owcAutocomplete
    ) {
      const option = findOptionByValue(this.data, this.value);
      this._owcAutocomplete.value = option ? option.value : '';
    }
  }

  focus() {
    this._waInput?.focus();
  }

  /** Sync input → state while typing */
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
    this.value = opt.value;
    if (this._waInput) {
      this._waInput.value = opt.value;
      this._waInput.focus?.({ preventScroll: true });
    }
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  /**
   * @param {CustomEvent} event
   */
  _onAutocompleteChange(event) {
    const selectedOption = event.detail;
    if (isSelectableOption(selectedOption)) {
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
    .col.input-col {
      min-width: 220px;
    }
    .form {
      font-size: inherit;
    }
  `;
}
