import { LitElement, html, css, nothing } from 'lit';

/**
 * Sortable column header used by `OwcTable`.
 *
 * Clicking the cell toggles `order` between 'asc' and 'desc', writes the
 * resulting `sorters` array, and fires a bubbling `sort-changed` event that
 * the table listens for.
 */
export class OwcTableHeaderCell extends LitElement {
  static properties = {
    sortable: { type: Boolean },
    order: { type: String, reflect: true },
    field: { type: String },
    customSorters: { type: Array },
  };

  constructor() {
    super();
    this.sortable = true;
    /** @type {'asc' | 'desc' | null} */
    this.order = null;
    this.field = '';
    /** @type {import('./OwcTable.types.js').JsonSorter[] | undefined} */
    this.customSorters = undefined;
    /**
     * Output state: set on click, read by `OwcTable` via the `sort-changed` event.
     * @type {import('./OwcTable.types.js').JsonSorter[] | undefined}
     */
    this.sorters = undefined;
  }
  
  #clickHandler() {
    if (this.sortable === false) {
      return;
    }
    switch (this.order){
      case 'asc':
        this.order = 'desc'
        break
      case 'desc':
        this.order = null;
        break
      case null:
        this.order = 'asc'
        break
    }
    if (this.customSorters) {
      this.sorters = this.customSorters.map(sorter => ({
        field: sorter.field,
        order: /** @type {'asc' | 'desc'} */ (this.order),
        sortType: sorter.sortType,
      }));
    } else {
      // @ts-ignore // due the switch statement, it cannot be undefined
      this.sorters = [{ field: this.field, order: this.order }];
    }
    this.dispatchEvent(new Event('sort-changed', { bubbles: true }));
  }

  render() {
    return html`
      <div @click=${this.#clickHandler} id="wrapper">
        <div id="slot-wrapper"><slot></slot></div>
        ${this.sortable ? html`<button aria-label="Sortieren"></button>` : nothing}
      </div>
    `;
  }

  static styles = [
    css`
      :host {
        cursor: pointer;
        width: 100%;
      }

      #slot-wrapper {
        display: flex;
        justify-content: var(--owc-table-header-cell-align, start);
        flex-grow: 1;
      }

      #wrapper {
        display: flex;
        align-items: center;
        gap: 4px;
        width: 100%;
        height: 100%;
      }

      button {
        background-color: initial;
        background-position-x: center;
        background-repeat: no-repeat;
        background-size: contain;
        border: none;
        cursor: pointer;
        height: 24px;
        margin: 0;
        outline: 0;
        padding: 0;
        min-width: 13px;
        justify-content: end;
      }

      :host(:not([order])) button {
        background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDEuOTk4IiBoZWlnaHQ9IjQwMS45OTgiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDQwMS45OTggNDAxLjk5OCIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PHBhdGggZD0iTTczLjA5MiAxNjQuNDUyaDI1NS44MTNjNC45NDkgMCA5LjIzMy0xLjgwNyAxMi44NDgtNS40MjQgMy42MTMtMy42MTYgNS40MjctNy44OTggNS40MjctMTIuODQ3cy0xLjgxMy05LjIyOS01LjQyNy0xMi44NUwyMTMuODQ2IDUuNDI0QzIxMC4yMzIgMS44MTIgMjA1Ljk1MSAwIDIwMC45OTkgMHMtOS4yMzMgMS44MTItMTIuODUgNS40MjRMNjAuMjQyIDEzMy4zMzFjLTMuNjE3IDMuNjE3LTUuNDI0IDcuOTAxLTUuNDI0IDEyLjg1IDAgNC45NDggMS44MDcgOS4yMzEgNS40MjQgMTIuODQ3IDMuNjIxIDMuNjE3IDcuOTAyIDUuNDI0IDEyLjg1IDUuNDI0em0yNTUuODEzIDczLjA5N0g3My4wOTJjLTQuOTUyIDAtOS4yMzMgMS44MDgtMTIuODUgNS40MjEtMy42MTcgMy42MTctNS40MjQgNy44OTgtNS40MjQgMTIuODQ3czEuODA3IDkuMjMzIDUuNDI0IDEyLjg0OEwxODguMTQ5IDM5Ni41N2MzLjYyMSAzLjYxNyA3LjkwMiA1LjQyOCAxMi44NSA1LjQyOHM5LjIzMy0xLjgxMSAxMi44NDctNS40MjhsMTI3LjkwNy0xMjcuOTA2YzMuNjEzLTMuNjE0IDUuNDI3LTcuODk4IDUuNDI3LTEyLjg0OCAwLTQuOTQ4LTEuODEzLTkuMjI5LTUuNDI3LTEyLjg0Ny0zLjYxNC0zLjYxNi03Ljg5OS01LjQyLTEyLjg0OC01LjQyeiIvPjwvc3ZnPg==);
        background-position-y: center;
        opacity: 0.3;
      }
      :host([order='desc']) button {
        background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyOTIuMzYyIiBoZWlnaHQ9IjI5Mi4zNjIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDI5Mi4zNjIgMjkyLjM2MiIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PHBhdGggZD0iTTI4Ni45MzUgNjkuMzc3Yy0zLjYxNC0zLjYxNy03Ljg5OC01LjQyNC0xMi44NDgtNS40MjRIMTguMjc0Yy00Ljk1MiAwLTkuMjMzIDEuODA3LTEyLjg1IDUuNDI0QzEuODA3IDcyLjk5OCAwIDc3LjI3OSAwIDgyLjIyOGMwIDQuOTQ4IDEuODA3IDkuMjI5IDUuNDI0IDEyLjg0N2wxMjcuOTA3IDEyNy45MDdjMy42MjEgMy42MTcgNy45MDIgNS40MjggMTIuODUgNS40MjhzOS4yMzMtMS44MTEgMTIuODQ3LTUuNDI4TDI4Ni45MzUgOTUuMDc0YzMuNjEzLTMuNjE3IDUuNDI3LTcuODk4IDUuNDI3LTEyLjg0NyAwLTQuOTQ4LTEuODE0LTkuMjI5LTUuNDI3LTEyLjg1eiIvPjwvc3ZnPg==);
        background-position-y: 65%;
        background-size: 10px;
      }
      :host([order='asc']) button {
        background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyOTIuMzYyIiBoZWlnaHQ9IjI5Mi4zNjEiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDI5Mi4zNjIgMjkyLjM2MSIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PHBhdGggZD0iTTI4Ni45MzUgMTk3LjI4NyAxNTkuMDI4IDY5LjM4MWMtMy42MTMtMy42MTctNy44OTUtNS40MjQtMTIuODQ3LTUuNDI0cy05LjIzMyAxLjgwNy0xMi44NSA1LjQyNEw1LjQyNCAxOTcuMjg3QzEuODA3IDIwMC45MDQgMCAyMDUuMTg2IDAgMjEwLjEzNHMxLjgwNyA5LjIzMyA1LjQyNCAxMi44NDdjMy42MjEgMy42MTcgNy45MDIgNS40MjUgMTIuODUgNS40MjVoMjU1LjgxM2M0Ljk0OSAwIDkuMjMzLTEuODA4IDEyLjg0OC01LjQyNSAzLjYxMy0zLjYxMyA1LjQyNy03Ljg5OCA1LjQyNy0xMi44NDdzLTEuODE0LTkuMjMtNS40MjctMTIuODQ3eiIvPjwvc3ZnPg==);
        background-position-y: 35%;
        background-size: 10px;
      }
    `,
  ];
}
