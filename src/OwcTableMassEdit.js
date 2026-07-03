import { LitElement, html, css, nothing } from 'lit';
import { OwcAutocomplete } from './autocomplete/OwcAutocomplete.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { getFieldPathContent } from './field-path-helper/getFieldPathContent.js';

import '@awesome.me/webawesome/dist/components/radio/radio.js';
import '@awesome.me/webawesome/dist/components/radio-group/radio-group.js';
import { setFieldPath } from './field-path-helper/setFieldPath.js';

/**
 * @template {Record<string, unknown>} T
 */
export class OwcTableMassEdit extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'owc-autocomplete': OwcAutocomplete,
  };

  static properties = {
    columns: { type: Array },
    column: { type: Object },
    value: { type: Object },
    data: { type: Array },
    allData: { type: Array },
    table: { type: Object },
    preview: { type: Boolean },
    operation: { type: String },
  };

  constructor() {
    super();

    /**@type {import('./OwcTable.js').OwcTable<T> | undefined} */
    this.table = undefined;
    /** @type {Array<T>} */
    this.data = [];
    /** @type {Array<T>} */
    this.allData = [];
    /** @type {import('./OwcTable.types.js').Column<T>[]} */
    this.columns = [];
    this.column = undefined;
    /**@type {'SET' | 'ADD' | 'REMOVE'} */
    this.operation = 'SET';
    /**@type {any} */
    this.value = '';
    this.preview = false;

    /**@type {import('./OwcTable.js').OwcTable<T>['handleUpdate'] | undefined} */
    this.handleUpdateExecute = undefined;
    this.resetLastColumn = false;
  }

  /**
   * @param {import('lit').PropertyValues} changedProperties
   */
  update(changedProperties) {
    if (
      (changedProperties.has('preview') ||
        changedProperties.has('data') ||
        changedProperties.has('column') ||
        changedProperties.has('value') ||
        changedProperties.has('allData')) &&
      this.table
    ) {
      if (this.preview && this.column) {
        /**@type {Record<string, Partial<T>>} */
        const comparisonData = {};
        for (const data of this.allData) {
          if (this.data.includes(data)) {
            comparisonData[data.id?.toString() || ''] = /**@type {Partial<T>}*/ ({
              [this.column.field]: this.value,
            });
          }
        }
        this.table.compareOverrides = comparisonData;
        this.table.renderType = 'compare';
      } else {
        this.table.compareOverrides = undefined;
        this.table.renderType = 'html';
      }
    }
    super.update(changedProperties);
  }

  /**
   * @param {unknown | unknown[]} value
   */
  setColumn(value) {
    this.column = this.columns.find(elm => elm.field === value);
    if (!this.table || !this.column) {
      return;
    }
    if (this.table && this.column && !this.table.visibleColumns.includes(this.column)) {
      this.table.overrides.visibility[this.column.field] = 'always';
      this.table.requestUpdate('overrides');
      this.resetLastColumn = true;
    }
  }

  resetColumn() {
    if (!this.table || !this.column || !this.resetLastColumn) {
      return;
    }
    delete this.table.overrides.visibility[this.column.field];
    this.table.requestUpdate('overrides');
    this.resetLastColumn = false;
    this.column = undefined;
  }

  render() {
    const columnData = this.columns
      .filter(column => column.field && column.editableOptions?.massEdit)
      .map(column => ({
        label: column.labelString || column.label,
        value: column.field,
      }));
    return html`
      <owc-autocomplete
        .data=${columnData}
        .value=${this.column?.field}
        @change=${(/** @type {Event} */ ev) => {
          const target = /** @type {OwcAutocomplete<T>} */ (ev?.target);
          if (target.value) {
            this.value = '';
            this.resetColumn();
            this.setColumn(target.value);
          }
        }}
      ></owc-autocomplete>

      ${
        this.column
          ? html`
              ${this.#renderForm(this.column)}
              ${
                !this.preview
                  ? html`<wa-button
                      variant="brand"
                      @click=${() => {
                        this.preview = true;
                      }}
                      >Preview</wa-button
                    >`
                  : html`<wa-button
                        @click=${() => {
                          this.preview = false;
                        }}
                        >Abbrechen</wa-button
                      >
                      <wa-button @click=${this.executeEdit}
                        >${this.data?.length || 0} Änderungen durchführen</wa-button
                      >`
              }
            `
          : nothing
      }
    `;
  }

  get needChangeCount() {
    const column = this.columns.find(column => column.field === this.value.field);
    if (!column) {
      return 0;
    }
    let counter = 0;
    for (const row of this.data) {
      const value = getFieldPathContent(row, column);
      if (value !== this.value.value) {
        counter += 1;
      }
    }
    return counter;
  }

  /**
   *
   * @param {MouseEvent} event
   * @returns
   */
  executeEdit(event) {
    if (!this.column) {
      return;
    }
    const field = this.column.field;

    const handleUpdateTable = this.table?.handleUpdate;
    if (!handleUpdateTable) {
      if (this.handleUpdateExecute) {
        for (const selectedData of this.data) {
          this.handleUpdateExecute({
            field: field,
            data: selectedData,
            event,
            config: this.column,
            value: this.value,
            allRequiredFieldsAreFilled: () => true,
            isNewInsert: false,
            autoSetData: (data = selectedData) => setFieldPath(data, field, this.value),
          });
        }
      }
      return;
    }

    for (const selectedData of this.data) {
      handleUpdateTable({
        field: field,
        data: selectedData,
        event,
        config: this.column,
        value: this.value,
        allRequiredFieldsAreFilled: () => true,
        isNewInsert: false,
        autoSetData: (data = selectedData) => setFieldPath(data, field, this.value),
      });
    }

    this.preview = false;
    this.value = '';
  }

  /**
   *
   * @param {import('./OwcTable.types.js').Column<T>} column
   * @returns
   */
  #renderForm(column) {
    if (!column.editableOptions) {
      return nothing;
    }
    let clickEditableContent;
    // input
    if (column.editableOptions.type === 'textarea') {
      clickEditableContent = html`
        <wa-textarea
          @change=${(/** @type {{ target: any; }} */ ev) => {
            this.value = ev.target.value;
          }}
          .value=${this.value || ''}
        >
        </wa-textarea>
      `;
    } else if (column.editableOptions.type === 'autocomplete') {
      clickEditableContent = html`
        <owc-autocomplete
          .data=${column.editableOptions?.data}
          @change=${(/** @type {{ target: any; }} */ ev) => {
            this.value = ev.target.value;
          }}
          .value=${this.value || ''}
        >
        </owc-autocomplete>
      `;
    } else if (column.editableOptions.type === 'checkbox') {
      clickEditableContent = html`
        <wa-checkbox
          @change=${(/** @type {{ target: any; }} */ ev) => {
            this.value = ev.target.value;
          }}
          .value=${this.value || ''}
        >
        </wa-checkbox>
      `;
    } else {
      clickEditableContent = html`
        <wa-input
          @change=${(/** @type {{ target: any; }} */ ev) => {
            this.value = ev.target.value;
          }}
          .value=${this.value || ''}
        ></wa-input>
      `;
    }
    return clickEditableContent;
  }

  static styles = [
    css`
      :host {
        display: block;
      }
    `,
  ];
}
