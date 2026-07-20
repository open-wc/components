import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { LitElement, css, html, nothing } from 'lit';
import { map } from 'lit/directives/map.js';

import { OwcTableFilter } from './OwcTableFilter.js';
import { OwcSeparator } from '@open-wc/components/OwcSeparator.js';
import { classMap } from 'lit/directives/class-map.js';

import '@awesome.me/webawesome/dist/components/details/details.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import { globalSearchField } from './jsonToFilter.js';
import { OwcLocalizeController } from '@open-wc/components/localization.js';

/**
 * @template {Record<string, unknown>} T
 */
export class OwcTableFilterBuilder extends ScopedElementsMixin(LitElement) {
  #localize = new OwcLocalizeController(this);
  static scopedElements = {
    'owc-table-filter': OwcTableFilter,
    'owc-separator': OwcSeparator,
  };

  static properties = {
    value: { type: Array },
    columns: { type: Array },
    globalSearch: { type: Boolean, attribute: 'global-search', reflect: true },
    globalSearchOnly: { type: Boolean, attribute: 'global-search-only' },
    hideInfoDetail: { type: Boolean, attribute: 'hide-info-detail' },
  };

  constructor() {
    super();
    /** @type {import('./filter.type.js').NestedJsonFilters} */
    this.value = [];
    /** @type {import('./OwcTable.types.js').Column<T>[]} */
    this.columns = [];
    this.globalSearch = false;
    this.globalSearchOnly = false;
    this.hideInfoDetail = false;
  }

  #onlyRootAndFilters = false;

  /**
   * @param {import('lit').PropertyValues} changedProperties
   */
  update(changedProperties) {
    if (changedProperties.has('value')) {
      this.value = structuredClone(this.value);
      this.#onlyRootAndFilters = this.value.every(filter => !Array.isArray(filter));
    }
    if (
      (changedProperties.has('globalSearch') ||
        changedProperties.has('globalSearchOnly') ||
        changedProperties.has('value')) &&
      (this.globalSearch || this.globalSearchOnly) &&
      // @ts-ignore
      this.value[0]?.field !== globalSearchField
    ) {
      this.value = [
        {
          enabled: false,
          field: globalSearchField,
          operator: 'includes',
          value: '',
        },
        ...this.value,
      ];
    }
    super.update(changedProperties);
  }

