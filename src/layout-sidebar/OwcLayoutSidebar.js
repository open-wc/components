import { LitElement, html, css, nothing } from 'lit';
import '@awesome.me/webawesome/dist/components/details/details.js';
import '@awesome.me/webawesome/dist/components/split-panel/split-panel.js';

/** @typedef {import('./OwcLayoutSidebar.types.js').MenuItem} MenuItem */

import { getFullHref } from './hrefHelpers.js';

export class OwcLayoutSidebar extends LitElement {
  static get properties() {
    return {
      menuItemList: { type: Array },
      menuBottomItemList: { type: Array },
      menuTopTemplate: { type: Object },
      logoSvg: { type: Object },
    };
  }

  constructor() {
    super();
    /** @type {MenuItem[]} */
    this.menuItemList = [];
    /** @type {MenuItem[]} */
    this.menuBottomItemList = [];
    /** @type {import('lit').TemplateResult | undefined} */
    this.menuTopTemplate = undefined;
    this.logoSvg = html``;
  }

  /**
   * @param {MenuItem} menuItem
   * @returns {import('lit').TemplateResult | import('lit').nothing}
   */
  renderMenuItem(menuItem) {
    if (menuItem.visible !== undefined && menuItem.visible === false) {
      return nothing;
    }
    if (menuItem.subMenuItemList) {
      // TODO: this is not working when using <wa-details ?open=${menuItem.open}> - why? => for now we duplicate the code
      return menuItem.open
        ? html`
            <li>
              <wa-details open>
                <div slot="summary">
                  ${menuItem.icon ? html`<wa-icon name="${menuItem.icon}"></wa-icon>` : ''}
                  ${menuItem.label}
                </div>
                <ul>
                  ${menuItem.subMenuItemList.map(subMenuItem => this.renderMenuItem(subMenuItem))}
                </ul>
              </wa-details>
            </li>
          `
        : html`
            <li>
              <wa-details>
                <div slot="summary">
                  ${menuItem.icon ? html`<wa-icon name="${menuItem.icon}"></wa-icon>` : ''}
                  ${menuItem.label}
                </div>
                <ul>
                  ${menuItem.subMenuItemList.map(subMenuItem => this.renderMenuItem(subMenuItem))}
                </ul>
              </wa-details>
            </li>
          `;
    }
    const href = getFullHref(menuItem.href, menuItem.hrefGETParams);
    return html`
      <li class="${menuItem.selected ? 'selected' : ''}">
        <a href="${href}" class="${menuItem.selected ? 'selected' : ''}">
          ${menuItem.icon ? html`<wa-icon name="${menuItem.icon}"></wa-icon>` : ''}
          ${menuItem.label}
        </a>
      </li>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadStateFromUrl();
  }

  /**
   * @param {Array<MenuItem>} menuItemList
   * @param {MenuItem} [parent]
   */
  _loadStateFromUrl(menuItemList, parent) {
    const currentUrl = `${location.pathname}${location.search}`;
    for (const menuItem of menuItemList) {
      const menuItemHref = getFullHref(menuItem.href, menuItem.hrefGETParams);
      if (menuItemHref === currentUrl) {
        menuItem.selected = true;
      } else {
        menuItem.selected = false;
      }
      if (parent) {
        menuItem.parent = parent;
      }
      if (menuItem.selected) {
        while (parent) {
          parent.open = true;
          parent = parent.parent;
        }
      }
      if (menuItem.subMenuItemList) {
        this._loadStateFromUrl(menuItem.subMenuItemList, menuItem);
      }
    }
  }

  loadStateFromUrl() {
    this._loadStateFromUrl(this.menuItemList);
    this._loadStateFromUrl(this.menuBottomItemList);
    this.requestUpdate();
  }

  render() {
    return html`
      <wa-split-panel style="--min: 260px" position-in-pixels="260" primary="start">
        <div slot="divider" name="grip-vertical"></div>
        <div slot="start">
          <div id="sidebar">
            <div id="top">
              ${this.logoSvg ? html`<div id="logo">${this.logoSvg}</div>` : ''}
              ${this.menuTopTemplate ?? nothing}
              <ul>
                ${this.menuItemList.map(menuItem => this.renderMenuItem(menuItem))}
              </ul>
            </div>
            <div id="bottom">
              <ul>
                ${this.menuBottomItemList.map(menuItem => this.renderMenuItem(menuItem))}
              </ul>
            </div>
          </div>
        </div>
        <div id="content" slot="end">
          <div class="spacer-shadow">
            <div class="mask"></div>
          </div>

          <slot id="content-slot"></slot>
        </div>
      </wa-split-panel>
    `;
  }

  static styles = [
    css`
      :host {
        font-family: var(--wa-font-family-body);
      }

      #logo {
        width: 155px;
        margin-bottom: 18px;
      }

      #sidebar {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: calc(100vh - 15px);
        box-sizing: border-box;
        padding: 24px 28px 4px 24px;
        position: sticky;
        top: 0;
        box-sizing: border-box;
        overflow-y: auto;
      }

      #content {
        padding: 0 0 0 1.5em;
        box-sizing: border-box;
        position: relative;
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      li {
        margin: 0;
        padding: 0;
      }

      a:hover,
      wa-details::part(header):hover {
        background-color: #f5f5f5;
        border-radius: 4px;
      }

      a {
        display: block;
        margin: 0.4em 0 0.4em 0em;
        padding: 0.6em 0.7em;
        text-decoration: none;
        color: var(--wa-color-text-quiet);
      }

      wa-details::part(header) {
        margin: 0.4em 0 0.4em 0em;
        padding: 0.6em 0.7em;
      }

      wa-details > ul {
        border-left: 2px solid #d9d9d9;
        padding-left: 0.5em;
        margin-left: 1.1em;
      }
      wa-details > ul > li {
        margin-left: 0.3em;
      }

      wa-icon {
        margin-right: 0.3em;
      }

      wa-split-panel {
        --divider-width: 1px;
      }

      .spacer-shadow {
        position: sticky;
        top: 0;
        margin-left: -25px;
        margin-top: -100vh;
        pointer-events: none;
      }

      .spacer-shadow .mask {
        overflow: hidden;
        width: 200px;
        height: 100vh;
      }
      .spacer-shadow .mask:after {
        content: '';
        display: block;
        margin-left: -200px;
        width: 200px;
        height: 100%;
        border-radius: 12px / 125px;
        box-shadow: 0 0 8px rgba(0, 0, 0, 0.25);
      }

      wa-details::part(base) {
        border: none;
        color: var(--wa-color-text-quiet);
      }
      wa-details::part(content) {
        padding: 0;
      }

      a.selected {
        background-color: #d1e6f5;
        border-radius: 4px;
      }
    `,
  ];
}
