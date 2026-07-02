import { LitElement, css, html, nothing } from 'lit';
import '@awesome.me/webawesome/dist/components/input/input.js';
import { HasSlotController } from '../autocomplete/HasSlotController.js';
import '@awesome.me/webawesome/dist/components/format-date/format-date.js';
import { ifDefined } from 'lit/directives/if-defined.js';

export class OwcClickEditable extends LitElement {
  static properties = {
    value: { type: String },
    formatter: { type: Function },
    editable: { type: Boolean, attribute: 'editable', reflect: true },
    formAlign: { type: String, attribute: 'form-align' },
    type: { type: String },
    validator: { type: Function },
    readOnly: { type: Boolean, attribute: 'read-only', reflect: true },
    showCopyButton: { type: Boolean, attribute: 'show-copy-button', reflect: true },
    fallbackValue: { type: String },
  };

  /**
   * @type {any}
   */
  lastValue;

  constructor() {
    super();
    /**@type {string | Array<string> | number | boolean | Date} */
    this.value = '';
    this.hasSlotController = new HasSlotController(this, 'help-text', 'label');
    /** @type {(value: any) => (import('lit').TemplateResult | import("lit").nothing | undefined | null )} */
    this.formatter = this.defaultFormatter;
    this.editable = false;
    /**@type {'start' | 'center' | 'end' } */
    this.formAlign = 'start';
    /**@type {"number" | "email" | "text" | "search" | "time" | "date" | "datetime-local" | "password" | "tel" | "url"} */
    this.type = 'text';
    /**@type {((value: any) => ({valid: boolean; error?: string})) | undefined} */
    this.validator = undefined;
    this.readOnly = false;
    this.showCopyButton = false;
    this.fallbackValue = '-';
  }

  /**
   *
   * @param {any} value
   * @returns {import('lit').TemplateResult}
   */
  defaultFormatter(value) {
    if (['date', 'datetime-local'].includes(this.type)) {
      if (value) {
        return html` <wa-format-date
          day="2-digit"
          month="2-digit"
          year="numeric"
          hour=${ifDefined(this.type === 'datetime-local' ? '2-digit' : undefined)}
          minute=${ifDefined(this.type === 'datetime-local' ? '2-digit' : undefined)}
          date=${value.toISOString()}
          lang="de"
        ></wa-format-date>`;
      }
    }
    return html`<span>${value?.toString() || this.fallbackValue}</span>`;
  }

  isEditPlaceholder() {
    const formattedValue = this.formatter(this.parsedValue);
    return (
      formattedValue === undefined ||
      formattedValue === null ||
      formattedValue === nothing ||
      (formattedValue.values && formattedValue.values[0] === this.fallbackValue)
    );
  }

  validate() {
    if (!this.validator) {
      return;
    }
    const inputElement = /**@type {HTMLFormElement}*/ (
      this.shadowRoot?.querySelector(`#form-element`)
    );

    if (inputElement.setCustomValidity) {
      inputElement.setCustomValidity('');
      const validation = this.validator(this.getParsedValue(inputElement?.value || ''));
      if (!validation.valid) {
        inputElement.setCustomValidity(validation.error);
      }
    }
  }

  focus() {
    if (this.editable) {
      setTimeout(() => this.inputElement?.focus(), 0);
    } else {
      const el = this.shadowRoot?.querySelector('.display');
      if (el) {
        const typedEl = /**@type {HTMLElement} */ (el);
        typedEl.focus();
      }
    }
  }

  get inputElement() {
    return (
      /**@type {HTMLFormElement}*/ (this.shadowRoot?.querySelector(`#form-element`)) || undefined
    );
  }

  reportValidity() {
    this.validate();
    return this.inputElement.reportValidity ? this.inputElement.reportValidity() : true;
  }

  async _submit() {
    let nextValue = this.inputElement?.value || '';
    if (Array.isArray(nextValue)) {
      nextValue = nextValue.filter(Boolean);
    } else if (nextValue && this.type === 'number') {
      nextValue = Number.parseFloat(nextValue);
    }

    if (this.lastValue === nextValue) {
      this.editable = false;
      this.inputElement.blur;
      return;
    }

    this.value = nextValue;
    if (!this.reportValidity()) {
      return;
    }

    this.dispatchEvent(new Event('submit'));
    this.editable = false;
    this.inputElement.blur();
  }

  async _change() {
    let nextValue = this.inputElement?.value || '';
    if (Array.isArray(nextValue)) {
      nextValue = nextValue.filter(Boolean);
    }
    if (this.value instanceof Date && (this.type === 'date' || this.type === 'datetime-local')) {
      this.value = new Date(nextValue);
    } else {
      this.value = nextValue;
    }
    this.dispatchEvent(new Event('change'));
  }

