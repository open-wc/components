import { LitElement, css, html, nothing } from 'lit';
import { OwcCard } from '../card/OwcCard.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { repeat } from 'lit/directives/repeat.js';
import { ref } from 'lit/directives/ref.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/details/details.js';
import { VerticalListController } from '../lit-helpers/VerticalListController.js';

/**
 * @template {Record<string, any>} T
 * @template {{label?: string, value: string, onDrop?: (data: T, column: string) => void, onLift?: (data: T, column: string) => void}[]} Columns
 * @template {{data: T[], onDrop: (data: T, column: string) => void, onLift?: (data: T, column: string) => void, liftable?: boolean}} DropzoneColumn
 */
export class OwcPinboard extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'owc-card': OwcCard,
  };

  static properties = {
    data: { type: Array },
    columns: { type: Array },
    dropZones: { type: Object },
    sorter: { type: Function },
    keyFunction: { type: Function },
    fieldMapper: { type: Object },
    canDrop: { type: Function },
    scrollTarget: { attribute: false },
  };

  constructor() {
    super();
    /**@type {T[][]} */
    this.data = [];
    /**@type {Columns} */
    // @ts-ignore
    this.columns = [];
    /**@type {{delete?: DropzoneColumn, success?: DropzoneColumn}}} */
    this.dropZones = {};
    /**@type {import('../card-list/CardListTypes.js').Fields<T>} */
    this.fieldMapper = { body: () => '' };
    /**@type {(a: T, b: T) => number} */
    this.sorter = () => 0;
    /**@type {(data: T) => string} */
    this.keyFunction = () => '';
    /**@type {(data: T, column: string) => boolean} */
    this.canDrop = () => true;
    /** @type {Element | undefined} */
    this.scrollTarget = undefined;
  }

  #smallListThreshold = 50;
  #normalOverscan = 5;
  #dragOverscan = 50;
  /** @type {string | undefined} */
  #draggedListKey;
  /** @type {string | number | undefined} */
  #draggedItemKey;
  /** @type {Map<string, {items: T[], list: VerticalListController, element?: Element}>} */
  #columnLists = new Map();
  /** @type {Element | undefined} */
  #columnListsScrollTarget;

  connectedCallback() {
    super.connectedCallback();
    // Keep the controllers registered while detached so Lit can run their
    // supported hostDisconnected/hostConnected lifecycle. Requesting a render
    // reattaches card measurement elements after the board is reconnected.
    this.requestUpdate();
  }

  render() {
    this.#disposeColumnListsExcept(this.#activeVirtualListKeys());
    return html` <div class="main-container">
      <div class="column-container">
        ${repeat(
          this.columns,
          col => col.value,
          (col, index) => this.#renderColumn(`column:${col.value}`, col, this.data[index]),
        )}
      </div>
      <div class="dropzone-container-container">
        <div class="dropzone-container">
          ${Object.entries(this.dropZones).map(([key]) =>
            this.#renderDropzone(/**@type {"success" | "delete"}*/ (key)),
          )}
        </div>
      </div>
    </div>`;
  }

  /**@param {"success" | "delete"} dropzone */
  #renderDropzone(dropzone) {
    return html` <div class="${dropzone}-container dropzone-sub-container">
      ${
        this.dropZones?.[dropzone]?.onDrop
          ? html` <div
              class="dropzone ${dropzone}"
              .name=${dropzone}
              @dragover=${this.#onDragMove}
              @drop=${this.#onDrop}
              @dragleave=${this.#onDragLeave}
              .onDropCallback=${this.dropZones?.[dropzone].onDrop}
              @click=${() => this.#handleDropzoneClick(dropzone)}
            >
              <wa-icon
                auto-width
                class="dropzone-icon"
                name=${dropzone === 'success' ? 'check' : 'trash'}
              ></wa-icon>
            </div>`
          : nothing
      }
      ${
        this.dropZones?.[dropzone]?.data
          ? html`<wa-details class="dropzone-details">
              ${this.#renderColumn(
                `dropzone:${dropzone}`,
                {
                  value: dropzone,
                  onDrop: this.dropZones?.[dropzone].onDrop,
                  onLift: this.dropZones?.[dropzone].onLift,
                },
                this.dropZones?.[dropzone].data,
                this.dropZones[dropzone].liftable || false,
              )}
            </wa-details>`
          : nothing
      }
    </div>`;
  }

  /**
   *
   * @param {"success" | "delete"} dropzone
   */
  #handleDropzoneClick(dropzone) {
    const details = /**@type {{open: boolean} | undefined}*/ (
      this.shadowRoot?.querySelector(`.${dropzone}-container .dropzone-details`)
    );
    if (!details) {
      return;
    }
    details.open = !details.open;
  }

  /**
   *
   * @param {string} listKey
   * @param {Columns[number]} column
   * @param {T[]} data
   * @param {boolean} [liftable]
   */
  #renderColumn(listKey, column, data = [], liftable = true) {
    const items = [...data].sort(this.sorter);
    return html`
      <div
        class="column ${liftable ? 'liftable' : ''}"
        .name=${column.value}
        .listKey=${listKey}
        .onLiftCallback=${column.onLift}
        .onDropCallback=${column.onDrop}
        @dragover=${this.#onDragMove}
        @drop=${this.#onDrop}
        @dragleave=${this.#onDragLeave}
        @dragstart=${liftable ? this.#onDragStart : undefined}
        @dragend=${liftable ? this.#onDragEnd : undefined}
      >
        ${column.label ? html`<div class="column-header-cell">${column.label}</div>` : nothing}
        <div class="column-list">${this.#renderList(listKey, items, liftable)}</div>
      </div>
    `;
  }

  /** @param {T[]} items */
  #shouldVirtualize(items) {
    return items.length >= this.#smallListThreshold;
  }

  #activeVirtualListKeys() {
    /** @type {Set<string>} */
    const keys = new Set();
    this.columns.forEach((column, index) => {
      if (this.#shouldVirtualize(this.data[index] ?? [])) {
        keys.add(`column:${column.value}`);
      }
    });
    Object.entries(this.dropZones).forEach(([key, dropzone]) => {
      if (dropzone.data && this.#shouldVirtualize(dropzone.data)) {
        keys.add(`dropzone:${key}`);
      }
    });
    return keys;
  }

  /** @param {Set<string>} activeKeys */
  #disposeColumnListsExcept(activeKeys) {
    for (const [key, { list }] of this.#columnLists) {
      if (!activeKeys.has(key)) {
        list.dispose();
        this.#columnLists.delete(key);
      }
    }
  }

  /** @param {string} key @param {T[]} items */
  #getList(key, items) {
    if (this.#columnListsScrollTarget !== this.scrollTarget) {
      this.#disposeColumnListsExcept(new Set());
      this.#columnListsScrollTarget = this.scrollTarget;
    }
    let entry = this.#columnLists.get(key);
    if (!entry) {
      const initialItems = items;
      const listItems = () => this.#columnLists.get(key)?.items ?? initialItems;
      const list = new VerticalListController(this, {
        scrollTarget: this.scrollTarget ? 'element' : 'window',
        getScrollElement: () => this.scrollTarget ?? null,
        getItems: listItems,
        getItemKey: index => this.keyFunction(listItems()[index]),
        estimateSize: 120,
        overscan: this.#draggedListKey ? this.#dragOverscan : this.#normalOverscan,
        rangeExtractor: range => this.#getDragRange(key, range),
      });
      entry = { items, list };
      this.#columnLists.set(key, entry);
    } else {
      entry.items = items;
    }
    entry.list.update();
    return entry.list;
  }

  /**
   * Retain the lifted card even when its column is scrolled far enough for the
   * normal range to exclude it. The expanded overscan keeps nearby targets
   * available without making the normal, non-dragging DOM unbounded.
   * @param {{startIndex: number, endIndex: number, overscan: number, count: number}} range
   */
  /** @param {string} key @param {{startIndex: number, endIndex: number, overscan: number, count: number}} range */
  #getDragRange(key, range) {
    const start = Math.max(range.startIndex - range.overscan, 0);
    const end = Math.min(range.endIndex + range.overscan, range.count - 1);
    const indexes = Array.from({ length: end - start + 1 }, (_, index) => start + index);
    if (key !== this.#draggedListKey || this.#draggedItemKey === undefined) {
      return indexes;
    }
    const sourceIndex = this.#columnLists
      .get(key)
      ?.items.findIndex(item => this.keyFunction(item) === this.#draggedItemKey);
    if (sourceIndex !== undefined && sourceIndex >= 0 && !indexes.includes(sourceIndex)) {
      indexes.push(sourceIndex);
      indexes.sort((a, b) => a - b);
    }
    return indexes;
  }

  /** @param {boolean} active */
  #setDragOverscan(active) {
    for (const { list } of this.#columnLists.values()) {
      list.setOverscan(active ? this.#dragOverscan : this.#normalOverscan);
    }
    this.requestUpdate();
  }

  /** @param {string} key @param {Element | null} element */
  #setListElement(key, element) {
    const entry = this.#columnLists.get(key);
    if (!entry || !element) {
      return;
    }
    entry.element = element;
    const scrollOffset = this.scrollTarget
      ? /** @type {HTMLElement} */ (this.scrollTarget).scrollTop
      : window.scrollY;
    const scrollTop = this.scrollTarget ? this.scrollTarget.getBoundingClientRect().top : 0;
    entry.list.setScrollMargin(scrollOffset + element.getBoundingClientRect().top - scrollTop);
  }

  /** @param {T} item @param {boolean} liftable */
  #renderCard(item, liftable) {
    return html`<owc-card
      class="column-card"
      .data=${item}
      draggable=${liftable}
      small-padding
      style="${this.#renderStyles(item)}"
    >
      ${this.#renderCardImage(item)} ${this.#renderCardHeader(item)} ${this.#renderCardBody(item)}
      ${this.#renderCardFooter(item)}
    </owc-card>`;
  }

  /** @param {string} key @param {T[]} items @param {boolean} liftable */
  #renderList(key, items, liftable) {
    if (!this.#shouldVirtualize(items)) {
      const entry = this.#columnLists.get(key);
      entry?.list.dispose();
      this.#columnLists.delete(key);
      return items.map(item => this.#renderCard(item, liftable));
    }
    const list = this.#getList(key, items);
    return html`<div
      class="virtual-list"
      style=${`height: ${list.totalSize}px`}
      ${ref(element => this.#setListElement(key, element ?? null))}
    >
      ${list.items.map(
        virtualItem =>
          html`<div
            class="virtual-item"
            data-index=${virtualItem.index}
            style=${`transform: translateY(${virtualItem.start - list.scrollMargin}px)`}
            ${ref(element => list.measureElement(element ?? null))}
          >
            ${this.#renderCard(items[virtualItem.index], liftable)}
          </div>`,
      )}
    </div>`;
  }

  static styles = [
    css`
      .main-container {
        display: flex;
        gap: 100px;
        min-height: inherit;
      }

      .column-container {
        display: flex;
        flex-direction: row;
        flex-basis: auto;
        width: max-content;
      }

      .dropzone-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        position: sticky;
        height: min(100%, 100vh);
        top: 0px;
        gap: max(20%, 10px);
      }

      .dropzone-sub-container {
        display: grid;
        justify-items: center;
      }

      .column {
        --border-style: 1px solid var(--wa-color-surface-border);

        display: flex;
        flex-direction: column;
        border-right: var(--border-style);
        border-bottom: var(--border-style);
        gap: 10px;
        padding-bottom: 10px;
        width: 250px;
        transition: var(--wa-transition-medium);
      }

      .dropzone-details .column {
        padding-top: 10px;
        border-top: var(--border-style);
      }

      .column:first-child {
        border-left: var(--border-style);
        border-start-start-radius: var(--wa-border-radius-m);
        border-end-start-radius: var(--wa-border-radius-m);
      }

      .column:last-child {
        border-start-end-radius: var(--wa-border-radius-m);
        border-end-end-radius: var(--wa-border-radius-m);
      }

      .column-card {
        margin-right: 10px;
        margin-left: 10px;
        width: 230px;
        margin-bottom: 10px;
      }

      .virtual-list {
        position: relative;
        width: 100%;
      }

      .virtual-item {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
      }

      .column-header-cell {
        text-align: center;
        border-bottom: var(--border-style);
        border-top: var(--border-style);
        color: #6b7280;
        background-color: #f9fafb;
        position: sticky;
        top: 0px;
        z-index: 100;
        padding-top: 10px;
        padding-bottom: 10px;
      }

      .dropzone {
        font-size: 40px;
        max-width: 1em;
        max-height: 1em;
        padding: 0.8em;
        border-radius: var(--wa-border-radius-l);
        border: thick dashed;
        transition: var(--wa-transition-medium);
        z-index: 300;
      }

      .delete {
        border-color: red;
      }

      .dropzone-icon {
        transition: var(--wa-transition-medium);
        display: flex;
      }

      .delete .dropzone-icon {
        color: red;
      }

      .success {
        border-color: green;
      }

      .success .dropzone-icon {
        color: green;
      }

      .drop-hover {
        transition: var(--wa-transition-medium);
        box-shadow: 0 2px 8px rgb(0 0 0 / 50%);
        z-index: 150;
      }

      .drop-hover .column-header-cell {
        z-index: 200;
      }

      .drop-hover.delete {
        background-color: red;
      }

      .drop-hover .dropzone-icon {
        color: white;
      }

      .drop-hover.success {
        background-color: green;
      }

      .cannot-drop {
        background-color: var(--wa-color-neutral-90);
        color: var(--wa-color-neutral-900);
      }

      /* wa-detail overrides */
      .dropzone-details {
        max-height: 400px;
        animation-duration: 1s;
        overflow: auto;
      }
      .dropzone-details::part(base) {
        border: none;
        padding: 0;
        box-shadow: none;
      }
      .dropzone-details::part(icon) {
        display: none;
      }
      .dropzone-details::part(summary) {
        padding: 0;
        margin: 0;
        display: none;
      }
      .dropzone-details::part(header) {
        padding: 0;
      }
      .dropzone-details::part(content) {
        padding: 0;
        margin: 0;
      }

      owc-card::part(body) {
        display: block;
      }
    `,
  ];

  /**
   *
   * @param {T} data
   */
  #renderStyles(data) {
    if (!this.fieldMapper.style) {
      return '';
    }
    return this.fieldMapper.style(data);
  }

  /**
   *
   * @param {T} data
   */
  #renderCardImage(data) {
    if (!this.fieldMapper.image?.src || !this.fieldMapper.image?.alt) {
      return nothing;
    }
    return html` <img
      slot="media"
      src=${this.fieldMapper.image.src(data)}
      alt=${this.fieldMapper.image.alt(data)}
    />`;
  }

  /**
   *
   * @param {T} data
   */
  #renderCardHeader(data) {
    if (!this.fieldMapper.header) {
      return nothing;
    }
    return html` <div slot="header">${this.fieldMapper.header(data)}</div>`;
  }

  /**
   *
   * @param {T} data
   */
  #renderCardFooter(data) {
    if (!this.fieldMapper.footer) {
      return nothing;
    }
    return html` <div slot="footer">${this.fieldMapper.footer(data)}</div>`;
  }

  /**
   *
   * @param {T} data
   */
  #renderCardBody(data) {
    return html` <div class="body">${this.fieldMapper.body(data)}</div>`;
  }

  #removeHoverShadow() {
    this.shadowRoot
      ?.querySelectorAll('.drop-hover')
      .forEach(elm => elm.classList.remove('drop-hover'));
  }

  /**
   *
   * @param {T} dragged
   */
  #showNonDropColsDisabled(dragged) {
    const columns = /**@type {(Element & {name: string})[]}*/ (
      Array.from(this.shadowRoot?.querySelectorAll('.column') || [])
    );
    columns?.forEach(column => {
      // @ts-ignore
      if (
        !this.canDrop(dragged, column.name) &&
        !Object.keys(this.dropZones).includes(column.name)
      ) {
        column.classList.add('cannot-drop');
      }
    });
  }

  #hideNonDropColsDisabled() {
    const columns = this.shadowRoot?.querySelectorAll('.column');
    columns?.forEach(column => {
      column.classList.remove('cannot-drop');
    });
  }

  /**
   *
   * @param {DragEvent} ev
   */
  #onDragStart(ev) {
    this.dragged = /**@type {HTMLElement}*/ (ev.target);
    this.draggedFrom = ev.currentTarget;
    const source = /** @type {HTMLElement & {listKey: string}} */ (this.draggedFrom);
    this.#draggedListKey = source.listKey;
    // @ts-ignore
    this.#draggedItemKey = this.keyFunction(this.dragged.data);
    this.#setDragOverscan(true);
    // @ts-ignore
    this.#showNonDropColsDisabled(this.dragged.data);
    // @ts-ignore
    ev.dataTransfer.effectAllowed = 'move';
  }

  /**
   *
   * @param {DragEvent} ev
   */
  #onDragEnd(ev) {
    ev.preventDefault();
    this.#finishDrag();
  }

  #finishDrag() {
    this.#hideNonDropColsDisabled();
    this.#draggedListKey = undefined;
    this.#draggedItemKey = undefined;
    this.#setDragOverscan(false);
  }

  /**
   *
   * @param {DragEvent} ev
   */
  #onDragMove(ev) {
    if (!ev.dataTransfer) {
      return;
    }
    const typedTarget = /**@type {HTMLElement}*/ (ev.currentTarget);
    if (typedTarget.classList.contains('column')) {
      // @ts-ignore
      if (!this.canDrop(this.dragged?.data, typedTarget.name)) {
        this.#removeHoverShadow();
        return;
      }
    }
    ev.preventDefault();
    ev.dataTransfer.dropEffect = 'move';
    if (this.dragged?.parentElement !== typedTarget) {
      if (
        typedTarget.classList.contains('dropzone') &&
        !typedTarget.classList.contains('drop-hover')
      ) {
        this.#removeHoverShadow();
        typedTarget.classList.add('drop-hover');
      } else if (typedTarget.classList.contains('column')) {
        // typedTarget.appendChild(this.dragged);
        this.#removeHoverShadow();
        typedTarget.classList.add('drop-hover');
      }
    } else {
      this.#removeHoverShadow();
    }
  }

  /**
   *
   * @param {DragEvent} ev
   */
  async #onDragLeave(ev) {
    const composedPath = ev.composedPath();
    if (
      composedPath.indexOf(/**@type {Node}*/ (ev.currentTarget)) <
      composedPath.indexOf(/**@type {Node}*/ (ev.relatedTarget))
    ) {
      // currentTarget is inside of relatedTarget
      this.#removeHoverShadow();
    }
  }

  /**
   *
   * @param {DragEvent} ev
   */
  async #onDrop(ev) {
    ev.preventDefault();
    this.#removeHoverShadow();
    const typedTarget = /**@type {HTMLElement}*/ (ev.currentTarget);
    const dragged = /** @type {(HTMLElement & {data: T}) | undefined} */ (this.dragged);
    const dropTarget = /** @type {HTMLElement & {name: string}} */ (typedTarget);
    if (
      dropTarget.classList.contains('column') &&
      !this.canDrop(/** @type {T} */ (dragged?.data), dropTarget.name)
    ) {
      this.#finishDrag();
      return;
    }
    if (typedTarget !== this.draggedFrom || typedTarget.classList.contains('dropzone')) {
      // @ts-ignore
      await this.draggedFrom?.onLiftCallback?.(this.dragged.data, this.draggedFrom.name);
      // @ts-ignore
      await typedTarget?.onDropCallback?.(
        // @ts-ignore
        this.dragged?.data,
        // @ts-ignore
        typedTarget.name,
      );
      this.requestUpdate();
    }
    this.#finishDrag();
  }
}
