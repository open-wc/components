import { LitElement, html, css, nothing } from 'lit';
import '@awesome.me/webawesome/dist/components/details/details.js';
import '@awesome.me/webawesome/dist/components/split-panel/split-panel.js';

/** @typedef {import('./OwcLayoutSidebar.types.js').MenuItem} MenuItem */

import { getFullHref } from './hrefHelpers.js';

/**
 * Persisted layout preference record.
 * @typedef {object} StoredSidebarState
 * @property {number} version
 * @property {boolean} collapsed
 * @property {number} expandedWidth
 */

/**
 * Application layout sidebar with menus, submenus, URL-based selection and
 * a collapsible icon rail.
 *
 * @fires collapsed - Sidebar entered the collapsed rail state.
 * @fires expanded - Sidebar returned to the full expanded state.
 */
export class OwcLayoutSidebar extends LitElement {
  static COLLAPSED_WIDTH = 56;
  static DEFAULT_EXPANDED_WIDTH = 260;
  static MIN_EXPANDED_WIDTH = 220;
  static MAX_EXPANDED_WIDTH = 600;
  static DEFAULT_STORAGE_KEY = 'owc-layout-sidebar';
  static STORAGE_VERSION = 1;

  static get properties() {
    return {
      menuItemList: { type: Array },
      menuBottomItemList: { type: Array },
      menuTopTemplate: { type: Object },
      logoSvg: { type: Object },
      logoSmallSvg: { type: Object },
      collapsed: { type: Boolean, reflect: true },
      storageKey: { type: String, attribute: 'storage-key' },
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
    /** @type {import('lit').TemplateResult | undefined} */
    this.logoSvg = undefined;
    /** @type {import('lit').TemplateResult | undefined} */
    this.logoSmallSvg = undefined;
    /** @type {boolean | undefined} */
    this.collapsed = undefined;
    /** @type {string | undefined} */
    this.storageKey = undefined;
    this._expandedWidth = OwcLayoutSidebar.DEFAULT_EXPANDED_WIDTH;
    this._configuredDefaultCollapsed = false;
    this._initialized = false;
    this._suppressNextCollapsedEvent = false;
    this._toggleCollapsed = this._toggleCollapsed.bind(this);
    /** @type {number | undefined} */
    this._persistWidthTimeout = undefined;
    this.iconName = ""
  }

  /**
   * @param {MenuItem} menuItem
   * @returns {import('lit').TemplateResult | import('lit').nothing}
   */
  renderMenuItem(menuItem) {
    if (menuItem.visible === false) {
      return nothing;
    }

    if (menuItem.subMenuItemList?.length) {
      return html`
        <li>
          <wa-details ?open=${Boolean(menuItem.open)}>
            <div slot="summary">
              ${menuItem.icon ? html`<wa-icon name=${menuItem.icon}></wa-icon>` : nothing}
              <span>${menuItem.label}</span>
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
      <li>
        <a
          href=${href}
          class=${menuItem.selected ? 'selected' : ''}
          aria-current=${menuItem.selected ? 'page' : nothing}
        >
          ${menuItem.icon ? html`<wa-icon name=${menuItem.icon}></wa-icon>` : nothing}
          <span>${menuItem.label}</span>
        </a>
      </li>
    `;
  }

  /**
   * @param {MenuItem} menuItem
   * @returns {import('lit').TemplateResult | import('lit').nothing}
   */
  /**
   * Renders a top-level menu item as an icon in the collapsed rail.
   *
   * @param {MenuItem} menuItem
   * @returns {import('lit').TemplateResult | import('lit').nothing}
   */
  renderRailMenuItem(menuItem) {
    if (menuItem.visible === false) {
      return nothing;
    }

    const label = menuItem.label ?? '';
    const hasSubmenu =
      Array.isArray(menuItem.subMenuItemList) && menuItem.subMenuItemList.length > 0;

    const icon = menuItem.icon
      ? html` <wa-icon name=${menuItem.icon} aria-hidden="true"></wa-icon> `
      : html`
          <span class="rail-fallback" aria-hidden="true"> ${label.charAt(0).toUpperCase()} </span>
        `;

    if (hasSubmenu) {
      const active = Boolean(menuItem.selected) || this._hasSelectedDescendant(menuItem);

      return html`
        <li>
          <button
            type="button"
            class=${`rail-item ${active ? 'selected' : ''}`}
            title=${label}
            aria-label=${`Expand navigation and open ${label}`}
            @click=${() => this._expandAndOpenGroup(menuItem)}
          >
            ${icon}
          </button>
        </li>
      `;
    }

    const href = getFullHref(menuItem.href, menuItem.hrefGETParams);

    return html`
      <li>
        <a
          href=${href}
          class=${`rail-item ${menuItem.selected ? 'selected' : ''}`}
          title=${label}
          aria-label=${label}
          aria-current=${menuItem.selected ? 'page' : nothing}
        >
          ${icon}
        </a>
      </li>
    `;
  }

  /**
   * @param {MenuItem} menuItem
   * @returns {boolean}
   */
  /**
   * @param {MenuItem} menuItem
   * @returns {boolean}
   */
  _hasSelectedDescendant(menuItem) {
    if (!Array.isArray(menuItem.subMenuItemList) || menuItem.subMenuItemList.length === 0) {
      return false;
    }

    return menuItem.subMenuItemList.some(
      child => Boolean(child.selected) || this._hasSelectedDescendant(child),
    );
  }

  /**
   * @param {MenuItem} menuItem
   */
  _expandAndOpenGroup(menuItem) {
    menuItem.open = true;
    this.collapsed = false;
    this.requestUpdate();
  }

  _toggleCollapsed() {
    this.collapsed = !this.collapsed;
  }

  /**
   * @returns {StoredSidebarState | null}
   */
  _readStoredState() {
    try {
      const raw = localStorage.getItem(this.storageKey || OwcLayoutSidebar.DEFAULT_STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      if (
        !parsed ||
        typeof parsed !== 'object' ||
        parsed.version !== OwcLayoutSidebar.STORAGE_VERSION
      ) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  _schedulePersistState() {
    clearTimeout(this._persistStateTimeout);

    this._persistStateTimeout = window.setTimeout(() => {
      this._persistState();
    }, 100);
  }

  _persistState() {
    try {
      /** @type {StoredSidebarState} */
      const record = {
        version: OwcLayoutSidebar.STORAGE_VERSION,
        collapsed: !!this.collapsed,
        expandedWidth: this._expandedWidth,
      };
      localStorage.setItem(
        this.storageKey || OwcLayoutSidebar.DEFAULT_STORAGE_KEY,
        JSON.stringify(record),
      );
    } catch {
      /* empty */
    }
  }

  resetPersistedState() {
    try {
      localStorage.removeItem(this.storageKey || OwcLayoutSidebar.DEFAULT_STORAGE_KEY);
    } catch {
      /* empty */
    }
    this._expandedWidth = OwcLayoutSidebar.DEFAULT_EXPANDED_WIDTH;
    if (this.collapsed !== this._configuredDefaultCollapsed) {
      this._suppressNextCollapsedEvent = true;
      this.collapsed = this._configuredDefaultCollapsed;
    } else {
      this.requestUpdate();
    }
  }

  _resolveInitialState() {
    if (!this.storageKey) {
      this.storageKey = OwcLayoutSidebar.DEFAULT_STORAGE_KEY;
    }

    const explicitCollapsed = this.collapsed;
    this._configuredDefaultCollapsed = explicitCollapsed !== undefined ? explicitCollapsed : false;

    const stored = this._readStoredState();
    const resolvedCollapsed =
      explicitCollapsed !== undefined ? explicitCollapsed : stored ? !!stored.collapsed : false;

    if (stored && Number.isFinite(stored.expandedWidth)) {
      this._expandedWidth = Math.min(
        OwcLayoutSidebar.MAX_EXPANDED_WIDTH,
        Math.max(OwcLayoutSidebar.MIN_EXPANDED_WIDTH, stored.expandedWidth),
      );
    }

    if (resolvedCollapsed !== this.collapsed) {
      this._suppressNextCollapsedEvent = true;
    }
    this.collapsed = resolvedCollapsed;

    this._persistState();
    this._initialized = true;
  }

  /**
   * @param {CustomEvent} event
   */
  _handleReposition(event) {
    if (this.collapsed) {
      return;
    }

    const panel = event.currentTarget;
    const rawPosition =
      typeof panel?.positionInPixels === 'number'
        ? panel.positionInPixels
        : event.detail?.positionInPixels;

    if (!Number.isFinite(rawPosition)) {
      return;
    }

    const nextWidth = Math.min(
      OwcLayoutSidebar.MAX_EXPANDED_WIDTH,
      Math.max(OwcLayoutSidebar.MIN_EXPANDED_WIDTH, rawPosition),
    );

    if (nextWidth === this._expandedWidth) {
      return;
    }

    this._expandedWidth = nextWidth;
    this._schedulePersistState();
  }
  connectedCallback() {
    super.connectedCallback();
    this._resolveInitialState();
    this.loadStateFromUrl();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this._persistStateTimeout);
  }

  /**
   * @param {MenuItem[]} menuItemList
   * @param {MenuItem[]} [ancestors]
   */
  _loadStateFromUrl(menuItemList, ancestors = []) {
    const currentUrl = `${location.pathname}${location.search}`;

    for (const menuItem of menuItemList) {
      const menuItemHref = menuItem.href
        ? getFullHref(menuItem.href, menuItem.hrefGETParams)
        : undefined;

      menuItem.selected = menuItemHref === currentUrl;

      if (menuItem.selected) {
        for (const ancestor of ancestors) {
          ancestor.open = true;
        }
      }

      if (menuItem.subMenuItemList?.length) {
        this._loadStateFromUrl(menuItem.subMenuItemList, [...ancestors, menuItem]);
      }
    }
  }

  loadStateFromUrl() {
    this._loadStateFromUrl(this.menuItemList);
    this._loadStateFromUrl(this.menuBottomItemList);
    this.requestUpdate();
  }

  /**
   * @param {Map<PropertyKey, unknown>} changedProperties
   */
  updated(changedProperties) {
    super.updated(changedProperties);
    if (!changedProperties.has('collapsed')) {
      return;
    }
    if (this._suppressNextCollapsedEvent) {
      this._suppressNextCollapsedEvent = false;
      return;
    }
    if (!this._initialized) {
      return;
    }
    this._persistState();
    this.dispatchEvent(
      new CustomEvent(this.collapsed ? 'collapsed' : 'expanded', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  _renderHeader() {
    const expanded = !this.collapsed;
    const toggleLabel = expanded ? 'Collapse navigation' : 'Expand navigation';
    const logo = expanded ? this.logoSvg : this.logoSmallSvg;

    return html`
      <div id="sidebar-header">
        ${logo ? html` <div id=${expanded ? 'logo' : 'logo-small'}>${logo}</div> ` : nothing}

        <button
          type="button"
          id="collapse-toggle"
          title=${toggleLabel}
          aria-label=${toggleLabel}
          aria-controls="sidebar-navigation"
          aria-expanded=${expanded ? 'true' : 'false'}
          @click=${this._toggleCollapsed}
        >
          <wa-icon name=${expanded ? 'chevron-double-left' : 'chevron-double-right'} aria-hidden="true"></wa-icon>
        </button>
      </div>
    `;
  }

  render() {
    const width = this.collapsed ? OwcLayoutSidebar.COLLAPSED_WIDTH : this._expandedWidth;
    const minWidth = this.collapsed
      ? OwcLayoutSidebar.COLLAPSED_WIDTH
      : OwcLayoutSidebar.MIN_EXPANDED_WIDTH;
    return html`
      <wa-split-panel
        style=${`--min: ${minWidth}px`}
        .positionInPixels=${width}
        primary="start"
        @wa-reposition=${this._handleReposition}
      >
        <div id="sidebar-panel" slot="start">
          <div id="sidebar">
            <div id="top">
              ${this._renderHeader()}
              ${!this.collapsed ? (this.menuTopTemplate ?? nothing) : nothing}

              <nav id="sidebar-navigation" aria-label="Main navigation">
                <ul>
                  ${
                    this.collapsed
                      ? this.menuItemList.map(menuItem => this.renderRailMenuItem(menuItem))
                      : this.menuItemList.map(menuItem => this.renderMenuItem(menuItem))
                  }
                </ul>
              </nav>
            </div>
            <div id="bottom">
              <nav aria-label="Secondary navigation">
                <ul>
                  ${
                    this.collapsed
                      ? this.menuBottomItemList.map(menuItem => this.renderRailMenuItem(menuItem))
                      : this.menuBottomItemList.map(menuItem => this.renderMenuItem(menuItem))
                  }
                </ul>
              </nav>
            </div>
          </div>
        </div>
        <div id="content" slot="end">
          <slot id="content-slot"></slot>
        </div>
      </wa-split-panel>
    `;
  }

  static styles = [
    css`
      :host {
        display: block;
        height: 100%;
        min-height: 0;

        --owc-layout-sidebar-hover-background: #f5f5f5;
        --owc-layout-sidebar-selected-background: #d1e6f5;
        --owc-layout-sidebar-submenu-border: #d9d9d9;
        --owc-layout-sidebar-border-radius: 4px;
        --owc-layout-sidebar-icon-size: 40px;

        font-family: var(--wa-font-family-body);
      }
      #logo {
        width: min(155px, 100%);
      }

      #logo-small {
        width: 28px;
        height: 28px;
      }

      #logo,
      #logo-small {
        flex: none;
        line-height: 0;
      }

      #logo svg,
      #logo-small svg {
        display: block;
        width: 100%;
        height: auto;
      }

      #logo-small svg {
        height: 100%;
      }

      #sidebar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
      }

      :host([collapsed]) #sidebar-header {
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
      }

      :host([collapsed]) #collapse-toggle {
        margin-left: 0;
      }

      #sidebar {
        position: sticky;
        top: 0;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        width: 100%;
        height: 100%;
        min-height: 0;
        padding: 16px 16px 4px 16px;
        overflow-y: auto;
        overflow-x: hidden;
        box-sizing: border-box;
      }

      :host([collapsed]) #sidebar {
        padding: 24px 6px 4px 6px;
      }

      #content {
        padding-left: 1.5em;
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
        background-color: var(--owc-layout-sidebar-hover-background);
        border-radius: var(--owc-layout-sidebar-border-radius);
      }

      a {
        display: block;
        margin: 0.4em 0;
        padding: 0.6em 0.7em;
        text-decoration: none;
        color: var(--wa-color-text-quiet);
      }

      wa-details::part(header) {
        margin: 0.4em 0 0.4em 0em;
        padding: 0.6em 0.7em;
      }

      wa-details > ul {
        border-left: 2px solid var(--owc-layout-sidebar-submenu-border);
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
        width: 100%;
        height: 100%;
        min-height: 0;
        --divider-width: 1px;
        transition: grid-template-columns 180ms ease;
      }
      @media (prefers-reduced-motion: reduce) {
        wa-split-panel {
          transition: none;
        }
      }

      :host([collapsed]) [slot='divider'] {
        pointer-events: none;
        opacity: 0;
      }

      #sidebar-panel {
        position: relative;
        height: 100%;
        min-height: 0;
        z-index: 1;
        box-shadow: 4px 0 8px -6px rgb(0 0 0 / 35%);
      }

      wa-details::part(base) {
        border: none;
        color: var(--wa-color-text-quiet);
      }
      wa-details::part(content) {
        padding: 0;
      }

      a.selected {
        background-color: var(--owc-layout-sidebar-selected-background);
        border-radius: var(--owc-layout-sidebar-border-radius);
      }

      :is(.rail-item, #collapse-toggle) {
        all: unset;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        width: var(--owc-layout-sidebar-icon-size);
        height: var(--owc-layout-sidebar-icon-size);
        border-radius: var(--owc-layout-sidebar-border-radius);
        color: var(--wa-color-text-quiet);
        cursor: pointer;
      }

      .rail-item {
        margin: 4px auto;
      }

      #collapse-toggle {
        margin: 4px 0 4px auto;
      }

      :host([collapsed]) #collapse-toggle {
        margin: 4px auto;
      }

      :is(.rail-item, #collapse-toggle):hover {
        background-color: var(--owc-layout-sidebar-hover-background);
      }

      :is(.rail-item, #collapse-toggle):focus-visible {
        background-color: var(--owc-layout-sidebar-hover-background);
        outline: 2px solid currentColor;
        outline-offset: 2px;
      }

      .rail-item.selected {
        background-color: var(--owc-layout-sidebar-selected-background);
      }

      :is(.rail-item, #collapse-toggle) wa-icon {
        margin: 0;
      }

      .rail-fallback {
        font-size: 0.85em;
        font-weight: 600;
        line-height: 1;
      }
    `,
  ];
}
