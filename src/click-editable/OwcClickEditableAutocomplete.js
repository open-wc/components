import { css, html, nothing } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { OwcClickEditable } from './OwcClickEditable.js';
import { OwcAutocomplete } from '../autocomplete/OwcAutocomplete.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import '@awesome.me/webawesome/dist/components/copy-button/copy-button.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { labelForValue, labelsForValues } from './labelHelpers.js';

/**
 * @template {Record<string, unknown>} T
 */
export class OwcClickEditableAutocomplete extends ScopedElementsMixin(OwcClickEditable) {
  static scopedElements = {
    'owc-autocomplete': OwcAutocomplete,
  };

  static properties = {
    ...super.properties,
    data: { attribute: false },
    multiple: { type: Boolean },
    clearable: { type: Boolean },
    hideSelectAll: { type: Boolean, attribute: 'hide-select-all' },
  };

  constructor() {
    super();
    /** @type {Array<T>} */
    this.data = /** @type {Array<T>} */ ([]);
    this.multiple = false;
    this.clearable = false;
    this.hideSelectAll = false;
  }

  get open() {
    if (this._autocomplete) {
      return this._autocomplete.open;
    }
    return false;
  }

  set open(value) {
    if (this._autocomplete) {
      this._autocomplete.open = value;
    }
  }

  /**
   * @type {OwcAutocomplete<T> | undefined}
   */
  #cachedAutocomplete = undefined;

  get _autocomplete() {
    if (!this.#cachedAutocomplete) {
      const autocomplete = this.shadowRoot?.querySelector('owc-autocomplete');
      if (autocomplete) {
        this.#cachedAutocomplete = /** @type {OwcAutocomplete<T>} */ (autocomplete);
      }
    }
    return this.#cachedAutocomplete;
  }

  /**
   * Labels are looked up loosely on purpose ('100' matches 100); values
   * without a matching option are skipped.
   *
   * @param {any} value
   */
  defaultFormatter(value) {
    if (Array.isArray(value)) {
      const formattedValue = labelsForValues(this.data, value);
      return html`${formattedValue.length > 0 ? formattedValue : this.fallbackValue}`;
    }
    return html`${labelForValue(this.data, value) || this.fallbackValue}`;
  }

  /**
   * @param {any} value
   */
  #formatToString(value) {
    if (Array.isArray(value)) {
      return labelsForValues(this.data, value);
    }
    return labelForValue(this.data, value) || '';
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
                ? html`<wa-copy-button
                    value="${this.#formatToString(this.parsedValue)}"
                  ></wa-copy-button>`
                : nothing
            }
          </div>
          </div>
          <div class="form-container-wrapper" >
            <div class="form-container input">
              <owc-autocomplete
                .hideSelectAll=${this.hideSelectAll}
                .multiple=${this.multiple || false}
                .withClear=${this.clearable}
                .syncWidth=${false}
                id="form-element"
                @wa-hide=${() => {
                  if (this.editable) {
                    if (this.multiple) {
                      this._submit();
                    } else {
                      this.editable = false;
                    }
                  }
                }}
                @change=${() => {
                  if (this.editable) {
                    if (!this.multiple) {
                      this._submit();
                    } else {
                      this._change();
                    }
                  }
                }}
                tabindex=${ifDefined(this.editable ? undefined : '-1')}
                @keydown=${this._handleKeyDown}
                .data=${this.data}
                .value=${this.value}
              ></owc-autocomplete>
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
        min-width: 10ch;
      }
    `,
  ];
}
