import { LitElement, html, css, nothing } from 'lit';
import { OwcAutocomplete } from '@open-wc/components/OwcAutocomplete.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';

import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/checkbox/checkbox.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/textarea/textarea.js';
import { setFieldPath } from '../field-path-helper/setFieldPath.js';
import { OwcLocalizeController } from '@open-wc/components/localization.js';

/**
 * @template {Record<string, unknown>} T
 */
export class OwcTableMassEdit extends ScopedElementsMixin(LitElement) {
  #localize = new OwcLocalizeController(this);
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
    // compare by field: visibility-overridden columns are clones of the originals
    const isVisible = this.table.visibleColumns.some(col => col.field === this.column?.field);
    if (this.table && this.column && !isVisible) {
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
                      >${this.#localize.term('tablePreview')}</wa-button
                    >`
                  : html`<wa-button
                        @click=${() => {
                          this.preview = false;
                        }}
                        >${this.#localize.term('tableCancel')}</wa-button
                      >
                      <wa-button @click=${this.executeEdit}
                        >${this.#localize.term('tableApplyMassEdit', this.data?.length || 0)}</wa-button
                      >`
              }
            `
          : nothing
      }
    `;
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
    // Capture the value: this.value is reset below, but consumers may call
    // autoSetData later (e.g. after an async save)
    const value = this.value;

    const handleUpdate = this.table?.handleUpdate || this.handleUpdateExecute;
    if (handleUpdate) {
      for (const selectedData of this.data) {
        handleUpdate({
          field: field,
          data: selectedData,
          event,
          config: this.column,
          value,
          allRequiredFieldsAreFilled: () => true,
          isNewInsert: false,
          autoSetData: (data = selectedData) => setFieldPath(data, field, value),
        });
      }
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
            // a checkbox carries its state in "checked", "value" is the static form value
            this.value = ev.target.checked;
          }}
          ?checked=${this.value === true}
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
