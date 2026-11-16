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
import { gridRowCount, gridRowIndex, openDetailIndices } from './gridRows.js';
import { detailIdentity, indexOfRow, isSameRow, rowIdentity } from './gridFocus.js';
import { HEADER_ROW, moveInGrid, nearestRow } from './gridNavigation.js';
import { keyName } from '../a11y/keys.js';
import { LiveRegionController } from '../a11y/LiveRegionController.js';
import {
  controlsIn,
  deepActiveElement,
  focusControl,
  handleInteractionKey,
  isSimpleControl,
  keepOutOfTabOrder,
  tabStopsOf,
} from '../a11y/controls.js';
import { findScrollContainer, isDocumentScroller } from '../virtualizer/scrollContainer.js';

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
import { visuallyHidden } from '../a11y/visuallyHidden.js';

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

/** The cells of a row of the grid, among the row's children. */
const CELLS = ':scope > .cell, :scope > .full-width-cell';

/** The elements that hold what a cell shows, where its controls are: a detail's `wa-details` is its cell. */
const CELL_CONTENT = '.cell-text, .cell-full, owc-table-header-cell, .detail-row > wa-details';

/** A header cell's sort button isn't a control of its cell: the cell sorts. */
const CELL_CONTROL_OPTIONS = { transparent: 'owc-table-header-cell' };

/** Stands for the header row where the grid remembers a row by its item. */
const HEADER_ITEM = Symbol('header row');

/** Stands for the row that shows the message of an empty table. */
const EMPTY_ITEM = Symbol('empty message row');

/** The checkbox of a row in the selector column. */
const SELECTION_CHECKBOX = '.owc-selectable-checkbox';

/** How far the pointer moves between press and release, in pixels, before a click counts as the end of a drag. */
const DRAG_DISTANCE = 4;

/** The link of a row in the `link` and `linkWithDetail` modes, seen from the row. */
const ROW_LINK = ':scope > .cell > a.row-click';

/**
 * Follows a link as a click on it does, for an event elsewhere that stands
 * for that click. The event's modifier keys go along, so Ctrl, Cmd and Shift
 * open the link the way the browser does it for the link itself.
 *
 * @param {Element} link
 * @param {KeyboardEvent | MouseEvent} event
 */
function followLink(link, { ctrlKey, metaKey, shiftKey }) {
  link.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      ctrlKey,
      metaKey,
      shiftKey,
    }),
  );
}

/**
 * The link of a row: where it goes, its name if `getRowLinkSettings` gave it
 * one, and the id for the content of its cell, which names it otherwise.
 *
 * @typedef {{ href: string, label?: string, contentId: string }} RowLink
 */

/**
 * Whether a cell's content shows nothing: no value, or only whitespace.
 *
 * @param {unknown} content
 */
function isBlank(content) {
  return (
    content === undefined ||
    content === null ||
    content === nothing ||
    (typeof content === 'string' && content.trim() === '')
  );
}

/**
 * Whether a column shows data: every column but the ones the table adds for
 * the selection and for the detail toggle.
 *
 * @param {{ field?: string }} column
 */
function isDataColumn(column) {
  return column.field !== '_selector' && column.field !== '_open-details';
}

/**
 * Whether the rows can be sorted by a column from its header cell.
 *
 * @param {{ formatter?: unknown, headerSort?: boolean }} column
 */
function isSortable(column) {
  return column.formatter !== 'rownum' && (column.headerSort ?? true);
}

/** `aria-sort` of a sortable column's header cell, by the order the rows are sorted in by it. */
const ARIA_SORT = { asc: 'ascending', desc: 'descending', none: 'none' };

/**
 * Whether the user can resize a column.
 *
 * @param {{ resizable?: boolean }} column
 */
function isResizable(column) {
  return column.resizable ?? true;
}

/**
 * The id of the name of the selector column, which names its header cell:
 * from its content, the select-all checkbox would add its own name to it.
 */
const SELECTION_COLUMN_NAME = 'selection-column-name';

/** How far Shift+← and Shift+→ on a header cell resize its column, in px. */
const KEY_RESIZE_STEP = 10;

/**
 * Whether an element is an editable cell's editor while it is editing, when
 * every key belongs to it.
 *
 * @param {EventTarget} target
 */
function isActiveEditor(target) {
  const element = /** @type {Element & { editable?: boolean }} */ (target);
  return Boolean(element.localName?.startsWith('owc-click-editable-')) && element.editable === true;
}

/**
 * @template {Record<string, unknown>} T
 */
export class OwcTable extends ScopedElementsMixin(LitElement) {
  #localize = new OwcLocalizeController(this);
  #liveRegion = new LiveRegionController(this);
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
    label: { type: String },
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
    /**
     * The accessible name of the table's grid. Without it, the grid is named
     * by the localization term `tableLabel`.
     * @type {string | undefined}
     */
    this.label = undefined;
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

  /** @type {ResizeObserver | undefined} */
  #headerResizeObserver;

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

  /**
   * The indices of the list's items that have an open detail, and what they
   * were found from.
   *
   * @type {{ items?: unknown[], openDetails?: unknown[], renderMode?: string, indices: number[], has: Set<number> }}
   */
  #openDetailRows = { indices: [], has: new Set() };

  /** @type {WeakMap<import('./groupedList.js').Group, GroupHeader>} */
  #groupHeaders = new WeakMap();

  /**
   * Where the mouse button went down in the grid, in client coordinates.
   *
   * @type {{ x: number, y: number } | undefined}
   */
  #pressedAt;

