import { css, LitElement } from 'lit';

import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import { html, literal } from 'lit/static-html.js';
import { ifDefined } from 'lit/directives/if-defined.js';

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
    this.disabled = '';
    this.label = '';
    this.variant = '';
  }

  #handleBlur() {
    this.hasFocus = false;
  }

  #handleFocus() {
    this.hasFocus = true;
  }

  /**
   *
   * @param {Event} event
   */
  #handleClick(event) {
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  get button() {
    return /**@type {HTMLButtonElement | HTMLLinkElement | undefined}*/ (
      this.shadowRoot?.querySelector('.icon-button')
    );
  }

  /** Simulates a click on the icon button. */
  click() {
    this.button?.click();
  }

  /** Sets focus on the icon button. */
  /**
   *
   * @param {FocusOptions} options
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
    return html`
      <${tag}
        class="icon-button"
        ?disabled=${ifDefined(isLink ? undefined : this.disabled)}
        type=${ifDefined(isLink ? undefined : 'button')}
        href=${ifDefined(isLink ? this.href : undefined)}
        target=${ifDefined(isLink ? this.target : undefined)}
        download=${ifDefined(isLink ? this.download : undefined)}
        rel=${ifDefined(isLink && this.target ? 'noreferrer noopener' : undefined)}
        role=${ifDefined(isLink ? undefined : 'button')}
        aria-disabled=${this.disabled ? 'true' : 'false'}
        aria-label="${this.label}"
        tabindex=${this.disabled ? '-1' : '0'}
        @blur=${this.#handleBlur}
        @focus=${this.#handleFocus}
        @click=${this.#handleClick}
      
      >
      <wa-icon
        class="icon-button__icon"
        name=${this.name}
        aria-hidden="true"
        variant=${this.variant}
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

      .icon-button:hover:not(.icon-button:disabled),
      .icon-button:focus-visible:not(.icon-button:disabled) {
        color: var(--wa-color-brand-40);
      }

      .icon-button:active:not(.icon-button--disabled) {
        color: var(--sl-color-brand-30);
      }

      .icon-button:focus {
        outline: none;
      }

      .icon-button:disabled {
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
