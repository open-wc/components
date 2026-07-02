import { LitElement, css, html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { HasSlotController } from '../autocomplete/HasSlotController.js';
import '@awesome.me/webawesome/dist/components/details/details.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';

/**
 * @summary A compact card-like layout with an accent rail, icon, primary text, and detail content.
 * @status experimental
 * @since 1.0
 *
 * @slot - Expandable detail content rendered below the summary row.
 * @slot icon - The icon or leading visual.
 * @slot text - The primary text column, e.g. title and subtitle.
 * @slot detail - The right-aligned summary column, e.g. price and period.
 * @slot suffix - An optional trailing indicator. Defaults to a chevron.
 * @cssproperty --owc-detail-card-accent-color - The accent rail color.
 */
export class OwcDetailCard extends LitElement {
  static properties = {
    accentColor: { type: String, attribute: 'accent-color' },
    open: { type: Boolean, reflect: true },
    withIcon: { type: Boolean, reflect: true, attribute: 'with-icon' },
    withDetail: { type: Boolean, reflect: true, attribute: 'with-detail' },
    withBody: { type: Boolean, reflect: true, attribute: 'with-body' },
  };

  constructor() {
    super();
    this.hasSlotController = new HasSlotController(
      this,
      '[default]',
      'icon',
      'text',
      'detail',
      'suffix',
    );
    this.accentColor = '';
    this.open = false;
    this.withIcon = false;
    this.withDetail = false;
    this.withBody = false;
  }

  updated() {
    this.withBody = this.hasSlotController.test('[default]');
    this.withIcon = this.hasSlotController.test('icon');
    this.withDetail = this.hasSlotController.test('detail');
  }

  /**
   * @param {Event & { currentTarget: HTMLElement & { open?: boolean } }} event
   */
  handleToggle(event) {
    this.open = !!event.currentTarget?.open;
  }

  render() {
    const styles = this.accentColor
      ? { '--owc-detail-card-accent-color': this.accentColor }
      : undefined;

    return html`
      <wa-details
        class="card"
        style=${styleMap(styles ?? {})}
        ?open=${this.open}
        @toggle=${this.handleToggle}
      >
        <div slot="summary" class="summary">
          <div class="content">
            <div class="icon">
              <slot name="icon"></slot>
            </div>
            <div class="text">
              <slot name="text"></slot>
            </div>
            <div class="detail">
              <slot name="detail"></slot>
            </div>
            <div class="suffix">
              <slot name="suffix">
                <wa-icon name="chevron-down"></wa-icon>
              </slot>
            </div>
          </div>
        </div>
        <div class="body">
          <slot></slot>
        </div>
      </wa-details>
    `;
  }

  static styles = [
    css`
      :host {
        --owc-detail-card-accent-color: var(--wa-color-brand-fill-loud);
        display: block;
        color: var(--wa-color-text-normal);
      }

      wa-details::part(base) {
        --owc-detail-card-accent-width: 0.5625rem;
        border: none;
        padding: 0;
        box-shadow: none;
        border-radius: 0.5rem;
        overflow: hidden;
        background: linear-gradient(
          90deg,
          var(--owc-detail-card-accent-color) 0,
          var(--owc-detail-card-accent-color) var(--owc-detail-card-accent-width),
          transparent var(--owc-detail-card-accent-width),
          transparent 100%
        );
      }

      wa-details::part(summary) {
        padding: 0;
        margin: 0;
      }

      wa-details::part(header) {
        padding: 0;
      }

      wa-details::part(icon) {
        display: none;
      }

      wa-details::part(content) {
        margin: 0;
        padding: 0;
      }

      .summary {
        display: block;
        width: 100%;
      }

      .content {
        box-sizing: border-box;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto auto;
        align-items: center;
        gap: 0.5rem;
        min-inline-size: 0;
        padding: 0.75rem 1rem;
        margin-inline-start: var(--owc-detail-card-accent-width);
        background-color: var(--wa-color-surface-default);
        border: 1.5px solid var(--wa-color-surface-border);
        border-inline-start-width: 0;
        border-start-end-radius: 0.5rem;
        border-end-end-radius: 0.5rem;
        box-shadow: var(--wa-shadow-s);
      }

      wa-details[open] .content {
        border-block-end-width: 0;
        border-end-end-radius: 0;
      }

      .icon {
        display: flex;
        align-items: center;
        justify-content: center;
        inline-size: 1.5rem;
        block-size: 1.5rem;
        flex: 0 0 auto;
        color: var(--wa-color-text-normal);
      }

      .text,
      .detail {
        min-inline-size: 0;
      }

      .text {
        min-inline-size: 0;
      }

      .detail {
        min-inline-size: 0;
        text-align: end;
      }

      .suffix {
        display: flex;
        align-items: center;
        justify-content: center;
        inline-size: 1.5rem;
        block-size: 1.5rem;
        color: var(--wa-color-text-normal);
        transition: transform var(--wa-transition-fast);
      }

      wa-details[open] .suffix {
        transform: rotate(180deg);
      }

      .body {
        box-sizing: border-box;
        position: relative;
        margin-inline-start: var(--owc-detail-card-accent-width);
        border: 1.5px solid var(--wa-color-surface-border);
        border-top-width: 0;
        border-end-end-radius: 0.5rem;
        background-color: var(--wa-color-surface-default);
        padding: 0.75rem 1rem;
      }

      .body::before {
        content: '';
        position: absolute;
        inset-inline: 1rem;
        inset-block-start: 0;
        border-top: 1px solid var(--wa-color-surface-border);
      }

      @supports (text-box: trim-both cap alphabetic) {
        .text,
        .detail {
          text-box: trim-both cap alphabetic;
        }
      }

      :host(:not([with-body])) .body {
        display: none;
      }

      :host(:not([with-icon])) .icon,
      :host(:not([with-detail])) .detail {
        display: none;
      }

      :host(:not([with-icon])) .content {
        grid-template-columns: minmax(0, 1fr) auto auto;
      }

      :host(:not([with-detail])) .content {
        grid-template-columns: auto minmax(0, 1fr) auto;
      }

      :host(:not([with-icon]):not([with-detail])) .content {
        grid-template-columns: minmax(0, 1fr) auto;
      }
    `,
  ];
}
