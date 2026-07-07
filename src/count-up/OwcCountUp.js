import { LitElement, html, css } from 'lit';
import { CountUp } from 'countup.js';

import { mergeCountUpOptions } from './mergeCountUpOptions.js';

/**
 * Animates a number counting up to `end`, powered by countup.js.
 * By default the animation starts when the element scrolls into view.
 */
export class OwcCountUp extends LitElement {
  static properties = {
    start: { type: Number },
    end: { type: Number },
    duration: { type: Number },
    separator: { type: String },
    options: { type: Object },
  };

  /** @type {CountUp | undefined} */
  #countUp = undefined;

  constructor() {
    super();
    this.start = 0;
    this.end = 0;
    this.duration = 5;
    this.separator = '.';
    /** @type {import('countup.js').CountUpOptions} */
    this.options = {
      enableScrollSpy: true,
      scrollSpyOnce: true,
    };
  }

  /** The underlying countup.js instance, e.g. for `countUp.reset()`. */
  get countUp() {
    return this.#countUp;
  }

  get #target() {
    if (this.shadowRoot) {
      return /** @type {HTMLElement} */ (this.shadowRoot.querySelector('#target'));
    }
    return undefined;
  }

  /**
   * @param {import('lit').PropertyValues} changedProperties
   */
  updated(changedProperties) {
    super.updated(changedProperties);
    if (
      changedProperties.has('start') ||
      changedProperties.has('end') ||
      changedProperties.has('duration') ||
      changedProperties.has('separator') ||
      changedProperties.has('options')
    ) {
      this.#setup();
    }
  }

  #setup() {
    if (this.#target) {
      this.#countUp = new CountUp(this.#target, this.end, mergeCountUpOptions(this, this.options));
    }
  }

  render() {
    return html`<div id="target"></div>`;
  }

  static styles = [
    css`
      :host {
        display: block;
      }
    `,
  ];
}
