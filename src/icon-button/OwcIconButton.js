import { css, LitElement } from 'lit';

import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import { html, literal } from 'lit/static-html.js';
import { ifDefined } from 'lit/directives/if-defined.js';

import { getLinkAttributes } from './linkHelpers.js';

/**
 * A borderless icon-only button; renders as an anchor when `href` is set.
 */
export class OwcIconButton extends LitElement {
  static properties = {
    name: { type: String },
    href: { type: String },
    target: { type: String },
    download: { type: String },
    disabled: { type: Boolean, reflect: true },
    label: { type: String },
    variant: { type: String },
  };

  constructor() {
    super();
    this.name = '';
    this.href = '';
    /**@type {'_blank' | '_parent' | '_self' | '_top' | ''} */
    this.target = '';
    this.download = '';
    this.disabled = false;
    this.label = '';
    this.variant = '';
  }

  /**
   * @param {Event} event
   */
  #handleClick(event) {
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  get button() {
    return /**@type {HTMLButtonElement | HTMLAnchorElement | undefined}*/ (
      this.shadowRoot?.querySelector('.icon-button')
    );
  }

  /** Simulates a click on the icon button. */
  click() {
    this.button?.click();
  }

  /**
   * Sets focus on the icon button.
   * @param {FocusOptions} [options]
   */
  focus(options) {
    this.button?.focus(options);
  }

  /** Removes focus from the icon button. */
  blur() {
    this.button?.blur();
  }

  render() {
    const isLink = !!this.href;
    const tag = isLink ? literal`a` : literal`button`;
    const link = getLinkAttributes(this);
    return html`
      <${tag}
        class="icon-button"
        ?disabled=${!isLink && this.disabled}
        type=${ifDefined(isLink ? undefined : 'button')}
        href=${ifDefined(isLink ? link.href : undefined)}
        target=${ifDefined(isLink ? link.target : undefined)}
        download=${ifDefined(isLink ? link.download : undefined)}
        rel=${ifDefined(isLink ? link.rel : undefined)}
        aria-disabled=${this.disabled ? 'true' : 'false'}
        aria-label=${ifDefined(this.label || undefined)}
        tabindex=${this.disabled ? '-1' : '0'}
        @click=${this.#handleClick}
      >
      <wa-icon
        class="icon-button__icon"
        name=${this.name}
        aria-hidden="true"
        variant=${ifDefined(this.variant || undefined)}
      ></wa-icon>
      </${tag}>
    `;
  }

  static styles = [
    css`
      :host {
        display: inline-block;
        color: var(--wa-color-neutral-40);
        padding: var(--wa-space-s);
      }

      .icon-button {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        background: none;
        border: none;
        border-radius: var(--wa-border-radius-m);
        font-size: inherit;
        color: inherit;
        cursor: pointer;
        transition: var(--wa-transition-fast) color;
        padding: 0;
        -webkit-appearance: none;
      }

      .icon-button:hover:not(:disabled, [aria-disabled='true']),
      .icon-button:focus-visible:not(:disabled, [aria-disabled='true']) {
        color: var(--wa-color-brand-40);
      }

      .icon-button:active:not(:disabled, [aria-disabled='true']) {
        color: var(--wa-color-brand-30);
      }

      .icon-button:focus {
        outline: none;
      }

      /* :disabled only matches the button variant; disabled links match via aria-disabled */
      .icon-button:disabled,
      .icon-button[aria-disabled='true'] {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .icon-button:focus-visible {
        outline: var(--wa-focus-ring);
        outline-offset: var(--wa-focus-ring-offset);
      }

      .icon-button__icon {
        pointer-events: none;
      }
    `,
  ];
}
