import { LitElement, html, css } from 'lit';
import { CountUp } from 'countup.js';

export class OwcCountUp extends LitElement {
  static properties = {
    start: { type: Number },
    end: { type: Number },
    duration: { type: Number },
    separator: { type: String },
    options: { type: Object },
  };

  /** @type {CountUp | undefined} */
  // eslint-disable-next-line no-unused-private-class-members
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

  get #target() {
    if (this.shadowRoot) {
      return /** @type {HTMLElement} */ (this.shadowRoot.querySelector('#target'));
    }
    return undefined;
  }

  /**
   * @param {import('lit').PropertyValues} changedProperties
   */
  update(changedProperties) {
    if (
      changedProperties.has('start') ||
      changedProperties.has('end') ||
      changedProperties.has('duration') ||
      changedProperties.has('separator') ||
      changedProperties.has('options')
    ) {
      this.options = {
        startVal: this.start,
        duration: this.duration,
        separator: this.separator,
        ...this.options,
      };
      this.#setup();
    }

    super.update(changedProperties);
  }

  #setup() {
    if (this.#target) {
      this.#countUp = new CountUp(this.#target, this.end, this.options);
    }
  }

  firstUpdated() {
    this.#setup();
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
