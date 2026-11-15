import { html } from 'lit';

customElements.define(
  'test-composed-control',
  class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' }).innerHTML = `
        <button id="shadow-first">First</button>
        <slot></slot>
        <button id="shadow-last">Last</button>
      `;
    }
  },
);

customElements.define(
  'test-forwarded-control',
  class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' }).innerHTML =
        '<test-composed-control><slot></slot></test-composed-control>';
    }
  },
);

export const composedControlTemplates = {
  'a slot': html`<test-composed-control
    ><input id="slotted-input" aria-label="Value"
  /></test-composed-control>`,
  'nested slots': html`<test-forwarded-control
    ><input id="slotted-input" aria-label="Value"
  /></test-forwarded-control>`,
};
