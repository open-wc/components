import { LitElement, html, css, nothing } from 'lit';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { OwcTabs } from '@open-wc/components/OwcTabs.js';
import { OwcTableMassEdit } from './OwcTableMassEdit.js';
import { OwcTableSettings } from './OwcTableSettings.js';
import { getFieldPathContent } from '../field-path-helper/getFieldPathContent.js';
import { getFieldPath } from '../field-path-helper/getFieldPath.js';
import { setFieldPath } from '../field-path-helper/setFieldPath.js';
import { OwcLocalizeController } from '@open-wc/components/localization.js';

/**
 * @template {Record<string, unknown>} T
 */
export class OwcTableInfo extends ScopedElementsMixin(LitElement) {
  #localize = new OwcLocalizeController(this);
  static scopedElements = {
    'owc-tabs': OwcTabs,
    'owc-table-mass-edit': OwcTableMassEdit,
    'owc-table-settings': OwcTableSettings,
  };

  static properties = {
    table: { type: Object },
    dataFullSize: { type: Number },
    dataSelectedSize: { type: Number },
    dataCurrentSize: { type: Number },
    columns: { type: Array },
    actionTabs: { type: Object },
    actionTabActive: { type: String },
    refreshButton: { type: Boolean },
    loading: { type: Boolean },
    showInfo: { type: Boolean },
  };

  constructor() {
    super();
    this.dataSelectedSize = 0;
    this.dataCurrentSize = 0;
    this.dataFullSize = 0;
    this.showInfo = false;
    this.customStyles = css`
      .owc-table-definition-list {
        display: grid;
        grid-template-columns: auto auto;
        gap: 0.2rem 1rem;
        font-size: 0.95rem;
        font-family: 'Inter', sans-serif;
        max-width: max-content; /* <– das ist der Schlüssel */

        dt {
          text-align: left;
          color: #4b5563;
          font-weight: 600; /* fett */
          margin: 0;
        }

        dd {
          text-align: right;
          font-variant-numeric: tabular-nums;
          color: #1f2937;
          font-weight: 500;
          margin: 0;
        }
      }
    `;
    /** @type {import('./OwcTable.types.js').Column<T>[]} */
    this.columns = [];
    /** @type {import('../tabs/OwcTabs.types.js').Tabs<{ }>} */
    this.actionTabs = {};
    this.getRenderOptions = () => ({});
    /** @type {import('./OwcTable.js').OwcTable<T> | undefined} */
    this.table = undefined;
    this.actionTabActive = '';
    /** @type {import('../tabs/OwcTabs.types.js').Tabs<import('./OwcTable.types.js').OwcTableActionTabsRenderOptions<T>>} */
    this.builtInTabs = {
      calculateSums: {
        visible: false,
        order: 750,
        label: 'Sums',
        content: ({ processedData, selectedData, columns }) => {
          const data = selectedData?.length > 0 ? selectedData : processedData;
          const sumList = [];

          const summableColumns = columns.filter(
            col => col.showInCalculateSums === true && col.field,
          );

          for (const column of summableColumns) {
            if (column.field) {
              let sum = 0;
              for (const row of data) {
                const value = getFieldPath(row, column.field);
                const num =
                  typeof value === 'number' ? value : parseFloat(/** @type {string} */ (value));
                if (!isNaN(num)) {
                  sum += num;
                }
              }
              const fakeData = /**@type {T}*/ ({});
              setFieldPath(fakeData, column.field, sum);
              const value = getFieldPathContent(fakeData, column);
              sumList.push({ label: column.label, value });
            }
          }

          return html`
            <dl class="owc-table-definition-list">
              ${sumList.map(({ label, value }) => {
                return html`
                  <dt>${label}:</dt>
                  <dd>${value}</dd>
                `;
              })}
            </dl>
          `;
        },
      },
      export: {
        label: 'Export',
        content: () =>
          html`<div>
            <wa-button
              size="s"
              appearance="outlined"
              @click=${() => {
                this.table?.copyAsExcel();
              }}
            >
              ${this.#localize.term('tableCopyExcel')}
            </wa-button>

            <wa-button
              appearance="outlined"
              size="s"
              @click=${() => {
                this.table?.downloadAsCsv();
              }}
            >
              ${this.#localize.term('tableExportCsv')}
            </wa-button>
          </div>`,
        visible: false,
        order: 800,
      },
      massEdit: {
        label: 'Bulk edit',
        content: ({ selectedData, processedData }) => {
          return html`<owc-table-mass-edit
            lang=${this.lang}
            .columns=${this.columns}
            .data=${selectedData}
            .allData=${processedData}
            .table=${this.table}
          ></owc-table-mass-edit>`;
        },
        visible: false,
        order: 850,
      },
      settings: {
        label: 'Settings',
        content: () => html`
          <owc-table-settings
            lang=${this.lang}
            style="width: 400px"
            .columns=${this.columns}
            .storeNamePrefix=${this.table?.storeNamePrefix}
            @change=${this.#overridesChanged}
            size="s"
          ></owc-table-settings>
        `,
        visible: false,
        order: 900,
      },
    };
    this.refreshButton = false;
    this.loading = false;
  }

