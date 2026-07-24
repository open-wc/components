import { LitElement, html, css, nothing } from 'lit';

import '@awesome.me/webawesome/dist/components/radio-group/radio-group.js';
import '@awesome.me/webawesome/dist/components/radio/radio.js';

/**
 * Shared radio group for selecting the template email tag.
 *
 */
export class OwcEmailTagRadioGroup extends LitElement {
  static properties = {
    tags: { type: Array },
    value: { type: String },
    label: { type: String },
    handleValueChange: { type: Function },
  };

  constructor() {
    super();

    /** @type {{ value: string, label: string }[]} */
    this.tags = [];

    /** @type {string | undefined} */
    this.value = undefined;

    /** @type {string} */
    this.label = 'Art der E-Mail';

    /** @type {(value: string | undefined) => void} */
    this.handleValueChange = () => {};
  }

  /**
   * @param {Event} event
   */
  handleChange(event) {
    const target = /** @type {{ value?: string }} */ (event.target);
    const nextValue = typeof target.value === 'string' ? target.value : '';

    this.value = nextValue || undefined;

    this.handleValueChange(this.value);
  }

  render() {
    if (!Array.isArray(this.tags) || this.tags.length <= 0) {
      return nothing;
    }

    return html`
      <wa-radio-group
        class="email-tag-radio-group"
        .label=${this.label}
        .value=${this.value ?? ''}
        orientation="horizontal"
        @change=${this.handleChange}
      >
        ${this.tags.map(
          tag => html` <wa-radio appearance="button" value=${tag.value}> ${tag.label} </wa-radio> `,
        )}
      </wa-radio-group>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }
  `;
}
