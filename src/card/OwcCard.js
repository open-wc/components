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
    this.hasSlotController = new HasSlotController(this, 'footer', 'header', 'image');
    this.withHeader = false;
    this.withFooter = false;
    this.withMedia = false;
    this.withHref = false;
    this.href = '';
  }

  updated() {
    if (!this.withHeader && this.hasSlotController.test('header')) {
      this.withHeader = true;
    }
    if (!this.withMedia && this.hasSlotController.test('media')) {
      this.withMedia = true;
    }
    if (!this.withFooter && this.hasSlotController.test('footer')) {
      this.withFooter = true;
    }
    this.withHref = !!this.href;
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
