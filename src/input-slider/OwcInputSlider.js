import { LitElement, html, css } from 'lit';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';

import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/slider/slider.js';
import { ifDefined } from 'lit/directives/if-defined.js';

import { adjustRangeForValue, clampRangeToAbsolute } from './sliderRange.js';

export class OwcInputSlider extends ScopedElementsMixin(LitElement) {
  static scopedElements = {};

  static properties = {
    value: { type: Number },
    label: { type: String },
    inputPosition: { type: String, attribute: 'input-position' },
    stacked: { type: Boolean, reflect: true },
    min: { type: Number },
    max: { type: Number },
    step: { type: Number },
    absoluteMin: { type: Number, attribute: 'absolute-min' },
    absoluteMax: { type: Number, attribute: 'absolute-max' },
    disabled: { type: Boolean, reflect: true },
  };

  constructor() {
    super();
    this.value = 0;
    this.textValue = 0;
    this.label = '';
    /**@type {'start' | 'end'} */
    this.inputPosition = 'start';
    this.stacked = false;
    /**@type {Number | undefined} */
    this.absoluteMin;
    /**@type {Number | undefined} */
    this.absoluteMax;
    this.step = 1;

    this.disabled = false;

    this.min = 0;
    this.max = 100;
  }

  get #rangeState() {
    return {
      value: this.value,
      min: this.min,
      max: this.max,
      absoluteMin: this.absoluteMin,
      absoluteMax: this.absoluteMax,
    };
  }

  /**
   * @param {import('./sliderRange.js').SliderRangeState} state
   */
  #applyRangeState({ value, min, max }) {
    this.value = value;
    this.min = min;
    this.max = max;
  }

  /**
   * @param {import('lit').PropertyValues} changedProperties
   */
  update(changedProperties) {
    if (changedProperties.has('absoluteMin') || changedProperties.has('absoluteMax')) {
      this.#applyRangeState(clampRangeToAbsolute(this.#rangeState));
    }
    if (changedProperties.has('value')) {
      this.adjustValueForMinMax();
    }
    super.update(changedProperties);
  }

  adjustValueForMinMax() {
    this.#applyRangeState(adjustRangeForValue(this.#rangeState));
  }

  #adjustForStep() {
    this.value = this.value - (this.value % this.step);
  }

  /**
   * @param {Event & { target: { value: string; } }} ev
   */
  adjustTextValue(ev) {
    ev.stopPropagation();
    const nextValue = Number.parseFloat(ev.target.value);
    if (!Number.isFinite(nextValue)) {
      return;
    }
    this.value = nextValue;
    this.#adjustForStep();
    this.adjustValueForMinMax();
    this.textValue = this.value;
    this.requestUpdate()
    this.dispatchEvent(new Event(ev.type, { bubbles: true, composed: true }));
  }

  /**
   * @param {Event & { target: { value: string; } }} ev
   */
  adjustInput(ev) {
    // The inner change event does not cross the shadow boundary (it is not
    // composed) - stop the inner event and re-dispatch on the host instead
    ev.stopPropagation();
    const nextValue = Number.parseFloat(ev.target.value);
    if (!Number.isFinite(nextValue)) {
      return;
    }
    this.value = nextValue;
    this.#adjustForStep();
    this.adjustValueForMinMax();
    this.dispatchEvent(new Event(ev.type, { bubbles: true, composed: true }));
  }

  /**
   * @param {Event & { target: { value: number; } }} ev
   */
  adjustSlider(ev) {
    ev.stopPropagation();
    this.value = ev.target.value;
    this.textValue = this.value;
    this.dispatchEvent(new Event(ev.type, { bubbles: true, composed: true }));
  }

  render() {
    return html`
      <span part="label" class="label">${this.label}</span>
      ${
        this.inputPosition === 'start'
          ? html` <wa-input
              ?disabled=${this.disabled}
              type="number"
              exportparts="
              base:input-base,
              input:input-control,
              form-control-label:input-label,
              start:input-start,
              end:input-end,
              hint:input-hint,
              clear-button:input-clear-button,
              password-toggle-button:input-password-toggle-button
            "
              @input=${this.adjustInput}
              @change=${this.adjustInput}
              @blur=${this.adjustTextValue}
              .value=${this.textValue.toString()}
              min=${ifDefined(this.absoluteMin?.toString())}
              max=${ifDefined(this.absoluteMax?.toString())}
              .step=${this.step}
              label=${this.label}
            ></wa-input>`
          : ''
      }
      <wa-slider
        ?disabled=${this.disabled}
        exportparts="
          label:slider-label,
          hint:slider-hint,
          markers:slider-markers,
          marker:slider-marker,
          tooltip:slider-tooltip,
          tooltip__base:slider-tooltip-base,
          tooltip__content:slider-tooltip-content,
          slider:slider-base,
          track:slider-track,
          indicator:slider-indicator,
          thumb:slider-thumb,
          thumb-min:slider-thumb-min,
          thumb-max:slider-thumb-max
        "
        min=${this.absoluteMin ? this.absoluteMin : this.min}
        max=${this.absoluteMax ? this.absoluteMax : this.max}
        step=${this.step}
        @input=${this.adjustSlider}
        @change=${this.adjustSlider}
        .value=${this.value}
      ></wa-slider>
      ${
        this.inputPosition === 'end'
          ? html` <wa-input
              ?disabled=${this.disabled}
              type="number"
              exportparts="
              base:input-base,
              input:input-control,
              form-control-label:input-label,
              start:input-start,
              end:input-end,
              hint:input-hint,
              clear-button:input-clear-button,
              password-toggle-button:input-password-toggle-button
            "
              @input=${this.adjustInput}
              @change=${this.adjustTextValue}
              .value=${this.textValue.toString()}
              min=${ifDefined(this.absoluteMin?.toString())}
              max=${ifDefined(this.absoluteMax?.toString())}
              step=${this.step}
              label=${this.label}
            ></wa-input>`
          : ''
      }
    `;
  }

  static styles = css`
    :host {
      --owc-input-width: 8ch;
      --owc-input-slider-gap: 20px;
      display: grid;
      align-items: center;
      column-gap: var(--owc-input-slider-gap);
      grid-template-columns:
        calc(var(--owc-input-width) + 2 * var(--wa-form-control-padding-inline))
        1fr;
    }

    .label {
      grid-column: span 2;
    }

    :host([input-position='end']) {
      grid-template-columns:
        1fr
        calc(var(--owc-input-width) + 2 * var(--wa-form-control-padding-inline));
    }

    :host([input-position='end'][stacked]) {
      grid-template-columns:
        1fr
        calc(var(--owc-input-width) + 2 * var(--wa-form-control-padding-inline));
      row-gap: var(--owc-input-slider-gap);
    }

    :host([input-position='end'][stacked]) .label {
      grid-column: 1;
      grid-row: 1;
    }

    :host([input-position='end'][stacked]) wa-input {
      grid-column: 2;
      grid-row: 1;
    }

    :host([input-position='end'][stacked]) wa-slider {
      grid-column: 1 / -1;
      grid-row: 2;
    }

    wa-input::part(form-control-label) {
      display: none;
    }
  `;
}
