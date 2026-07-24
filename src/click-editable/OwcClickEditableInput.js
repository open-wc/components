import { css, html, nothing } from 'lit';
import { OwcClickEditable } from './OwcClickEditable.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import { classMap } from 'lit/directives/class-map.js';
import '@awesome.me/webawesome/dist/components/copy-button/copy-button.js';
import { isReasonableDate, toInputDateString } from './valueHelpers.js';

export class OwcClickEditableInput extends OwcClickEditable {
  static properties = { ...super.properties };

  /**
   * @param {import('lit').PropertyValues} changedProperties
   */
  shouldUpdate(changedProperties) {
    if (
      (this.type === 'datetime-local' || this.type === 'date') &&
      changedProperties.has('value')
    ) {
      // Skip renders for invalid intermediate dates (e.g. while typing a year)
      return this.value === '' || isReasonableDate(this.value);
    }
    return true;
  }

  /**
   * @param {import('lit').PropertyValues} changedProperties
   */
  update(changedProperties) {
    if ((this.type === 'datetime-local' || this.type === 'date') && this.value) {
      if (!isReasonableDate(this.value)) {
        this.value = this.lastValue;
      }
    }
    super.update(changedProperties);
  }

  render() {
    const classes = {
      display: true,
      'empty-display-muted': this.isEditPlaceholder(),
    };

    const valueDateFormatted = toInputDateString(this.value, this.type);
    return html`
      <div class="main-container">
        <div class="label-text-container">
          <div class="label-container">
            <slot name="label" class="label" part="label"></slot>
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
                ? html`<wa-copy-button value=${this.value}></wa-copy-button>`
                : nothing
            }
          </div>
        </div>
        <div class="form-container-wrapper">
          <div
            class=${classMap({
              'form-container': true,
              'is-date': ['time', 'date', 'datetime-local'].includes(this.type),
              'is-number': this.type === 'number',
            })}
          >
            <wa-input
              ?disabled=${!this.editable}
              @input=${() => {
                if (this.editable) {
                  this._change();
                  // Set a timeout to validate such that events can settle before validating
                  setTimeout(() => {
                    this.validate();
                  }, 50);
                }
              }}
              @keydown=${this._handleKeyDown}
              class="form"
              step="any"
              id="form-element"
              @blur=${() => {
                if (this.editable) {
                  this._submit();
                }
              }}
              type=${this.type}
              min=${this.type === 'date' || this.type === 'datetime-local' ? '1900-01-01' : ''}
              max=${this.type === 'date' || this.type === 'datetime-local' ? '3000-03-03' : ''}
              value=${valueDateFormatted ?? this.value}
            ></wa-input>
            <div class="hint">${this._localize.term('clickEditableHint')}</div>
          </div>
        </div>
      </div>
      <slot name="help-text" class="help-text when-editable"></slot>
    `;
  }

  static styles = [
    ...super.styles,
    css`
      :host([form-align='center']) .form-container {
        margin: 0;
        margin-top: 19px;
      }
      :host([form-align='center']) .form::part(input) {
        text-align: center;
      }

      :host([form-align='end']) .form::part(input) {
        text-align: end;
      }
      .label-text-container {
        display: block;
      }

      .form::part(base) {
        font-size: inherit;
      }
    `,
  ];
}
