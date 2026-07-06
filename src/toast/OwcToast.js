import { LitElement, html, css } from 'lit';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { join } from 'lit/directives/join.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/progress-bar/progress-bar.js';
import { OwcIconButton } from '../icon-button/OwcIconButton.js';

/**
 *
 * @param {{
 *   position?: 'top-center' | 'top-start' | 'top-end' | 'bottom-center' | 'bottom-start' | 'bottom-end',
 *   variant?: OwcToastComponent['variant'],
 *   appearance?: OwcToastComponent['appearance'],
 *   duration?: OwcToastComponent['duration'],
 *   icon?: OwcToastComponent['icon'],
 *   text?: OwcToastComponent['text'],
 *   title?: OwcToastComponent['title'],
 *   dismissible?: OwcToastComponent['dismissible']
 * }} options
 * @returns
 */
export function toast(options) {
  if (!customElements.get('owc-toast-component')) {
    customElements.define('owc-toast-component', OwcToastComponent);
  }

  const { position = 'top-center' } = options;
  let container = document.querySelector(`.owc-toast-${position}`);
  if (!container) {
    container = document.createElement('div');
    container.classList.add(`owc-toast-${position}`);
    // @ts-ignore
    container.style = `
    position: fixed;
    ${position.split('-')[0]}: 0;
    z-index: 99999;
    display: flex;
    width: 100%;
    align-items: ${position.split('-')[1]};
    flex-direction: ${position.split('-')[0] === 'bottom' ? 'column-reverse' : 'column'};
    pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  const toastElement = new OwcToastComponent(options);

  // Remove container if empty after one second
  toastElement.addEventListener('removed', () =>
    setTimeout(() => {
      if (container.children.length === 0) {
        container.remove();
      }
    }, 1000),
  );

  container.appendChild(toastElement);
  return toastElement;
}

export class OwcToastComponent extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'owc-icon-button': OwcIconButton,
  };

  static properties = {
    variant: { type: String, reflect: true },
    appearance: { type: String, reflect: true },
    text: { type: String },
    title: { type: String },
    customIcon: { type: String },
    progress: { type: String },
    size: { type: String },
    state: { type: String, reflect: true },
    dismissible: { type: Boolean },
  };

  /**
   *
   * @param {{
   *   variant?: OwcToastComponent['variant'],
   *   appearance?: OwcToastComponent['appearance'],
   *   duration?: OwcToastComponent['duration'],
   *   icon?: OwcToastComponent['icon'],
   *   text?: OwcToastComponent['text'],
   *   title?: OwcToastComponent['title'],
   *   dismissible?: OwcToastComponent['dismissible'],
   * }} options
   */
  constructor({
    variant = 'brand',
    appearance = 'filled-outlined',
    icon = '',
    duration = 4,
    text = '',
    title = '',
    dismissible = true,
  }) {
    super();
    /**@type {'brand' | 'neutral' | 'success' | 'warning' | 'danger'} */
    this.variant = variant;
    /**@type {'accent' | 'filled' | 'outlined' | 'plain' | 'filled-outlined'} */
    this.appearance = appearance;
    /**@type {'small' | 'medium' | 'large'} */
    this.size = 'medium';
    /**@type {string} */
    this.icon = icon;
    /**@type {string} */
    this.text = text;
    /**@type {string} */
    this.title = title;
    /**@type {number} */
    this.duration = duration;
    /**@type {boolean} */
    this.dismissible = dismissible;
    this.progress = 100;

    /** @type {'visible' | 'fade-out'} */
    this.state = 'visible';
  }

  remove() {
    this.addEventListener('animationend', () => {
      this.dispatchEvent(new Event('removed'));
      super.remove();
    });
    this.state = 'fade-out';
  }

  #startProgress() {
    this.progressInterval = setInterval(
      async () => {
        this.progress -= 1;

        if (this.progress <= 0) {
          clearInterval(this.progressInterval);
          // Wait for progress bar being at 0
          const progressBar =
            /**@type {import('@awesome.me/webawesome/dist/components/progress-bar/progress-bar.js').default}*/ (
              this.shadowRoot?.querySelector('wa-progress-bar')
            );
          const progressBarBar = progressBar.shadowRoot?.querySelector('.indicator');
          progressBarBar?.addEventListener('transitionend', () => {
            this.remove();
          });
        }
      },
      (this.duration / 100) * 1000,
    );
  }

  #stopProgress() {
    clearInterval(this.progressInterval);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#stopProgress();
  }

  firstUpdated() {
    this.state = 'visible';
    this.addEventListener('mouseleave', () => this.#startProgress());
    this.addEventListener('mouseenter', () => this.#stopProgress());
    this.#startProgress();
  }

  get defaultIcon() {
    switch (this.variant) {
      case 'brand':
        return 'info-circle';
      case 'neutral':
        return 'gear';
      case 'success':
        return 'check-circle';
      case 'warning':
        return 'exclamation-triangle';
      case 'danger':
        return 'exclamation-circle';
    }
    return '';
  }

  render() {
    return html`
      <wa-callout variant=${this.variant} appearance=${this.appearance} size=${this.size}>
        <wa-icon slot="icon" .name=${this.icon || this.defaultIcon}></wa-icon>
        <div class="callout-content">
          <span>
            ${this.title ? html`<strong>${this.title}</strong><br />` : ''}
            ${join(this.text.split('\n'), html`<br />`)}
          </span>
          ${
            this.dismissible
              ? html`<owc-icon-button name="x-lg" @click=${() => this.remove()}></owc-icon-button>`
              : ''
          }
        </div>

        <wa-progress-bar value=${this.progress}></wa-progress-bar>
      </wa-callout>
    `;
  }
  static styles = [
    css`
      :host {
        display: block;
        position: relative;
        padding: 5px;
        opacity: 1;
        animation: fadeIn 200ms ease;
        pointer-events: all;
      }

      :host([state='fade-out']) {
        opacity: 0;
        animation: fadeOut 200ms ease;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes fadeOut {
        from {
          opacity: 1;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(-10px);
        }
      }

      :host([appearance='plain']) wa-callout {
        background-color: white;
      }

      :host([appearance='outlined']) wa-callout {
        background-color: white;
      }

      .callout-content {
        display: flex;
        align-items: center;
      }

      wa-callout {
        overflow: hidden;
      }

      wa-progress-bar {
        --track-height: 3px;
        position: absolute;
        width: 100%;
        left: 0;
        bottom: 0;
      }

      :host([variant='neutral']) wa-progress-bar {
        --indicator-color: var(--wa-color-neutral-fill-loud);
      }
      :host([variant='success']) wa-progress-bar {
        --indicator-color: var(--wa-color-success-fill-loud);
      }
      :host([variant='warning']) wa-progress-bar {
        --indicator-color: var(--wa-color-warning-fill-loud);
      }
      :host([variant='danger']) wa-progress-bar {
        --indicator-color: var(--wa-color-danger-fill-loud);
      }
    `,
  ];
}
