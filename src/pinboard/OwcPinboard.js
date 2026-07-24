import { LitElement, css, html, nothing } from 'lit';
import { OwcCard } from '../card/OwcCard.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { repeat } from 'lit/directives/repeat.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/details/details.js';
import { virtualize } from '@lit-labs/virtualizer/virtualize.js';

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
    this.keyFunction = this.#defaultKeyFunction;
    /**@type {(data: T, column: string) => boolean} */
    this.canDrop = () => true;
  }

  render() {
    return html` <div class="main-container">
      <div class="column-container">
        ${repeat(
          this.columns,
          col => col.value,
          (col, index) => this.#renderColumn(this.#wrapCallbacks(col), this.data[index]),
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
    const config = this.dropZones?.[dropzone];
    if (!config) {
      return nothing;
    }

    const wrapped = this.#wrapCallbacks({
      value: dropzone,
      onDrop: config.onDrop,
      onLift: config.onLift,
    });

    return html` <div class="${dropzone}-container dropzone-sub-container">
      <div
        class="dropzone ${dropzone}"
        .name=${dropzone}
        @dragover=${this.#onDragMove}
        @drop=${this.#onDrop}
        @dragleave=${this.#onDragLeave}
        .onDropCallback=${wrapped.onDrop}
        @click=${() => this.#handleDropzoneClick(dropzone)}
      >
        <wa-icon
          auto-width
          class="dropzone-icon"
          name=${dropzone === 'success' ? 'check' : 'trash'}
        ></wa-icon>
      </div>
      ${
        config.data !== undefined
          ? html`<wa-details class="dropzone-details">
              ${this.#renderColumn(wrapped, config.data, config.liftable || false)}
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
   * @param {Columns[number]} column
   * @param {T[]} data
   * @param {boolean} [liftable]
   */
  #renderColumn(column, data, liftable = true) {
    return html`
      <div
        class="column ${liftable ? 'liftable' : ''}"
        .name=${column.value}
        .onLiftCallback=${column.onLift}
        .onDropCallback=${column.onDrop}
        @dragover=${this.#onDragMove}
        @drop=${this.#onDrop}
        @dragleave=${this.#onDragLeave}
        @dragstart=${liftable ? this.#onDragStart : undefined}
        @dragend=${liftable ? this.#onDragEnd : undefined}
      >
        ${column.label ? html`<div class="column-header-cell">${column.label}</div>` : nothing}
        <div>
          ${virtualize({
            items: [...data].sort(this.sorter),
            keyFunction: this.keyFunction,
            renderItem: elm => html`
              <div>
                <owc-card
                  class="column-card"
                  .data=${elm}
                  draggable=${liftable}
                  small-padding
                  style="${this.#renderStyles(elm)}"
                >
                  ${this.#renderCardImage(elm)} ${this.#renderCardHeader(elm)}
                  ${this.#renderCardBody(elm)} ${this.#renderCardFooter(elm)}
                </owc-card>
              </div>
            `,
          })}
        </div>
      </div>
    `;
  }

  /**
   * @param {T} data
   * @param {string} column
   * @return {void}
   */
  #defaultOnDrop = (data, column) => {
    const colIndex = this.columns.findIndex(c => c.value === column);
    if (colIndex !== -1) {
      this.data[colIndex] = [...this.data[colIndex], data];
      return;
    }
    const zone = this.dropZones[column];
    if (zone && Array.isArray(zone.data)) {
      zone.data = [...zone.data, data];
    }
  };

  /**
   * @param {T} data
   * @param {string} column
   * @return {void}
   */
  #defaultOnLift = (data, column) => {
    const colIndex = this.columns.findIndex(c => c.value === column);
    if (colIndex !== -1) {
      this.data[colIndex] = this.data[colIndex].filter(elm => elm !== data);
      return;
    }
    const zone = this.dropZones[column];
    if (zone && Array.isArray(zone.data)) {
      zone.data = zone.data.filter((/** @type {T} */ elm) => elm !== data);
    }
  };

  /**
   * @param {((data: T, column: string, defaultAction: (data: T, column: string) => void) => void) | undefined} userFn
   * @param {T} data
   * @param {string} column
   * @param {(data: T, column: string) => void} defaultFn
   * @return {void}
   */
  #runHook(userFn, data, column, defaultFn) {
    return userFn ? userFn(data, column, defaultFn) : defaultFn(data, column);
  }

  /**
   * @param {{value: string, onDrop?: (data: T, column: string, defaultAction: (data: T, column: string) => void) => void, onLift?: (data: T, column: string, defaultAction: (data: T, column: string) => void) => void}} col
   * @return {{value: string, onDrop: (data: T, column: string) => void, onLift: (data: T, column: string) => void}}
   */
  #wrapCallbacks(col) {
    return {
      ...col,
      onDrop: (data, column) => this.#runHook(col.onDrop, data, column, this.#defaultOnDrop),
      onLift: (data, column) => this.#runHook(col.onLift, data, column, this.#defaultOnLift),
    };
  }

  /** @type {WeakMap<object, string>} */
  #itemKeys = new WeakMap();
  #itemKeyCounter = 0;

  /**
   *
   * @param {T} data
   * @return {string}
   */
  #defaultKeyFunction = data => {
    let key = this.#itemKeys.get(data);
    if (key === undefined) {
      key = `pinboard-item-${this.#itemKeyCounter++}`;
      this.#itemKeys.set(data, key);
    }
    return key;
  };

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
    this.#hideNonDropColsDisabled();
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
    this.#hideNonDropColsDisabled();
    const typedTarget = /**@type {HTMLElement}*/ (ev.currentTarget);
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
}
