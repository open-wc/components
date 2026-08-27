import { HasSlotController } from '../autocomplete/HasSlotController.js';
import { LitElement, html } from 'lit';
import styles from './card.styles.js';

export class OwcCard extends LitElement {
  static properties = {
    href: { type: String },
    withHeader: { type: Boolean, reflect: true, attribute: 'with-header' },
    withFooter: { type: Boolean, reflect: true, attribute: 'with-footer' },
    withMedia: { type: Boolean, reflect: true, attribute: 'with-media' },
  };

  constructor() {
    super();
    // the registered slot names re-render the card on slotchange
    this.hasSlotController = new HasSlotController(this, 'footer', 'header', 'media');
    this.withHeader = false;
    this.withFooter = false;
    this.withMedia = false;
    this.href = '';
  }

  willUpdate() {
    this.withHeader = this.hasSlotController.test('header');
    this.withMedia = this.hasSlotController.test('media');
    this.withFooter = this.hasSlotController.test('footer');
  }

  render() {
    return html`
      ${
        this.href
          ? html`<a href=${this.href} class="href"></a
              ><a href=${this.href}><slot name="media" part="media" class="media"></slot></a>`
          : html` <slot name="media" part="media" class="media"></slot>`
      }
      <slot name="header" part="header" class="header"></slot>
      <slot part="body" class="body"></slot>
      <slot name="footer" part="footer" class="footer"></slot>
    `;
  }
  static styles = [styles];
}