  /** Whether the mouse button just went down in the grid: the focus that moves now follows that press. */
  #pressing = false;

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
   * Keeps `--_owc-table-header-height` at the height of the header row. With
   * a sticky header, rows and cells that scroll into view leave that much
   * room above them (see the styles), so the header never covers them.
   */
  #observeHeaderHeight() {
    const header = this.renderRoot?.querySelector('.table-header');
    if (!header) {
      // not rendered yet: `firstUpdated` comes back
      return;
    }
    this.#headerResizeObserver ??= new ResizeObserver(entries => {
      // rounded up, so a scroll position in whole px leaves the whole height free
      const height = Math.ceil(entries.at(-1)?.borderBoxSize[0]?.blockSize ?? 0);
      this.style.setProperty('--_owc-table-header-height', `${height}px`);
    });
    this.#headerResizeObserver.observe(header);
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
    this.#observeHeaderHeight();
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
    const grid = this.#grid;
    if (grid) {
      // New rows and new cell content bring new controls with every render.
      keepOutOfTabOrder(grid, CELL_CONTENT);
      if (this.#hadFocusBeforeRender) {
        this.#keepFocusAfterRender();
      }
      this.#updateTabStop();
    }
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
    // The render may remove the element that has the focus.
    this.#hadFocusBeforeRender = this.#hasRovingFocus();
    if (this.#hadFocusBeforeRender) {
      this.#parkFocusBeforeRender();
    }
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
    this.#observeHeaderHeight();
    void this.recalculateColumnWidths();
    this.handleInitialData();
    this.loadStateFromUrl();
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.#handleWindowResize);
    this.#hostResizeObserver?.disconnect();
    this.#headerResizeObserver?.disconnect();
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
    // Where the focus is now: on the button, or on the page in browsers whose
    // buttons don't take the focus from a click, like Safari.
    const focusBefore = deepActiveElement();
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
    const inTable = Boolean(/** @type {ShadowRoot} */ (this.renderRoot).activeElement);
    if (!inTable && deepActiveElement() !== focusBefore) {
      // the focus went elsewhere while the row was brought in: it stays there
      return;
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

  /** Whether the body shows the empty message instead of the list. */
  #isEmpty() {
    return !(this.allData?.length > 0);
  }

  // The grid: one Tab stop, a roving focus on its cells, and the keys that
  // move it. src/table/README.md ("Keyboard and focus") describes the model.

  get #grid() {
    return /** @type {HTMLElement | null} */ (this.renderRoot?.querySelector('#data-table'));
  }

  /**
   * The cell the roving focus is on, or was on last: what identifies its row
   * (see `gridFocus.js`; a symbol for the header row and for the empty
   * message), and the index of its column among the visible columns. A row
   * with one cell across all columns keeps the column the focus came from.
   *
   * `index` is the row's index in the list `items`, where the row was found
   * last. It only says where to look: when the row is gone from a new list,
   * the row now at that index takes its place.
   *
   * @type {{
   *   row: import('./gridFocus.js').RowIdentity | symbol | undefined,
   *   column: number,
   *   index: number,
   *   items?: Array<T | GroupHeader>,
   * }}
   */
  #remembered = { row: undefined, column: 0, index: 0 };

  /**
   * The element with `tabindex="0"`: the grid's one Tab stop. `undefined`
   * while the focus is on a control in a cell, when nothing in the grid is a
   * Tab stop, so Tab and Shift+Tab leave the grid from there.
   *
   * @type {HTMLElement | undefined}
   */
  #tabStop;

  /**
   * The cell whose controls have the focus in interaction mode.
   *
   * @type {HTMLElement | undefined}
   */
  #interactionCell;

  /** Whether the roving focus was in the grid when the render that is under way started. */
  #hadFocusBeforeRender = false;

  /** Whether the grid element is taking the focus itself, which isn't the focus coming in from Tab. */
  #takingFocusOnGrid = false;

  /** Whether the grid is moving the focus from a cell on to the cell's control. */
  #forwardingFocus = false;

  /**
   * Where a navigation key is moving the focus while the row is brought in,
   * so the next key continues from there.
   *
   * @type {import('./gridNavigation.js').GridPosition | undefined}
   */
  #pendingPosition;

  /** Counts the moves of the roving focus, so a move knows when a later one replaced it. */
  #focusMove = 0;

  /** Resolves once the last row the grid asked the virtualizer for is in view. */
  #scrolledToRow = Promise.resolve();

  /**
   * The grid's own cell among the targets of an event: the event comes from
   * the cell or from its content. `undefined` for events from elsewhere in
   * the grid, like a detail, and for cells of a table nested in this one.
   *
   * @param {EventTarget[]} path the event's composed path
   */
  #cellIn(path) {
    for (const target of path) {
      if (target === this.#grid) {
        break;
      }
      if (target instanceof HTMLElement && this.#isCell(target)) {
        return target;
      }
    }
    return undefined;
  }

  /** @param {Element} element */
  #isCell(element) {
    return (
      element.getRootNode() === this.renderRoot &&
      element.parentElement?.getAttribute('role') === 'row' &&
      element.matches('.cell, .full-width-cell')
    );
  }

  /**
   * The cell that is, or holds, an element of the table's shadow root.
   *
   * @param {Element | null} element
   */
  #cellOf(element) {
    for (
      let current = element;
      current && current !== this.#grid;
      current = current.parentElement
    ) {
      if (this.#isCell(current)) {
        return /** @type {HTMLElement} */ (current);
      }
    }
    return undefined;
  }

  /**
   * The rendered row of the grid at a row of a position.
   *
   * @param {number} row `HEADER_ROW`, or an index of the list
   */
  #rowElementAt(row) {
    if (row === HEADER_ROW) {
      return this.renderRoot.querySelector('.table-header > .row');
    }
    if (this.#isEmpty()) {
      return row === 0 ? this.renderRoot.querySelector('#empty-message-wrapper') : null;
    }
    // a Data Row or an insert row in its container, or a group header
    return this.renderRoot.querySelector(
      `#virtualize-container > .row-container > .row[data-index="${row}"],` +
        ` #virtualize-container > [data-index="${row}"]`,
    );
  }

  /**
   * The rendered cell at a position: in a row with one cell, that cell.
   *
   * @param {import('./gridNavigation.js').GridPosition | undefined} position
   */
  #cellAt(position) {
    if (!position) {
      return undefined;
    }
    const rowElement = this.#rowElementAt(position.row);
    if (position.detail) {
      // the open detail after the Data Row
      const detail = rowElement?.nextElementSibling;
      return detail?.matches('.detail-row[role="row"]')
        ? (/** @type {HTMLElement | null} */ (detail.querySelector(CELLS)) ?? undefined)
        : undefined;
    }
    const cells = /** @type {NodeListOf<HTMLElement> | undefined} */ (
      rowElement?.querySelectorAll(CELLS)
    );
    return cells?.[Math.min(position.column, cells.length - 1)];
  }

  /**
   * @param {HTMLElement} cell
   * @returns {import('./gridNavigation.js').GridPosition}
   */
  #positionOf(cell) {
    const rowElement = /** @type {HTMLElement} */ (cell.parentElement);
    const { column } = this.#remembered;
    if (rowElement.classList.contains('detail-row')) {
      // an open detail, at the row of its Data Row, which comes right before it
      const dataRow = /** @type {HTMLElement} */ (rowElement.previousElementSibling);
      return { row: Number(dataRow.dataset.index), column, detail: true };
    }
    if (cell.classList.contains('full-width-cell')) {
      // A row with one cell keeps the column the focus came from. It is a
      // group header, or the message of an empty table, the body's only row.
      return { row: Number(rowElement.dataset.index ?? 0), column };
    }
    return {
      row: rowElement.parentElement?.classList.contains('table-header')
        ? HEADER_ROW
        : Number(rowElement.dataset.index),
      column: [...rowElement.querySelectorAll(CELLS)].indexOf(cell),
    };
  }

  /**
   * Remembers the cell at a position as the one the roving focus is on.
   *
   * @param {import('./gridNavigation.js').GridPosition} position
   */
  #remember({ row, column, detail }) {
    const { items } = this.#list;
    if (row === HEADER_ROW) {
      this.#remembered = { row: HEADER_ITEM, column, index: 0 };
    } else if (this.#isEmpty()) {
      this.#remembered = { row: EMPTY_ITEM, column, index: 0 };
    } else if (row < items.length) {
      this.#remembered = {
        row: detail
          ? detailIdentity(this.getRowId(/** @type {T} */ (items[row])))
          : rowIdentity(items[row], { getRowId: this.getRowId }),
        column,
        index: row,
        items,
      };
    }
  }

  /**
   * The remembered cell's position in the list, whether its row is rendered
   * or not. If its row is gone from the list, it is the cell of the row that
   * is at its place now. `undefined` while the grid remembers no cell, or
   * while no row of the body can take the focus.
   *
   * @returns {import('./gridNavigation.js').GridPosition | undefined}
   */
  #rememberedPosition() {
    const remembered = this.#remembered;
    const { row, column } = remembered;
    if (row === undefined) {
      return undefined;
    }
    if (row === HEADER_ITEM) {
      return { row: HEADER_ROW, column };
    }
    if (this.#isEmpty()) {
      // the message is the only row of the body
      return { row: 0, column };
    }
    const { items } = this.#list;
    if (remembered.items !== items) {
      // The list changed: find the row again, once. Scrolling doesn't get here.
      remembered.items = items;
      const found = typeof row === 'symbol' ? -1 : this.#indexOfRow(row);
      remembered.index =
        found >= 0 ? found : (nearestRow(remembered.index, this.#gridShape()) ?? -1);
    }
    if (remembered.index < 0) {
      return undefined;
    }
    // A detail is found where its Data Row is. Once it is closed, the focus
    // belongs on the Data Row.
    const onDetail =
      typeof row !== 'symbol' && row.detail && this.#openDetailRows.has.has(remembered.index);
    return onDetail
      ? { row: remembered.index, column, detail: true }
      : { row: remembered.index, column };
  }

  /**
   * The index of a row in the list, -1 if it isn't there.
   *
   * @param {import('./gridFocus.js').RowIdentity} row
   */
  #indexOfRow(row) {
    // `indexOfRow` skips rows `getRowId` throws for: rendering such a row
    // says so, looking for another row shouldn't
    return indexOfRow(this.#list.items, row, this.getRowId);
  }

  /** Whether the roving focus is in the grid: on a cell, in a cell, or parked on the grid itself. */
  #hasRovingFocus() {
    const active = /** @type {ShadowRoot | undefined} */ (this.renderRoot)?.activeElement;
    return Boolean(active) && (active === this.#grid || this.#cellOf(active ?? null) !== undefined);
  }

  /**
   * Parks the focus on the grid before a render takes the remembered row out
   * of the rendered rows, so the focus goes from the cell to the grid and is
   * never on the page in between.
   */
  #parkFocusBeforeRender() {
    const slice = this.#slice;
    if (!slice || this.#pendingPosition || this.#isEmpty()) {
      return;
    }
    const row = this.#rememberedPosition()?.row;
    const leaves =
      row !== undefined && row !== HEADER_ROW && (row < slice.first || row > slice.last);
    if (leaves && /** @type {ShadowRoot} */ (this.renderRoot).activeElement !== this.#grid) {
      this.#holdFocusOnGrid();
    }
  }

  /**
   * Keeps the roving focus on the remembered cell through a render. A render
   * can take the cell's element away (its row left the rendered rows, or was
   * filtered out), move it, or show another row in it. While the cell isn't
   * rendered, the focus is parked on the grid, which always is: it would fall
   * to the page otherwise, and keys wouldn't reach the grid anymore. Parking
   * doesn't scroll. Only called when the focus was in the grid before the
   * render, so a render never pulls the focus back from elsewhere.
   */
  #keepFocusAfterRender() {
    if (this.#pendingPosition) {
      // a move is on its way, and holds the focus on the grid itself
      return;
    }
    const grid = /** @type {HTMLElement} */ (this.#grid);
    const active = /** @type {ShadowRoot} */ (this.renderRoot).activeElement;
    const cell = this.#cellAt(this.#rememberedPosition() ?? this.#firstPosition());
    if (!cell) {
      if (active !== grid) {
        this.#holdFocusOnGrid();
      }
    } else if (!active || this.#cellOf(active) !== cell) {
      this.#focusCell(cell);
      // In a row this render created, the controls haven't rendered their
      // shadow trees yet, so the focus is on the cell. A frame later the grid
      // can tell whether it belongs on a control.
      requestAnimationFrame(() => {
        if (/** @type {ShadowRoot} */ (this.renderRoot).activeElement === cell) {
          this.#focusCell(cell);
        }
      });
    }
  }

  /** The first cell of the first body row, or of the header row in a table without body rows. */
  #firstPosition() {
    const start = { row: HEADER_ROW, column: 0 };
    return moveInGrid(start, 'Control+Home', this.#gridShape()) ?? start;
  }

  /**
   * What `moveInGrid` needs to know about the grid.
   *
   * @param {number} [pageSize]
   * @returns {import('./gridNavigation.js').GridShape}
   */
  #gridShape(pageSize = 1) {
    const { items } = this.#list;
    const columnCount = this.#visibleColumns.length;
    if (this.#isEmpty()) {
      return { rowCount: 1, columnCount, pageSize, isFullWidth: () => true };
    }
    return {
      rowCount: items.length,
      columnCount,
      pageSize,
      isFullWidth: this.#isGrouped() ? row => items[row] instanceof GroupHeader : undefined,
      hasDetail: this.#openDetailRows.indices.length
        ? row => this.#openDetailRows.has.has(row)
        : undefined,
    };
  }

  /**
   * The number of rows that fit into the visible part of the table body,
   * which PageUp and PageDown move by.
   *
   * @param {HTMLElement | undefined} cell a cell of the row whose height stands for all rows
   */
  #pageSize(cell) {
    const grid = /** @type {HTMLElement} */ (this.#grid);
    let top = 0;
    let bottom = window.innerHeight;
    const container = this.scrollTarget ?? findScrollContainer(grid);
    if (container instanceof Element && !isDocumentScroller(container)) {
      const rect = container.getBoundingClientRect();
      top = Math.max(top, rect.top + container.clientTop);
      bottom = Math.min(bottom, rect.top + container.clientTop + container.clientHeight);
    }
    const header = grid.querySelector('.table-header')?.getBoundingClientRect();
    const body = grid.querySelector('.table-body')?.getBoundingClientRect();
    // The header row covers the top of the visible part when it sticks.
    top = Math.max(top, header?.bottom ?? top, body?.top ?? top);
    bottom = Math.min(bottom, body?.bottom ?? bottom);
    const row = cell?.parentElement ?? grid.querySelector('.table-body [role="row"]');
    const rowHeight = row?.getBoundingClientRect().height || 47;
    return Math.max(1, Math.floor((bottom - top) / rowHeight));
  }

  /**
   * Makes one element the grid's Tab stop, or none.
   *
   * @param {HTMLElement | undefined} element a cell or the grid
   */
  #setTabStop(element) {
    const previous = this.#tabStop;
    if (previous !== element) {
      this.#tabStop = element;
      if (previous === this.#grid) {
        this.#releaseGridFocus();
      } else {
        // cells stay focusable for pointers and scripts
        previous?.setAttribute('tabindex', '-1');
      }
    }
    if (element && element.getAttribute('tabindex') !== '0') {
      element.setAttribute('tabindex', '0');
    }
  }

  /**
   * Moves the focus to the grid itself while the row the focus goes to is
   * brought in: the row it is on may leave the rendered rows, and keys have
   * to keep arriving at the grid. The grid is focusable only while it holds
   * the focus or is the Tab stop, so a click beside a cell's content doesn't
   * land on it.
   */
  #holdFocusOnGrid() {
    const grid = /** @type {HTMLElement} */ (this.#grid);
    if (!grid.hasAttribute('tabindex')) {
      grid.setAttribute('tabindex', '-1');
    }
    this.#takingFocusOnGrid = true;
    try {
      grid.focus({ preventScroll: true });
    } finally {
      this.#takingFocusOnGrid = false;
    }
  }

  /** Makes the grid unfocusable again, unless it is the Tab stop or still holds the focus. */
  #releaseGridFocus() {
    const grid = /** @type {HTMLElement} */ (this.#grid);
    if (this.#tabStop === grid) {
      return;
    }
    if (/** @type {ShadowRoot} */ (this.renderRoot).activeElement === grid) {
      grid.setAttribute('tabindex', '-1');
    } else {
      grid.removeAttribute('tabindex');
    }
  }

  /**
   * Where the focus belongs in a cell: on the cell, or on its control if it
   * has exactly one simple control. The header cell of a column that can be
   * sorted always keeps it: Enter and Space sort there, so a control in its
   * label is reached like one of several, with F2.
   *
   * @param {HTMLElement} cell
   * @param {HTMLElement[]} [controls] the cell's controls
   */
  #focusTargetOf(cell, controls = controlsIn(cell, CELL_CONTROL_OPTIONS)) {
    return controls.length === 1 &&
      isSimpleControl(controls[0]) &&
      !this.#sorterOf(cell) &&
      !this.#isDetailCell(cell)
      ? controls[0]
      : cell;
  }

  /**
   * Whether a cell is the one cell of an open detail. Its content is
   * arbitrary, so it always keeps the focus itself, like a cell with several
   * controls: Enter or F2 go in, Escape comes back.
   *
   * @param {HTMLElement} cell
   */
  #isDetailCell(cell) {
    return Boolean(cell.parentElement?.classList.contains('detail-row'));
  }

  /**
   * What sorts the rows by a cell's column: the `owc-table-header-cell` of a
   * header cell whose column can be sorted.
   *
   * @param {HTMLElement} cell
   */
  #sorterOf(cell) {
    if (cell.getAttribute('role') !== 'columnheader') {
      return undefined;
    }
    const sorter = /** @type {OwcTableHeaderCell | null} */ (
      cell.querySelector('owc-table-header-cell')
    );
    return sorter?.sortable ? sorter : undefined;
  }

  /**
   * Gives a cell the focus where it belongs (`#focusTargetOf`). The caller
   * scrolls: a control in a shadow tree has none of the cell's scroll margin.
   *
   * @param {HTMLElement} cell
   * @param {HTMLElement} [target] what `#focusTargetOf` returned for the cell
   */
  #focusCell(cell, target = this.#focusTargetOf(cell)) {
    if (target === cell) {
      cell.focus({ preventScroll: true });
    } else {
      focusControl(target, { preventScroll: true });
    }
  }

  /**
   * Keeps the grid one Tab stop after a render or after the focus left it:
   * the remembered cell while it is rendered, else the first cell of the
   * first body row, else the grid itself, which then brings that row in when
   * it gets the focus.
   *
   * @param {{ focusLeft?: boolean }} [options] `focusLeft`: the focus is leaving the grid right now
   */
  #updateTabStop({ focusLeft = false } = {}) {
    const grid = /** @type {HTMLElement} */ (this.#grid);
    const active = focusLeft ? null : /** @type {ShadowRoot} */ (this.renderRoot).activeElement;
    const focusedCell = active && active !== grid ? this.#cellOf(active) : undefined;
    if (focusedCell) {
      // A cell with the focus is the Tab stop. With the focus on a control in
      // it, Shift+Tab would stop at the cell on its way out, so nothing is.
      this.#setTabStop(active === focusedCell ? focusedCell : undefined);
      return;
    }
    this.#setTabStop(this.#cellAt(this.#rememberedPosition() ?? this.#firstPosition()) ?? grid);
  }

  /**
   * Follows the focus through the grid: remembers the cell, hands the focus
   * of a cell with one simple control on to that control, and tracks
   * interaction mode.
   *
   * @param {FocusEvent} event
   */
  #handleGridFocusin(event) {
    const grid = /** @type {HTMLElement} */ (event.currentTarget);
    const path = event.composedPath();
    if (path[0] === grid) {
      // The grid is the Tab stop while the remembered cell isn't rendered,
      // and Tab moves on from it to that cell, which brings its row back.
      // Focus that the grid takes itself stays, and so does focus from a
      // pointer, which would scroll away from what it clicked.
      const fromOutside = !(
        event.relatedTarget instanceof Node && grid.contains(event.relatedTarget)
      );
      if (fromOutside && !this.#takingFocusOnGrid && grid.matches(':focus-visible')) {
        void this.#focusPosition(this.#rememberedPosition() ?? this.#firstPosition());
      }
      return;
    }
    const cell = this.#cellIn(path);
    if (!cell) {
      return;
    }
    const previousRow = this.#remembered.row;
    this.#remember(this.#positionOf(cell));
    // what the live region says: the annotation of a row the focus comes into
    const messages = isSameRow(previousRow, this.#remembered.row)
      ? []
      : [this.#annotationTextOf(cell)].filter(text => text !== '');
    const controls = controlsIn(cell, CELL_CONTROL_OPTIONS);
    const target = this.#focusTargetOf(cell, controls);
    const onControl = controls.some(control => path.includes(control));
    if (!onControl && path[0] !== target && !this.#forwardingFocus) {
      // The focus is on the cell, but belongs on its control; or it is on
      // something in the cell that is no control, like a clicked icon.
      if (this.#pressing) {
        // Moving the focus while the mouse button goes down would keep the
        // press from starting a text selection, so it waits for the release.
        this.#forwardFocusOnRelease(cell);
      } else {
        this.#forwardingFocus = true;
        try {
          this.#focusCell(cell, target);
        } finally {
          this.#forwardingFocus = false;
        }
        this.#announceAll(messages);
        return;
      }
    }
    if (onControl && target === cell) {
      if (this.#interactionCell !== cell) {
        this.#interactionCell = cell;
        messages.push(this.#localize.term('tableInteractionHint'));
      }
    } else {
      this.#interactionCell = undefined;
    }
    this.#announceAll(messages);
    this.#setTabStop(path[0] === cell ? cell : undefined);
  }

  /**
   * Hands the focus in a cell on to where it belongs (`#focusTargetOf`) once
   * the mouse button comes up, if the focus is still in the cell then.
   *
   * @param {HTMLElement} cell
   */
  #forwardFocusOnRelease(cell) {
    window.addEventListener(
      'mouseup',
      () => {
        const active = /** @type {ShadowRoot} */ (this.renderRoot).activeElement;
        if (active && cell.contains(active)) {
          this.#focusCell(cell);
        }
      },
      { once: true, capture: true },
    );
  }

  /**
   * The text of the annotation of a cell's row, `''` for a row without one.
   *
   * @param {HTMLElement} cell
   */
  #annotationTextOf(cell) {
    const id = cell.parentElement?.getAttribute('aria-describedby');
    const annotation = id ? /** @type {ShadowRoot} */ (this.renderRoot).getElementById(id) : null;
    return annotation?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }

  /**
   * Says messages in the live region as one: of several messages in a row,
   * it would only say the last one.
   *
   * @param {string[]} messages
   */
  #announceAll(messages) {
    if (messages.length > 0) {
      this.#liveRegion.announce(messages.join(' '));
    }
  }

  /** @param {FocusEvent} event */
  #handleGridFocusout(event) {
    const grid = /** @type {HTMLElement} */ (event.currentTarget);
    if (!(event.relatedTarget instanceof Node && grid.contains(event.relatedTarget))) {
      this.#interactionCell = undefined;
      this.#updateTabStop({ focusLeft: true });
    }
    if (event.composedPath()[0] === grid && this.#tabStop !== grid) {
      // it held the focus for a row that was brought in
      grid.removeAttribute('tabindex');
    }
  }

  /**
   * The grid's keys. They only count when they come from a cell, or from the
   * grid itself while it holds the focus for a row that is brought in or that
   * isn't rendered. There, only the navigation keys do something: Enter needs
   * a cell, so it never acts on a row the user doesn't see. Shift+Space has a
   * listener of its own, `#selectionKeyListener`.
   *
   * @param {KeyboardEvent} event
   */
  #handleGridKeydown(event) {
    const path = event.composedPath();
    const cell = this.#cellIn(path);
    if (event.defaultPrevented || (!cell && path[0] !== event.currentTarget)) {
      return;
    }
    const key = keyName(event);
    if (cell && (key === 'Tab' || key === 'Shift+Tab') && this.#isInInsertRow(cell)) {
      // also from an editor that edits: Tab moves on like in a form
      this.#tabInInsertRow(event, key, cell, path);
      return;
    }
    if (path.some(isActiveEditor)) {
      return;
    }
    if (cell && path[0] !== cell && this.#interactionCell === cell) {
      // interaction mode: the cell's controls get every key but Tab, Shift+Tab and Escape
      handleInteractionKey(event, cell, CELL_CONTROL_OPTIONS);
      return;
    }
    if (cell?.getAttribute('role') === 'columnheader' && this.#handleHeaderKey(event, key, cell)) {
      return;
    }
    const group = cell && this.#groupOf(cell);
    if (group && this.#handleGroupKey(event, key, group)) {
      return;
    }
    // Enter with Ctrl, Cmd or Shift is for a row's link, as on any link.
    const isEnter = event.key === 'Enter' && !event.altKey;
    if (cell && path[0] === cell && (isEnter || key === 'F2')) {
      const [first] = controlsIn(cell, CELL_CONTROL_OPTIONS);
      if (!first && isEnter) {
        this.#triggerRowAction(cell, event);
      } else if (first && (key === 'Enter' || key === 'F2')) {
        event.preventDefault();
        focusControl(first);
      }
      return;
    }
    const from =
      this.#pendingPosition ?? (cell ? this.#positionOf(cell) : this.#rememberedPosition());
    const pageSize = key === 'PageUp' || key === 'PageDown' ? this.#pageSize(cell) : 1;
    const to = moveInGrid(from ?? this.#firstPosition(), key, this.#gridShape(pageSize));
    if (to) {
      // The grid owns its navigation keys, also where they have nowhere to go.
      event.preventDefault();
      // Without a cell to move from, the first key goes to the first cell.
      void this.#focusPosition(from ? to : this.#firstPosition());
    }
  }

  /**
   * The keys of a header cell. Enter and Space on the cell sort by its
   * column, as a click on it does. Shift+← and Shift+→ make a column that can
   * be resized narrower or wider, as dragging its edge does, and
   * Shift+Backspace resets its width, as a double-click on its edge does.
   *
   * @param {KeyboardEvent} event
   * @param {string} key
   * @param {HTMLElement} cell a header cell
   * @returns {boolean} whether the key was one of them, so the grid is done with it
   */
  #handleHeaderKey(event, key, cell) {
    if ((key === 'Enter' || key === 'Space') && event.composedPath()[0] === cell) {
      const sorter = this.#sorterOf(cell);
      if (sorter) {
        event.preventDefault();
        sorter.cycleSort();
        return true;
      }
    }
    if (key === 'Shift+ArrowLeft' || key === 'Shift+ArrowRight' || key === 'Shift+Backspace') {
      const column = this.#visibleColumns[this.#positionOf(cell).column];
      if (column && isResizable(column)) {
        event.preventDefault();
        if (key === 'Shift+Backspace') {
          void this.#resetColumnWidth(column).then(() => this.#announceWidthOf(column.field));
        } else {
          const step = key === 'Shift+ArrowRight' ? KEY_RESIZE_STEP : -KEY_RESIZE_STEP;
          this.#resizeColumnBy(column, step, cell);
        }
        return true;
      }
    }
    return false;
  }

  /**
   * The group whose header a cell is the one cell of.
   *
   * @param {HTMLElement} cell
   */
  #groupOf(cell) {
    const index = cell.parentElement?.dataset.index;
    const item =
      index !== undefined && cell.classList.contains('full-width-cell')
        ? this.#list.items[Number(index)]
        : undefined;
    return item instanceof GroupHeader ? item : undefined;
  }

  /**
   * The keys of a group header, from its cell or from the cell's button: →
   * expands the group and ← collapses it. Enter and Space toggle it without
   * the grid, as clicks of the button.
   *
   * @param {KeyboardEvent} event
   * @param {string} key
   * @param {GroupHeader} header
   * @returns {boolean} whether the key was one of them, so the grid is done with it
   */
  #handleGroupKey(event, key, header) {
    if (key !== 'ArrowLeft' && key !== 'ArrowRight') {
      return false;
    }
    // the group's own keys, also where it is expanded or collapsed already
    event.preventDefault();
    if (header.active !== (key === 'ArrowRight')) {
      this.#toggleGroup(header);
    }
    return true;
  }

  /**
   * Says the width of a column in the live region, for a user who changed it
   * from the keyboard and may not see it.
   *
   * @param {string} field the column's field: the columns can be new objects by now
   */
  #announceWidthOf(field) {
    const column = this.#visibleColumns.find(visible => visible.field === field);
    const width = column?.width ?? column?._calculatedWidth;
    if (width != null) {
      this.#liveRegion.announce(this.#localize.term('tableColumnWidth', Math.round(width)));
    }
  }

  /**
   * Makes a column wider or narrower from the keyboard, and says its new
   * width in the live region.
   *
   * @param {import('./OwcTable.types.js').Column<T>} column a visible column
   * @param {number} delta in px
   * @param {HTMLElement} cell the column's header cell
   */
  #resizeColumnBy(column, delta, cell) {
    const current = column.width ?? column._calculatedWidth ?? cell.getBoundingClientRect().width;
    const width = Math.max(this.#MIN_COLUMN_WIDTH, Math.round(current) + delta);
    this.#setColumnWidth(column, width);
    this.#columnResized();
    this.#announceWidthOf(column.field);
  }

  /**
   * Gives a column a width of the user's, which wins over its configured
   * and its measured width until it is reset.
   *
   * @param {import('./OwcTable.types.js').Column<T>} column a visible column
   * @param {number} width in px
   */
  #setColumnWidth(column, width) {
    column.width = width;
    this.#columnWidths[column.field] = width;
    this.#updateColumnCssVariables();
  }

  /**
   * After the user resized a column: a full-width table fits its other
   * columns to the container again, and rows that wrap differently now are
   * measured again.
   */
  #columnResized() {
    if (this.growFullWidth) {
      void this.recalculateColumnWidths();
    } else {
      this.#remeasureRowsIfWidthsChanged();
    }
  }

  /**
   * The Data Row a cell belongs to. `undefined` for the cells of other rows:
   * the header row, group headers, details, insert rows and the message of
   * an empty table.
   *
   * @param {HTMLElement} cell
   * @returns {T | undefined}
   */
  #dataRowOf(cell) {
    const { row, detail } = this.#positionOf(cell);
    const item =
      row === HEADER_ROW || detail || this.#isEmpty() ? undefined : this.#list.items[row];
    return item !== undefined && this.#isDataRow(item) ? /** @type {T} */ (item) : undefined;
  }

  /**
   * Shift+Space toggles the selection of the Data Row the focus is in, from
   * the cell or from a control in it. The grid takes the key on its way down
   * to the control, which never gets it: a button isn't pressed, and an
   * editable cell doesn't start to edit. On a group header it does nothing:
   * there is no row to select, and the header's button isn't pressed. Three
   * places keep the key:
   *
   * - an editor that is editing and the controls of a cell in interaction
   *   mode, where it is a space;
   * - the row's own checkbox, which toggles itself, and whose click selects
   *   the row;
   * - the grid while the focus is parked on it, with no rendered row to act on.
   */
  #selectionKeyListener = {
    capture: true,
    /** @param {KeyboardEvent} event */
    handleEvent: event => {
      if (!this.selectable || event.defaultPrevented || keyName(event) !== 'Shift+Space') {
        return;
      }
      const path = event.composedPath();
      const cell = this.#cellIn(path);
      if (
        !cell ||
        path.some(isActiveEditor) ||
        (path[0] !== cell && this.#interactionCell === cell) ||
        path.some(target => target instanceof Element && target.matches(SELECTION_CHECKBOX))
      ) {
        return;
      }
      const row = this.#dataRowOf(cell);
      if (row || this.#groupOf(cell)) {
        // a group header has nothing to select, and its button isn't pressed either
        event.preventDefault();
        event.stopPropagation();
      }
      if (row) {
        this.#toggleSelection(row);
      }
    },
  };

  /**
   * The row's action, which Enter triggers on a cell without controls: what a
   * click on the row does. A row with a link follows it, also with Ctrl, Cmd
   * or Shift, which mean what they mean on any link; other rows only take a
   * plain Enter.
   *
   * @param {HTMLElement} cell
   * @param {KeyboardEvent} event an Enter
   */
  #triggerRowAction(cell, event) {
    const row = this.#dataRowOf(cell);
    if (!row) {
      return;
    }
    const link = cell.parentElement?.querySelector(ROW_LINK);
    if (link) {
      event.preventDefault();
      followLink(link, event);
      return;
    }
    if (event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }
    event.preventDefault();
    if (this.#togglesDetail()) {
      this.#toggleDetail(row);
    }
    this.dispatchEvent(new RowClickEvent('rowClick', row));
  }

  /**
   * Whether a cell is one of an insert row's, whose fields Tab moves between.
   *
   * @param {HTMLElement} cell
   */
  #isInInsertRow(cell) {
    if (cell.classList.contains('full-width-cell') || this.#isEmpty()) {
      return false;
    }
    const { row, detail } = this.#positionOf(cell);
    const item = row === HEADER_ROW || detail ? undefined : this.#list.items[row];
    return item !== undefined && !(item instanceof GroupHeader) && this.isInsert({ data: item });
  }

  /**
   * Tab and Shift+Tab in an insert row, whose fields are open editors: they
   * move to the next or the previous Tab stop of the row's controls, as in a
   * form, from a field or from a cell of the row. From the last or the first
   * one, they leave the grid: nothing in the grid is a Tab stop while the
   * focus is on a control, so the browser's own Tab does that.
   *
   * @param {KeyboardEvent} event
   * @param {'Tab' | 'Shift+Tab'} key
   * @param {HTMLElement} cell a cell of an insert row
   * @param {EventTarget[]} path
   */
  #tabInInsertRow(event, key, cell, path) {
    const cells = [.../** @type {HTMLElement} */ (cell.parentElement).querySelectorAll(CELLS)];
    const stops = cells.flatMap(rowCell =>
      controlsIn(rowCell, CELL_CONTROL_OPTIONS)
        .flatMap(tabStopsOf)
        .map(stop => ({ cell: cells.indexOf(rowCell), stop })),
    );
    const current = stops.findIndex(({ stop }) => path.includes(stop));
    const column = cells.indexOf(cell);
    const next =
      current >= 0
        ? stops[key === 'Tab' ? current + 1 : current - 1]
        : key === 'Tab'
          ? stops.find(stop => stop.cell > column)
          : stops.filter(stop => stop.cell < column).at(-1);
    if (next) {
      event.preventDefault();
      next.stop.focus();
    }
  }

  /**
   * Moves the roving focus to a cell: brings its row in through the
   * virtualizer if it isn't rendered, scrolls the cell into view and focuses
   * the cell or its control.
   *
   * @param {import('./gridNavigation.js').GridPosition} position
   */
  async #focusPosition(position) {
    const move = ++this.#focusMove;
    this.#pendingPosition = position;
    if (this.#slice && !this.#cellAt(position)) {
      this.#holdFocusOnGrid();
      await this.#scrolledToRow;
      if (this.#wasMoveDropped(move, position)) {
        return;
      }
      this.#scrolledToRow = this.#virtualizer.scrollToIndex(position.row, { block: 'nearest' });
      await this.#scrolledToRow;
      if (this.#wasMoveDropped(move, position)) {
        return;
      }
    }
    this.#pendingPosition = undefined;
    const cell = this.#cellAt(position);
    if (!cell) {
      return;
    }
    // A row with one cell keeps the column the focus comes from.
    this.#remembered = { ...this.#remembered, column: position.column };
    cell.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    this.#focusCell(cell);
  }

  /**
   * Whether a move of the roving focus is off after it waited for its row:
   * a later move replaced it, or the focus left the grid meanwhile. The grid
   * never takes the focus back, but the cell stays the one to come back to.
   *
   * @param {number} move
   * @param {import('./gridNavigation.js').GridPosition} position
   */
  #wasMoveDropped(move, position) {
    if (move !== this.#focusMove) {
      return true;
    }
    if (this.#hasRovingFocus()) {
      return false;
    }
    this.#pendingPosition = undefined;
    this.#remember(position);
    this.#updateTabStop();
    return true;
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

    // The header cells show the order of their columns from `jsonSorters` when they render.
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
    this.#updateOpenDetailRows();
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

  /**
   * Finds the items of the list with an open detail again when the list, the
   * open details or the render mode changed. Each is a row of the grid that
   * isn't an item of the list (see `gridRows.js`).
   */
  #updateOpenDetailRows() {
    const { items } = this.#list;
    const { openDetails, renderMode } = this;
    const previous = this.#openDetailRows;
    if (
      previous.items === items &&
      previous.openDetails === openDetails &&
      previous.renderMode === renderMode
    ) {
      return;
    }
    const indices = openDetailIndices(items, this.#openDetailPredicate());
    this.#openDetailRows = { items, openDetails, renderMode, indices, has: new Set(indices) };
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
    return html`<div id="virtualize-container" role="none">
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
    // A click anywhere in the header toggles the group, and so do Enter and
    // Space on its button, as clicks of the button.
    return html`
      <div
        data-index=${index}
        role="row"
        aria-rowindex=${gridRowIndex(index, this.#openDetailRows.indices)}
        style=${styleMap({ backgroundColor: header.backgroundColor })}
        class="group-label-container ${active ? 'active' : ''} data-container  ${
          !active && header.last ? 'last-row' : ''
        }"
        @click=${() => this.#toggleGroup(header)}
      >
        <div class="row-click"></div>
        <div
          class="full-width-cell"
          role="gridcell"
          aria-colspan=${this.#visibleColumns.length}
          tabindex="-1"
        >
          <button
            type="button"
            class="group-label"
            tabindex="-1"
            aria-expanded=${active ? 'true' : 'false'}
            aria-label=${this.#localize.term('tableGroupLabel', header.label, header.count)}
            style=${styleMap({ color: header.textColor })}
          >
            ${header.label}
            <wa-badge variant="neutral" pill>${header.count}</wa-badge>
            <wa-icon name=${active ? 'chevron-down' : 'chevron-right'}></wa-icon>
          </button>
        </div>
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
        role="grid"
        aria-label=${this.label || this.#localize.term('tableLabel')}
        aria-rowcount=${gridRowCount(
          this.#isEmpty() ? 0 : this.#list.items.length,
          this.#openDetailRows.indices,
        )}
        aria-busy=${this.loading ? 'true' : 'false'}
        aria-multiselectable=${ifDefined(this.selectable ? 'true' : undefined)}
        style=${styleMap({ '--owc-table-columns': this.#columnTracks() })}
        @mousedown=${this.#handleTableMouseDown}
        @keydown=${this.#handleGridKeydown}
        @focusin=${this.#handleGridFocusin}
        @focusout=${this.#handleGridFocusout}
      >
        <div class="table-header" role="rowgroup">${this.#renderHeader()}</div>
        <div class="table-body" role="rowgroup" @keydown=${this.#selectionKeyListener}>
          ${
            !this.#isEmpty()
              ? this.#renderListHost()
              : html`<div id="empty-message-wrapper" role="row" aria-rowindex="2">
                  <p
                    class="full-width-cell"
                    role="gridcell"
                    aria-colspan=${this.#visibleColumns.length}
                    tabindex="-1"
                  >
                    ${this.#localize.term('tableEmptyMessage')}
                  </p>
                </div>`
          }
        </div>
        <div id="loading-indicator" aria-hidden="true">
          <wa-spinner></wa-spinner>
        </div>
      </div>
    `;
  }

  #renderHeader() {
    return html`
      <div class="row" role="row" aria-rowindex="1">
        <span class="row-click" role="none"></span>
        ${this.#visibleColumns.map((column, index) => {
          const sortable = isSortable(column);
          const order = sortable ? this.#sortOrderOf(column) : undefined;
          return html`
            <div
              class="cell"
              role="columnheader"
              aria-sort=${ifDefined(sortable ? ARIA_SORT[order ?? 'none'] : undefined)}
              aria-labelledby=${ifDefined(
                column.field === '_selector' ? SELECTION_COLUMN_NAME : undefined,
              )}
              tabindex="-1"
            >
              <div class="cell-content">
                <owc-table-header-cell
                  tabindex="-1"
                  lang=${this.lang}
                  style="--owc-table-header-cell-align: ${column.align}"
                  .field=${column.field}
                  .sortable=${sortable}
                  .order=${order}
                  .customSorters=${column.sorter}
                >
                  ${typeof column.label === 'function' ? column.label() : column.label}
                </owc-table-header-cell>
              </div>
              ${
                isResizable(column)
                  ? html`<span
                      class="cell-resize"
                      data-visible-column-index=${index}
                      @dblclick=${this.#handleResizeDoubleClick}
                    ></span>`
                  : nothing
              }
            </div>
          `;
        })}
      </div>
    `;
  }

  /**
   * The order the rows are sorted in by a column, from `jsonSorters`: the
   * table's sort state. A column with sorters of its own is sorted when the
   * rows are sorted by the first of them.
   *
   * @param {import('./OwcTable.types.js').Column<T>} column
   */
  #sortOrderOf(column) {
    const field = column.sorter?.[0]?.field ?? column.field;
    return this.jsonSorters.find(sorter => sorter.field === field)?.order || undefined;
  }

  /**
   * A double-click on a column's resize handle resets the column's width.
   *
   * @param {Event} ev
   */
  #handleResizeDoubleClick(ev) {
    ev.stopPropagation();
    const target = /** @type {HTMLElement} */ (ev.currentTarget);
    const column = this.#visibleColumns[Number(target.dataset.visibleColumnIndex)];
    if (column) {
      void this.#resetColumnWidth(column);
    }
  }

  /**
   * Drops the width the user gave a column: the column goes back to its
   * originally configured width, or without one to the width that fits its
   * content.
   *
   * @param {import('./OwcTable.types.js').Column<T>} column a visible column
   * @returns {Promise<void>} resolves when the columns are sized again
   */
  #resetColumnWidth(column) {
    const defaultWidth = this.#defaultColumnWidths[column.field];
    if (defaultWidth != null) {
      column.width = defaultWidth;
    } else {
      delete column.width;
    }
    delete this.#columnWidths[column.field];

    this.#saveStateToUrl();
    return this.recalculateColumnWidths();
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
   * What lies under the cells of a row, as the row's first child. A row's
   * link isn't part of it: it is in the row's first data cell.
   *
   * @param {T} row
   * @returns {import('lit').TemplateResult}
   */
  renderRowMode(row) {
    if (this.isInsert({ data: row })) {
      return html`<div class="row-no-click"></div>`;
    }

    if (this.#togglesDetail()) {
      return html`<div class="row-click"></div>`;
    }

    return html`<div class="row-no-click"></div>`;
  }

  /**
   * The link of a row in the `link` and `linkWithDetail` modes. `undefined`
   * for rows without one.
   *
   * @param {T} row
   * @param {number} index the row's index in the list, which no other rendered row has
   * @returns {RowLink | undefined}
   */
  #rowLinkOf(row, index) {
    const isLinkMode = this.renderMode === 'link' || this.renderMode === 'linkWithDetail';
    if (!isLinkMode || this.isInsert({ data: row })) {
      return undefined;
    }
    const settings = row && this.getRowLinkSettings ? this.getRowLinkSettings(row) : undefined;
    return settings
      ? { href: settings.href, label: settings['aria-label'], contentId: `row-link-name-${index}` }
      : undefined;
  }

  /**
   * A row's link, as the first child of the row's first data cell, from where
   * it covers the row. It is named by its `label`, else by the content of its
   * cell. "Open row" names it when that content is empty, and when it has no
   * text, like an icon.
   *
   * @param {RowLink} link
   * @param {string | undefined} contentId the id of the cell's content, if it names the link
   */
  #renderRowLink({ href, label }, contentId) {
    return html`<a
      class="row-click"
      href=${href}
      aria-label=${label ?? this.#localize.term('tableOpenRow')}
      aria-labelledby=${ifDefined(contentId)}
      tabindex="-1"
    ></a>`;
  }

  /** Whether the rows toggle their detail themselves, without a toggle button. */
  #togglesDetail() {
    return this.renderMode === 'detail' || this.renderMode === 'detailDeferred';
  }

  /**
   * Opens the detail of a row, which closes every other detail, or closes it
   * if it is open.
   *
   * @param {T} row
   */
  #toggleDetail(row) {
    const rowId = this.getRowId(row);
    if (rowId) {
      if (this.openDetails?.includes(rowId)) {
        this.#closeDetail(rowId);
      } else {
        this.loadedDetailIdSet.add(rowId);
        this.openDetails = [rowId];
        this.#announceDetail('tableDetailsOpened');
      }
    }
  }

  /**
   * Closes the detail of a row: the user toggled it, or its content called
   * `closeDetail`.
   *
   * @param {string | number} rowId
   */
  #closeDetail(rowId) {
    if (this.openDetails?.includes(rowId)) {
      this.openDetails = this.openDetails.filter(id => id !== rowId);
      this.#announceDetail('tableDetailsClosed');
    }
  }

  /**
   * Says in the live region that a detail opened or closed, in the modes
   * whose rows toggle their detail themselves: the focus may be on any cell
   * of the row, or the toggle may come from the pointer. A toggle button
   * says it itself (`aria-expanded`).
   *
   * @param {'tableDetailsOpened' | 'tableDetailsClosed'} term
   */
  #announceDetail(term) {
    if (this.#togglesDetail()) {
      this.#liveRegion.announce(this.#localize.term(term));
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
    const annotation = this.renderAnnotation(row);
    // An annotation isn't a row of the grid. It describes its Data Row, and
    // the live region says it when the focus comes into the row.
    const annotationId =
      annotation !== nothing && mode === 'data-table' ? `row-annotation-${index}` : undefined;
    const annotationContent = annotationId
      ? html`<div class="row-annotation" id=${annotationId}>${annotation}</div>`
      : nothing;

    const rowId = this.getRowId(row);
    const hasDetailRow =
      mode === 'data-table' &&
      !this.isInsert({ data: row }) &&
      (this.renderMode === 'detail' ||
        this.renderMode === 'detailDeferred' ||
        this.renderMode === 'linkWithDetail') &&
      rowId;
    // A detail is a row of the grid while it is open, and its `wa-details` the
    // row's one cell. Closed, it is rendered all the same (in `detail` mode
    // with its content, so find-in-page finds its text), but has no part in the
    // grid: it is out of the accessibility tree, where the `<details>` inside
    // `wa-details` would be a group among the rows.
    const detailOpen = Boolean(hasDetailRow && this.openDetails?.includes(rowId));

    const rowLink = this.#rowLinkOf(row, index);
    const firstDataColumn = this.#visibleColumns.find(isDataColumn);
    const linkColumn = rowLink && firstDataColumn;
    // Rows that toggle their detail themselves say on their first data cell
    // whether it is open; `linkWithDetail` rows say it on their toggle button.
    const expandedColumn = hasDetailRow && this.#togglesDetail() ? firstDataColumn : undefined;

    const rawRowContent = html` <div
      class=${this.#shouldBeHighlighted(row) ? 'row highlighted' : 'row'}
      role="row"
      aria-rowindex=${gridRowIndex(index, this.#openDetailRows.indices)}
      aria-selected=${ifDefined(this.#canSelect(row) ? String(this.#isSelected(row)) : undefined)}
      aria-describedby=${ifDefined(annotationId)}
      data-index=${index}
      @click=${(/** @type {MouseEvent} */ ev) => this.#handleRowClick(ev, row)}
    >
      ${this.renderRowMode(row)}
      ${this.#visibleColumns.map(column =>
        this.#renderCell(row, column, position, {
          link: column === linkColumn ? rowLink : undefined,
          expanded: column === expandedColumn ? detailOpen : undefined,
        }),
      )}
    </div>`;

    const detailContent =
      hasDetailRow && this.#shouldRenderDetail(rowId)
        ? this.renderDetail(row, {
            jsonFilters: this.jsonFilters,
            closeDetail: () => this.#closeDetail(rowId),
          })
        : nothing;
    const rowDetail = hasDetailRow
      ? html`<div
          class="detail-row"
          role=${detailOpen ? 'row' : 'none'}
          aria-hidden=${ifDefined(detailOpen ? undefined : 'true')}
          aria-rowindex=${ifDefined(
            detailOpen ? gridRowIndex(index, this.#openDetailRows.indices) + 1 : undefined,
          )}
        >
          <wa-details
            class="full-width-cell"
            role=${ifDefined(detailOpen ? 'gridcell' : undefined)}
            aria-colspan=${ifDefined(detailOpen ? this.#visibleColumns.length : undefined)}
            tabindex=${ifDefined(detailOpen ? '-1' : undefined)}
            summary=${this.#localize.term('tableOpenDetails')}
            ?open=${detailOpen}
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
        </div>`
      : nothing;
    return mode === 'data-table'
      ? html`<div class="row-container ${last ? 'last-row' : ''}" role="none">
          ${annotationContent}${rawRowContent}${rowDetail}
        </div>`
      : rawRowContent;
  };

  /**
   * @param {T} row
   * @param {import('./OwcTable.types.js').Column<T>} column
   * @param {number} index
   * @param {{ link?: RowLink, expanded?: boolean }} [options]
   *   `link`: the row's link, for the cell that holds it;
   *   `expanded`: whether the row's detail is open, for the cell that says so
   */
  #renderCell(row, column, index, { link, expanded } = {}) {
    return getFieldPathContent(row, column, {
      renderType: this._renderType,
      requiredFields:
        column.type === 'editable'
          ? this.#visibleColumns.filter(col => col.editableOptions?.required).map(col => col.field)
          : [],
      render: ({ config, content }) => {
        // The content names the row's link, unless the link has a name or there is no content.
        const contentId =
          link && link.label === undefined && !isBlank(content) ? link.contentId : undefined;
        const rowLink = link ? this.#renderRowLink(link, contentId) : nothing;
        const ariaExpanded = expanded === undefined ? undefined : String(expanded);
        if (config.type === 'editable') {
          return html`<div
            class="cell ${column.cellClass}"
            role="gridcell"
            aria-expanded=${ifDefined(ariaExpanded)}
            tabindex="-1"
          >
            ${rowLink}
            <div class="cell-content ${'align-' + (column.align || 'start')}">
              <span class="cell-text" id=${ifDefined(contentId)}> ${content}</span>
            </div>
          </div>`;
        }
        return html`
          <div
            class="cell ${column.cellClass}"
            role="gridcell"
            aria-expanded=${ifDefined(ariaExpanded)}
            tabindex="-1"
          >
            ${rowLink}
            <div class="cell-content ${'align-' + (column.align || 'start')}">
              ${
                column.align === 'full'
                  ? html`<div class="cell-full" id=${ifDefined(contentId)}>${content}</div>`
                  : html`<span class="cell-text" id=${ifDefined(contentId)}> ${content} </span>`
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
    /** @param {T} [data] */
    const autoSetData = data => {
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
    // the Data Row with its detail
    const container = /** @type {HTMLElement} */ (ev.target).closest('.row-container');
    setTimeout(() => container?.scrollIntoView({ block: 'start' }), 5);
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
    /** Whether the click hit what a cell shows, not the space beside it. */
    let onContent = false;
    const path = ev.composedPath();
    for (const el of path) {
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
      if (typedEl.matches?.(CELL_CONTENT)) {
        onContent = true;
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
        useCheckbox.checked = this.#toggleSelection(row);
      }
      return;
    }
    // What the cells show can be selected: a drag over the row, whose end is
    // a click too, and the further clicks of a double or triple click on
    // text select, and aren't for the row's link or detail.
    const opensRow =
      !this.#endsDrag(ev) &&
      (!onContent || (ev.detail <= 1 && !ev.defaultPrevented && !this.#isForCellContent(path)));
    if (opensRow) {
      const link = /** @type {Element} */ (ev.currentTarget).querySelector(ROW_LINK);
      if (link && onContent) {
        // What the cells show lies above the row's link. A click on it that
        // nothing in the cell does anything with follows the link too: that
        // click then fires `rowClick`.
        followLink(link, ev);
        return;
      }
      if (this.#togglesDetail()) {
        this.#toggleDetail(row);
      }
    }
    this.dispatchEvent(new RowClickEvent('rowClick', row));
  }

  /**
   * Whether a click ends a drag of the mouse: the browser fires a click for a
   * drag too when the button comes up in the row it went down in. A click
   * without a pointer position, from the keyboard or from `click()`, never
   * does.
   *
   * @param {MouseEvent} ev
   */
  #endsDrag(ev) {
    const pressed = this.#pressedAt;
    return (
      ev.detail > 0 &&
      pressed !== undefined &&
      Math.hypot(ev.clientX - pressed.x, ev.clientY - pressed.y) > DRAG_DISTANCE
    );
  }

  /**
   * Whether a click in a cell is for something in the cell that reacts to
   * it: one of the cell's controls, or a `label` or `summary`.
   *
   * @param {EventTarget[]} path the click's composed path
   */
  #isForCellContent(path) {
    const cell = this.#cellIn(path);
    if (!cell) {
      return false;
    }
    const inCell = path.slice(0, path.indexOf(cell));
    return (
      inCell.some(target => target instanceof Element && target.matches('label, summary')) ||
      controlsIn(cell, CELL_CONTROL_OPTIONS).some(control => inCell.includes(control))
    );
  }

  /**
   * Selects a Data Row, or takes it out of the selection if it is selected.
   *
   * @param {T} row
   * @returns {boolean} whether the row is selected now
   */
  #toggleSelection(row) {
    const key = this.#rowKey(row);
    const selected = !this.#selectedSet.has(key);
    if (selected) {
      this.#selectedSet.add(key);
    } else {
      this.#selectedSet.delete(key);
    }
    this.#saveStateToUrl();
    this.requestUpdate();
    return selected;
  }

  /**
   * Whether a row can be selected: a Data Row of a selectable table. A row
   * that is being inserted can't.
   *
   * @param {T} row
   */
  #canSelect(row) {
    return Boolean(this.selectable) && !this.isInsert({ data: row });
  }

  /** @param {T} row */
  #isSelected(row) {
    return !this.isInsert({ data: row }) && this.#selectedSet.has(this.#rowKey(row));
  }

  /**
   * @param {MouseEvent} ev
   */
  #handleTableMouseDown(ev) {
    this.#pressedAt = { x: ev.clientX, y: ev.clientY };
    // The browser moves the focus for a press right after this event, in the same task.
    this.#pressing = true;
    setTimeout(() => {
      this.#pressing = false;
    });
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
          this.#setColumnWidth(
            column,
            Math.max(this.#MIN_COLUMN_WIDTH, width + (clientX - clientXStart)),
          );
        } else if (target.parentElement) {
          width = Math.max(
            this.#MIN_COLUMN_WIDTH,
            target.parentElement.getBoundingClientRect().width,
          );
          this.#setColumnWidth(column, width);
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
          this.#columnResized();
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
      // The column is named "Selection" for assistive technology, and its
      // header holds the select-all checkbox (see `#renderHeader`).
      label: () =>
        html`<span class="visually-hidden" id=${SELECTION_COLUMN_NAME}
            >${this.#localize.term('tableSelection')}</span
          ><wa-checkbox
            class="owc-select-all-checkbox"
            @change=${this.#handleSelectableTitleChange}
            .checked=${this.#selectedSet.size === this.processedData.length}
            .indeterminate=${
              this.#selectedSet.size > 0 && this.#selectedSet.size < this.processedData.length
            }
            >${this.#localize.term('tableSelectAll')}</wa-checkbox
          >`,
      includeInExport: false,
      formatter: (row, options) => {
        const selectorSettings = this.getSelectorSettings(row);
        // @ts-ignore
        const typedIndex = /** @type {number} */ (options.custom.index);
        // The checkbox names its input by its content, not by an `aria-label` on itself.
        return html`<wa-checkbox
          class="owc-selectable-checkbox"
          value=${typedIndex}
          .checked=${this.#isSelected(row)}
          >${selectorSettings['aria-label'] ?? this.#localize.term('tableSelectRow')}</wa-checkbox
        >`;
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
      // The column of the toggle buttons shows no label, but has a name.
      label: () =>
        html`<span class="visually-hidden">${this.#localize.term('tableDetails')}</span>`,
      includeInExport: false,
      formatter: row => {
        const open = this.openDetails?.includes(this.getRowId(row) || '');
        return html`<owc-icon-button
          class="open-details-button ${open ? 'details-open' : ''}"
          name="chevron-right"
          .label=${this.#localize.term('tableDetails')}
          .expanded=${Boolean(open)}
          @click=${() => this.#toggleDetail(row)}
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

      /*
       * What lies under the cells of a row as its first child lets the pointer
       * through to the cells, so a click reaches the cell it is on and moves
       * the focus there. Only a row's link takes the pointer itself.
       */
      .row > .row-no-click,
      .row > .row-click {
        pointer-events: none;
      }

      /*
       * A row that toggles its detail does so for a click anywhere in it. What
       * its cells show keeps the text cursor, which shows where a selection
       * starts.
       */
      .row:has(> div.row-click) > .cell {
        cursor: pointer;
      }

      .row:has(> div.row-click) > .cell :is(.cell-text, .cell-full) {
        cursor: auto;
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
      .detail-row,
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
        border: 1px solid var(--owc-table-borderColor);
        min-height: 45px;
        display: flex;
        border-width: 0 1px 1px 1px;
        cursor: pointer;
      }

      /* A marker under the header's cell, as in every row: the header takes the clicks. */
      .group-label-container > .row-click {
        pointer-events: none;
      }

      .group-label-container > .full-width-cell {
        flex: 1;
        min-width: 0;
        display: flex;
      }

      /* The group's button fills its header. */
      .group-label {
        appearance: none;
        background: none;
        border: 0;
        margin: 0;
        font: inherit;
        cursor: pointer;
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

      /* Above the row's link, which comes after this cell and would cover its toggle. */
      .open-details {
        z-index: 10;
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

      .last-row > .detail-row > wa-details::part(content) {
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

      /* The names of the selection checkboxes and of the detail toggles' column are for assistive technology only. */
      .owc-selectable-checkbox::part(label),
      .owc-select-all-checkbox::part(label),
      .visually-hidden {
        ${visuallyHidden}
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
        scroll-margin-left: 1000px;
      }

      /*
       * A row or a focused cell that scrolls into view stops below what sticks
       * over the top of the scroll container: the header row, and the info
       * block above it. Both heights are measured.
       */
      .row-container,
      .group-label-container,
      .table-body .cell,
      .full-width-cell {
        scroll-margin-top: var(--_owc-table-sticky-height, 0px);
      }
      :host([sticky-header]) #data-table {
        --_owc-table-sticky-height: var(--_owc-table-header-height, 0px);
      }
      :host([_has-info-block][sticky-header]) #data-table {
        --_owc-table-sticky-height: calc(
          var(--info-height, 40px) + var(--_owc-table-header-height, 0px)
        );
      }

      /*
       * Inside the cell, where neither the cell's clipping nor its neighbours cover it.
       * A row's link covers the row, so the row shows the ring for it: above
       * the selector cell and the cell of the detail toggle, which lie above
       * the link and would cover its own outline when they have a background.
       */
      .cell:focus-visible,
      .full-width-cell:focus-visible,
      .group-label:focus-visible,
      .row:has(> .cell > a.row-click:focus-visible)::after {
        outline: var(--wa-focus-ring, 2px solid Highlight);
        outline-offset: calc(-1 * var(--wa-focus-ring-width, 2px));
      }

      .row:has(> .cell > a.row-click:focus-visible)::after {
        content: '';
        position: absolute;
        inset: 0;
        z-index: 11;
        pointer-events: none;
      }

      a.row-click:focus-visible {
        outline: none;
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
