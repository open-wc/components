import { css, html } from 'lit';

import { live } from 'lit/directives/live.js';
import { OwcAutocomplete } from '@open-wc/components/OwcAutocomplete.js';
import { mergeVisibility, nextVisibility } from './overrideHelpers.js';
import '@awesome.me/webawesome/dist/components/checkbox/checkbox.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import { createRef, ref } from 'lit/directives/ref.js';

/**
 * Modified version of https://jsfiddle.net/RubaXa/zLq5J/6 from
 * "https://github.com/SortableJS/Sortable/wiki/Sorting-with-the-help-of-HTML5-Drag'n'Drop-API"
 * @param {HTMLElement} rootEl
 * @param {(elem: HTMLElement) => void} update
 */
function sortable(rootEl, update) {
  /** @type {HTMLElement} */
  let dragEl;
  /** @type {HTMLElement} */
  let nextEl;
  /**
   * @param {DragEvent} ev
   */
  function _onDragOver(ev) {
    if (!ev.dataTransfer) {
      return;
    }
    ev.preventDefault();
    ev.dataTransfer.dropEffect = 'move';
    let target = /** @type {HTMLElement} */ (ev.target);
    if (!target.classList.contains('row')) {
      return;
    }
    if (target && target !== dragEl) {
      let rect = target.getBoundingClientRect();
      let next = (ev.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
      rootEl.insertBefore(dragEl, next ? target.nextElementSibling : target);
    }
  }
  /**
   * @param {DragEvent} ev
   */
  function _onDragEnd(ev) {
    ev.preventDefault();

    dragEl.classList.remove('ghost');
    rootEl.removeEventListener('dragover', _onDragOver);
    rootEl.removeEventListener('dragend', _onDragEnd);

    if (nextEl !== dragEl.nextElementSibling) {
      update(dragEl);
    }
  }

  rootEl.addEventListener('dragstart', ev => {
    dragEl = /** @type {HTMLElement} */ (ev.target);
    nextEl = /** @type {HTMLElement} */ (dragEl?.nextElementSibling);
    if (!ev.dataTransfer) {
      return;
    }
    ev.dataTransfer.effectAllowed = 'move';
    rootEl.addEventListener('dragover', _onDragOver);
    rootEl.addEventListener('dragend', _onDragEnd);

    dragEl.classList.add('ghost');
  });
}

/**
 * @typedef {import("./OwcTable.types.js").Column<unknown>} T
 * @extends {OwcAutocomplete<T>}
 */
export class OwcTableSettings extends OwcAutocomplete {
  /** @type {Record<string, {type: any, attribute?: any, converter?: any}>} */
  static properties = {
    storeNamePrefix: { type: String },
    columns: { type: Array },
  };

  constructor() {
    super();
    this.storeNamePrefix = 'owc-table';
    // Static trigger text - the settings dropdown never has a "selected" value
    this.placeholder = 'Spalten';
    /** @type {import('./OwcTable.types.js').Overrides} */
    this.overrides = this.emptyOverrides();
    /** @type {import('./OwcTable.types.js').Overrides} */
    this.localOverrides = this.emptyOverrides();
    /** @type {T[]} */
    this.columns = [];
    this.syncWidth = false;
    this.footer = () => {
      return html`
        <div id="footer">
          <div id="footer-actions">
            <wa-button size="s" appearance="outlined" @click=${this.toggleLegend}> ? </wa-button>
            <wa-button size="s" appearance="outlined" @click=${this.reset}>Reset</wa-button>
          </div>
          <div id="footer-legend" hidden>
            <p>Spalten werden in der Tabelle angezeigt, wenn:</p>
            <ul>
              <li><wa-checkbox checked></wa-checkbox>Zeige immer</li>
              <li><wa-checkbox .indeterminate=${true}></wa-checkbox>Zeige wenn gefiltert</li>
              <li><wa-checkbox></wa-checkbox>Zeige nie</li>
            </ul>
          </div>
        </div>
      `;
    };
  }

  /**
   * @param {T} column
   * @param {number} index
   * @returns {import('lit').TemplateResult}
   */
  renderItem = (column, index) => {
    const visible = this.getVisibility(column.field) || 'always';
    // Use the plain text label in settings, because the table label can contain HTML which breaks.
    const settingsLabel =
      column.labelString || (typeof column.label === 'string' ? column.label : column.field);
    const row = createRef();
    return html`<div ${ref(row)} class="row option" data-index=${index}>
      <wa-icon
        ?hidden=${this.search.value !== ''}
        name="grip-horizontal"
        label="Move column"
        class="grip"
        @mouseenter=${() => row.value?.setAttribute('draggable', 'true')}
        @mouseleave=${() => row.value?.removeAttribute('draggable')}
      ></wa-icon>
      <wa-checkbox
        .indeterminate=${live(visible === 'ifFiltered')}
        ?checked=${live(visible === 'always')}
      ></wa-checkbox>
      <span>${settingsLabel}</span>
    </div>`;
  };

  /**
   * @param {import('lit').PropertyValues} changedProperties
   */
  firstUpdated(changedProperties) {
    const url = this.getOverridesFromUrl();
    this.localOverrides = this.getOverridesFromLocalStorage();
    if (url.order || Object.values(url.visibility).length > 0) {
      this.saveOverridesToUrl(this.localOverrides);
    }
    this.overrides.visibility = this.mergeVisibility(
      this.localOverrides.visibility,
      url.visibility,
    );
    this.reorderColumns(url.order || this.localOverrides.order || this.columns.map(c => c.field));
    this.dispatchEvent(new CustomEvent('change'));

    sortable(/** @type {HTMLElement} */ (this.shadowRoot?.querySelector('#rows')), () => {
      const rows = /** @type {NodeListOf<HTMLElement>} */ (
        this.shadowRoot?.querySelectorAll('.row')
      );
      /** @type {string[]} */
      const order = Array.from(rows).map(row => {
        const index = parseInt(row.dataset.index || '-1');
        return this.data[index].field;
      });
      this.localOverrides.order = order;

      const url = this.getOverridesFromUrl();
      const local = this.getOverridesFromLocalStorage();

      localStorage.setItem(this.#localStorageKey(), JSON.stringify(this.localOverrides));

      if (JSON.stringify(url) === JSON.stringify(local)) {
        this.saveOverridesToUrl(this.localOverrides);
      }

      this.overrides.order = order;
      this.dispatchEvent(new CustomEvent('change'));
      this.reorderColumns(order);
    });

    super.firstUpdated(changedProperties);
  }

  /**
   * @param {import('./OwcTable.types.js').Visibility} visibility
   * @returns {import('./OwcTable.types.js').Visibility}
   */
  nextVisibility(visibility) {
    return nextVisibility(visibility);
  }

  /**
   * @param {string} column field
   */
  getVisibility(column) {
    const override = this.overrides.visibility[column];
    if (override) {
      return override;
    }
    return this.columns.find(c => c.field === column)?.visible;
  }

  /**
   *
   * @param {HTMLInputElement} checkbox
   * @param {import('./OwcTable.types.js').Visibility} visibility
   */
  setCheckbox(checkbox, visibility) {
    checkbox.checked = visibility === 'always';
    checkbox.indeterminate = visibility === 'ifFiltered';
  }

  /**
   * @param {MouseEvent} ev
   */
  handleOptionClick(ev) {
    ev.preventDefault();
    let index;
    /** @type {HTMLElement | null} */
    let checkbox = null;
    for (const el of ev.composedPath()) {
      const typedEl = /** @type {HTMLElement} */ (el);
      if (typedEl.dataset?.index) {
        index = parseInt(typedEl.dataset.index);
        checkbox = typedEl.querySelector('wa-checkbox');
      }
    }
    if (index === undefined || !checkbox) {
      return;
    }
    const column = this.processedData[index];
    this.cycleVisibility(column, /** @type {HTMLInputElement} */ (checkbox));
  }

  /**
   *
   * @param {T} column
   * @param {HTMLInputElement} checkbox
   * @returns
   */
  cycleVisibility(column, checkbox) {
    const previous = this.getVisibility(column.field);

    const next = this.nextVisibility(previous || 'always');
    this.setCheckbox(checkbox, next);

    this.localOverrides.visibility[column.field] = next;

    const url = this.getOverridesFromUrl();
    const local = this.getOverridesFromLocalStorage();

    localStorage.setItem(this.#localStorageKey(), JSON.stringify(this.localOverrides));

    if (JSON.stringify(url) === JSON.stringify(local)) {
      this.saveOverridesToUrl(this.localOverrides);
      this.overrides = structuredClone(this.localOverrides);
    } else {
      this.overrides.visibility = this.mergeVisibility(
        this.localOverrides.visibility,
        url.visibility,
      );
    }

    this.dispatchEvent(new CustomEvent('change'));
  }

  /**
   * @param {string[]} order
   */
  reorderColumns(order) {
    const columns = this.columns.map(c => ({
      ...c,
      label: typeof c.label === 'string' ? c.label : c.field,
    }));
    const reordered = [];
    for (const field of order) {
      const column = columns.find(c => c.field === field);
      if (column) {
        reordered.push(column);
      }
    }
    this.data = reordered;
  }

  /**
   * @returns {string}
   */
  #localStorageKey() {
    return `${this.storeNamePrefix}-override-settings`;
  }

  /**
   * @param {import('./OwcTable.types.js').Overrides} overrides
   */
  saveOverridesToUrl(overrides) {
    let needsUpdate = false;
    const newUrl = new URL(location.href);
    if (overrides.order || Object.values(overrides.visibility).length > 0) {
      const encodedOverrides = JSON.stringify(overrides);
      if (newUrl.searchParams.get(`${this.storeNamePrefix}-overrides`) !== encodedOverrides) {
        newUrl.searchParams.set(`${this.storeNamePrefix}-overrides`, encodedOverrides);
        needsUpdate = true;
      }
    } else {
      newUrl.searchParams.delete(`${this.storeNamePrefix}-overrides`);
      needsUpdate = true;
    }
    if (needsUpdate === true) {
      history.replaceState({}, '', newUrl);
    }
  }

  /**
   * @returns {import('./OwcTable.types.js').Overrides}
   */
  getOverridesFromUrl() {
    const currentUrl = new URL(location.href);
    const currentOverridesState = currentUrl.searchParams.get(`${this.storeNamePrefix}-overrides`);
    return currentOverridesState ? JSON.parse(currentOverridesState) : this.emptyOverrides();
  }

  /**
   * @returns {import('./OwcTable.types.js').Overrides}
   */
  getOverridesFromLocalStorage() {
    const local = localStorage.getItem(this.#localStorageKey());
    const ret = local ? JSON.parse(local) : this.emptyOverrides();
    if (Array.isArray(ret)) {
      const fallback = this.emptyOverrides();
      localStorage.setItem(this.#localStorageKey(), JSON.stringify(fallback));
      return fallback;
    }
    return ret;
  }

  /**
   *
   * @param {{ [column: string]: import('./OwcTable.types.js').Visibility }} local
   * @param {{ [column: string]: import('./OwcTable.types.js').Visibility }} url
   */
  mergeVisibility(local, url) {
    return mergeVisibility(local, url);
  }

  reset() {
    localStorage.removeItem(this.#localStorageKey());
    this.saveOverridesToUrl(this.emptyOverrides());
    this.overrides = this.emptyOverrides();
    this.localOverrides = this.emptyOverrides();
    this.data = [...this.columns];
    this.requestUpdate();
    this.dispatchEvent(new CustomEvent('change'));
  }

  /**
   * @returns {import('./OwcTable.types.js').Overrides}
   */
  emptyOverrides() {
    return { visibility: {} };
  }

  toggleLegend() {
    if (this.shadowRoot) {
      const legend = /** @type {HTMLElement} */ (this.shadowRoot.querySelector('#footer-legend'));
      if (legend) {
        legend.hidden = !legend.hidden;
      }
    }
  }

  static styles = [
    ...super.styles,
    css`
      .row {
        padding: 0.7em;
      }

      #footer {
        padding: 16px;
      }

      #footer ul {
        list-style: none;
        padding: 0;
      }

      #footer-legend wa-checkbox {
        pointer-events: none;
      }

      wa-checkbox,
      span {
        line-height: 1.2;
      }

      .grip {
        cursor: move;
        flex-shrink: 0;
        /* Move slightly to left */
        margin-right: 0.2em;
        margin-left: -0.2em;
        margin-top: 0.2em;
      }

      .ghost {
        opacity: 0.5;
      }
    `,
  ];
}
