import { css, html, nothing } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { OwcClickEditable } from './OwcClickEditable.js';
import { OwcInputAutofill } from '../input-autofill/OwcInputAutofill.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import '@awesome.me/webawesome/dist/components/copy-button/copy-button.js';
import { ifDefined } from 'lit/directives/if-defined.js';

/**
 * @template {Record<string, unknown>} T
 */
export class OwcClickEditableInputAutofill extends ScopedElementsMixin(OwcClickEditable) {
  static scopedElements = {
    'owc-input-autofill': OwcInputAutofill,
  };

  static properties = {
    ...super.properties,
    data: { attribute: false },
  };

  constructor() {
    super();
    /** @type {Array<T>} */
    this.data = /** @type {Array<T>} */ ([]);
  }

  get open() {
    if (this._inputAutofill) {
      return this._inputAutofill.open;
    }
    return false;
  }

  set open(value) {
    if (this._inputAutofill) {
      this._inputAutofill.open = value;
    }
  }

  /**
   * @type {OwcInputAutofill | undefined}
   */
  #cachedAutocomplete = undefined;

  get _inputAutofill() {
    if (!this.#cachedAutocomplete) {
      const autocomplete = this.shadowRoot?.querySelector('owc-input-autofill');
      if (autocomplete) {
        this.#cachedAutocomplete = /** @type {OwcInputAutofill} */ (autocomplete);
      }
    }
    return this.#cachedAutocomplete;
  }

  render() {
    const classes = { display: true, 'empty-display-muted': this.isEditPlaceholder() };
    return html`
      <div class="main-container">
        <div class="label-text-container">
          <div class="label-container">
            <slot name="label" class="label"></slot>
          </div>
          <div class="display-container">
            <span
              class="${classMap(classes)}"
              @dblclick=${this._handleEditClick}
              tabindex=${this.editable ? '-1' : '0'}
              @keydown=${this._handleKeyDown}
              >${this.isEditPlaceholder() ? this.fallbackValue : this.formatter(this.parsedValue)}
            </span>
            ${
              this.showCopyButton
                ? html`<wa-copy-button value="${this.value}"></wa-copy-button>`
                : nothing
            }
          </div>
          </div>
          <div class="form-container-wrapper" >
            <div class="form-container input">
              <owc-input-autofill
                id="form-element"
                @change=${() => {
                  if (this.editable) {
                    this._change();
                  }
                }}
                @input=${() => {
                  if (this.editable) {
                    this._change();
                    // Set a timeout to validate such that events can settle before validating
                    setTimeout(() => {
                      this.validate();
                    }, 50);
                  }
                }}
                @blur=${() => {
                  if (this.editable) {
                    this._submit();
                  }
                }}
                tabindex=${ifDefined(this.editable ? undefined : '-1')}
                @keydown=${this._handleKeyDown}
                .data=${this.data}
                .value=${this.value}
              ></owc-input-autofill>
            </div>
          </div>
        </div>
        <slot name="help-text" class="help-text when-editable"></slot>
      </div>
    `;
  }

  static styles = [
    ...super.styles,
    css`
      .empty-display-muted {
        color: #adb5bd;
      }

      .form-container {
        white-space: nowrap;
        /* Give it a little extra space for the dropdown */
        margin-right: -25px;
      }

      :host([form-align='center']) .form-container {
        margin: 0;
        margin-left: 28px;
      }

      :host([form-align='end']) .form-container-wrapper {
        margin: 0;
        margin-left: -28px;
      }

      :host([form-align='center']) .form::part(combobox) {
        text-align: center;
      }

      :host([form-align='end']) .form::part(combobox) {
        text-align: end;
      }

      .form-container-wrapper {
        width: calc(var(--anchor-width) + 75px);
      }
    `,
  ];
}
