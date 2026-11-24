import { LitElement, css, html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { HasSlotController } from '../autocomplete/HasSlotController.js';
import '@awesome.me/webawesome/dist/components/details/details.js';
import '@awesome.me/webawesome/dist/components/badge/badge.js';
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
 * @slot heading - Primary text in the default summary stack; overridden by text.
 * @slot description - Supporting text below heading; overridden by text.
 * @slot value - Primary value in the right-aligned stack; overridden by detail.
 * @slot value-description - Supporting value text; overridden by detail.
 * @slot badge - Optional badge positioned over the summary's trailing edge.
 * @slot suffix - An optional trailing indicator. Defaults to a chevron.
 * @event card-toggle - Bubbling/composed { open } notification forwarded from Web Awesome transitions.
 * @csspart trigger - The Web Awesome disclosure header, absent for static summaries.
 * @csspart content - The summary row, including its surface, spacing and padding.
 * @csspart icon - The leading visual container.
 * @csspart text - The primary text column.
 * @csspart detail - The right-aligned value column.
 * @csspart heading - The default heading slot.
 * @csspart description - The default supporting-text slot.
 * @csspart value - The default primary-value slot.
 * @csspart value-description - The default supporting-value slot.
 * @csspart suffix - The trailing indicator container.
 * @csspart badge - The badge container.
 * @csspart body - The expanded body.
 * @cssproperty --owc-detail-card-accent-color - The accent rail color.
 * @cssproperty --owc-detail-card-accent-width - The accent rail width.
 * @cssproperty --owc-detail-card-background - The header and body background.
 * @cssproperty --owc-detail-card-border - The header and body border shorthand.
 * @cssproperty --owc-detail-card-border-width - The header and body border width.
 * @cssproperty --owc-detail-card-border-style - The header and body border style.
 * @cssproperty --owc-detail-card-border-color - The header and body border color.
 * @cssproperty --owc-detail-card-border-inline-start-width - The header's leading border width.
 * @cssproperty --owc-detail-card-border-radius - The card corner radius.
 * @cssproperty --owc-detail-card-shadow - The header shadow.
 */
export class OwcDetailCard extends LitElement {
  static properties = {
    accentColor: { type: String, attribute: 'accent-color' },
    open: { type: Boolean, reflect: true },
    headingLevel: { type: Number, attribute: 'heading-level' },
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
      'heading',
      'description',
      'value',
      'value-description',
    );
    this.accentColor = '';
    this.open = false;
    this.headingLevel = 3;
    this.withIcon = false;
    this.withDetail = false;
    this.withBody = false;
  }

  /** Focus the disclosure trigger, or the static heading when no details exist. */
  /** @param {FocusOptions} [options] */
  focus(options) {
    const target = this.withBody
      ? this.shadowRoot?.querySelector('wa-details')?.header
      : /** @type {HTMLElement | null | undefined} */ (
          this.shadowRoot?.querySelector('.static-summary')
        );
    target?.focus(options);
  }

  /** Open the details and wait for Web Awesome's expansion animation. */
  async show() {
    await this.updateComplete;
    const details = this.shadowRoot?.querySelector('wa-details');
    await details?.updateComplete;
    return details?.show();
  }

  /** @param {import('lit').PropertyValues} changedProperties */
  willUpdate(changedProperties) {
    if (
      changedProperties.has('open') &&
      !this.open &&
      this.shadowRoot?.querySelector('.body')?.matches(':focus-within')
    ) {
      this.focus({ preventScroll: true });
    }
    this.withBody = this.hasSlotController.test('[default]');
    this.withIcon = this.hasSlotController.test('icon');
    this.withDetail = ['detail', 'value', 'value-description'].some(name =>
      this.hasSlotController.test(name),
    );
  }

  async updated() {
    const details = this.shadowRoot?.querySelector('wa-details');
    await details?.updateComplete;
    if (details) {
      // Web Awesome 3.14 references this header ID without assigning it. Its
      // default region would also create a landmark for every expanded card.
      details.header.id = 'header';
      details.body.setAttribute('role', 'group');
    }
  }

  /** @param {Event} event */
  handleToggle(event) {
    if (event.target === event.currentTarget) {
      this.open = event.type === 'wa-show';
      this.dispatchEvent(
        new CustomEvent('card-toggle', {
          detail: { open: this.open },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  renderSummary() {
    return html`
      <div part="content" class="content">
        <div part="icon" class="icon">
          <slot name="icon"></slot>
        </div>
        <div part="text" class="text">
          <slot name="text">
            <div class="summary-stack">
              <slot
                part="heading"
                name="heading"
                class="primary"
                ?hidden=${!this.hasSlotController.test('heading')}
              ></slot>
              <slot
                part="description"
                name="description"
                class="secondary"
                ?hidden=${!this.hasSlotController.test('description')}
              ></slot>
            </div>
          </slot>
        </div>
        <div part="detail" class="detail">
          <slot name="detail">
            <div class="summary-stack">
              <slot
                part="value"
                name="value"
                class="primary"
                ?hidden=${!this.hasSlotController.test('value')}
              ></slot>
              <slot
                part="value-description"
                name="value-description"
                class="secondary"
                ?hidden=${!this.hasSlotController.test('value-description')}
              ></slot>
            </div>
          </slot>
        </div>
        <div part="suffix" class="suffix">
          <slot name="suffix">
            <wa-icon name="chevron-down"></wa-icon>
          </slot>
        </div>
      </div>
      <div part="badge" class="badge">
        <slot name="badge"></slot>
      </div>
    `;
  }

  render() {
    const styles = this.accentColor ? { '--owc-detail-card-accent-color': this.accentColor } : {};
    const level = [1, 2, 3, 4, 5, 6].includes(this.headingLevel) ? this.headingLevel : 3;
    return html`
      <div class="card${this.accentColor ? ' card--with-accent' : ''}" style=${styleMap(styles)}>
        ${
          this.withBody
            ? html`
                <wa-details
                  exportparts="header:trigger"
                  .open=${this.open}
                  @wa-show=${this.handleToggle}
                  @wa-hide=${this.handleToggle}
                >
                  <div
                    slot="summary"
                    part="summary"
                    class="summary"
                    role="heading"
                    aria-level=${level}
                  >
                    ${this.renderSummary()}
                  </div>
                  <div part="body" class="body" ?inert=${!this.open}>
                    <slot></slot>
                  </div>
                </wa-details>
              `
            : html`<div
                  part="summary"
                  class="summary static-summary"
                  role="heading"
                  aria-level=${level}
                  tabindex="-1"
                >
                  ${this.renderSummary()}
                </div>
                <slot hidden></slot>`
        }
      </div>
    `;
  }

  static styles = [
    css`
      :host {
        --owc-detail-card-accent-color: var(--wa-color-brand-fill-loud);
        --owc-detail-card-accent-width: 0.5625rem;
        --owc-detail-card-background: var(--wa-color-surface-default);
        --owc-detail-card-border-width: var(--wa-border-width-s, 1.5px);
        --owc-detail-card-border-style: solid;
        --owc-detail-card-border-color: var(--wa-color-surface-border);
        --owc-detail-card-border: var(--owc-detail-card-border-width)
          var(--owc-detail-card-border-style) var(--owc-detail-card-border-color);
        --owc-detail-card-border-inline-start-width: 0;
        --owc-detail-card-border-radius: var(--wa-border-radius-l, 0.5rem);
        --owc-detail-card-shadow: var(--wa-shadow-s);
        display: block;
        color: var(--wa-color-text-normal);
      }

      .card {
        border: none;
        padding: 0;
        box-shadow: none;
        border-radius: var(--owc-detail-card-border-radius);
        overflow: visible;
        background: linear-gradient(
          90deg,
          var(--owc-detail-card-accent-color) 0,
          var(--owc-detail-card-accent-color) var(--owc-detail-card-accent-width),
          transparent var(--owc-detail-card-accent-width),
          transparent 100%
        );
      }

      .summary {
        display: block;
        position: relative;
        width: 100%;
        padding: 0;
        margin: 0;
        border: 0;
        border-radius: var(--owc-detail-card-border-radius);
        background: transparent;
        font: inherit;
        color: inherit;
        text-align: start;
      }

      wa-details::part(details) {
        border: none;
        border-radius: inherit;
        background: transparent;
        overflow: visible;
      }

      wa-details::part(header),
      wa-details::part(content) {
        padding: 0;
      }

      wa-details::part(summary) {
        width: 100%;
      }

      wa-details::part(icon) {
        display: none;
      }

      .summary:focus-visible {
        outline: var(--wa-focus-ring, 3px solid Highlight);
        outline-offset: var(--wa-focus-ring-offset, 2px);
      }

      .content {
        box-sizing: border-box;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto auto;
        align-items: center;
        gap: var(--wa-space-xs, 0.5rem);
        min-inline-size: 0;
        padding: var(--wa-space-s, 0.75rem) var(--wa-space-m, 1rem);
        margin-inline-start: var(--owc-detail-card-accent-width);
        background-color: var(--owc-detail-card-background);
        border: var(--owc-detail-card-border);
        border-inline-start-width: var(--owc-detail-card-border-inline-start-width);
        border-start-end-radius: var(--owc-detail-card-border-radius);
        border-end-end-radius: var(--owc-detail-card-border-radius);
        box-shadow: var(--owc-detail-card-shadow);
      }

      :host([with-body][open]) .content {
        border-block-end-width: 0;
        border-end-start-radius: 0;
        border-end-end-radius: 0;
      }

      .card:not(.card--with-accent) {
        background: transparent;
      }

      .card:not(.card--with-accent) .content,
      .card:not(.card--with-accent) .body {
        margin-inline-start: 0;
      }

      .card:not(.card--with-accent) .content {
        border-inline-start-width: var(--owc-detail-card-border-width);
        border-start-start-radius: var(--owc-detail-card-border-radius);
        border-end-start-radius: var(--owc-detail-card-border-radius);
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

      .summary-stack {
        display: grid;
        gap: var(--wa-space-3xs, 0.125rem);
        min-inline-size: 0;
        overflow-wrap: anywhere;
        line-height: var(--wa-line-height-condensed, 1.2);
      }

      .primary,
      .secondary {
        display: block;
        min-inline-size: 0;
      }

      .primary {
        font-family: var(--wa-font-family-heading, inherit);
        font-size: var(--wa-font-size-s, 0.875rem);
        font-weight: var(--wa-font-weight-heading, 600);
      }

      .secondary {
        color: var(--wa-color-text-quiet, #666);
        font-family: var(--wa-font-family-body, inherit);
        font-size: var(--wa-font-size-xs, 0.75rem);
        font-weight: var(--wa-font-weight-body, 400);
      }

      .primary::slotted(*),
      .secondary::slotted(*) {
        margin: 0;
        font: inherit;
      }

      [hidden] {
        display: none !important;
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

      .badge {
        display: flex;
        gap: var(--wa-space-2xs, 0.25rem);
        position: absolute;
        inset-block-start: 0;
        inset-inline-end: 1.25rem;
        z-index: 1;
        transform: translateY(-50%);
      }

      slot[name='badge']::slotted(wa-badge) {
        padding: 0.18em 0.72em;
        font-size: var(--wa-font-size-2xs, 11px);
      }

      :host([open]) .suffix {
        transform: rotate(180deg);
      }

      .body {
        box-sizing: border-box;
        position: relative;
        margin-inline-start: var(--owc-detail-card-accent-width);
        border: var(--owc-detail-card-border);
        border-top-width: 0;
        border-end-end-radius: var(--owc-detail-card-border-radius);
        background-color: var(--owc-detail-card-background);
        padding: var(--wa-space-s, 0.75rem) var(--wa-space-m, 1rem);
      }

      .card:not(.card--with-accent) .body {
        border-end-start-radius: var(--owc-detail-card-border-radius);
      }

      .body::before {
        content: '';
        position: absolute;
        inset-inline: var(--wa-space-m, 1rem);
        inset-block-start: 0;
        border-top: 1px solid var(--owc-detail-card-border-color);
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

      :host(:not([with-body])) .suffix {
        display: none;
      }

      @media (prefers-reduced-motion: reduce) {
        wa-details {
          --show-duration: 0s;
          --hide-duration: 0s;
        }

        .suffix {
          transition: none;
        }
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
