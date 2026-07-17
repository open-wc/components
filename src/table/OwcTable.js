import { LitElement, css, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { until } from 'lit/directives/until.js';
import { virtualize, virtualizerRef } from '@lit-labs/virtualizer/virtualize.js';

import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { OwcTableHeaderCell } from './OwcTableHeaderCell.js';
import { jsonToFilter } from './jsonToFilter.js';

import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/checkbox/checkbox.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/badge/badge.js';
import { RowClickEvent } from './RowClickEvent.js';
import { OwcTableFilterBuilder } from '@open-wc/components/OwcTableFilterBuilder.js';
import {
  getFieldPathContent,
  contentFormatterStyles,
} from '../field-path-helper/getFieldPathContent.js';
import { copyAsCsv, downloadAsCsv } from '@open-wc/components/table/csv.js';
import { jsonToSorters } from './jsonToSorters.js';
import { globalSearchField } from './jsonToFilter.js';
import { copyAsExcel } from '@open-wc/components/table/excel.js';
import { filterFieldValue } from './filterFieldValue.js';
import { OwcTableInfo } from './OwcTableInfo.js';
import {
  OwcClickEditableAutocomplete,
  OwcClickEditableInput,
  OwcClickEditableTextarea,
} from '@open-wc/components/OwcClickEditable.js';
import { styleMap } from 'lit/directives/style-map.js';
import { dateParserForJsonDecode } from './dateParserForJsonDecode.js';
import { createTableLocalizer, tableTerm } from './localization.js';

// for smaller views do something like this
// https://github.com/zachleat/table-saw/

/**
 * @param {(...args: unknown[]) => void} func
 * @param {number} delay
 */
function throttle(func, delay = 300) {
  /** @type {NodeJS.Timeout | null} */
  let timer = null;

  /**
   * @param {unknown[]} args
   */
  return (...args) => {
    if (timer === null) {
      func(...args);
      timer = setTimeout(() => {
        timer = null;
      }, delay);
    }
  };
}

/**
 * Method to scroll into view port, if it's outside the viewport
 *
 * @param {Element} target - DOM Element
 * @returns {undefined}
 */
function scrollIntoViewIfNeeded(target) {
  if (target.getBoundingClientRect().bottom > window.innerHeight) {
    target.scrollIntoView({ block: 'end', inline: 'nearest' });
  }

  if (target.getBoundingClientRect().top < 0) {
    target.scrollIntoView({ block: 'start', inline: 'nearest' });
  }
}

/**
 * @template {Record<string, unknown>} T
 */
export class OwcTable extends ScopedElementsMixin(LitElement) {
  localize = createTableLocalizer(this);
  static scopedElements = {
    'owc-table-header-cell': OwcTableHeaderCell,
    'owc-table-filter-builder': OwcTableFilterBuilder,
    'owc-table-info': OwcTableInfo,
    'owc-click-editable-autocomplete': OwcClickEditableAutocomplete,
    'owc-click-editable-input': OwcClickEditableInput,
    'owc-click-editable-textarea': OwcClickEditableTextarea,
  };

  static properties = {
    loading: { type: Boolean, reflect: true },
    handleData: { type: Function, attribute: false },
    handleDataOptions: { type: Object, noAccessor: true },
    storeNamePrefix: { type: String, attribute: 'store-name-prefix' },
    data: { type: Array },
    visibleData: { type: Array },
    processedData: { type: Array },
    insertData: { type: Array },
    allData: { type: Array },
    compareOverrides: { type: Array },
    _renderType: { type: String },
    sorters: { type: Array },
    jsonSorters: { type: Array },
    filter: { type: Function, attribute: false },
    jsonFilters: { type: Array },
    highlightFilter: { type: Function, attribute: false },
    highlightJsonFilters: { type: Array },
    columns: { type: Array },
    selectable: { type: Boolean },
    filterMode: { type: String, reflect: true, attribute: 'filter-mode' },
    saveStateToUrl: { type: Boolean, attribute: 'save-state-to-url', reflect: true },
    stickyHeader: { type: Boolean, attribute: 'sticky-header', reflect: true },
    getRowLinkSettings: { attribute: false },
    emptyMessage: { type: Object },
    handleInsert: { type: Function },
    overrides: { type: Array, state: true },
    showInfo: { type: Boolean, attribute: 'show-info', reflect: true },
    _hasInfoBlock: { type: Boolean, attribute: '_has-info-block', reflect: true },
    actionTabs: { type: Object },
    actionTabActive: { type: String, attribute: 'action-tab-active' },
    renderMode: { type: String, attribute: 'render-mode' },
    renderDetail: { type: Function },
    openDetails: { type: Array },
    customStyles: { type: Object },
    currencyFormatter: { type: Object },
    dateFormatter: { type: Object },
    dateTimeFormatter: { type: Object },
    numberFormatter: { type: Object },
    percentFormatter: { type: Object },
    renderAnnotation: { type: Function },
    renderHeaderContent: { type: Function },
    virtualizerMode: { type: String, attribute: 'virtualizer-mode' },
  };

  #initialSetFilterFields = new Set();

  /**
   * @param {import('./OwcTable.types.js').HandleDataOptions} value
   */
  set handleDataOptions(value) {
    const old = { ...this._handleDataOptions };
    this._handleDataOptions = {
      ...this._handleDataOptions,
      ...value,
    };
    if (old?.debounceTime !== this._handleDataOptions.debounceTime) {
      this.#callHandleDataDebounced = debounce(
        ({ jsonFilters }) => this.callHandleData({ jsonFilters }),
        this._handleDataOptions.debounceTime,
      );
    }
    this.requestUpdate('handleDataOptions', old);
  }

  get handleDataOptions() {
    return this._handleDataOptions;
  }

  constructor() {
    super();
    this.loading = false;
    this.handleDataOptions = {
      mode: 'initiallyOnce',
      debounceTime: 500,
      refreshButton: true,
    };
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
    this.numberFormatter = new Intl.NumberFormat('de', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    });
    this.percentFormatter = new Intl.NumberFormat('de', {
      style: 'percent',
      maximumFractionDigits: 2,
    });

    this.handleDataUseCache = false;
    /** @type {((options?: {jsonFilters?:any}) => Promise<T[]>) | undefined} */
    this.handleData = undefined;
    this.storeNamePrefix = 'owc-table';
    /** @type {Array<T>} */
    this.data = [];
    /** @type {Array<T>} */
    this.processedData = [];
    /** @type {Array<T>} */
    this.insertData = [];
    /** @type {Array<T>} */
    this.allData = [];
    /** @type {Array<T>} */
    this.visibleData = [];
    /** @type {Record<string, Partial<T>> | undefined} */
    this.compareOverrides = undefined;
    this.customStyles = nothing;

    /** @type {import('lit').TemplateResult | undefined} */
    this.emptyMessage = undefined;
    this.showInfo = false;
    this._hasInfoBlock = false;
    this.saveStateToUrl = false;
    this.stickyHeader = false;

    /**@type {import('../field-path-helper/getFieldPathContent.types.js').getFieldPathContentOptions<T>['renderType']} */
    this._renderType = 'html';

    /**@type {((row: T) => string) | undefined}*/
    this.groupSelector = undefined;

    this.groupList =
      /**@type {{label: string, key: string, priority?: number, active?: boolean, backgroundColor?: string, textColor?: string}[]} */ ([]);

    this.othersGroupActive = false;

    /** @type {import('../tabs/OwcTabs.types.js').Tabs<import('./OwcTable.types.js').OwcTableActionTabsRenderOptions<T>> | undefined} */
    this.actionTabs = undefined;
    this.actionTabActive = '';
    /**
     * @param {T} _row
     * @returns {import('./OwcTable.types.js').RowLinkSettings}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.getRowLinkSettings = _row => ({ href: '' });
    /**
     * @param {T} _row
     * @returns {import('./OwcTable.types.js').SelectorSettings}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.getSelectorSettings = _row => ({});

    /** @type {import('./OwcTable.types.js').Sorter[]} */
    this.sorters = [];
    /** @type {import('./OwcTable.types.js').JsonSorter[]} */
    this.jsonSorters = [];
    /** @type {import('./filter.type.js').NestedJsonFilters} */
    this.jsonFilters = [];
    /** @type {import('./filter.type.js').NestedJsonFilters} */
    this.highlightJsonFilters = [];
    /** @type {import('./filter.type.js').Filter<unknown> | null} */
    this.filter = null;
    /** @type {import('./filter.type.js').Filter<unknown> | null} */
    this.highlightFilter = null;

    /** @type {import('./OwcTable.types.js').Column<T>[]} */
    this.columns = [];

    this.selectable = false;
    /** @type {'hidden' | 'global-search' | 'global-search-with-builder' | 'builder'} */
    this.filterMode = 'hidden';

    /** @param {T} row */
    this.getRowId = row => {
      if (row && (row.id === undefined || row.id === null)) {
        throw new Error(`row.id is undefined for row ${JSON.stringify(row)}`);
      }
      return row && row.id ? /** @type {string | number} */ (row.id) : undefined;
    };
    /** @type {(() => T) | undefined} */
    this.handleInsert = undefined;
    /** @type {import('./OwcTable.types.js').Overrides} */
    this.overrides = { visibility: {} };

    /** @type {import('../field-path-helper/getFieldPathContent.types.js').handleUpdate<T> | undefined} */
    this.handleUpdate = undefined;

    /** @type {import('./OwcTable.types.js').RenderMode} */
    this.renderMode = 'simple';

    /** @type {import('./OwcTable.types.js').renderDetail<T> | import('./OwcTable.types.js').renderDetailPromise<T>} */
    this.renderDetail = () => html``;

    /** @type {(string | number )[]} */
    this.openDetails = [];

    /** @type {Set<string | number>} */
    this.loadedDetailIdSet = new Set();

    /** @type {import('./OwcTable.types.js').RenderAnnotation<T>} */
    this.renderAnnotation = () => nothing;

    /** @type {import('./OwcTable.types.js').RenderHeaderContent} */
    this.renderHeaderContent = () => nothing;

    /** @type {'always' | 'never' | 'auto'} */
    this.virtualizerMode = 'auto';

    /** @type {number} */
    this.tableWidth = 0;
  }

  #selectedSet = new Set();
  /** @type {import('./OwcTable.types.js').Column<T>[]} */
  #visibleColumns = [];
  /** @type {Record<string, number>} */
  #columnWidths = {};

  get visibleColumns() {
    return [...this.#visibleColumns];
  }

  /**
   * Selection ids are stored as strings so they survive the url round-trip
   * (`save-state-to-url` serializes them as a comma separated string).
   * @param {T} row
   */
  #rowKey(row) {
    return String(this.getRowId(row));
  }

  get selectedData() {
    const data = [];
    for (const item of this.data) {
      if (this.#selectedSet.has(this.#rowKey(item))) {
        data.push(item);
      }
    }
    return data;
  }

  /**
   * @param {import('lit').PropertyValues} changedProperties
   */
  firstUpdated(changedProperties) {
    this.virtualizerHost?.addEventListener('rangeChanged', ev => {
      // @ts-ignore
      this.visibleData = this.allData.slice(ev.first, ev.last + 1);
    });

    const sortedColumns = new Set();
    for (const column of this.jsonSorters) {
      sortedColumns.add(column.field);
    }
    let defaultSorters = this.#visibleColumns
      .flatMap(column => column.sorter || [])
      .map(sorter => ({ order: /** @type {'asc' | 'desc'} */ ('asc'), ...sorter }));
    defaultSorters = defaultSorters.filter(sorter => !sortedColumns.has(sorter.field));
    this.jsonSorters = [...this.jsonSorters, ...defaultSorters];
    const columnElements = /** @type {NodeListOf<OwcTableHeaderCell>} */ (
      this.shadowRoot?.querySelectorAll('#data-table owc-table-header-cell')
    );
    this.#visibleColumns.forEach((column, index) => {
      if (!columnElements[index]) {
        return;
      }
      columnElements[index].order =
        this.jsonSorters.find(sorter => sorter.field === column.field)?.order || undefined;
    });
    super.firstUpdated(changedProperties);
  }

  /**
   * @param {import('lit').PropertyValues} changedProperties
   */
  update(changedProperties) {
    if (changedProperties.has('data')) {
      this.processedData = [...this.data];
      if (this.#hasDetailRows()) {
        this.#pruneLoadedDetails();
      }

      if (this.data.length > 0) {
        this.updateComplete.then(() => {
          setTimeout(() => {
            this.dispatchEvent(
              new Event('owc-table-data-ready', { bubbles: true, composed: true }),
            );
          }, 50);
        });
      }
    }
    if (changedProperties.has('jsonFilters')) {
      const filterableTextNumberFields = this.columns
        .filter(
          field =>
            field.filterable === true &&
            (field.filterType === 'text' ||
              field.filterType === 'number' ||
              field.filterType === undefined) &&
            !field.excludeGlobalSearch,
        )
        .filter(field => field.field !== undefined)
        .map(field => field.field || 'impossible');
      this.filter = jsonToFilter(this.jsonFilters, filterableTextNumberFields);
      if (this.handleDataOptions?.mode === 'anyFilterChange') {
        // @ts-ignore
        this.#executeHandleData(changedProperties.get('jsonFilters'));
      }
    }
    if (changedProperties.has('jsonSorters')) {
      this.sorters = this.jsonSorters.map(jsonToSorters);
    }
    if (changedProperties.has('highlightJsonFilters')) {
      this.highlightFilter = jsonToFilter(this.highlightJsonFilters);
    }
    if (changedProperties.has('openDetails')) {
      this.#markOpenDetailsAsLoaded();
    }
    if (
      changedProperties.has('filter') ||
      changedProperties.has('data') ||
      changedProperties.has('sorters') ||
      changedProperties.has('jsonSorters') ||
      changedProperties.has('jsonFilters') ||
      changedProperties.has('columns')
    ) {
      this.#applyFilters();
      this.#applySorters();
      this.recalculateColumnWidths();
    }
    if (changedProperties.has('overrides')) {
      this.recalculateColumnWidths();
    }
    if (changedProperties.has('actionTabActive')) {
      this.#saveStateToUrl();
    }
    if (
      changedProperties.has('columns') ||
      changedProperties.has('jsonFilters') ||
      changedProperties.has('overrides')
    ) {
      let columns = this.columns;
      if (this.overrides.order) {
        columns = [];
        for (const field of this.overrides.order) {
          const column = this.columns.find(c => c.field === field);
          if (column) {
            columns.push(column);
          }
        }
      }
      this.#visibleColumns = columns
        .map(column => {
          const override = this.overrides.visibility[column.field];
          if (override) {
            const vis = override;
            return { ...column, ...{ visible: vis } };
          }
          return column;
        })
        .filter(
          column =>
            column.visible === undefined ||
            column.visible === 'always' ||
            (column.visible === 'ifFiltered' &&
              column.field &&
              this.filteredFields.includes(column.field)),
        );
      if (this.selectable) {
        this.addSelectableColumn();
      }
      if (this.renderMode === 'linkWithDetail') {
        this.addDetailsColumn();
      }
      for (const column of this.#visibleColumns) {
        const width = this.#columnWidths[column.field];
        if (width != null) {
          column.width = width;
        }
      }
    }
    if (changedProperties.has('filter')) {
      if (this.filterMode === 'global-search-with-builder' || this.filterMode === 'global-search') {
        if (this.jsonFilters.length === 0) {
          this.#addGlobalSearchJsonFilter();
        }
      }
    }

    if (
      changedProperties.has('processedData') ||
      changedProperties.has('data') ||
      changedProperties.has('insertData')
    ) {
      this.allData = [...this.processedData, ...this.insertData];
    }
    if (
      changedProperties.has('showInfo') ||
      changedProperties.has('actionTabs') ||
      changedProperties.has('handleInsert') ||
      changedProperties.has('handleData')
    ) {
      this._hasInfoBlock = Boolean(
        this.showInfo ||
        this.actionTabs !== undefined ||
        this.handleInsert !== undefined ||
        (this.handleData !== undefined && this.handleDataOptions.refreshButton),
      );
    }
    super.update(changedProperties);
  }

  /**
   *
   * @param {import('./filter.type.js').NestedJsonFilters} filters
   * @param {string} prefix
   * @returns {string[]}
   */
  filteredFieldsRec(filters, prefix) {
    const arr = [];
    for (const filter of filters) {
      if (Array.isArray(filter)) {
        arr.push(...this.filteredFieldsRec(filter, prefix));
      } else if (filter.enabled === false) {
        // paused filters should not keep 'ifFiltered' columns visible
        continue;
      } else if (filter.operator === 'some' || filter.operator === 'every') {
        // @ts-ignore
        arr.push(...this.filteredFieldsRec(filter.value, prefix + filter.field + '[].'));
      } else {
        arr.push(prefix + filter.field);
      }
    }
    return arr;
  }

  get filteredFields() {
    return this.filteredFieldsRec(this.jsonFilters, '');
  }

  #applyFilters() {
    if (this.filter !== null) {
      this.processedData = this.data.filter(this.filter);
    } else {
      this.processedData = [...this.data];
    }
    this.#saveStateToUrl();
  }

  /**
   * @param {{ jsonFilters?: import('./filter.type.js').NestedJsonFilters }} [options]
   */
  callHandleData = async ({ jsonFilters = this.jsonFilters } = {}) => {
    this.loading = true;
    try {
      this.data = (await this.handleData?.({ jsonFilters })) ?? [];
    } finally {
      this.loading = false;
    }
  };

  #callHandleDataDebounced = debounce(({ jsonFilters }) => {
    this.callHandleData({ jsonFilters });
  }, 500);

  /**
   *
   * @param {import('./filter.type.js').NestedJsonFilters} [oldFilters]
   */
  async #executeHandleData(oldFilters) {
    if (this.handleDataUseCache === false && typeof this.handleData === 'function') {
      const condition = this.handleDataOptions.condition;
      const shouldExecute =
        typeof condition === 'undefined' ||
        (typeof condition === 'function' &&
          condition({ jsonFilters: this.jsonFilters, oldFilters }));

      if (shouldExecute && typeof this.handleData === 'function') {
        if (
          this.handleDataOptions.mode === 'anyFilterChange' &&
          this.handleDataOptions.debounceTime > 0
        ) {
          this.#callHandleDataDebounced({ jsonFilters: this.jsonFilters });
        } else {
          this.callHandleData({ jsonFilters: this.jsonFilters });
        }
      }
    }
  }

  async handleInitialData() {
    if (this.handleDataOptions.mode === 'initiallyOnce') {
      await this.#executeHandleData();
      this.handleDataUseCache = true;
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.handleInitialData();
    this.loadStateFromUrl();
  }

  loadStateFromUrl() {
    const currentUrl = new URL(location.href);
    const currentFilterState = currentUrl.searchParams.get(`${this.storeNamePrefix}-filter`);
    if (currentFilterState) {
      try {
        const parsedFilterState = JSON.parse(currentFilterState, dateParserForJsonDecode);
        this.jsonFilters = parsedFilterState;
        this.#initialSetFilterFields = this.getUsedFilterFieldNames();
      } catch (e) {
        // can't parse state => do nothing
      }
    }

    const currentHighlightFilterState = currentUrl.searchParams.get(
      `${this.storeNamePrefix}-highlight-filter`,
    );
    if (currentHighlightFilterState) {
      try {
        const parsedFilterState = JSON.parse(currentHighlightFilterState);
        this.highlightJsonFilters = parsedFilterState;
      } catch (e) {
        // can't parse state => do nothing
      }
    }

    const currentSorterState = currentUrl.searchParams.get(`${this.storeNamePrefix}-sorter`);
    if (currentSorterState) {
      try {
        const parsedSorterState = JSON.parse(currentSorterState);
        this.jsonSorters = parsedSorterState;
        this.sorters = parsedSorterState.map(jsonToSorters);
      } catch (e) {
        // can't parse state => do nothing
      }
    }

    const currentSelectedState = currentUrl.searchParams.get(`${this.storeNamePrefix}-selected`);
    if (currentSelectedState) {
      const parsedSelectedState = currentSelectedState.split(',');
      for (const id of parsedSelectedState) {
        // ids are stored as strings in the url; getRowId values are stringified
        // on write so the set contents stay comparable
        this.#selectedSet.add(id);
      }
    }

    const currentOverridesState = currentUrl.searchParams.get(`${this.storeNamePrefix}-overrides`);
    if (currentOverridesState) {
      try {
        const parsedOverridesState = JSON.parse(currentOverridesState);
        this.overrides = parsedOverridesState;
      } catch (e) {
        // can't parse state => do nothing
      }
    }

    const currentActionTabActiveState = currentUrl.searchParams.get(
      `${this.storeNamePrefix}-action-tab-active`,
    );
    if (currentActionTabActiveState) {
      this.actionTabActive = currentActionTabActiveState;
    }
    const currentColumnState = currentUrl.searchParams.get(`${this.storeNamePrefix}-columns`);
    if (currentColumnState) {
      try {
        this.#columnWidths = JSON.parse(currentColumnState);
        // #columnWidths is a plain private field, not a reactive property, so mutating it
        // alone won't cause update() to re-run the block that copies these widths onto
        // #visibleColumns. Force it, so restored widths are actually applied — and so this
        // keeps working if loadStateFromUrl() is ever called again later (e.g. on popstate).
        this.requestUpdate('columns', undefined);
      } catch (e) {
        // can't parse state => do nothing
      }
    }
  }

  #saveStateToUrl() {
    if (this.saveStateToUrl === false) {
      return;
    }
    /** @type {boolean} */
    let needsUpdate = false;
    const newUrl = new URL(location.href);

    /**
     * Sets the param when there is a value and removes it when the state is
     * empty again, so cleared filters/sorters don't resurrect on reload.
     * @param {string} name
     * @param {string} value
     */
    const setOrDeleteParam = (name, value) => {
      if (value) {
        if (newUrl.searchParams.get(name) !== value) {
          newUrl.searchParams.set(name, value);
          needsUpdate = true;
        }
      } else if (newUrl.searchParams.has(name)) {
        newUrl.searchParams.delete(name);
        needsUpdate = true;
      }
    };

    setOrDeleteParam(
      `${this.storeNamePrefix}-filter`,
      this.jsonFilters.length > 0 ? JSON.stringify(this.jsonFilters) : '',
    );
    setOrDeleteParam(
      `${this.storeNamePrefix}-highlight-filter`,
      this.highlightJsonFilters.length > 0 ? JSON.stringify(this.highlightJsonFilters) : '',
    );
    setOrDeleteParam(
      `${this.storeNamePrefix}-sorter`,
      this.jsonSorters.length > 0 ? JSON.stringify(this.jsonSorters) : '',
    );
    setOrDeleteParam(
      `${this.storeNamePrefix}-selected`,
      Array.from(this.#selectedSet.values()).join(','),
    );
    setOrDeleteParam(`${this.storeNamePrefix}-action-tab-active`, this.actionTabActive);

    setOrDeleteParam(
      `${this.storeNamePrefix}-columns`,
      Object.keys(this.#columnWidths).length > 0 ? JSON.stringify(this.#columnWidths) : '',
    );

    if (needsUpdate) {
      history.replaceState({}, '', newUrl);
    }
  }

  /**
   *
   * @param {((a: any, b: any) => number)[]} sorters
   * @returns {((a: any, b: any) => number)}
   */
  iterativeSorter(sorters) {
    return (a, b) => {
      for (let i = 0; i < sorters.length; i++) {
        const result = sorters[i](a, b);
        if (result !== 0) {
          return result;
        }
      }
      return 0;
    };
  }

  #applySorters() {
    if (this.sorters?.length > 0 && this.processedData?.length > 0) {
      this.processedData.sort(this.iterativeSorter(this.sorters));
    }
  }

  #updateColumnCssVariables() {
    let tableWidth = 0;
    const gridTemplateColumns = this.#visibleColumns
      .map(column => {
        // same 50px floor the old `.cell { min-width: 50px }` used to enforce
        const width = Math.max(50, column.width ?? column._calculatedWidth ?? 50);
        tableWidth += width;
        return `${width}px`;
      })
      .join(' ');

    this.#saveStateToUrl();

    this.style.setProperty('--owc-table-width', `${tableWidth}px`);
    this.style.setProperty('--owc-table-grid-template-columns', gridTemplateColumns || 'none');
  }

  #addGlobalSearchJsonFilter() {
    // reassign instead of unshift so Lit sees the change
    this.jsonFilters = [
      {
        field: globalSearchField,
        operator: 'includes',
        value: '',
        enabled: false,
      },
      ...this.jsonFilters,
    ];
  }

  /**
   * @param {Event} ev
   */
  #filterChanged(ev) {
    const typedTarget = /** @type {OwcTableFilterBuilder<T>} */ (ev.target);
    this.jsonFilters = [...typedTarget.value];
  }

  render() {
    return html`
      <style>
        ${this.renderSizeTableColumnStyles()}
        ${this.customStyles}
      </style>
      <div id="size-table-wrapper">${this.#renderSizeTable()}</div>

      <div id="header">
        ${
          this.filterMode !== 'hidden'
            ? html`
                <owc-table-filter-builder
                  @change=${this.#filterChanged}
                  .columns=${this.columns.filter(column => column.filterable)}
                  .value=${this.jsonFilters}
                  ?global-search=${
                    this.filterMode === 'global-search-with-builder' ||
                    this.filterMode === 'global-search'
                  }
                  ?global-search-only=${this.filterMode === 'global-search'}
                ></owc-table-filter-builder>
                <br />
              `
            : nothing
        }
        ${
          typeof this.renderHeaderContent === 'function'
            ? this.renderHeaderContent({
                dateFormatter: this.dateFormatter,
                dateTimeFormatter: this.dateTimeFormatter,
                currencyFormatter: this.currencyFormatter,
                numberFormatter: this.numberFormatter,
                percentFormatter: this.percentFormatter,
              })
            : nothing
        }
      </div>
      ${
        this._hasInfoBlock
          ? html`
              <div id="info-outer-wrapper">
                <div id="info-wrapper">
                  ${
                    this.handleInsert
                      ? html`<wa-button
                          size="s"
                          variant="brand"
                          @click=${async () => {
                            if (this.handleInsert) {
                              this.insertData = [...this.insertData, this.handleInsert()];
                              setTimeout(async () => {
                                await this.updateComplete;
                                const editableElement = /** @type {HTMLInputElement} */ (
                                  this.shadowRoot?.querySelector('[editable]')
                                );
                                if (editableElement) {
                                  scrollIntoViewIfNeeded(editableElement);
                                  // @ts-ignore
                                  if (
                                    editableElement.focus &&
                                    typeof editableElement.focus === 'function'
                                  ) {
                                    // @ts-ignore
                                    editableElement.focus();
                                  }
                                }
                              }, 100);
                            }
                          }}
                        >
                          <wa-icon
                            slot="start"
                            name="plus"
                            label=${tableTerm(this.localize, 'tableNew')}
                          ></wa-icon
                          >${tableTerm(this.localize, 'tableNew')}
                        </wa-button>`
                      : nothing
                  }
                  <owc-table-info
                    .table=${this}
                    .columns=${this.columns}
                    .dataFullSize=${this.data.length}
                    .dataCurrentSize=${this.processedData?.length || 0}
                    .dataSelectedSize=${this.#selectedSet.size}
                    .actionTabs=${this.actionTabs}
                    .actionTabActive=${this.actionTabActive}
                    .getRenderOptions=${() => ({
                      selectedData: this.selectedData,
                      processedData: this.processedData,
                      columns: this.columns,
                      // formatters
                      dateFormatter: this.dateFormatter,
                      dateTimeFormatter: this.dateTimeFormatter,
                      currencyFormatter: this.currencyFormatter,
                      numberFormatter: this.numberFormatter,
                      percentFormatter: this.percentFormatter,
                    })}
                    .loading=${this.loading}
                    .showInfo=${this.showInfo}
                    .refreshButton=${
                      this.handleData !== undefined && this.handleDataOptions.refreshButton
                    }
                    @action-tab-active-changed=${this.#actionTabActiveChanged}
                    @refresh-button-clicked=${this.#handleRefreshButtonClick}
                  ></owc-table-info>
                </div>
              </div>
            `
          : nothing
      }
      <div @sort-changed=${this.#sortChanged}>${this.#renderDataTable()}</div>
    `;
  }

  async #handleRefreshButtonClick() {
    this.handleDataUseCache = false;
    await this.#executeHandleData();
    this.handleDataUseCache = true;
  }

  /**
   * @param {Event} ev
   */
  #actionTabActiveChanged(ev) {
    const typedTarget = /** @type {import('./OwcTableInfo.js').OwcTableInfo<T>} */ (ev.target);
    this.actionTabActive = typedTarget.actionTabActive;
  }

  /**
   * @param {Event} ev
   */
  #sortChanged(ev) {
    const { target } = ev;
    const targetTyped = /** @type {import('./OwcTableHeaderCell.js').OwcTableHeaderCell}} */ (
      target
    );

    this.shadowRoot?.querySelectorAll('#data-table [data-sorter]').forEach(cell => {
      const cellTyped = /** @type {import('./OwcTableHeaderCell.js').OwcTableHeaderCell} */ (cell);
      if (cellTyped !== targetTyped) {
        cellTyped.order = undefined;
      }
    });
    if (targetTyped.sorters) {
      this.jsonSorters = targetTyped.sorters;
      this.sorters = this.jsonSorters.map(jsonToSorters);
    }
    this.#applySorters();
  }

  /**
   * @param {{items: T[], renderItem: (item: T, index: number) => import('lit').TemplateResult}} options
   * @returns
   */
  #renderList({ items, renderItem }) {
    const shouldUseVirtualizer =
      this.virtualizerMode === 'always' || (this.virtualizerMode === 'auto' && items.length >= 300);

    if (shouldUseVirtualizer) {
      return html`${virtualize({ items, renderItem })}`;
    }

    return html`${items.map(renderItem)}`;
  }

  #renderDataTable() {
    return html`
      <div
        class="table"
        id="data-table"
        @click=${this.#handleTableClick}
        @mousedown=${this.#handleTableMouseDown}
      >
        <div class="table-header">${this.#renderHeader()}</div>
        <div class="table-body">
          ${
            this.allData && this.allData.length > 0
              ? this.groupList?.length > 0 && this.groupSelector
                ? html`${this.#renderGroups()}`
                : html`<div id="virtualize-container">
                    ${this.#renderList({
                      items: this.allData,
                      renderItem: this.#renderItem,
                    })}
                  </div>`
              : html`<div id="empty-message-wrapper">
                  ${this.emptyMessage || html`<p>${tableTerm(this.localize, 'tableEmptyMessage')}</p>`}
                </div>`
          }
          <div id="loading-indicator">
            <wa-spinner></wa-spinner>
          </div>
        </div>
      </div>
    `;
  }

  #renderGroups() {
    if (!this.groupSelector) {
      return ``;
    }
    /**@type {Set<string>} */
    const groupKeyRecord = new Set(this.groupList.map(elm => elm.key));
    /**@type {Record<string, T[]>} */
    const groupRecord = { others: [] };
    for (const item of this.allData) {
      const groupName = this.groupSelector(item);
      if (!groupKeyRecord.has(groupName)) {
        groupRecord['others'].push(item);
        continue;
      }
      if (!groupRecord[groupName]) {
        groupRecord[groupName] = [item];
      } else {
        groupRecord[groupName].push(item);
      }
    }

    const groupListSorted = [
      ...[...this.groupList].sort((a, b) => (b?.priority || 0) - (a?.priority || 0)),
    ];
    if (groupRecord['others'].length > 0) {
      groupListSorted.push({
        key: 'others',
        label: tableTerm(this.localize, 'tableOthers'),
        active: this.othersGroupActive,
      });
    }

    // TODO: This does not work due to the hacky nature of row styling
    return html`
      ${groupListSorted.map(
        (group, groupIndex) => html`
          <div
            style=${styleMap({ backgroundColor: group.backgroundColor })}
            class="group-label-container ${group.active ? 'active' : ''} data-container  ${
              !group.active && groupIndex === groupListSorted.length - 1 ? 'last-row' : ''
            }"
          >
            <div
              class="row-click"
              @click=${() => {
                if (group.key === 'others') {
                  this.othersGroupActive = !this.othersGroupActive;
                } else {
                  group.active = !group.active;
                }
                this.requestUpdate('groupList');
              }}
            ></div>
            <span class="group-label" style=${styleMap({ color: group.textColor })}
              >${group.label}
              <wa-badge variant="neutral" pill>${(groupRecord[group.key] || []).length}</wa-badge>
              <wa-icon name=${group.active ? 'chevron-down' : 'chevron-right'}></wa-icon
            ></span>
          </div>
          ${
            group.active
              ? html`<div class="group-rows-container data-container">
                  ${this.#renderList({
                    items: groupRecord[group.key] || [],
                    renderItem: (item, index) => {
                      return this.#renderItem(item, index, {
                        setLast: groupIndex === groupListSorted.length - 1,
                        lastIndex: (groupRecord[group.key] || []).length - 1,
                      });
                    },
                  })}
                </div>`
              : html`<div class="group-rows-container"></div>`
          }
        `,
      )}
    `;
  }

  renderSizeTableColumnStyles() {
    return html`
      ${this.#visibleColumns.map((column, index) =>
        column.width
          ? html`#size-table .row > .cell:nth-child(${index + 2}) { width: ${column.width}px; }`
          : nothing,
      )}
    `;
  }

  #renderSizeTable() {
    return html`
      <div class="table" id="size-table">
        <div class="table-header">${this.#renderHeader()}</div>
        <div class="table-body">
          ${
            this.sizeData && this.sizeData.length > 0
              ? this.sizeData.map((row, index) =>
                  this.#renderItem(row, index, { mode: 'size-table' }),
                )
              : nothing
          }
        </div>
      </div>
    `;
  }

  #renderHeader() {
    return html`
      <div class="row">
        <span class="row-click"></span>
        ${this.#visibleColumns.map(
          (column, index) => html`
            <div class="cell">
              <div class="cell-content">
                <owc-table-header-cell
                  style="--owc-table-header-cell-align: ${column.align}"
                  .field=${column.field}
                  data-sorter
                  .sortable=${column.formatter !== 'rownum' ? (column.headerSort !== undefined ? column.headerSort : true) : false}
                  .customSorters=${column.sorter}
                >
                  ${typeof column.label === 'function' ? column.label() : column.label}
                </owc-table-header-cell>
              </div>
              ${
                column.resizable === undefined || column.resizable === true
                  ? html`<span class="cell-resize" data-visible-column-index=${index} @dblclick=${this.#resetColumnWidth} ></span></span>`
                  : nothing
              }
            </div>
          `,
        )}
      </div>
    `;
  }

  /**
   *
   * @param {Event} ev
   * @returns {void}
   */
  #resetColumnWidth(ev) {
    ev.stopPropagation();

    const target = /** @type {HTMLElement} */ (ev.currentTarget);

    const index = Number(target.dataset.visibleColumnIndex);

    const column = this.#visibleColumns[index];

    if (!column) {
      return;
    }

    // remove manual override
    delete column.width;
    delete this.#columnWidths[column.field];

    this.#saveStateToUrl();

    this.recalculateColumnWidths();
  }

  /**
   *
   * @param {T} row
   */
  #shouldBeHighlighted(row) {
    if (this.highlightFilter === null || this.highlightJsonFilters.length === 0) {
      return false;
    }
    return this.highlightFilter(row);
  }

  /**
   *
   * @param {T} row
   * @returns {import('lit').TemplateResult}
   */
  renderRowMode(row) {
    if (this.renderMode === 'link' || this.renderMode === 'linkWithDetail') {
      const rowLinkSettings =
        row && this.getRowLinkSettings ? this.getRowLinkSettings(row) : undefined;
      if (rowLinkSettings) {
        return html`<a
          href=${rowLinkSettings.href}
          aria-label=${ifDefined(rowLinkSettings['aria-label'])}
          class="row-click"
        ></a>`;
      }
    }

    if (this.renderMode === 'detail' || this.renderMode === 'detailDeferred') {
      return html`<div
        class="row-click"
        @click=${(/** @type {Event} */ ev) => this.#handleDetailsClick(ev, row)}
      ></div>`;
    }

    return html`<div class="row-no-click"></div>`;
  }

  /**
   *
   * @param {Event} ev
   * @param {T} row
   */
  #handleDetailsClick(ev, row) {
    const rowId = this.getRowId(row);
    if (rowId) {
      if (this.openDetails?.includes(rowId)) {
        this.openDetails = this.openDetails.filter(id => id !== rowId);
      } else {
        this.loadedDetailIdSet.add(rowId);
        this.openDetails = [rowId];
      }
    }
  }

  #markOpenDetailsAsLoaded() {
    for (const rowId of this.openDetails || []) {
      this.loadedDetailIdSet.add(rowId);
    }
  }

  #pruneLoadedDetails() {
    /** @type {Set<string | number>} */
    const currentRowIdSet = new Set();
    for (const row of this.data) {
      const rowId = this.getRowId(row);
      if (rowId !== undefined) {
        currentRowIdSet.add(rowId);
      }
    }

    for (const rowId of this.loadedDetailIdSet) {
      if (!currentRowIdSet.has(rowId)) {
        this.loadedDetailIdSet.delete(rowId);
      }
    }
  }

  #hasDetailRows() {
    return (
      this.renderMode === 'detail' ||
      this.renderMode === 'detailDeferred' ||
      this.renderMode === 'linkWithDetail'
    );
  }

  /**
   * @param {string | number} rowId
   */
  #shouldRenderDetail(rowId) {
    return (
      this.renderMode === 'detail' ||
      this.openDetails?.includes(rowId) ||
      this.loadedDetailIdSet.has(rowId)
    );
  }

  /**
   * @param {T} row
   * @param {number} index
   * @param {{mode?: "size-table" | "data-table", setLast?: boolean, lastIndex?: number}} [options]
   * @returns {import('lit').TemplateResult}
   */
  #renderItem = (
    row,
    index,
    { mode = 'data-table', setLast = true, lastIndex = this.allData.length - 1 } = {},
  ) => {
    const annotationContent =
      this.renderAnnotation(row) === nothing
        ? nothing
        : html`<div class="row-annotation">${this.renderAnnotation(row)}</div>`;
    const rawRowContent = html`
      <div class=${this.#shouldBeHighlighted(row) ? 'row highlighted' : 'row'} data-index=${index}>
        ${this.renderRowMode(row)}
        ${this.#visibleColumns.map(column => {
          return getFieldPathContent(row, column, {
            renderType: this._renderType,
            requiredFields:
              column.type === 'editable'
                ? this.#visibleColumns
                    .filter(col => col.editableOptions?.required)
                    .map(col => col.field)
                : [],
            render: ({ config, content }) => {
              if (config.type === 'editable') {
                return html`<div class="cell ${column.cellClass}">
                  <div class="cell-content ${'align-' + (column.align || 'start')}">
                    <span class="cell-text"> ${content}</span>
                  </div>
                </div>`;
              }
              return html`
                <div class="cell ${column.cellClass}">
                  <div class="cell-content ${'align-' + (column.align || 'start')}">
                    ${
                      column.align === 'full'
                        ? html`<div class="cell-full">${content}</div>`
                        : html`<span class="cell-text"> ${content} </span>`
                    }
                  </div>
                </div>
              `;
            },
            isInsert: this.isInsert.bind(this),
            handleUpdate: this.handleUpdate,
            renderInitiallyAsEditableCondition: ({ data }) => this.isInsert({ data }),
            additionalFormatterOptions: ({ data, config }) => ({
              fieldValueFiltered: config.field
                ? filterFieldValue(
                    data,
                    config.field,
                    config.fieldFilteredReturn || config.field,
                    this.jsonFilters,
                    this.jsonSorters,
                  )
                : [],
            }),
            additionalFormatter: (_data, { config, content, custom }) => {
              if (config.formatter === 'rownum') {
                const index = /** @type {number} */ (custom?.index || 0);
                return `${index + 1}`;
              }
              return content;
            },
            custom: { index, jsonFilters: this.jsonFilters },
            compareOverrides: this.compareOverrides,
            dateFormatter: this.dateFormatter,
            dateTimeFormatter: this.dateTimeFormatter,
            currencyFormatter: this.currencyFormatter,
            numberFormatter: this.numberFormatter,
            percentFormatter: this.percentFormatter,
          });
        })}
      </div>
    `;
    const rowId = this.getRowId(row);
    const rowDetail =
      mode === 'data-table' &&
      (this.renderMode === 'detail' ||
        this.renderMode === 'detailDeferred' ||
        this.renderMode === 'linkWithDetail') &&
      rowId
        ? html`
            <wa-details
              summary=${tableTerm(this.localize, 'tableOpenDetails')}
              ?open=${this.openDetails?.includes(rowId)}
              @wa-after-show=${this.handleDetailsOpen}
            >
              ${
                this.#shouldRenderDetail(rowId)
                  ? until(
                      Promise.resolve(
                        this.renderDetail(row, {
                          jsonFilters: this.jsonFilters,
                          closeDetail: () => {
                            this.openDetails = this.openDetails.filter(elm => elm !== rowId);
                          },
                        }),
                      ),
                      html`<div
                        style="display: flex; justify-content: center; align-items: center; min-height: 100px;"
                      >
                        <wa-spinner></wa-spinner>
                      </div>`,
                    )
                  : nothing
              }
            </wa-details>
          `
        : nothing;
    return mode === 'data-table'
      ? html`<div class="row-container ${setLast && index === lastIndex ? 'last-row' : ''}">
          ${annotationContent}${rawRowContent}${rowDetail}
        </div>`
      : rawRowContent;
  };

  /**
   * @param {Event} ev
   */
  handleDetailsOpen(ev) {
    if (ev.target !== ev.currentTarget) {
      return;
    }
    // @ts-ignore
    const parentElement = ev.target?.parentElement;
    setTimeout(() => parentElement?.scrollIntoView({ block: 'start' }), 5);
  }

  copyAsCsv() {
    return copyAsCsv(this.selectedData.length > 0 ? this.selectedData : this.processedData, {
      visibleColumns: this.#visibleColumns,
      jsonFilters: this.jsonFilters,
      dateFormatter: this.dateFormatter,
      dateTimeFormatter: this.dateTimeFormatter,
      currencyFormatter: this.currencyFormatter,
      numberFormatter: this.numberFormatter,
      percentFormatter: this.percentFormatter,
    });
  }

  downloadAsCsv() {
    downloadAsCsv(this.selectedData.length > 0 ? this.selectedData : this.processedData, {
      visibleColumns: this.#visibleColumns,
      jsonFilters: this.jsonFilters,
      dateFormatter: this.dateFormatter,
      dateTimeFormatter: this.dateTimeFormatter,
      currencyFormatter: this.currencyFormatter,
      numberFormatter: this.numberFormatter,
      percentFormatter: this.percentFormatter,
    });
  }

  copyAsExcel() {
    return copyAsExcel(this.selectedData.length > 0 ? this.selectedData : this.processedData, {
      visibleColumns: this.#visibleColumns,
      jsonFilters: this.jsonFilters,
      dateFormatter: this.dateFormatter,
      dateTimeFormatter: this.dateTimeFormatter,
      currencyFormatter: this.currencyFormatter,
      numberFormatter: this.numberFormatter,
      percentFormatter: this.percentFormatter,
    });
  }

  /**
   * @param {MouseEvent} ev
   */
  #handleTableClick(ev) {
    let index;
    let checkbox;
    let cell;
    let clickArea = 'row';
    for (const el of ev.composedPath()) {
      const typedEl = /** @type {HTMLElement} */ (el);
      if (typedEl.classList?.contains('cell-selector')) {
        clickArea = 'cell-selector';
        cell = typedEl;
      }
      if (typedEl.classList?.contains('owc-selectable-checkbox')) {
        checkbox = typedEl;
      }
      if (typedEl.dataset?.index) {
        index = parseInt(typedEl.dataset.index);
      }
    }
    if (clickArea === 'cell-selector' && index !== undefined) {
      const useCheckbox = checkbox || cell?.querySelector('.owc-selectable-checkbox');
      if (useCheckbox) {
        let typeCheckbox = /** @type {HTMLInputElement} */ (useCheckbox);
        typeCheckbox.checked = !typeCheckbox.checked;
        if (typeCheckbox.checked) {
          this.#selectedSet.add(this.#rowKey(this.processedData[index]));
        } else {
          this.#selectedSet.delete(this.#rowKey(this.processedData[index]));
        }
        this.#saveStateToUrl();
        this.requestUpdate();
      }
    }

    if (clickArea === 'row' && index !== undefined) {
      const row = this.processedData[index];
      this.dispatchEvent(new RowClickEvent('rowClick', row));
    }
  }

  /**
   * @param {MouseEvent} ev
   */
  #handleTableMouseDown(ev) {
    const target = /** @type {HTMLElement} */ (ev.target);
    const visibleColumnIndex = target.dataset.visibleColumnIndex;
    if (target.classList.contains('cell-resize') && visibleColumnIndex) {
      ev.preventDefault();
      const column = this.#visibleColumns[parseInt(visibleColumnIndex)];
      if (!column) {
        return;
      }
      const { clientX: clientXStart } = ev;
      let width = column.width ? column.width : column._calculatedWidth || 50;

      /**
       * @param {MouseEvent} event
       */
      const onResizeMouseMove = event => {
        if (column.width) {
          const { clientX } = event;
          const newWidth = width + (clientX - clientXStart);
          column.width = newWidth;
          this.#columnWidths[column.field] = newWidth;
          this.#updateColumnCssVariables();
          this.requestUpdate();
        } else if (target.parentElement) {
          const realWidth = target.parentElement.getBoundingClientRect().width;
          column.width = realWidth;
          this.#columnWidths[column.field] = realWidth;
          width = realWidth;
          this.#updateColumnCssVariables();
          this.requestUpdate();
        }
      };

      // @ts-ignore
      const throttledResize = throttle(onResizeMouseMove, 10);
      let hasResized = false;
      const onResizeMouseMoveAndTrack = (/** @type {Event} */ event) => {
        hasResized = true;
        throttledResize(event);
      };
      const onResizeMouseUp = (/** @type {MouseEvent} */ event) => {
        // `throttle` intentionally drops intermediate events, so commit the
        // actual mouse-up position to avoid losing the end of a fast drag.
        if (hasResized) {
          onResizeMouseMove(event);
        }
        this.removeEventListener('mousemove', onResizeMouseMoveAndTrack);
        this.removeEventListener('mouseup', onResizeMouseUp);
      };
      this.addEventListener('mousemove', onResizeMouseMoveAndTrack);
      this.addEventListener('mouseup', onResizeMouseUp);
    }
  }

  async recalculateColumnWidths() {
    this.sizeData = this.processedData.slice(0, 100);
    this.requestUpdate();
    await this.updateComplete;

    const headers = this.shadowRoot?.querySelectorAll('#size-table .table-header .row > .cell');

    if (!headers) {
      return;
    }

    let changed = false;

    for (const [index, header] of Array.from(headers).entries()) {
      const newWidth = parseInt(getComputedStyle(header).width);
      const currentWidth = this.#visibleColumns[index]._calculatedWidth;

      if (newWidth !== currentWidth) {
        this.#visibleColumns[index]._calculatedWidth = newWidth;
        changed = true;
      }
    }

    this.#updateColumnCssVariables();

    if (changed) {
      this.requestUpdate();
    }
  }

  /**
   * @param {Event} ev
   */
  #handleSelectableTitleChange(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    const typedTarget = /** @type {HTMLInputElement} */ (ev.target);
    if (typedTarget && typedTarget.checked) {
      for (const index of this.processedData.keys()) {
        this.#selectedSet.add(this.#rowKey(this.processedData[index]));
      }
    } else {
      this.#selectedSet.clear();
    }
    this.#saveStateToUrl();
    this.requestUpdate();
  }

  addSelectableColumn() {
    this.#visibleColumns.unshift({
      label: () =>
        html`<wa-checkbox
          @change=${this.#handleSelectableTitleChange}
          ?checked=${this.#selectedSet.size === this.processedData.length}
          ?indeterminate=${
            this.#selectedSet.size > 0 && this.#selectedSet.size < this.processedData.length
          }
          aria-label=${tableTerm(this.localize, 'tableSelectAll')}
        ></wa-checkbox>`,
      includeInExport: false,
      formatter: (row, options) => {
        const selectorSettings = this.getSelectorSettings(row);
        // @ts-ignore
        const typedIndex = /** @type {number} */ (options.custom.index);
        /** @param {Event} ev */
        return html`<wa-checkbox
          class="owc-selectable-checkbox"
          value=${typedIndex}
          ?checked=${this.#selectedSet.has(this.#rowKey(this.processedData[typedIndex]))}
          aria-label=${ifDefined(selectorSettings['aria-label'])}
        ></wa-checkbox>`;
      },
      cellClass: 'cell-selector',
      headerSort: false,
      resizable: false,
      width: 50,
      field: '_selector',
    });
  }

  addDetailsColumn() {
    this.#visibleColumns.unshift({
      label: '',
      includeInExport: false,
      formatter: row => {
        const selectorSettings = this.getSelectorSettings(row);
        const open = this.openDetails?.includes(this.getRowId(row) || '');
        /** @param {Event} ev */
        return html`<owc-icon-button
          class="open-details-button ${open ? 'details-open' : ''}"
          name="chevron-right"
          @click=${(/** @type {Event} */ ev) => this.#handleDetailsClick(ev, row)}
          aria-label=${ifDefined(selectorSettings['aria-label'])}
        ></owc-icon-button>`;
      },
      cellClass: 'open-details',
      headerSort: false,
      resizable: false,
      width: 50,
      field: '_open-details',
    });
  }

  /**
   * @param {Array<string>} refreshColumnFields
   */
  refreshFilterOptions(refreshColumnFields) {
    const filterOptionsToRefresh = this.columns.filter(
      column => column.field && refreshColumnFields.includes(column.field),
    );
    for (const column of filterOptionsToRefresh) {
      if (typeof column.filterOptionsFn === 'function') {
        column.filterOptions = column.filterOptionsFn();
      }
    }
    this.requestUpdate();
  }

  /**
   * @param {string} field
   * @returns {import("./OwcTable.types.js").Column<T>}
   */
  findColumn(field) {
    return this.columns.find(f => f.field === field) || { label: 'Nicht gefunden', field: '' };
  }

  /**
   * @param {{ data: T }} options
   */
  isInsert({ data }) {
    return this.insertData.includes(data);
  }

  /**
   *
   * @param {T} row
   */
  removeData(row) {
    if (this.data.includes(row)) {
      this.data = this.data.filter(elm => elm !== row);
    }
  }

  /**
   *
   * @param {T} row
   */
  removeInsertData(row) {
    if (this.insertData.includes(row)) {
      this.insertData = this.insertData.filter(elm => elm !== row);
    }
  }

  /**
   * @param {Set<string>} set
   * @param {import('./filter.type.js').NestedJsonFilters} value
   */
  getUsedFilterFieldNames(set = new Set(), value = this.jsonFilters) {
    const valueArray = Array.isArray(value) ? value : [value];
    valueArray.forEach(filter => {
      if (Array.isArray(filter)) {
        filter.forEach(f =>
          this.getUsedFilterFieldNames(
            set,
            /** @type {import('./filter.type.js').NestedJsonFilters} */ (f),
          ),
        );
      } else if (filter.enabled === undefined || filter.enabled === true) {
        if (
          (this.filterMode === 'global-search-with-builder' ||
            this.filterMode === 'global-search') &&
          !Array.isArray(this.jsonFilters[0]) &&
          filter.field === globalSearchField &&
          filter.field === this.jsonFilters[0].field
        ) {
          set.add('Global Text');
          return set;
        }
        const column = this.findColumn(filter.field);
        const fieldName =
          column.labelString || (typeof column.label === 'string' ? column.label : column.field);
        if (typeof fieldName === 'string') {
          set.add(fieldName);
        }
      }
    });
    return set;
  }

  getAddedFilterFieldNames() {
    const addedFields = new Set();
    for (const field of this.getUsedFilterFieldNames()) {
      if (!this.#initialSetFilterFields.has(field)) {
        addedFields.add(field);
      }
    }
    return addedFields;
  }

  get virtualizer() {
    const el = this.shadowRoot?.querySelector('#data-table .table-body #virtualize-container');
    // @ts-ignore
    return el ? el[virtualizerRef] : undefined;
  }

  get virtualizerHost() {
    const el = this.shadowRoot?.querySelector('#data-table .table-body #virtualize-container');
    return el || undefined;
  }

  resetVirtualizer() {
    if (this.virtualizer) {
      this.virtualizer.disconnected();
      this.virtualizer.connected();
    }
  }

  static styles = [
    contentFormatterStyles,
    css`
      :host {
        --owc-table-borderColor: #e5e7eb;
        --owc-table-loadingColor: rgba(200, 200, 200, 0.3);
        --owc-table-important-row-background-color: #f9fafb;
        --owc-table-primary-background-color: #fff;
        --owc-table-header-color: #6b7280;
        --owc-table-width: auto;
        --owc-table-grid-template-columns: none;
        display: block;
      }

      * {
        box-sizing: border-box;
      }

      .row-wrapper {
        position: relative;
        display: contents;
      }
      .row-click {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        cursor: pointer;
      }
      .row-no-click {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }

      .table-header .row-no-click {
        pointer-events: none;
      }

      .table-header .row-click {
        pointer-events: none;
      }

      .row {
        display: grid;
        grid-template-columns: var(--owc-table-grid-template-columns, none);
        width: max-content;
        position: relative;
      }

      .row:has(.row-click):hover {
        background: var(--owc-table-important-row-background-color);
      }

      .highlighted {
        background: var(--owc-table-highlighted, #ffec60);
      }
      .highlighted:hover {
        background: var(--owc-table-highlighted-hover, #eddc5a);
      }
      .cell {
        outline: 0;
        border: 1px solid var(--owc-table-borderColor);
        border-width: 0 0 1px 0;
        min-width: 50px;
        display: flex;
        justify-content: center;
      }

      #data-table .cell {
        min-width: 0;
        overflow: hidden;
      }

      .cell-content {
        padding: 14px 18px;
        text-align: left;
        overflow: visible;
        text-overflow: ellipsis;
        white-space: nowrap;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        justify-content: center;
      }

      .cell-full {
        position: relative;
        width: 100%;
      }

      .cell-text {
        position: relative;
        white-space: nowrap;
      }

      .group-label-container {
        position: relative;
        outline: 0;
        border: 1px solid var(--owc-table-borderColor);
        min-height: 45px;
        display: flex;
        align-items: center;
        border-width: 0 1px 1px 1px;
      }

      .group-label {
        padding: 14px 10px;
        text-align: left;
        overflow: visible;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 100%;
        font-weight: bold;
        color: var(--owc-table-header-color);
        display: flex;
        align-items: center;
        gap: 1ch;
      }

      .group-rows-container {
        /* transition: 2s ease-in-out; */
        min-height: 0;
        position: relative;
      }

      .cell-resize {
        min-width: 20px;
        width: 20px;
        height: 100%;
        cursor: col-resize;
        opacity: 0;
        transition: opacity 0.2s ease-in-out;
        position: relative;
        display: block;
      }

      .cell-resize::after {
        content: '';
        width: 1px;
        height: 100%;
        background: var(--owc-table-resize-bar-color, #aeafaf);
        position: absolute;
        right: 50%;
      }

      .cell:hover .cell-resize {
        opacity: 1;
      }

      .cell-selector {
        z-index: 10;
        overflow: hidden;
      }

      .row > .cell:nth-child(2) {
        border-left-width: 1px;
      }
      .row > .cell:last-child {
        border-right-width: 1px;
      }
      .table-header .row {
        color: var(--owc-table-header-color);
        font-weight: bold;
        background-color: var(--owc-table-important-row-background-color);
      }
      .table-header .cell {
        display: inline-flex;
      }
      .table-body {
        position: relative;
      }

      .last-row .cell:nth-child(2) {
        border-radius: 0 0 0 8px;
      }
      .last-row .cell:last-child {
        border-radius: 0 0 8px 0;
      }

      .last-row {
        border-radius: 0 0 8px 8px;
      }

      .table-header .row:first-child > .cell {
        border-top-width: 1px;
      }
      .table-header .row:first-child > .cell:nth-child(2) {
        border-radius: 8px 0 0 0;
      }
      .table-header .row:first-child > .cell:last-child {
        border-radius: 0 8px 0 0;
      }
      #data-table .table-header .cell-content {
        padding-right: 2px;
      }

      #size-table-wrapper {
        height: 0;
        overflow: hidden;
      }
      #size-table-wrapper .table {
        display: table;
        width: 100%;
      }
      #size-table-wrapper .table-header {
        display: table-header-group;
      }
      #size-table-wrapper .table-body {
        display: table-row-group;
      }
      #size-table-wrapper .row {
        display: table-row;
        position: relative;
      }
      #size-table-wrapper .cell {
        display: table-cell;
      }

      #info-wrapper {
        display: inline-flex;
        align-items: center;
        justify-content: flex-start;
        background: var(--owc-table-primary-background-color);
        min-height: 40px;
      }

      #info {
        font-size: 0.8em;
        color: var(--owc-table-header-color);
        margin: 0.5em 0;
        padding-left: 1em;
      }

      #actions > * {
        margin: 0.3em;
      }

      #actions > .connected-before {
        margin-left: -10px;
        margin-right: 0;
      }

      .open-details-button {
        padding: 0;
        transition: rotate var(--wa-transition-slow) ease;
        rotate: 0deg;
      }

      .open-details-button.details-open {
        rotate: 90deg;
      }

      .owc-selectable-checkbox::part(label) {
        display: none;
      }

      .owc-selectable-checkbox {
        pointer-events: none;
      }

      owc-table-filter-builder {
        margin-bottom: 1em;
      }

      .table-header {
        display: flex;
      }

      .align-start {
        align-items: start;
      }

      .align-end {
        align-items: end;
      }

      .align-center {
        align-items: center;
      }

      .list-content {
        display: flex;
        justify-content: space-between;
        gap: 1.5em;
        width: 100%;
      }

      #empty-message-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
      }

      /** sticky header */
      :host([sticky-header]) .table-header {
        position: sticky;
        top: 0;
        z-index: 100;
      }
      :host([_has-info-block][sticky-header]) .table-header {
        top: 40px;
      }
      :host([sticky-header]) #info-outer-wrapper {
        position: sticky;
        top: 0;
        background: var(--owc-table-primary-background-color);
        z-index: 110;
      }

      :host([sticky-header]) #info-outer-wrapper:has([open]) {
        z-index: 150;
      }

      :host([sticky-header]) #info-wrapper {
        position: sticky;
        z-index: 130;
        left: 1em;
        width: 100%;
        padding-right: 10px;
      }

      :host([sticky-header][filter-mode*='builder']) #header {
        position: sticky;
        z-index: 120;
        left: 1em;
        display: inline-flex;
      }
      .row-container {
        width: fit-content;
      }

      .row-annotation {
        width: 100%;
        border: 1px solid var(--owc-table-borderColor);
        border-width: 0 1px 0px 1px;
        padding-top: 0.5rem;
        padding-left: 1rem;
      }

      wa-spinner {
        font-size: 50px;
      }

      #loading-indicator-details {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        background: var(--owc-table-loadingColor);
        opacity: 1;
        pointer-events: none;
        height: 100%;
      }

      #loading-indicator {
        top: 0;
        left: 0;
        position: absolute;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        background: var(--owc-table-loadingColor);
        opacity: 0;
        transition: opacity 0.5s ease-in-out;
        pointer-events: none;
        height: 100%;
      }

      :host([loading]) #loading-indicator {
        opacity: 1;
        height: 100%;
      }

      .row-container {
        scroll-margin-top: 95px;
        scroll-margin-left: 1000px;
      }

      wa-details {
        display: block;
        width: var(--owc-table-width);
        max-width: var(--owc-table-width);
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
        margin: 0;
        border: 1px solid var(--owc-table-borderColor);
        border-width: 0 1px 1px 1px;
        padding: 0px;
        padding-left: 20px;
        padding-right: 20px;
        min-height: 25dvh;
        max-height: 85dvh;
        width: 100%;
        max-width: 100%;
        overflow-x: auto;
        overflow-y: auto;
      }

      @media (min-height: 1200px) {
        wa-details::part(content) {
          max-height: 90dvh;
        }
      }
    `,
  ];
}

/**
 * @template T
 * @param {(args: T) => void} func
 * @param {number} [timeout=300]
 */
function debounce(func, timeout = 300) {
  /** @type {NodeJS.Timeout} */
  let timer;
  /**
   * @param {T} args
   */
  return args => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func(args);
    }, timeout);
  };
}
