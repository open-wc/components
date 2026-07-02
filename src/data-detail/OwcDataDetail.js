import { LitElement, html, css } from 'lit';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';

import { OwcAutocomplete } from '../autocomplete/OwcAutocomplete.js';
import { OwcClickEditableAutocomplete } from '../click-editable/OwcClickEditableAutocomplete.js';
import { OwcClickEditableInput } from '../click-editable/OwcClickEditableInput.js';
import { OwcTable } from '../OwcTable.js';

import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/badge/badge.js';
import {
  getFieldPathContent,
  contentFormatterStyles,
} from '../field-path-helper/getFieldPathContent.js';
import { OwcClickEditableTextarea } from '../click-editable/OwcClickEditableTextarea.js';

/**
 * @template {Record<string, unknown>} T
 */
export class OwcDataDetail extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'owc-click-editable-input': OwcClickEditableInput,
    'owc-click-editable-autocomplete': OwcClickEditableAutocomplete,
    'owc-click-editable-textarea': OwcClickEditableTextarea,
    'owc-autocomplete': OwcAutocomplete,
    'owc-table': OwcTable,
  };

  static properties = {
    columns: { type: Array },
    data: { type: Object },
    openColumns: { type: Array },
    fallbackValue: { type: String },
    handleUpdate: { type: Function },
    currencyFormatter: { type: Object },
    dateFormatter: { type: Object },
    dateTimeFormatter: { type: Object },
    numberFormatter: { type: Object },
    percentFormatter: { type: Object },
  };

  constructor() {
    super();
    /** @type {T} */
    this.data = /** @type {T} */ ({});
    /** @type {import('./OwcDataDetail.types.js').OwcDataDetailColumns<T>} */
    this.columns = [];
    /** @type {import('./OwcDataDetail.types.js').openColumns<T>} */
    this.openColumns = [];
    this.fallbackValue = '-';
    /** @type {import('../field-path-helper/getFieldPathContent.types.js').handleUpdate<T> | undefined} */
    this.handleUpdate = undefined;
    this.dateFormatter = new Intl.DateTimeFormat('de', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    this.dateTimeFormatter = new Intl.DateTimeFormat('de', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
    this.currencyFormatter = new Intl.NumberFormat('de', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2,
    });
    this.numberFormatter = new Intl.NumberFormat('de', { maximumFractionDigits: 2 });
    this.percentFormatter = new Intl.NumberFormat('de', {
      style: 'percent',
      maximumFractionDigits: 2,
    });
  }

  get columnsRowCount() {
    return Math.max(...this.visibleColumns.map(column => column.length));
  }

  /**
   * @param {import('lit').PropertyValues} changedProperties
   */
  update(changedProperties) {
    // console.log('update owcDetail:', this, changedProperties);
    super.update(changedProperties);
  }

  get requiredFields() {
    return this.visibleColumns
      .flatMap(col => col)
      .filter(col => col.editableOptions?.required)
      .map(col => col.field);
  }

  get visibleColumns() {
    return this.columns.map(col =>
      col.filter(col => {
        const v = col.visible;
        const isVisible = typeof v === 'function' ? v(this.data) : (v ?? true);
        return isVisible;
      }),
    );
  }

  /**
   * @param {import('../field-path-helper/getFieldPathContent.types.js').Field<T>} field
   */
  handleLabelClick(field) {
    if (this.isFieldOpen(field)) {
      this.openColumns = this.openColumns.filter(column => column !== field);
    } else {
      this.openColumns = [field];
    }
  }

  /**
   * @param {import('../field-path-helper/getFieldPathContent.types.js').Field<T>} field
   * @returns {boolean}
   */
  isFieldOpen(field) {
    return this.openColumns.includes(field);
  }

  /**
   * @param {import('@finum/data-table/OwcDataDetail.types.js').OwcDataDetailItem<T>} detailItem
   */
  iconOrLabel(detailItem) {
    const labelBadge = detailItem.labelBadge ? detailItem.labelBadge(this.data) : '';
    if (detailItem.type === 'expandable') {
      return html`<div class="grid-cell">
        <wa-button class="label expandable-label" appearance="plain">
          <div>
            ${detailItem.label}
            ${labelBadge ? html`<wa-badge variant="neutral" pill>${labelBadge}</wa-badge>` : ''}
          </div>
          ${
            this.isFieldOpen(detailItem.field)
              ? html`<wa-icon slot="end" name="chevron-up"></wa-icon>`
              : html`<wa-icon slot="end" name="chevron-down"></wa-icon>`
          }
        </wa-button>
      </div>`;
    }
    return html`
      <div class="grid-cell">
        <div class="label">
          ${typeof detailItem.label === 'function' ? detailItem.label(this.data) : detailItem.label}
        </div>
      </div>
    `;
  }

  /**
   * @param {import('@finum/data-table/OwcDataDetail.types.js').OwcDataDetailItem<T>}  cell
   */
  renderCell(cell) {
    if (!cell) {
      return html`-`;
    }

    return getFieldPathContent(this.data, cell, {
      renderType: 'html',
      requiredFields: cell.type === 'editable' ? this.requiredFields : [],
      render: ({ config, content }) => {
        if (config.type === 'expandable') {
          return html`<div @click="${() => this.handleLabelClick(config.field)}">
              ${this.iconOrLabel(cell)}
            </div>
            <div class="grid-cell value">${content}</div>`;
        }
        return html`${this.iconOrLabel(config)}
          <div class="grid-cell value">
            <div>${content}</div>
            ${
              config.contentSuffix
                ? html`<div class="content-suffix">${config.contentSuffix(this.data)}</div>`
                : ''
            }
          </div>`;
      },
      handleUpdate: this.handleUpdate,
      fallbackValue: this.fallbackValue,
      dateFormatter: this.dateFormatter,
      dateTimeFormatter: this.dateTimeFormatter,
      currencyFormatter: this.currencyFormatter,
      numberFormatter: this.numberFormatter,
      percentFormatter: this.percentFormatter,
    });
  }

  render() {
    return html`
      <div class="dataDetail">
        ${Array(this.columnsRowCount)
          .fill(0)
          .map(
            (_, i) => html`
              <div class="grid-row" id="grid-row-${i + 1}">
                ${this.visibleColumns.map(column => {
                  return column[i] ? html`${this.renderCell(column[i])}` : '';
                })}
              </div>
              <div class="expandable" id="expandable-${i + 1}">
                ${this.visibleColumns.map(
                  column => html`
                    ${
                      column &&
                      column[i] &&
                      column[i].type === 'expandable' &&
                      column[i].contentExpanded
                        ? html`<wa-details
                            ?open=${this.openColumns.includes(column[i].field)}
                            data-field="${column[i].field}"
                          >
                            ${column[i].contentExpanded(this.data)}
                          </wa-details>`
                        : ''
                    }
                  `,
                )}
              </div>
            `,
          )}
      </div>
    `;
  }

  static styles = [
    contentFormatterStyles,
    css`
      .dataDetail {
        display: grid;
        align-items: center;
        /* grid-template-columns: auto 1fr auto 1fr; */
        grid-template-columns: repeat(2, min-content auto);
        width: fit-content;
      }
      .grid-row {
        display: contents;
      }
      .grid-cell {
        padding: 0.3em 0.5em 0.3em 0px;
      }
      .label {
        white-space: nowrap;
      }
      .expandable-label {
        padding: 0;
      }
      .value {
        padding-right: 3em;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .expandable {
        grid-column: 1 / -1; /* Row goes across all columns */
      }
      .expandable-label {
        cursor: pointer;
      }

      /* wa-button overrides */

      wa-button::part(base) {
        padding: 0 5px 0 0;
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
    `,
  ];
}
