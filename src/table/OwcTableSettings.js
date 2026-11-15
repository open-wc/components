import { css, html } from 'lit';

import { live } from 'lit/directives/live.js';
import { OwcAutocomplete } from '@open-wc/components/OwcAutocomplete.js';
import { mergeVisibility, nextVisibility } from './overrideHelpers.js';
import '@awesome.me/webawesome/dist/components/checkbox/checkbox.js';
import '@awesome.me/webawesome/dist/components/dropdown/dropdown.js';
import '@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { OwcLocalizeController } from '@open-wc/components/localization.js';
import { visuallyHidden } from '../a11y/visuallyHidden.js';

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
  #localize = new OwcLocalizeController(this);
  #overridesInitialized = false;
  /** @type {Record<string, {type: any, attribute?: any, converter?: any}>} */
  static properties = {
    storeNamePrefix: { type: String },
    columns: { type: Array },
  };

  constructor() {
    super();
    this.storeNamePrefix = 'owc-table';
    // Static trigger text - the settings dropdown never has a "selected" value
    this.placeholder = this.#localize.term('tableColumns');
    /** @type {import('./OwcTable.types.js').Overrides} */
    this.overrides = this.emptyOverrides();
    /** @type {import('./OwcTable.types.js').Overrides} */
    this.localOverrides = this.emptyOverrides();
    /** @type {T[]} */
    this.columns = [];
    this.syncWidth = false;
    /** the items are columns with controls of their own, not options to pick @type {'list'} */
    this.listRole = 'list';

    const handleAutocompleteKeyDown = this.handleDocumentKeyDown;
    /**
     * The column list has controls of its own, so the keys they need don't reach the autocomplete:
     * - Tab moves through the dropdown's controls instead of closing it. It closes once focus leaves.
     * - Alt+ArrowUp and Alt+ArrowDown move a column, not the autocomplete's active option.
     * - An open move menu handles all of its keys itself, in a `document` listener of its own that
     *   runs after this one: Escape closes the menu, not the dropdown.
     *
     * @param {KeyboardEvent} ev
     */
    this.handleDocumentKeyDown = ev => {
      const moveMenuOpen = Boolean(this.shadowRoot?.querySelector('wa-dropdown[open]'));
      if (this.open && (ev.key === 'Tab' || ev.altKey || moveMenuOpen)) {
        return;
      }
      handleAutocompleteKeyDown(ev);
    };
    this.footer = () => {
      return html`
        <div id="footer">
          <div id="footer-actions">
            <wa-button size="s" appearance="outlined" @click=${this.toggleLegend}>
              <span aria-hidden="true">?</span>
              <span class="visually-hidden"
                >${this.#localize.term('tableColumnVisibilityLegend')}</span
              >
            </wa-button>
            <wa-button size="s" appearance="outlined" @click=${this.reset}
              >${this.#localize.term('tableReset')}</wa-button
            >
          </div>
          <div id="footer-legend" hidden>
            <p>${this.#localize.term('tableColumnVisibilityHint')}</p>
            <ul>
              <li>
                <wa-checkbox checked tabindex="-1"
                  >${this.#localize.term('tableShowAlways')}</wa-checkbox
                >
              </li>
              <li>
                <wa-checkbox .indeterminate=${true} tabindex="-1"
                  >${this.#localize.term('tableShowWhenFiltered')}</wa-checkbox
                >
              </li>
              <li>
                <wa-checkbox tabindex="-1">${this.#localize.term('tableShowNever')}</wa-checkbox>
              </li>
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
    const isFirst = index === 0;
    const isLast = index === this.processedData.length - 1;
    const visibility = {
      always: this.#localize.term('tableShowAlways'),
      ifFiltered: this.#localize.term('tableShowWhenFiltered'),
      never: this.#localize.term('tableShowNever'),
    }[visible];
    return html`<div
      ${ref(row)}
      class="row option"
      role="listitem"
      data-index=${index}
      @keydown=${this.#handleRowKeyDown}
    >
      <wa-dropdown
        @wa-select=${this.#handleMoveSelect}
        @wa-show=${this.#stopPropagation}
        @wa-after-show=${this.#stopPropagation}
        @wa-hide=${this.#stopPropagation}
        @wa-after-hide=${this.#stopPropagation}
      >
        <button
          slot="trigger"
          type="button"
          class="grip"
          ?hidden=${Boolean(this.search?.value)}
          aria-label=${`${this.#localize.term('tableMoveColumn')}: ${settingsLabel}`}
          @mouseenter=${() => row.value?.setAttribute('draggable', 'true')}
          @mouseleave=${() => row.value?.removeAttribute('draggable')}
        >
          <wa-icon name="grip-horizontal"></wa-icon>
        </button>
        <wa-dropdown-item value="up" ?disabled=${isFirst}
          >${this.#localize.term('tableMoveColumnUp')}</wa-dropdown-item
        >
        <wa-dropdown-item value="down" ?disabled=${isLast}
          >${this.#localize.term('tableMoveColumnDown')}</wa-dropdown-item
        >
        <wa-dropdown-item value="top" ?disabled=${isFirst}
          >${this.#localize.term('tableMoveColumnToTop')}</wa-dropdown-item
        >
        <wa-dropdown-item value="bottom" ?disabled=${isLast}
          >${this.#localize.term('tableMoveColumnToBottom')}</wa-dropdown-item
        >
      </wa-dropdown>
      <wa-checkbox
        class="named-by-column"
        .indeterminate=${live(visible === 'ifFiltered')}
        ?checked=${live(visible === 'always')}
        >${settingsLabel}: ${visibility}</wa-checkbox
      >
      <span>${settingsLabel}</span>
    </div>`;
  };

  /**
   * @param {import('lit').PropertyValues} changedProperties
   */
  firstUpdated(changedProperties) {
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
      this.#saveOrder(order);
    });

    super.firstUpdated(changedProperties);
  }

  /**
   * Makes a new column order the current one: in local storage, in the URL
   * if it mirrors local storage, for the table (`change`) and in the list.
   * Every way of reordering ends here, so they all save the same way.
   *
   * @param {string[]} order the fields of all columns
   */
  #saveOrder(order) {
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
  }

  /**
   * Whether the list shows the columns in their order. A search filters the
   * list, and a position in a filtered list says nothing about the order.
   */
  #canReorder() {
    return !this.search?.value;
  }

  /**
   * Moves a column to another position and saves the order.
   *
   * @param {number} from the column's index in the list
   * @param {number} to its new index
   * @returns {boolean} false if there is nowhere to move it
   */
  #moveColumn(from, to) {
    const order = this.data.map(column => column.field);
    if (!this.#canReorder() || from === to || to < 0 || to >= order.length) {
      return false;
    }
    order.splice(to, 0, ...order.splice(from, 1));
    this.#saveOrder(order);
    return true;
  }

  /**
   * Focuses a control of a column item once the list has rendered, and
   * brings the item into view. A new order renders new items, so the focus
   * on the moved one has to be restored.
   *
   * @param {number} index the column's index in the list
   * @param {string} selector the control inside the item
   */
  async #focusColumnControl(index, selector) {
    await this.updateComplete;
    // in a virtualized list, the column's new place may not be rendered
    await this.revealOption(index);
    /** @type {HTMLElement | null | undefined} */
    const control = this.shadowRoot?.querySelector(`#rows > [data-index="${index}"] ${selector}`);
    // a grip can only take the focus once its new menu has rendered the slot it sits in
    await control?.closest('wa-dropdown')?.updateComplete;
    control?.focus();
  }

  /**
   * The events of a move menu bubble and cross shadow roots. Outside they
   * would look like this dropdown's own `wa-show` and `wa-hide`, so they stop here.
   *
   * @param {Event} ev
   */
  #stopPropagation = ev => {
    ev.stopPropagation();
  };

  /**
   * Moves a column to where the chosen item of its move menu says.
   *
   * @param {Event & { detail: { item: { value: string } } }} ev `wa-select` of a move menu
   */
  #handleMoveSelect = ev => {
    this.#stopPropagation(ev);
    const row = /** @type {HTMLElement} */ (ev.currentTarget).closest('.row');
    const from = parseInt(/** @type {HTMLElement} */ (row).dataset.index || '-1');
    const to = { up: from - 1, down: from + 1, top: 0, bottom: this.data.length - 1 }[
      ev.detail.item.value
    ];
    if (to !== undefined && this.#moveColumn(from, to)) {
      this.#focusColumnControl(to, '.grip');
    }
  };

  /**
   * Alt+ArrowUp and Alt+ArrowDown move the column item that has the focus.
   *
   * @param {KeyboardEvent} ev
   */
  #handleRowKeyDown = ev => {
    const isMoveKey =
      ev.altKey &&
      !ev.ctrlKey &&
      !ev.metaKey &&
      !ev.shiftKey &&
      (ev.key === 'ArrowUp' || ev.key === 'ArrowDown');
    if (!isMoveKey) {
      return;
    }
    ev.preventDefault();
    const row = /** @type {HTMLElement} */ (ev.currentTarget);
    const from = parseInt(row.dataset.index || '-1');
    const to = ev.key === 'ArrowUp' ? from - 1 : from + 1;
    if (this.#moveColumn(from, to)) {
      const target = /** @type {HTMLElement} */ (ev.target);
      this.#focusColumnControl(to, target.closest('wa-checkbox') ? 'wa-checkbox' : '.grip');
    }
  };

  #initializeOverrides() {
    this.#overridesInitialized = true;
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
  }

  /**
   * @param {import('lit').PropertyValues} changedProperties
   */
  update(changedProperties) {
    this.placeholder = this.#localize.term('tableColumns');
    if (!this.#overridesInitialized) {
      this.#initializeOverrides();
    }
    super.update(changedProperties);
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
    const target = /** @type {Element} */ (ev.target);
    if (target.closest('wa-dropdown')) {
      // the grip and its move menu reorder the column; only the rest of the item cycles its visibility
      return;
    }
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

    // the checkbox's name says the visibility
    this.requestUpdate();
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

      /* named by its column and its visibility, which the row shows already */
      .named-by-column::part(label),
      .visually-hidden {
        ${visuallyHidden}
      }

      wa-checkbox,
      span {
        line-height: 1.2;
      }

      wa-dropdown {
        flex-shrink: 0;
      }

      /* The grip is a button that looks like the icon alone: it is the drag handle and opens the move menu. */
      .grip {
        display: flex;
        align-items: center;
        cursor: move;
        appearance: none;
        background: none;
        border: 0;
        border-radius: var(--wa-border-radius-s);
        color: inherit;
        font: inherit;
        /* 24px to click or tap at the default font size */
        padding: 0.25em;
        /* Move slightly to left */
        margin-right: 0.2em;
        margin-left: -0.45em;
      }

      .grip[hidden] {
        display: none;
      }

      .grip:focus-visible {
        outline: var(--wa-focus-ring);
        outline-offset: var(--wa-focus-ring-offset);
      }

      .ghost {
        opacity: 0.5;
      }
    `,
  ];
}
