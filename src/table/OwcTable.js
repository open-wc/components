import { LitElement, css, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { repeat } from 'lit/directives/repeat.js';
import { until } from 'lit/directives/until.js';
import {
  VirtualizerController,
  spacerStyles,
  virtualizes,
} from '../virtualizer/VirtualizerController.js';

import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { OwcTableHeaderCell } from './OwcTableHeaderCell.js';
import { jsonToFilter } from './jsonToFilter.js';
import { fitColumnWidths } from './fitColumnWidths.js';
import { GroupHeader, OthersGroupHeader, groupedList } from './groupedList.js';

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
import { OwcIconButton } from '../icon-button/OwcIconButton.js';
import {
  OwcClickEditableAutocomplete,
  OwcClickEditableInput,
  OwcClickEditableTextarea,
} from '@open-wc/components/OwcClickEditable.js';
import { styleMap } from 'lit/directives/style-map.js';
import { dateParserForJsonDecode } from './dateParserForJsonDecode.js';
import { OwcLocalizeController } from '@open-wc/components/localization.js';

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
 * A track list for the table's grid: each column's width in px, or
 * `min-content` for a column without a width, which then fits its content.
 *
 * @param {Array<number | null | undefined>} widths
 */
function gridTracks(widths) {
  return widths.map(width => (width != null ? `${width}px` : 'min-content')).join(' ');
}

/**
 * @template {Record<string, unknown>} T
 */
export class OwcTable extends ScopedElementsMixin(LitElement) {
  #localize = new OwcLocalizeController(this);
  static scopedElements = {
    'owc-table-header-cell': OwcTableHeaderCell,
    'owc-table-filter-builder': OwcTableFilterBuilder,
    'owc-table-info': OwcTableInfo,
    'owc-click-editable-autocomplete': OwcClickEditableAutocomplete,
    'owc-click-editable-input': OwcClickEditableInput,
    'owc-click-editable-textarea': OwcClickEditableTextarea,
    'owc-icon-button': OwcIconButton,
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
    scrollTarget: { attribute: false },
    growFullWidth: { type: Boolean, attribute: 'grow-full-width', reflect: true },
    groupList: { attribute: false },
    groupSelector: { attribute: false },
    othersGroupActive: { attribute: false },
  };

  #initialSetFilterFields = new Set();

  /**
   * Sizes the columns again when the window gets wider or narrower, and
   * measures the rows again, whose heights can depend on the window. A change
   * of the window's height alone, like a mobile browser's toolbar hiding while
   * scrolling, changes neither.
   */
  #handleWindowResize = () => {
    if (window.innerWidth !== this.#windowWidth) {
      this.#windowWidth = window.innerWidth;
      void this.#scheduleColumnWidths(true);
    }
  };

  #windowWidth = 0;

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

    /**
     * The element that scrolls the table. It overrides the automatic detection
     * of the scroll container; leave it unset, or set `undefined` or `null`,
     * to detect it.
     * @type {Element | null | undefined}
     */
    this.scrollTarget = undefined;

    this.growFullWidth = false;
  }

  #selectedSet = new Set();
  /** @type {import('./OwcTable.types.js').Column<T>[]} */
  #visibleColumns = [];
  /** @type {Record<string, number>} */
  #columnWidths = {};

  /**
    @type {Record<string, number>}
   */
  #defaultColumnWidths = {};

  #MIN_COLUMN_WIDTH = 50;

  /** @type {Promise<void> | undefined} */
  #columnSizingPromise;

  #columnSizingPending = false;

  #remeasureRowsAfterSizing = false;

  /**
   * Whether the table wasn't laid out when its columns were last sized (e.g.
   * inside `display: none`). Its columns then fit their content without being
   * frozen, and are sized once the table has a width.
   */
  #columnWidthsUnsized = false;

  /**
   * The column tracks the rows' heights were measured at, so the virtualizer
   * can measure them again when the widths change.
   * @type {string | undefined}
   */
  #rowsMeasuredAt;

  get visibleColumns() {
    return [...this.#visibleColumns];
  }

  /** @type {ResizeObserver | undefined} */
  #infoResizeObserver;

  /** @type {ResizeObserver | undefined} */
  #hostResizeObserver;

  #hostWidth = 0;

  /**
   * Renders the list from the `virtualizer-mode` threshold on. Until a detail
   * has been measured, an open detail is estimated at 200px, about the minimum
   * height of a detail (25dvh) in a typical window.
   */
  #virtualizer = new VirtualizerController(this, { estimateSize: 47, estimateExpansion: 200 });

  /**
   * The list the table body renders, one item per element: the rows of an
   * ungrouped table, or every group's header followed by its rows while the
   * group is expanded. `positionOf` gives the index of the row at a list index
   * among the rows of its group, or of the table. `dataRows` are the Data Rows
   * among the items, which a grouped list only finds once a render shows all
   * of them.
   *
   * @type {{ items: Array<T | GroupHeader>, positionOf: (index: number) => number, dataRows?: T[], groupedFrom?: unknown[] }}
   */
  #list = { items: [], positionOf: index => index, dataRows: [] };

  /** @type {WeakMap<import('./groupedList.js').Group, GroupHeader>} */
  #groupHeaders = new WeakMap();

  /**
   * The header of the group of rows that belong to no group in `groupList`:
   * named in the table's language, and expanded through `othersGroupActive`.
   */
  #othersHeader = new OthersGroupHeader({
    label: () => this.#localize.term('tableOthers'),
    isActive: () => this.othersGroupActive,
    setActive: active => {
      this.othersGroupActive = active;
    },
  });

  /**
   * Whether a row changed in place since the list was laid out, e.g. through a
   * cell edit, which can move it to another group.
   */
  #rowsChangedInPlace = false;

  /**
   * The items the next render shows when the list is virtualized.
   * @type {import('../virtualizer/VirtualizerController.js').VirtualSlice<T | GroupHeader> | undefined}
   */
  #slice;

  #initialSortersApplied = false;

  #updateInfoHeight() {
    const wrapper = this.shadowRoot?.querySelector('#info-outer-wrapper');
    const height = wrapper?.getBoundingClientRect().height ?? 0;
    this.style.setProperty('--info-height', `${height}px`);
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

    this.#updateInfoHeight();

    const wrapper = this.shadowRoot?.querySelector('#info-outer-wrapper');
    if (wrapper) {
      this.#infoResizeObserver = new ResizeObserver(() => {
        this.#updateInfoHeight();
      });
      this.#infoResizeObserver.observe(wrapper);
    }

    super.firstUpdated(changedProperties);
  }

  /** @param {import('lit').PropertyValues} changedProperties */
  updated(changedProperties) {
    if (changedProperties.has('growFullWidth')) {
      void this.recalculateColumnWidths();
    }
    super.updated(changedProperties);
  }

  /**
   * @param {import('lit').PropertyValues} changedProperties
   */
  update(changedProperties) {
    if (changedProperties.has('scrollTarget')) {
      this.#virtualizer.scrollContainer = this.scrollTarget ?? undefined;
    }
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
    if (changedProperties.has('openDetails') || changedProperties.has('renderMode')) {
      this.#virtualizer.expanded = this.#openDetailPredicate();
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
      void this.recalculateColumnWidths();
    }
    if (changedProperties.has('actionTabActive')) {
      this.#saveStateToUrl();
    }
    if (
      changedProperties.has('columns') ||
      changedProperties.has('jsonFilters') ||
      changedProperties.has('overrides')
    ) {
      if (changedProperties.has('columns')) {
        for (const column of this.columns) {
          if (
            column.field &&
            column.width != null &&
            !(column.field in this.#defaultColumnWidths)
          ) {
            this.#defaultColumnWidths[column.field] = column.width;
          }
        }
      }
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
          // Measurements and user widths belong to this table, not shared definitions.
          return { ...column };
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
      if (!this.#initialSortersApplied) {
        this.#initialSortersApplied = true;
        const sortedColumns = new Set(this.jsonSorters.map(sorter => sorter.field));
        const defaultSorters = this.#visibleColumns
          .flatMap(column => column.sorter || [])
          .map(sorter => ({ order: /** @type {'asc' | 'desc'} */ ('asc'), ...sorter }))
          .filter(sorter => !sortedColumns.has(sorter.field));
        if (defaultSorters.length > 0) {
          this.jsonSorters = [...this.jsonSorters, ...defaultSorters];
          this.sorters = this.jsonSorters.map(jsonToSorters);
          this.#applySorters();
        }
      }
    }
    if (changedProperties.has('overrides')) {
      void this.recalculateColumnWidths();
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
    this.#updateRenderedRows();
    super.update(changedProperties);

    this.updateComplete.then(() => this.#updateInfoHeight());
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
    this.#windowWidth = window.innerWidth;
    window.addEventListener('resize', this.#handleWindowResize);
    this.#observeHostWidth();
    void this.recalculateColumnWidths();
    this.handleInitialData();
    this.loadStateFromUrl();
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.#handleWindowResize);
    this.#hostResizeObserver?.disconnect();
    super.disconnectedCallback();
  }

  loadStateFromUrl() {
    if (!this.saveStateToUrl) {
      return;
    }
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

    for (const column of this.#visibleColumns) {
      const width = column.width ?? column._calculatedWidth;

      if (width != null) {
        tableWidth += width;
      }
    }

    this.#saveStateToUrl();

    this.style.setProperty('--owc-table-width', `${tableWidth}px`);

    this.requestUpdate();
  }

  /**
   * The column tracks of the table's grid, which the header row and every body
   * row lay out on. A column without a width fits its content until its width
   * is sized and frozen.
   */
  #columnTracks() {
    return gridTracks(this.#visibleColumns.map(column => column.width ?? column._calculatedWidth));
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
        ${this.customStyles}
      </style>
      <div id="header">
        ${
          this.filterMode !== 'hidden'
            ? html`
                <owc-table-filter-builder
                  lang=${this.lang}
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
                      ? html`<wa-button size="s" variant="brand" @click=${this.#handleInsertClick}>
                          <wa-icon
                            id="add-new-row-icon"
                            slot="start"
                            name="plus"
                            canvas="auto"
                            label=${this.#localize.term('tableNew')}
                          ></wa-icon
                          >${this.#localize.term('tableNew')}
                        </wa-button>`
                      : nothing
                  }
                  <owc-table-info
                    lang=${this.lang}
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

  /**
   * Adds a row from `handleInsert`, brings it into view and focuses its first
   * editable field.
   */
  async #handleInsertClick() {
    if (!this.handleInsert) {
      return;
    }
    const row = this.handleInsert();
    this.insertData = [...this.insertData, row];
    this.#expandGroupOf(row);
    await this.updateComplete;
    // Insert rows come last, in their group if the table is grouped, so in a
    // virtualized table the new row usually isn't rendered yet.
    const index = this.#list.items.lastIndexOf(row);
    if (index < 0) {
      return;
    }
    if (this.#slice) {
      await this.#virtualizer.scrollToIndex(index, { block: 'nearest' });
    } else {
      // instant like `scrollToIndex`, so focusing doesn't interrupt a smooth scroll
      this.#rowContainerAt(index)?.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        behavior: 'instant',
      });
    }
    const field = /** @type {HTMLElement | null | undefined} */ (
      this.#rowContainerAt(index)?.querySelector('[editable]')
    );
    field?.focus();
  }

  /**
   * Expands the group a row belongs to in a grouped table, so the row is part
   * of the list.
   *
   * @param {T} row
   */
  #expandGroupOf(row) {
    if (!this.groupSelector || !this.#isGrouped()) {
      return;
    }
    const key = this.groupSelector(row);
    const groups = this.groupList.filter(group => group.key === key);
    const headers =
      groups.length > 0 ? groups.map(group => this.#groupHeaderFor(group)) : [this.#othersHeader];
    for (const header of headers) {
      header.active = true;
    }
    this.requestUpdate('groupList');
  }

  /**
   * The rendered row container of the row at an index of the list the body
   * renders, which is its index in `allData` in an ungrouped table.
   *
   * @param {number} index
   */
  #rowContainerAt(index) {
    return (
      this.shadowRoot?.querySelector(
        `#virtualize-container > .row-container > .row[data-index="${index}"]`,
      )?.parentElement ?? undefined
    );
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

  #isGrouped() {
    return this.groupList?.length > 0 && Boolean(this.groupSelector);
  }

  /**
   * Decides which rows the next render shows, and sets `visibleData` to the
   * Data Rows among them in the same update, so a new range costs one update.
   */
  #updateRenderedRows() {
    this.#updateList();
    const list = this.#list;
    // Only Data Rows count toward the threshold, across all groups; group
    // headers and insert rows don't.
    this.#slice = virtualizes(this.virtualizerMode, this.processedData.length)
      ? this.#virtualizer.slice(list.items)
      : undefined;
    const visibleData = this.#slice
      ? this.#dataRowsOf(this.#slice.items)
      : (list.dataRows ??= this.#dataRowsOf(list.items));
    const unchanged =
      visibleData === this.visibleData ||
      (visibleData.length === this.visibleData.length &&
        visibleData.every((row, index) => row === this.visibleData[index]));
    if (!unchanged) {
      this.visibleData = visibleData;
    }
  }

  /**
   * Lays the rows out as the list the body renders. A grouped table is laid
   * out again only when its rows or its groups change, or a row changed in
   * place, so updates for scrolling don't group the rows again.
   */
  #updateList() {
    const rowsChangedInPlace = this.#rowsChangedInPlace;
    this.#rowsChangedInPlace = false;
    if (!this.#isGrouped()) {
      if (this.#list.items !== this.allData || this.#list.dataRows !== this.processedData) {
        this.#list = {
          items: this.allData,
          positionOf: index => index,
          dataRows: this.processedData,
        };
      }
      return;
    }
    const groupOf = /** @type {(row: T) => string} */ (this.groupSelector);
    const groupedFrom = [
      this.allData,
      groupOf,
      this.groupList,
      this.othersGroupActive,
      ...this.groupList.flatMap(group => [group.key, group.priority, Boolean(group.active)]),
    ];
    const previous = this.#list.groupedFrom;
    if (
      !rowsChangedInPlace &&
      previous?.length === groupedFrom.length &&
      groupedFrom.every((value, index) => value === previous[index])
    ) {
      return;
    }
    const { items, positions } = groupedList(this.allData, {
      groups: this.groupList,
      groupOf,
      headerFor: group => this.#groupHeaderFor(group),
      others: this.#othersHeader,
    });
    this.#list = { items, positionOf: index => positions[index], groupedFrom };
  }

  /** @param {import('./groupedList.js').Group} group */
  #groupHeaderFor(group) {
    let header = this.#groupHeaders.get(group);
    if (!header) {
      header = new GroupHeader(group);
      this.#groupHeaders.set(group, header);
    }
    return header;
  }

  /** @param {T | GroupHeader} item */
  #isDataRow(item) {
    return !(item instanceof GroupHeader) && !this.isInsert({ data: item });
  }

  /**
   * The Data Rows among items of the list, without group headers and insert rows.
   *
   * @param {Array<T | GroupHeader>} items
   */
  #dataRowsOf(items) {
    return /** @type {T[]} */ (items.filter(item => this.#isDataRow(item)));
  }

  #renderListHost() {
    return html`<div id="virtualize-container">
      ${
        this.#slice
          ? this.#virtualizer.renderSlice(this.#slice, (item, index) =>
              this.#renderListItem(item, index),
            )
          : this.#renderAllRows()
      }
    </div>`;
  }

  /** Every item of the list, for tables that aren't virtualized. */
  #renderAllRows() {
    const { items } = this.#list;
    if (!this.#isGrouped()) {
      return items.map((item, index) => this.#renderListItem(item, index));
    }
    // Keyed, so expanding or collapsing a group only adds or removes its rows.
    return repeat(
      items,
      item => item,
      (item, index) => this.#renderListItem(item, index),
    );
  }

  /**
   * @param {T | GroupHeader} item
   * @param {number} index the item's index in the list
   */
  #renderListItem(item, index) {
    if (item instanceof GroupHeader) {
      return this.#renderGroupHeader(item, index);
    }
    const { items, positionOf } = this.#list;
    return this.#renderItem(item, index, {
      position: positionOf(index),
      last: index === items.length - 1,
    });
  }

  /**
   * @param {GroupHeader} header
   * @param {number} index the header's index in the list (`data-index`)
   */
  #renderGroupHeader(header, index) {
    const { active } = header;
    return html`
      <div
        data-index=${index}
        style=${styleMap({ backgroundColor: header.backgroundColor })}
        class="group-label-container ${active ? 'active' : ''} data-container  ${
          !active && header.last ? 'last-row' : ''
        }"
      >
        <div class="row-click" @click=${() => this.#toggleGroup(header)}></div>
        <span class="group-label" style=${styleMap({ color: header.textColor })}
          >${header.label}
          <wa-badge variant="neutral" pill>${header.count}</wa-badge>
          <wa-icon name=${active ? 'chevron-down' : 'chevron-right'}></wa-icon
        ></span>
      </div>
    `;
  }

  /** @param {GroupHeader} header */
  #toggleGroup(header) {
    header.toggle();
    this.requestUpdate('groupList');
  }

  #renderDataTable() {
    return html`
      <div
        class="table"
        id="data-table"
        style=${styleMap({ '--owc-table-columns': this.#columnTracks() })}
        @mousedown=${this.#handleTableMouseDown}
      >
        <div class="table-header">${this.#renderHeader()}</div>
        <div class="table-body">
          ${
            this.allData && this.allData.length > 0
              ? this.#renderListHost()
              : html`<div id="empty-message-wrapper">
                  <p>${this.#localize.term('tableEmptyMessage')}</p>
                </div>`
          }
        </div>
        <div id="loading-indicator">
          <wa-spinner></wa-spinner>
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
                  lang=${this.lang}
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

    // fall back to the column's originally configured width (if any),
    // otherwise let it be recalculated from the rendered content
    const defaultWidth = this.#defaultColumnWidths[column.field];
    if (defaultWidth != null) {
      column.width = defaultWidth;
    } else {
      delete column.width;
    }
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
    if (this.isInsert({ data: row })) {
      return html`<div class="row-no-click"></div>`;
    }

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

  /**
   * Tells the virtualizer which rows have an open detail, so it estimates the
   * ones it hasn't measured with the typical detail height added.
   *
   * @returns {((item: T | GroupHeader) => boolean) | undefined}
   */
  #openDetailPredicate() {
    if (!this.#hasDetailRows() || !this.openDetails?.length) {
      return undefined;
    }
    const openDetails = new Set(this.openDetails);
    // The rows that render an open detail: Data Rows with an id in `openDetails`.
    // Group headers have no detail, nor an id to ask `getRowId` for.
    return item => {
      if (!this.#isDataRow(item)) {
        return false;
      }
      const rowId = this.getRowId(/** @type {T} */ (item));
      return rowId ? openDetails.has(rowId) : false;
    };
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
   * @param {number} index the row's index in the list the body renders (`data-index`), which counts group headers too
   * @param {{mode?: "size-table" | "data-table", position?: number, last?: boolean}} [options]
   *   `position`: the row's index for formatters such as `rownum`, which counts within its group in grouped tables;
   *   `last`: whether the row is the last item of the list
   * @returns {import('lit').TemplateResult}
   */
  #renderItem = (
    row,
    index,
    { mode = 'data-table', position = index, last = index === this.allData.length - 1 } = {},
  ) => {
    const hasAnnotation = this.renderAnnotation(row) !== nothing;
    const annotationContent = hasAnnotation
      ? html`<div class="row-annotation">${this.renderAnnotation(row)}</div>`
      : nothing;

    const rawRowContent = html` <div
      class=${this.#shouldBeHighlighted(row) ? 'row highlighted' : 'row'}
      data-index=${index}
      @click=${(/** @type {MouseEvent} */ ev) => this.#handleRowClick(ev, row)}
    >
      ${this.renderRowMode(row)}
      ${this.#visibleColumns.map(column => this.#renderCell(row, column, position))}
    </div>`;

    const rowId = this.getRowId(row);
    const hasDetailRow =
      mode === 'data-table' &&
      !this.isInsert({ data: row }) &&
      (this.renderMode === 'detail' ||
        this.renderMode === 'detailDeferred' ||
        this.renderMode === 'linkWithDetail') &&
      rowId;
    const detailContent =
      hasDetailRow && this.#shouldRenderDetail(rowId)
        ? this.renderDetail(row, {
            jsonFilters: this.jsonFilters,
            closeDetail: () => {
              this.openDetails = this.openDetails.filter(elm => elm !== rowId);
            },
          })
        : nothing;
    const rowDetail = hasDetailRow
      ? html`
          <wa-details
            summary=${this.#localize.term('tableOpenDetails')}
            ?open=${this.openDetails?.includes(rowId)}
            @wa-after-show=${this.handleDetailsOpen}
          >
            ${
              detailContent instanceof Promise
                ? until(
                    detailContent,
                    html`<div
                      style="display: flex; justify-content: center; align-items: center; min-height: 100px;"
                    >
                      <wa-spinner></wa-spinner>
                    </div>`,
                  )
                : detailContent
            }
          </wa-details>
        `
      : nothing;
    return mode === 'data-table'
      ? html`<div class="row-container ${last ? 'last-row' : ''}">
          ${annotationContent}${rawRowContent}${rowDetail}
        </div>`
      : rawRowContent;
  };

  /**
   * @param {T} row
   * @param {import('./OwcTable.types.js').Column<T>} column
   * @param {number} index
   */
  #renderCell(row, column, index) {
    return getFieldPathContent(row, column, {
      renderType: this._renderType,
      requiredFields:
        column.type === 'editable'
          ? this.#visibleColumns.filter(col => col.editableOptions?.required).map(col => col.field)
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
      handleUpdate: this.#handleCellUpdate,
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
          const rowIndex = typeof custom?.index === 'number' ? custom.index : 0;
          return `${rowIndex + 1}`;
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
  }

  /**
   * Hands a cell's edit to `handleUpdate`, or writes it into the row when
   * there's no `handleUpdate`. Once the value is in the row, the table renders
   * again, and a grouped table moves the row to the group it belongs to now.
   *
   * @type {import('../field-path-helper/getFieldPathContent.types.js').handleUpdate<T>}
   */
  #handleCellUpdate = async options => {
    const autoSetData = (/** @type {T | undefined} */ data) => {
      options.autoSetData(data);
      this._rowEdited();
    };
    if (this.handleUpdate) {
      await this.handleUpdate({ ...options, autoSetData });
    } else {
      autoSetData();
    }
  };

  /**
   * For the table's own editors, editable cells and the mass edit: call it once
   * an edit is in a row. The table renders again, and a grouped table lays its
   * groups out again in that update, since the edit can move the row to another
   * group. Edits of several rows in the same task cost one update.
   */
  _rowEdited() {
    this.#rowsChangedInPlace = true;
    this.requestUpdate();
  }

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
   * Sizes the columns again when the host's width changes, if they depend on
   * it: full-width columns follow it, and a table that wasn't laid out when it
   * was last sized is sized once it has a width.
   */
  #observeHostWidth() {
    this.#hostResizeObserver ??= new ResizeObserver(entries => {
      const width = Math.round(entries.at(-1)?.contentRect.width ?? 0);
      if (width === this.#hostWidth) {
        return;
      }
      this.#hostWidth = width;
      if (width > 0 && (this.growFullWidth || this.#columnWidthsUnsized)) {
        void this.recalculateColumnWidths();
      }
    });
    this.#hostResizeObserver.observe(this);
  }

  /** @param {number[]} naturalWidths */
  #applyColumnWidths(naturalWidths) {
    const availableWidth = this.clientWidth || this.getBoundingClientRect().width;
    const definitions = new Set(this.columns.map(column => column.field));
    const sizes = this.#visibleColumns.map((column, index) => {
      const naturalWidth = Math.max(naturalWidths[index] ?? 0, this.#MIN_COLUMN_WIDTH);
      const isAutomatic = column.resizable !== false && definitions.has(column.field);
      return {
        naturalWidth,
        fixedWidth: column.width ?? (isAutomatic ? undefined : naturalWidth),
      };
    });
    const widths =
      this.growFullWidth && availableWidth > 0
        ? fitColumnWidths(sizes, availableWidth, this.#MIN_COLUMN_WIDTH)
        : sizes.map(column => column.fixedWidth ?? column.naturalWidth);

    // Measurements remain separate; only final allocations are exposed on visibleColumns.
    this.#visibleColumns.forEach((column, index) => {
      if (column.width == null) {
        column._calculatedWidth = widths[index];
      }
    });
    this.#updateColumnCssVariables();
    this.#remeasureRowsIfWidthsChanged();
  }

  /**
   * Rows can wrap differently at new column widths, so the virtualizer
   * measures their heights again, including the cached heights of rows that
   * aren't rendered.
   */
  #remeasureRowsIfWidthsChanged() {
    const tracks = this.#columnTracks();
    if (this.#rowsMeasuredAt !== undefined && tracks !== this.#rowsMeasuredAt) {
      this.#virtualizer.remeasure();
    }
    this.#rowsMeasuredAt = tracks;
  }

  /**
   * A click in a row toggles the row's selection when it hit the selector
   * cell, and dispatches `rowClick` otherwise. The row comes from the clicked
   * element's own render, never from a position, so grouped and sorted rows
   * can't be mixed up.
   *
   * @param {MouseEvent} ev
   * @param {T} row
   */
  #handleRowClick(ev, row) {
    /** @type {HTMLElement | undefined} */
    let selectorCell;
    /** @type {HTMLElement | undefined} */
    let checkbox;
    for (const el of ev.composedPath()) {
      if (el === ev.currentTarget) {
        break;
      }
      const typedEl = /** @type {HTMLElement} */ (el);
      if (typedEl.classList?.contains('cell-selector')) {
        selectorCell = typedEl;
      }
      if (typedEl.classList?.contains('owc-selectable-checkbox')) {
        checkbox = typedEl;
      }
    }
    if (this.isInsert({ data: row })) {
      return;
    }
    if (selectorCell) {
      const useCheckbox = /** @type {HTMLInputElement | null} */ (
        checkbox ?? selectorCell.querySelector('.owc-selectable-checkbox')
      );
      if (useCheckbox) {
        const key = this.#rowKey(row);
        const selected = !this.#selectedSet.has(key);
        if (selected) {
          this.#selectedSet.add(key);
        } else {
          this.#selectedSet.delete(key);
        }
        useCheckbox.checked = selected;
        this.#saveStateToUrl();
        this.requestUpdate();
      }
      return;
    }
    this.dispatchEvent(new RowClickEvent('rowClick', row));
  }

  /** @param {T} row */
  #isSelected(row) {
    return !this.isInsert({ data: row }) && this.#selectedSet.has(this.#rowKey(row));
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
      let width = column.width ? column.width : column._calculatedWidth || this.#MIN_COLUMN_WIDTH;

      /**
       * @param {MouseEvent} event
       */
      const onResizeMouseMove = event => {
        if (column.width) {
          const { clientX } = event;
          const newWidth = Math.max(this.#MIN_COLUMN_WIDTH, width + (clientX - clientXStart));
          column.width = newWidth;
          this.#columnWidths[column.field] = newWidth;
          this.#updateColumnCssVariables();
          this.requestUpdate();
        } else if (target.parentElement) {
          const realWidth = Math.max(
            this.#MIN_COLUMN_WIDTH,
            target.parentElement.getBoundingClientRect().width,
          );
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
          if (this.growFullWidth) {
            void this.recalculateColumnWidths();
          } else {
            this.#remeasureRowsIfWidthsChanged();
          }
        }
        this.removeEventListener('mousemove', onResizeMouseMoveAndTrack);
        this.removeEventListener('mouseup', onResizeMouseUp);
      };
      this.addEventListener('mousemove', onResizeMouseMoveAndTrack);
      this.addEventListener('mouseup', onResizeMouseUp);
    }
  }

  /** Recalculate and render widths, including requests received during measurement. */
  recalculateColumnWidths() {
    return this.#scheduleColumnWidths();
  }

  /** @param {boolean} remeasureRows whether row heights are measured again after the widths changed */
  #scheduleColumnWidths(remeasureRows = false) {
    this.#columnSizingPending = true;
    this.#remeasureRowsAfterSizing ||= remeasureRows;
    if (!this.#columnSizingPromise) {
      this.#columnSizingPromise = this.#flushColumnWidths();
    }
    return this.#columnSizingPromise;
  }

  async #flushColumnWidths() {
    try {
      do {
        // Coalesce resize, property and manual requests before touching layout.
        await new Promise(resolve => requestAnimationFrame(resolve));
        this.#columnSizingPending = false;
        if (!this.isConnected) {
          return;
        }
        await this.#measureColumnWidths();
        await this.updateComplete;

        if (!this.#columnSizingPending && this.#remeasureRowsAfterSizing && this.isConnected) {
          this.#remeasureRowsAfterSizing = false;
          this.#virtualizer.remeasure();
          await this.updateComplete;
        }
      } while (this.#columnSizingPending);
    } finally {
      this.#columnSizingPromise = undefined;
      this.#columnSizingPending = false;
      this.#remeasureRowsAfterSizing = false;
    }
  }

  /**
   * Sizes the columns without a configured width to their content, as the
   * browser lays out the header and the rendered rows, and freezes the widths
   * in px, so they don't change while scrolling.
   */
  async #measureColumnWidths() {
    await this.updateComplete;
    const grid = /** @type {HTMLElement | null | undefined} */ (
      this.shadowRoot?.querySelector('#data-table')
    );
    if (!this.isConnected || !grid || this.#visibleColumns.length === 0) {
      return;
    }
    const contentWidths = this.#contentWidths(grid);
    this.#columnWidthsUnsized = !contentWidths;
    if (!contentWidths) {
      // Not laid out, e.g. inside `display: none`. Until the table has a width,
      // the columns fit their content as the browser lays it out.
      for (const column of this.#visibleColumns) {
        if (column.width == null) {
          delete column._calculatedWidth;
        }
      }
      this.#updateColumnCssVariables();
      return;
    }
    this.#applyColumnWidths(contentWidths);
  }

  /**
   * The width of every column when the columns without a configured width
   * fit their content: the header and the rendered rows, at their widest
   * unbreakable part. `undefined` while the table isn't laid out.
   *
   * @param {HTMLElement} grid the table's grid
   */
  #contentWidths(grid) {
    grid.style.gridTemplateColumns = gridTracks(this.#visibleColumns.map(column => column.width));
    // header labels count with their single-line width (see the styles)
    grid.setAttribute('sizing-columns', '');
    try {
      // the used track sizes, in px, once the grid is laid out
      const tracks = getComputedStyle(grid).gridTemplateColumns.split(' ');
      if (
        tracks.length !== this.#visibleColumns.length ||
        !tracks.every(track => /^\d+(\.\d+)?px$/.test(track))
      ) {
        return undefined;
      }
      return tracks.map(track => Math.ceil(parseFloat(track)));
    } finally {
      grid.style.removeProperty('grid-template-columns');
      grid.removeAttribute('sizing-columns');
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
          .checked=${this.#selectedSet.size === this.processedData.length}
          .indeterminate=${
            this.#selectedSet.size > 0 && this.#selectedSet.size < this.processedData.length
          }
          aria-label=${this.#localize.term('tableSelectAll')}
        ></wa-checkbox>`,
      includeInExport: false,
      formatter: (row, options) => {
        const selectorSettings = this.getSelectorSettings(row);
        // @ts-ignore
        const typedIndex = /** @type {number} */ (options.custom.index);
        return html`<wa-checkbox
          class="owc-selectable-checkbox"
          value=${typedIndex}
          .checked=${this.#isSelected(row)}
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
    return (
      this.columns.find(f => f.field === field) || {
        label: this.#localize.term('tableNotFound'),
        field: '',
      }
    );
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

  static styles = [
    contentFormatterStyles,
    spacerStyles,
    css`
      :host {
        width: 100%;
        max-width: var(--owc-max-content-width, 100%);
        min-width: 0;
        --owc-table-borderColor: #e5e7eb;
        --owc-table-loadingColor: rgba(200, 200, 200, 0.3);
        --owc-table-important-row-background-color: #f9fafb;
        --owc-table-primary-background-color: #fff;
        --owc-table-header-color: #6b7280;
        --owc-table-width: auto;
        display: block;
      }

      :host([grow-full-width]) {
        contain: inline-size;
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
        height: 100%;
        inset: 0;
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

      /*
       * One grid holds the whole table: the header row and every body row are
       * subgrid rows of it, so they share its column tracks. The containers in
       * between are subgrids across all columns too.
       */
      #data-table {
        display: grid;
        grid-template-columns: var(--owc-table-columns);
        position: relative;
      }

      .table-header,
      .table-body,
      #virtualize-container,
      .row-container,
      .row {
        display: grid;
        grid-template-columns: subgrid;
        grid-column: 1 / -1;
      }

      .row {
        position: relative;
      }

      /* Full-width parts of the body span all columns, and their content doesn't size them. */
      .virtualizer-spacer,
      .group-label-container,
      .row-annotation,
      wa-details,
      #empty-message-wrapper {
        grid-column: 1 / -1;
        contain: inline-size;
      }

      .row:has(.row-click):hover > .cell {
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

      /*
       * While the columns are sized, a header label counts with its single-line
       * width, even if it can wrap; content in the body counts with its widest
       * part that can't wrap.
       */
      #data-table[sizing-columns] .table-header .cell {
        min-width: max-content;
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
      .table-body {
        position: relative;
      }

      .last-row .cell:nth-child(2) {
        border-radius: 0 0 0 8px;
      }
      .last-row .cell:last-child {
        border-radius: 0 0 8px 0;
      }

      .last-row > wa-details::part(content) {
        border-radius: 0 0 8px 8px;
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
      .table-header .row:last-child > .cell:last-child {
        border-radius: 0 8px 0 0;
      }
      #data-table .table-header .cell-content {
        padding-right: 2px;
      }

      #add-new-row-icon {
        padding: 0 10px 0 0;
        margin: 0;
        font-size: 1rem;
      }

      #info-outer-wrapper {
        width: var(--owc-table-width);
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

      .align-start {
        align-items: start;
      }

      .align-end {
        align-items: end;
      }

      .align-center {
        align-items: center;
      }

      /* used in renderSubList */
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
        top: var(--info-height, 40px);
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
      .row-annotation {
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
        /* covers the body's row of the grid, as wide as the host, however wide the columns are */
        grid-row: 2 / 3;
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