  #fireChangeEvent() {
    this.dispatchEvent(new Event('change'));
  }

  renderGlobalSearch() {
    if (!this.globalSearch) {
      return nothing;
    }
    const globalSearch = /** @type {import('./filter.type.js').JsonFilter} */ (this.value[0]);

    return html`
      <wa-input
        class="global-search"
        @input=${(/** @type {InputEvent} */ ev) => {
          const target = /** @type {HTMLInputElement} */ (ev?.target);
          const value = target.value;
          this.value[0] = {
            ...globalSearch,
            value,
            enabled: !!value && value !== '',
          };

          this.#fireChangeEvent();
        }}
        .value=${globalSearch.value.toString() || ''}
        placeholder=${this.#localize.term('tableSearch')}
      >
        <wa-icon name="search" slot="start"></wa-icon>
      </wa-input>
    `;
  }

  /**
   * @param {import('./filter.type.js').NestedJsonFilters} filterList
   * @param {{ isOr?: boolean, root?: boolean, parentList?: import('./filter.type.js').NestedJsonFilters, parentListIndex?: number }} [options]
   * @returns {import('lit').TemplateResult}
   */
  renderFilterList(filterList, options = {}) {
    const { isOr = false, root = true, parentList, parentListIndex } = options;
    if (isOr) {
      return html`
        <div class="vertical">
          <owc-separator>${this.#localize.term('tableAnd')}</owc-separator>
          <div class="horizontal">
            ${map(filterList, (filter, index) => {
              if (Array.isArray(filter)) {
                return this.renderFilterList(filter, {
                  isOr: false,
                  root: false,
                  parentList: filterList,
                  parentListIndex: index,
                });
              }
              return this.renderExistingOr(filterList, index, {
                showSeparator: index !== 0,
                parentList,
                parentListIndex,
              });
            })}
            ${this.renderAdditionalOr(filterList)}
          </div>
        </div>
      `;
    }
    return html`
      <div
        class=${classMap({
          horizontal: !root,
          'horizontal-root': root,
          'only-root-and-filters': root && this.#onlyRootAndFilters,
          renderFilterList: true,
        })}
      >
        ${
          parentListIndex && parentListIndex > 0
            ? html`<owc-separator vertical>${this.#localize.term('tableOr')}</owc-separator>`
            : nothing
        }
        <div class="vertical">
          ${map(filterList, (filter, index) => {
            if (index === 0 && root && this.globalSearch) {
              return this.renderGlobalSearch();
            }
            if (Array.isArray(filter)) {
              return this.renderFilterList(filter, {
                isOr: true,
                root: false,
                parentList: filterList,
                parentListIndex: index,
              });
            }

            return this.renderExistingAnd(filterList, index, {
              parentList: parentList,
              parentListIndex: parentListIndex,
            });
          })}
          ${this.globalSearchOnly === false ? this.renderNewAnd(filterList) : nothing}
        </div>
      </div>
    `;
  }

  /**
   * @param {import('./filter.type.js').NestedJsonFilters} filterList
   * @param {number} index
   * @param {{ showSeparator?: boolean; parentList?: import('./filter.type.js').NestedJsonFilters, parentListIndex?: number }} [options]
   * @returns {import('lit').TemplateResult}
   */
  renderExistingOr(filterList, index, options = {}) {
    const { showSeparator = true, parentList, parentListIndex } = options;
    return html`
      ${showSeparator ? html`<owc-separator vertical>${this.#localize.term('tableOr')}</owc-separator>` : nothing}
      <div class="vertical renderExistingOr">
        <owc-table-filter
          type="or"
          .columns=${this.columns}
          .value=${filterList[index]}
          @change=${
            /** @param {Event} ev **/
            ev => {
              ev.stopPropagation();
              const filterEl = /** @type {OwcTableFilter<T>} */ (ev.target);
              filterList[index] = filterEl.value;
              this.requestUpdate();
              this.#fireChangeEvent();
            }
          }
          @delete=${() => {
            filterList.splice(index, 1);
            if (filterList.length <= 1 && parentList && parentListIndex !== undefined) {
              if (filterList.length === 0) {
                // remove the empty group instead of writing undefined into the parent
                parentList.splice(parentListIndex, 1);
              } else {
                parentList[parentListIndex] = filterList[0];
              }
            }
            this.requestUpdate();
            this.#fireChangeEvent();
          }}
        ></owc-table-filter>
        ${this.renderConvertingAnd(filterList, index)}
      </div>
    `;
  }

  /**
   * @param {import('./filter.type.js').NestedJsonFilters} filterList
   * @param {number} index
   * @param {{ parentList?: import('./filter.type.js').NestedJsonFilters, parentListIndex?: number }} [options]
   * @returns {import('lit').TemplateResult}
   */
  renderExistingAnd(filterList, index, options = {}) {
    const { parentList, parentListIndex } = options;
    return html`
      ${index !== 0 ? html`<owc-separator>${this.#localize.term('tableAnd')}</owc-separator>` : nothing}
      <div class="horizontal">
        <owc-table-filter
          .columns=${this.columns}
          .value=${filterList[index]}
          @change=${
            /** @param {Event} ev **/
            ev => {
              ev.stopPropagation();
              const filterEl = /** @type {OwcTableFilter<T>} */ (ev.target);
              filterList[index] = filterEl.value;
              this.requestUpdate();
              this.#fireChangeEvent();
            }
          }
          @delete=${() => {
            filterList.splice(index, 1);
            if (
              filterList.length <= 1 &&
              parentList &&
              parentList.length > 0 &&
              parentListIndex !== undefined
            ) {
              if (filterList.length === 0) {
                // remove the empty group instead of writing undefined into the parent
                parentList.splice(parentListIndex, 1);
              } else {
                parentList[parentListIndex] = filterList[0];
              }
            }
            this.requestUpdate();
            this.#fireChangeEvent();
          }}
        ></owc-table-filter>
        ${this.renderConvertingOr(filterList, index)}
      </div>
    `;
  }

  /**
   * @param {import('./filter.type.js').NestedJsonFilters} filterList
   * @returns {import('lit').TemplateResult}
   */
  renderAdditionalOr(filterList) {
    return html`
      <div class="horizontal separator-on-hover renderAdditionalOr">
        <owc-separator vertical>${this.#localize.term('tableOr')}</owc-separator>
        <div class="vertical">
          <owc-table-filter
            type="or"
            .columns=${this.columns}
            @change=${
              /** @param {Event} ev **/
              async ev => {
                ev.stopPropagation();
                const filterEl = /** @type {OwcTableFilter<T>} */ (ev.target);
                filterList.push(filterEl.value);
                filterEl.reset();
                this.requestUpdate();
                await this.updateComplete;
                this.#fireChangeEvent();
              }
            }
          ></owc-table-filter>
        </div>
      </div>
    `;
  }

  /**
   * @param {import('./filter.type.js').NestedJsonFilters} filterList
   * @param {number} index
   * @returns {import('lit').TemplateResult}
   */
  renderConvertingOr(filterList, index) {
    return html`
      <div class="horizontal separator-on-hover renderConvertingOr">
        <owc-separator vertical>${this.#localize.term('tableOr')}</owc-separator>
        <div class="vertical">
          <owc-table-filter
            type="or"
            .columns=${this.columns}
            @change=${
              /** @param {Event} ev **/
              ev => {
                ev.stopPropagation();
                const filterEl = /** @type {OwcTableFilter<T>} */ (ev.target);
                const currentFilter = filterList[index];
                filterList[index] = [currentFilter, filterEl.value];
                this.requestUpdate();
                this.#fireChangeEvent();
              }
            }
          ></owc-table-filter>
        </div>
      </div>
    `;
  }

  /**
   * @param {import('./filter.type.js').NestedJsonFilters} filterList
   * @returns {import('lit').TemplateResult}
   */
  renderNewAnd(filterList) {
    return html`
      <div class="separator-on-hover renderNewAnd">
        <owc-separator>${this.#localize.term('tableAnd')}</owc-separator>
        <div style="display: flex; gap: 3rem;">
          <div class="horizontal">
            <owc-table-filter
              .columns=${this.columns}
              @change=${
                /** @param {Event} ev **/
                async ev => {
                  ev.stopPropagation();
                  const filterEl = /** @type {OwcTableFilter<T>} */ (ev.target);
                  filterList.push(filterEl.value);
                  filterEl.reset();
                  this.requestUpdate();
                  await this.updateComplete;
                  this.#fireChangeEvent();
                  filterEl.focus();
                }
              }
            ></owc-table-filter>
          </div>
          ${!this.hideInfoDetail ? html`<div>${this.renderColumnInfoDetail()}</div>` : ''}
        </div>
      </div>
    `;
  }

  renderColumnInfoDetail() {
    if (this.columns.filter(col => col.description).length > 0) {
      return html`<wa-details class="custom-icons">
        <wa-icon name="book" slot="expand-icon"></wa-icon>
        <wa-icon name="x-circle" slot="collapse-icon"></wa-icon>
        <h2 class="reduced-margin">${this.#localize.term('tableFilterLexicon')}</h2>
        ${this.renderColumnInfoText(this.columns)}
      </wa-details> `;
    } else {
      return '';
    }
  }

  /**
   * @param {import('./OwcTable.types.js').Column<T>[]}  columns
   * @returns {string | import('lit').TemplateResult}
   */
  renderColumnInfoText(columns) {
    if (!columns) {
      return '';
    }

    let infoTemplate = html``;
    for (const column of columns) {
      infoTemplate = html`${infoTemplate}
      ${
        column.description
          ? html`<dt>${column.label}</dt>
              <dd>
                ${column.description}
                ${
                  column.subDescription
                    ? html`<wa-details class="custom-icons subDetail">
                        <slot id="subDetailSlot"></slot>
                        <wa-icon name="chevron-down" slot="expand-icon"></wa-icon>
                        <wa-icon name="chevron-left" slot="collapse-icon"></wa-icon>
                        >${column.subDescription}</wa-details
                      >`
                    : ''
                }
              </dd>`
          : ''
      } `;
    }
    return html`<dl class="filter-encyclopedia">${infoTemplate}</dl>`;
  }

  /**
   * @param {import('./filter.type.js').NestedJsonFilters} filterList
   * @param {number} index
   * @returns {import('lit').TemplateResult}
   */
  renderConvertingAnd(filterList, index) {
    return html`
      <div class="separator-on-hover renderConvertingAnd">
        <owc-separator>${this.#localize.term('tableAnd')}</owc-separator>
        <owc-table-filter
          .columns=${this.columns}
          @change=${
            /** @param {Event} ev **/
            ev => {
              ev.stopPropagation();
              const filterEl = /** @type {OwcTableFilter<T>} */ (ev.target);
              const currentFilter = filterList[index];
              filterList[index] = [currentFilter, filterEl.value];
              this.requestUpdate();
              this.#fireChangeEvent();
            }
          }
        ></owc-table-filter>
      </div>
    `;
  }

  render() {
    return this.renderFilterList(this.value);
  }

  static styles = [
    css`
      :host {
        display: inline-block;
      }

      .reduced-margin {
        margin: 0;
        padding: 0;
      }

      .subDetail {
        margin: 0;
        padding: 0;
        border: none;
      }

      .subDetail dl {
        margin: 0;
        padding: 0;
      }

      .detail-wrapper {
        justify-content: center;
      }

      .detail-wrapper:not(:has(dd)) {
        display: none;
      }

      .subDetail::part(base) {
        background: transparent;
        border: 0;
      }

      .subDetail::part(summary) {
        flex: 0 0 auto;
      }

      .subDetail::part(content) {
        padding-top: 0;
      }

      .subDetail > dd {
        margin-left: 0;
        padding-left: 1.1rem;
      }

      dl.filter-encyclopedia {
        background: #ffffff;
        font-size: 1.3rem;
        border-radius: 8px;
        padding: 20px;
        max-width: 600px;
        margin: auto;
      }

      dl.filter-encyclopedia dt {
        font-weight: bold;
        color: #14446c;
        margin-top: 10px;
        margin-bottom: 5px;
      }

      dl.filter-encyclopedia dd {
        margin: 0 0 15px 0;
        padding-left: 20px;
        color: #555;
      }

      dl.filter-encyclopedia dd:last-of-type {
        margin-bottom: 0;
      }

      dl.filter-encyclopedia dl {
        margin-left: 20px;
        padding-left: 10px;
        border-left: 3px solid #14446c;
        background: rgba(186, 230, 253, 0.1);
        border-radius: 4px;
        padding: 10px;
      }

      dl.filter-encyclopedia dl dt {
        font-weight: bold;
        color: #14446c;
      }

      dl.filter-encyclopedia dl dd {
        padding-left: 15px;
        color: #666;
      }

      .horizontal {
        display: flex;
        justify-content: center;
      }

      .only-root-and-filters .horizontal {
        justify-content: flex-start;
      }

      .horizontal-root {
        justify-content: flex-start;
      }

      .vertical {
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .separator-on-hover owc-separator {
        opacity: 0;
        transition: opacity 0.3s;
      }

      .separator-on-hover:hover owc-separator {
        opacity: 1;
      }

      .global-search {
        width: 300px;
      }
    `,
  ];
}
