import { LitElement } from 'lit';

import '@awesome.me/webawesome/dist/components/tooltip/tooltip.js';
import { html } from 'lit/static-html.js';

export class OwcTooltip extends LitElement {
  static properties = {
    placement: { type: String },
    distance: { type: Number },
    open: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    skidding: { type: Number },
    showDelay: { type: Number, attribute: 'show-delay' },
    hideDelay: { type: Number, attribute: 'hide-delay' },
    trigger: { type: String },
    withoutArrow: { type: Boolean, attribute: 'without-arrow' },
  };

  constructor() {
    super();
    /**@type {'top' | 'top-start' | 'top-end' | 'right' | 'right-start' | 'right-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'left' | 'left-start' | 'left-end'} */
    this.placement = 'top';
    this.distance = 8;
    this.open = false;
    this.disabled = false;
    this.skidding = 0;
    this.showDelay = 150;
    this.hideDelay = 0;
    this.trigger = 'hover focus';
    this.withoutArrow = false;
  }

  render() {
    return html`
      <slot id="anchor" name="anchor"></slot>
      <wa-tooltip
        for="anchor"
        placement=${this.placement}
        distance=${this.distance}
        ?open=${this.open}
        ?disabled=${this.disabled}
        skidding=${this.skidding}
        show-delay=${this.showDelay}
        hide-delay=${this.hideDelay}
        trigger=${this.trigger}
        ?without-arrow=${this.withoutArrow}
      >
        <slot></slot>
      </wa-tooltip>
    `;
  }
}
