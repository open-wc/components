import { LitElement, html, css } from 'lit';

/**
 * @summary Separators are used to separate elements with an in between note/info.
 * @status stable
 * @since 1.0
 *
 * @cssproperty --color - The color of the separator.
 * @cssproperty --width - The width of the separator.
 * @cssproperty --spacing - The spacing of the separator.
 */
export class OwcSeparator extends LitElement {
  static properties = {
    /** Draws the separator in a vertical orientation. */
    vertical: { type: Boolean, reflect: true },
  };

  constructor() {
    super();
    this.vertical = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'separator');
  }

  /**
   * @param {import('lit').PropertyValues} changedProperties
   */
  updated(changedProperties) {
    if (changedProperties.has('vertical')) {
      this.setAttribute('aria-orientation', this.vertical ? 'vertical' : 'horizontal');
    }
    super.updated(changedProperties);
  }

  render() {
    return html`
      <hr class="start" />
      <div>
        <slot></slot>
      </div>
      <hr class="end" />
    `;
  }

  static styles = [
    css`
      :host {
        --color: var(--wa-color-surface-border);
        --width: var(--wa-panel-border-width);
        --spacing: var(--wa-space-s);
        display: flex;
        width: 100%;
        font-size: 0.8em;
        flex-direction: column;
        align-items: center;
      }

      :host(:not([vertical])) {
        margin: var(--spacing) 0;
        flex-direction: row;
      }

      div {
        display: flex;
        padding: 0 var(--spacing);
      }

      hr {
        flex-grow: 1;
        border-width: 0;
        border-top: 1px solid var(--color);
      }

      .start {
        margin-left: var(--spacing);
      }
      .end {
        margin-right: var(--spacing);
      }

      :host([vertical]) {
        margin: 0 var(--spacing);
        width: 16px;
      }

      :host([vertical]) div {
        padding: calc(var(--spacing) * 1.4) 0;
        rotate: 90deg;
      }

      :host([vertical]) hr {
        border-width: 0;
        border-left: 1px solid var(--color);
      }

      :host([vertical]) .start {
        margin: var(--spacing) 0 0 0;
      }
      :host([vertical]) .end {
        margin: 0 0 var(--spacing) 0;
      }
    `,
  ];
}