  /**
   *
   * @param {any} value
   * @returns
   */
  getParsedValue(value) {
    switch (this.type) {
      case 'number':
        return value ? Number.parseFloat(value) : undefined;
      case 'date':
      case 'datetime-local':
        return value ? new Date(value) : undefined;
      default:
        return value;
    }
  }

  get parsedValue() {
    switch (this.type) {
      case 'number':
        // @ts-ignore
        return this.value ? Number.parseFloat(this.value) : undefined;
      case 'date':
      case 'datetime-local':
        // @ts-ignore
        return this.value ? new Date(this.value) : undefined;
      default:
        return this.value;
    }
  }

  _handleEditClick() {
    if (!this.inputElement || this.readOnly) {
      return;
    }
    const valueDate =
      (this.type === 'datetime-local' || this.type === 'date') && this.value
        ? // @ts-ignore
          new Date(this.value)
        : undefined;
    valueDate?.setMinutes(valueDate.getMinutes() - valueDate.getTimezoneOffset());
    // Slice off timezone seconds and millis from iso-date
    const valueDateFormatted = valueDate?.toISOString().slice(0, this.type === 'date' ? -14 : -8);

    const targetValue = this.value;
    this.lastValue = valueDate ? valueDateFormatted : targetValue;
    this.inputElement.value = valueDate ? valueDateFormatted : targetValue || '';
    this.editable = true;
    this.focus();
  }

  /**
   * @param {KeyboardEvent} ev
   */
  _handleKeyDown(ev) {
    if (this.editable) {
      if (ev.key === 'Enter' && !ev.shiftKey) {
        this._submit();
        this.focus();
      }
      if (ev.key === 'Escape') {
        if (this.value !== this.lastValue) {
          this.value = this.lastValue;
          this.dispatchEvent(new Event('change'));
        }
        this.editable = false;
        this.focus();
      }
    } else {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        this._handleEditClick();
      }
    }
  }

  /**
   * @param {import('lit').PropertyValues} changedProperties
   */
  update(changedProperties) {
    if (changedProperties.has('readOnly') && this.readOnly) {
      // readOnly changed from false to true
      if (this.editable && this.value !== this.lastValue) {
        this.value = this.lastValue;
      }
      this.editable = false;
    }
    if (changedProperties.has('formatter') && !this.formatter) {
      this.formatter = this.defaultFormatter;
    }
    super.update(changedProperties);
  }

  static styles = [
    css`
      .empty-display-muted {
        color: #adb5bd;
      }

      :host {
        white-space: inherit;
        text-wrap: inherit;
        position: relative;
      }

      * {
        opacity: 1;
        margin-bottom: 0;
        font-family: var(--wa-font-family-body);
      }

      .display:first-child {
        anchor-name: --my-anchor;
      }

      .form-container-wrapper {
        position: absolute;
        --top-left-top: calc(anchor(--my-anchor top));
        --top-left-left: calc(anchor(--my-anchor left));
        --input-pad-left: calc(var(--wa-space-m) + 1px);
        --input-pad-top: calc(var(--wa-space-s) - 1px);
        --anchor-width: anchor-size(--my-anchor width);
        --anchor-height: anchor-size(--my-anchor height);

        --full: anchor(--my-anchor 100%);
        top: calc(var(--top-left-top));
        left: calc(var(--top-left-left));
        width: calc(var(--anchor-width));
        height: calc(var(--anchor-height));
      }

      #form-element {
        font-size: inherit;
      }

      :host([form-align='center']) .form-container-wrapper {
        justify-content: center;
        align-content: center;
      }

      :host([form-align='end']) .form-container-wrapper {
        justify-content: end;
        align-content: center;
      }

      .form-container {
        margin-left: calc(-1 * var(--input-pad-left));
        margin-top: calc(-1 * var(--input-pad-top));
        z-index: 200;
      }

      :host([form-align='end']) .form-container-wrapper {
        margin-left: calc(1 * var(--input-pad-left));
        margin-top: calc(1 * var(--input-pad-top));
      }

      .form-container-wrapper {
        transition: opacity 200ms;
        transition: display 200ms;
        opacity: 0;
        pointer-events: none;
        display: none;
      }

      :host([editable]) .form-container-wrapper {
        opacity: 1;
        pointer-events: all;
        display: grid;
      }

      .hint {
        color: var(--wa-input-help-text-color);
        font-size: var(--wa-input-help-text-font-size-small);
        margin-top: var(--wa-space-2xs);
        text-align: center;
        width: 100%;
      }

      .help-text {
        color: var(--wa-input-help-text-color);
        font-size: var(--wa-input-help-text-font-size-small);
        margin-top: var(--wa-space-2xs);
        text-align: start;
        width: 100%;
      }

      @media print {
        * {
          .noPrint {
            display: none;
          }
        }
      }
    `,
  ];
}
