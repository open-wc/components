import { css, html, nothing } from 'lit';
import { OwcClickEditable } from './OwcClickEditable.js';
import '@awesome.me/webawesome/dist/components/textarea/textarea.js';
import { classMap } from 'lit/directives/class-map.js';
import '@awesome.me/webawesome/dist/components/copy-button/copy-button.js';
import { ifDefined } from 'lit/directives/if-defined.js';

export class OwcClickEditableTextarea extends OwcClickEditable {
  static properties = {
    ...super.properties,
  };

  constructor() {
    super();
  }

  render() {
    const classes = {
      display: true,
      'empty-display-muted': this.isEditPlaceholder(),
    };
    return html`
      <slot name="label" class=""></slot>
      <div class="main-container">
        <div class="display-container">
          <span
            class="${classMap(classes)}"
            @dblclick=${this._handleEditClick}
            tabindex=${this.editable ? '-1' : '0'}
            @keydown=${this._handleKeyDown}
            >${
              this.isEditPlaceholder() ? this.fallbackValue : this.formatter(this.parsedValue)
            }</span
          >
          ${
            this.showCopyButton
              ? html`<wa-copy-button value="${this.value}"></wa-copy-button>`
              : nothing
          }
        </div>
        <div class="form-container-wrapper">
          <div
            class=${classMap({
              'form-container': true,
              'is-date': ['time', 'date', 'datetime-local'].includes(this.type),
              'is-number': this.type === 'number',
            })}
          >
            <wa-textarea
              @input=${() => {
                if (this.editable) {
                  this._change();
                  // Set a timeout to validate such that events can settle before validating
                  setTimeout(() => {
                    this.validate();
                  }, 50);
                }
              }}
              tabindex=${ifDefined(this.editable ? undefined : '-1')}
              @keydown=${this._handleKeyDown}
              class="form"
              id="form-element"
              rows="1"
              @blur=${() => {
                if (this.editable) {
                  this._submit();
                }
              }}
              value=${this.value}
              resize="auto"
            ></wa-textarea>
            <div class="hint">Esc zum abbrechen</div>
          </div>
        </div>
      </div>
      <slot name="help-text" class="help-text when-editable"></slot>
    `;
  }

  static styles = [
    ...super.styles,
    css`
      :host([form-align='center']) .display-container {
        text-align: center;
      }
      :host([form-align='center']) .form::part(textarea) {
        text-align: center;
      }

      :host([form-align='center']) .form-container-wrapper {
        display: block;
        justify-content: unset;
        align-content: center;
      }
      .form {
        max-width: 100%;
      }

      .form::part(base) {
        font-size: inherit;
      }

      .display {
        white-space: pre-wrap;
        line-height: 1.4;
      }

      .form-container {
        margin-right: calc(-1 * var(--input-pad-left));
      }
    `,
  ];
}
