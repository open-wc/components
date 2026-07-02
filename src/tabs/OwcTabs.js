import { LitElement, html, css, nothing } from 'lit';

import '@awesome.me/webawesome/dist/components/details/details.js';

/**
 * @template {Record<string, unknown>} T
 */
export class OwcTabs extends LitElement {
  static properties = {
    active: { type: String, reflect: true },
    tabs: { type: Array },
  };

  constructor() {
    super();
    this.active = '';
    this.customStyles = css``;
    /** @type {import('./OwcTabs.types.js').Tabs<T>} */
    this.tabs = {};
    this.getRenderOptions = () => {
      return /** @type {T} */ ({});
    };
  }

  render() {
    const options = this.getRenderOptions();
    const tabList = Object.entries(this.tabs)
      .filter(([, tab]) =>
        typeof tab.visible === 'function'
          ? tab.visible(options)
          : tab.visible || tab.visible === undefined,
      )
      .sort((a, b) => {
        const aOrder = a[1].order || 0;
        const bOrder = b[1].order || 0;
        return aOrder - bOrder;
      });
    return html`
      <div id="tab-list" @click=${this.handleTabClick} part="tab-list">
        <slot name="tab-list-prefix"></slot>
        ${tabList.map(
          ([key, tab]) => html`
            <div class="tab">
              ${tab.labelPrefix ? html`<div class="tab-prefix">${tab.labelPrefix}</div>` : nothing}
              <wa-button
                class="tab"
                panel="${key}"
                size="small"
                variant=${key === this.active ? 'brand' : 'neutral'}
                appearance=${key === this.active ? 'accent' : 'outlined'}
              >
                ${tab.label}
              </wa-button>
              ${tab.labelSuffix ? html`<div class="tab-suffix">${tab.labelSuffix}</div>` : nothing}
            </div>
          `,
        )}
      </div>

      <div id="details-list" @wa-show=${this.handleDetailsShow}>
        ${tabList.map(([key, tab]) => {
          return html`
            <wa-details summary=${key} part="content-wrapper" ?open=${this.active === key}>
              <div class="details-content">
                ${
                  tab.content
                    ? tab.content({ ...options, open: this.active === key })
                    : `Please define a content function  the tab "${key}"`
                }
              </div>
            </wa-details>
          `;
        })}
      </div>
      <div class="spacer-shadow-wrapper" part="bottom-shadow">
        <div class="spacer-shadow">
          <div class="mask"></div>
        </div>
      </div>
      <style>
        ${this.customStyles}
      </style>
    `;
  }

  /**
   * @param {MouseEvent} ev
   */
  handleTabClick(ev) {
    const target = /** @type {HTMLElement}  */ (ev.target);
    if (target && target.classList.contains('tab')) {
      const newActive = target.getAttribute('panel') || '';
      this.active = newActive === this.active ? '' : newActive;
    }
  }

  /**
   * @param {MouseEvent} ev
   */
  handleDetailsShow(ev) {
    const target = /** @type {HTMLElement}  */ (ev.target);
    if (target.tagName === 'wa-details') {
      const newActive = target.getAttribute('summary') || '';
      if (newActive !== this.active) {
        this.active = newActive;
      }
    }
  }

  /**
   * @param {import('lit').PropertyValues} changedProperties
   */
  updated(changedProperties) {
    if (changedProperties.has('active')) {
      this.dispatchEvent(new Event('active-changed', { bubbles: true }));
    }
    super.updated(changedProperties);
  }

  static styles = [
    css`
      :host {
        display: block;
      }

      #tab-list {
        display: flex;
        gap: 4px;
        align-items: center;
        min-height: 40px;
      }

      .details-content {
        margin: 5px 0 7px 10px;
      }

      .tab {
        display: flex;
      }

      slot[name='tab-list-prefix']::slotted(*) {
        font-size: 0.8em;
        color: rgb(107, 114, 128);
        margin: 0.5em 0px;
        padding-left: 1em;
      }

      wa-button {
        position: static;
      }

      /* wa-detail overrides */
      wa-details::part(base) {
        border: none;
        padding: 0;
        box-shadow: none;
      }
      wa-details::part(icon) {
        display: none;
      }
      wa-details::part(summary) {
        padding: 0;
        margin: 0;
        display: none;
      }
      wa-details::part(header) {
        padding: 0;
        display: none;
      }
      wa-details::part(content) {
        padding: 0;
        margin: 0;
      }

      /* spacer shadow */
      .spacer-shadow-wrapper {
        overflow: hidden;
        width: 90%;
        max-width: calc(var(--owc-max-content-width, none) - 60px);
        height: 0;
        transition:
          height 0.3s ease,
          opacity 0.5s ease;
        opacity: 0.01;
      }
      :host([active]:not([active=''])) .spacer-shadow-wrapper {
        height: 14px;
        margin: 0 30px;
        opacity: 1;
      }

      .spacer-shadow {
        border-top: 1px solid #eee;
        margin: 0 auto;
      }

      .spacer-shadow .mask {
        overflow: hidden;
        height: 6px;
      }

      .spacer-shadow .mask:after {
        content: '';
        display: block;
        margin-top: -200px;
        width: 100%;
        height: 200px;
        border-radius: 125px / 12px;
        box-shadow: 0 0 6px rgba(0, 0, 0, 0.25);
      }
    `,
  ];
}