  render() {
    const tabIndex = { ...this.builtInTabs };
    const localizedTabIndex = /** @type {any} */ (tabIndex);
    localizedTabIndex.calculateSums = {
      ...tabIndex.calculateSums,
      label: this.#localize.term('tableSums'),
    };
    localizedTabIndex.export = {
      ...tabIndex.export,
      label: this.#localize.term('tableExport'),
    };
    localizedTabIndex.massEdit = {
      ...tabIndex.massEdit,
      label: this.#localize.term('tableMassEdit'),
    };
    localizedTabIndex.settings = {
      ...tabIndex.settings,
      label: this.#localize.term('tableSettings'),
    };
    if (this.actionTabs && Object.keys(this.actionTabs).length > 0) {
      for (const [_key, tab] of Object.entries(this.actionTabs)) {
        const key = /** @type {keyof tabIndex} */ (_key);
        if (tabIndex[key]) {
          tabIndex[key] = { ...tabIndex[key], ...tab };
        } else {
          tabIndex[key] = tab;
        }
      }
    }
    return html`
      <owc-tabs
        lang=${this.lang}
        .tabs=${tabIndex}
        .active=${this.actionTabActive}
        .getRenderOptions=${this.getRenderOptions}
        .customStyles=${this.customStyles}
        @active-changed=${this.#actionChanged}
      >
        <div slot="tab-list-prefix">
          ${this.showInfo ? this.renderInfo() : nothing}
          ${
            this.refreshButton
              ? html`
                  <wa-button
                    variant="neutral"
                    appearance="plain"
                    ?loading="${this.loading}"
                    @click="${this.#handleRefreshButtonClick}"
                    ><wa-icon
                      name="arrow-clockwise"
                      label=${this.#localize.term('tableRefresh')}
                    ></wa-icon
                  ></wa-button>
                `
              : nothing
          }
        </div>
      </owc-tabs>
    `;
  }

  #handleRefreshButtonClick() {
    this.dispatchEvent(
      new Event('refresh-button-clicked', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * @param {Event} ev
   */
  #actionChanged(ev) {
    const typedTarget =
      /** @type {import('../tabs/OwcTabs.js').OwcTabs<import('../tabs/OwcTabs.types.js').Tabs<import('./OwcTable.types.js').OwcTableActionTabsRenderOptions<T>>>} */ (
        ev.target
      );
    this.actionTabActive = typedTarget.active;
  }

  /**
   * @param {import('lit').PropertyValues} changedProperties
   */
  updated(changedProperties) {
    if (changedProperties.has('actionTabActive')) {
      this.dispatchEvent(new Event('action-tab-active-changed'));
    }
    super.updated(changedProperties);
  }

  /**
   * @param {Event} ev
   */
  #overridesChanged = ev => {
    const typedTarget = /** @type {OwcTableSettings} */ (ev.target);
    if (this.table) {
      this.table.overrides = structuredClone(typedTarget.overrides);
    }
  };

  renderInfo() {
    const selectedInfo =
      this.dataSelectedSize > 0
        ? html`<span>${this.#localize.term('tableSelectedEntries', this.dataSelectedSize)}</span>`
        : nothing;

    if (this.dataFullSize === this.dataCurrentSize) {
      return html`<div id="info">
        <span>${this.#localize.term('tableShowAllEntries', this.dataFullSize)}</span>
        ${selectedInfo}
      </div>`;
    }
    return html`<div id="info">
      <span
        >${this.#localize.term('tableShowEntries', this.dataCurrentSize, this.dataFullSize)}</span
      >
      ${selectedInfo}
    </div>`;
  }

  static styles = [
    css`
      :host {
        display: block;
        width: 100%;
      }

      owc-tabs::part(content-wrapper) {
        overflow: auto;
        max-height: 75vh;
        max-width: var(--owc-max-content-width, none);
        padding-right: 10px;
      }
    `,
  ];
}
