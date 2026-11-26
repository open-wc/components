import { LitElement, css, html, nothing, svg } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { ensureCanvasSupport } from './canvasSupport.js';
import { annotationsFor, slicePath } from './chartGeometry.js';

/** @typedef {import('./OwcDoughnutChart.types.js').OwcDoughnutChartCategory} Category */
/** @typedef {CanvasRenderingContext2D & { drawElementImage(element: Element, x: number, y: number, width: number, height: number): void }} DrawableContext */
/** @typedef {HTMLCanvasElement & { requestPaint(): void }} DrawableCanvas */

// Canvas paths and HTML hit areas share geometry; drawElementImage adds HTML content and semantics.
/**
 * A doughnut chart for prepared, ordered categories. Financial preparation and navigation are
 * consumer-owned. Requires native HTML-in-Canvas or the automatically loaded runtime polyfill.
 * @slot - Selectable center content, such as a formatted total and measure.
 * @slot heading - Consumer-owned heading markup, including its semantic heading level.
 * @slot caption - Optional descriptive content below the ring.
 * @fires category-activate - detail.categoryId identifies the activated category.
 */
export class OwcDoughnutChart extends LitElement {
  static properties = {
    categories: { attribute: false },
    context: { type: String },
    emptyLabel: { type: String, attribute: 'empty-label' },
    unavailableLabel: { type: String, attribute: 'unavailable-label' },
    _width: { state: true },
    _height: { state: true },
    _summaryBelow: { state: true },
    _showLabels: { state: true },
    _labelSizes: { state: true },
    _supported: { state: true },
    _rendered: { state: true },
    _failed: { state: true },
    _fractions: { state: true },
  };

  constructor() {
    super();
    /** @type {readonly Category[]} */
    this.categories = [];
    this.context = '';
    this.emptyLabel = 'Keine Daten';
    this.unavailableLabel = 'Nicht verfügbar';
    this._supported = false;
    this._rendered = false;
    this._failed = false;
    this._initialization = 0;
    /** @type {ResizeObserver | undefined} */
    this._resizeObserver = undefined;
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    this._paintTimeout = undefined;
    /** @type {HTMLCanvasElement | undefined} */
    this._wiredCanvas = undefined;
    /** @type {string | null} */
    this._focusBeforeUpdate = null;
    this._width = 320;
    this._height = 320;
    this._summaryBelow = false;
    this._showLabels = false;
    /** @type {Map<string, {width: number, height: number}>} */
    this._labelSizes = new Map();
    /** @type {MutationObserver | undefined} */
    this._contentObserver = undefined;
    /** @type {number | undefined} */
    this._layoutFrame = undefined;
    /** @type {Set<Element>} */
    this._observedLabels = new Set();
    /** @type {number[] | undefined} */
    this._fractions = undefined;
    /** @type {number | undefined} */
    this._motionFrame = undefined;
    /** @type {MediaQueryList | undefined} */
    this._motionQuery = undefined;
    this._finishMotion = this._finishMotion.bind(this);
    this._paint = this._paint.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this._motionQuery = matchMedia('(prefers-reduced-motion: no-preference)');
    this._motionQuery.addEventListener('change', this._finishMotion);
    this._initialize();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._initialization += 1;
    this._motionQuery?.removeEventListener('change', this._finishMotion);
    this._finishMotion();
    this._unwire();
  }

  /** @param {import('lit').PropertyValues} changed */
  willUpdate(changed) {
    this._focusBeforeUpdate = changed.has('categories')
      ? (this.shadowRoot?.activeElement?.getAttribute('data-category-id') ?? null)
      : null;
    if (changed.has('categories')) {
      this._transitionCategories(changed.get('categories'));
    }
  }

  _finishMotion() {
    if (this._motionFrame !== undefined) {
      cancelAnimationFrame(this._motionFrame);
      this._motionFrame = undefined;
    }
    this._fractions = undefined;
  }

  /** @param {readonly Category[] | undefined} previous */
  _transitionCategories(previous) {
    const compatible =
      this._dataState === 'ready' &&
      Array.isArray(previous) &&
      previous.length === this.categories.length &&
      previous.every((category, index) => category?.id === this.categories[index].id);
    if (!compatible) {
      this._finishMotion();
      return;
    }
    const total = this.categories.reduce((sum, category) => sum + category.value, 0);
    const target = this.categories.map(category => category.value / total);
    const previousTotal = previous.reduce((sum, category) => sum + category.value, 0);
    if (previous.every((category, index) => category.value / previousTotal === target[index])) {
      return;
    }
    const from = this._fractions ?? previous.map(category => category.value / previousTotal);
    this._finishMotion();
    if (
      !this.isConnected ||
      !this._rendered ||
      !this._wiredCanvas ||
      this._failed ||
      !this._motionQuery?.matches ||
      !from.every(Number.isFinite)
    ) {
      return;
    }
    this._fractions = from;
    const started = performance.now();
    /** @param {number} timestamp */
    const step = timestamp => {
      const progress = Math.min(1, (timestamp - started) / 400);
      const eased = 1 - (1 - progress) ** 3;
      this._fractions = target.map((value, index) => from[index] + (value - from[index]) * eased);
      if (progress < 1) {
        this._motionFrame = requestAnimationFrame(step);
      } else {
        this._motionFrame = undefined;
        this._fractions = undefined;
      }
    };
    this._motionFrame = requestAnimationFrame(step);
  }

  updated() {
    if (this.isConnected && this._supported && !this._failed) {
      this._wire();
      this._scheduleLayout();
    }
    if (this._focusBeforeUpdate && !this._failed) {
      const id = this._focusBeforeUpdate;
      this._focusBeforeUpdate = null;
      const root = /** @type {Document | ShadowRoot} */ (this.getRootNode());
      if (
        root.activeElement &&
        root.activeElement !== this &&
        root.activeElement !== document.body
      ) {
        return;
      }
      const button = [...this.renderRoot.querySelectorAll('button[data-category-id]')].find(
        button => button.getAttribute('data-category-id') === id,
      );
      if (button instanceof HTMLElement) {
        button.focus({ preventScroll: true });
      } else {
        const slot = this.renderRoot.querySelector('slot[name="heading"]');
        const assigned = /** @type {HTMLSlotElement | null} */ (slot)?.assignedElements({
          flatten: true,
        });
        const heading = assigned
          ?.flatMap(element => [
            element,
            ...element.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]'),
          ])
          .find(element => element.matches('h1,h2,h3,h4,h5,h6,[role="heading"]'));
        const target = heading ?? slot?.parentElement;
        if (target instanceof HTMLElement) {
          if (!target.hasAttribute('tabindex')) {
            target.tabIndex = -1;
          }
          target.focus({ preventScroll: true });
        }
      }
    }
  }

  async _initialize() {
    const initialization = ++this._initialization;
    try {
      await ensureCanvasSupport();
      if (this.isConnected && initialization === this._initialization) {
        this._supported = true;
        await this.updateComplete;
        if (this.isConnected && initialization === this._initialization) {
          this._wire();
        }
      }
    } catch {
      if (this.isConnected && initialization === this._initialization) {
        this._fail();
      }
    }
  }

  _wire() {
    const canvas = this.renderRoot.querySelector('canvas');
    if (!this.isConnected || !canvas || this._failed) {
      this._unwire();
      return;
    }
    if (canvas === this._wiredCanvas) {
      return;
    }
    this._unwire();
    this._wiredCanvas = canvas;
    canvas.addEventListener('paint', this._paint);
    this._resizeObserver = new ResizeObserver(() => {
      this._width = Math.max(1, Math.round(canvas.clientWidth));
      const width = Math.round(canvas.clientWidth * window.devicePixelRatio);
      const height = Math.round(canvas.clientHeight * window.devicePixelRatio);
      if (width > 0 && (canvas.width !== width || canvas.height !== height)) {
        canvas.width = width;
        canvas.height = height;
      }
      this._scheduleLayout();
      /** @type {DrawableCanvas} */ (canvas).requestPaint();
    });
    this._resizeObserver.observe(canvas);
    const summary = this.renderRoot.querySelector('.summary');
    if (summary) {
      this._resizeObserver.observe(summary);
    }
    this._contentObserver = new MutationObserver(() => this._scheduleLayout());
    this._contentObserver.observe(this, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
    });
    document.fonts.ready.then(() => {
      if (this.isConnected) {
        this._scheduleLayout();
      }
    });
    // A renderer that never produces a paint must not leave a pending chart or controls behind.
    this._paintTimeout = setTimeout(() => this._fail(), 5000);
    /** @type {DrawableCanvas} */ (canvas).requestPaint();
  }

  _unwire() {
    this._resizeObserver?.disconnect();
    this._resizeObserver = undefined;
    this._observedLabels.clear();
    this._contentObserver?.disconnect();
    this._contentObserver = undefined;
    if (this._layoutFrame !== undefined) {
      cancelAnimationFrame(this._layoutFrame);
      this._layoutFrame = undefined;
    }
    clearTimeout(this._paintTimeout);
    this._wiredCanvas?.removeEventListener('paint', this._paint);
    this._wiredCanvas = undefined;
  }

  _fail() {
    this._finishMotion();
    this._unwire();
    this._failed = true;
    this._rendered = false;
  }

  _paint() {
    if (!this.isConnected || this._failed) {
      return;
    }
    const canvas = this.renderRoot.querySelector('canvas');
    const drawing = this.renderRoot.querySelector('[drawable]');
    if (!canvas || !drawing) {
      return;
    }
    try {
      const ctx = /** @type {DrawableContext | null} */ (canvas.getContext('2d'));
      if (!ctx) {
        throw new Error('Canvas context unavailable');
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Rasterize the colored curves directly at the backing-store resolution. The transparent
      // HTML controls use the same paths for hit testing, with icons and text drawn on top.
      ctx.save();
      ctx.scale(canvas.width / this._width, canvas.height / this._height);
      const controls = drawing.querySelectorAll('.slice');
      this._slices.forEach(({ start, end }, index) => {
        const style = getComputedStyle(controls[index]);
        ctx.fillStyle = style.color;
        ctx.filter = style.filter;
        ctx.fill(new Path2D(slicePath(start, end, this._width, this._ringHeight)));
      });
      ctx.restore();
      ctx.drawElementImage(drawing, 0, 0, canvas.width, canvas.height);
      clearTimeout(this._paintTimeout);
      this._rendered = true;
    } catch {
      this._fail();
    }
  }

  _requestPaint() {
    /** @type {DrawableCanvas | undefined} */ (this._wiredCanvas)?.requestPaint();
  }

  /** @param {Category} category */
  _activate(category) {
    this.dispatchEvent(
      new CustomEvent('category-activate', {
        detail: { categoryId: category.id },
        bubbles: true,
        composed: true,
      }),
    );
  }

  get _ringHeight() {
    return Math.min(320, this._width);
  }

  _scheduleLayout() {
    if (!this.isConnected || this._layoutFrame !== undefined || this._failed) {
      return;
    }
    this._layoutFrame = requestAnimationFrame(() => {
      this._layoutFrame = undefined;
      this._measureLayout();
    });
  }

  _measureLayout() {
    const summary = /** @type {HTMLElement | null} */ (this.renderRoot.querySelector('.summary'));
    const canvas = /** @type {DrawableCanvas | null} */ (this.renderRoot.querySelector('canvas'));
    if (!summary || !canvas) {
      return;
    }
    const previousWidth = summary.style.width;
    summary.style.width = 'max-content';
    const naturalWidth = summary.scrollWidth;
    summary.style.width = previousWidth;
    const inside = this._ringHeight * 0.45 * 0.75 * Math.SQRT2 - 8;
    this._summaryBelow = naturalWidth > inside || summary.offsetHeight > inside;
    this._height = Math.ceil(
      this._ringHeight + (this._summaryBelow ? summary.offsetHeight + 24 : 0),
    );
    const sizes = new Map();
    const labels = new Set(this.renderRoot.querySelectorAll('.amount-label'));
    for (const old of this._observedLabels) {
      if (!labels.has(old)) {
        this._resizeObserver?.unobserve(old);
      }
    }
    for (const label of labels) {
      if (!this._observedLabels.has(label)) {
        this._resizeObserver?.observe(label);
      }
    }
    this._observedLabels = labels;
    for (const label of this.renderRoot.querySelectorAll('.amount-label')) {
      const element = /** @type {HTMLElement} */ (label);
      sizes.set(element.dataset.categoryId, {
        width: element.offsetWidth,
        height: element.offsetHeight,
      });
    }
    if (JSON.stringify([...sizes]) !== JSON.stringify([...this._labelSizes])) {
      this._labelSizes = sizes;
    }
    this._showLabels = annotationsFor(
      this._slices,
      this._width,
      this._ringHeight,
      sizes,
    ).showLabels;
    canvas.requestPaint();
  }

  get _slices() {
    const total = this.categories.reduce((sum, category) => sum + category.value, 0);
    let angle = 0;
    return this.categories
      .map((category, index) => {
        const start = angle;
        angle += (this._fractions?.[index] ?? category.value / total) * Math.PI * 2;
        return { category, start, end: angle };
      })
      .filter(({ category }, index) => category.value > 0 || (this._fractions?.[index] ?? 0) > 0);
  }

  get _dataState() {
    if (!Array.isArray(this.categories)) {
      return 'invalid';
    }
    const ids = new Set();
    let sum = 0;
    for (const category of this.categories) {
      if (
        !category ||
        typeof category.id !== 'string' ||
        !category.id.trim() ||
        ids.has(category.id) ||
        typeof category.label !== 'string' ||
        !category.label.trim() ||
        typeof category.amount !== 'string' ||
        !category.amount.trim() ||
        typeof category.color !== 'string' ||
        !CSS.supports('color', category.color) ||
        !Number.isFinite(category.value) ||
        category.value < 0 ||
        (category.icon !== undefined && typeof category.icon !== 'string') ||
        (category.actionable !== undefined && typeof category.actionable !== 'boolean')
      ) {
        return 'invalid';
      }
      ids.add(category.id);
      sum += category.value;
    }
    if (!Number.isFinite(sum)) {
      return 'invalid';
    }
    return this.categories.length === 0 ? 'empty' : sum === 0 ? 'zero' : 'ready';
  }

  render() {
    if (!this._supported || this._failed) {
      return nothing;
    }
    const state = this._dataState;
    if (state === 'empty' || state === 'invalid') {
      return html`<div class="frame">
        <div id="heading" part="heading"><slot name="heading"></slot></div>
        <p>${state === 'empty' ? this.emptyLabel : this.unavailableLabel}</p>
      </div>`;
    }
    const slices = this._slices;
    const { annotations } = annotationsFor(slices, this._width, this._ringHeight, this._labelSizes);
    const radius = this._ringHeight * 0.45;
    const inside = radius * 0.75 * Math.SQRT2 - 8;
    return html`
      <div class=${this._rendered ? 'frame' : 'frame pending'} ?inert=${!this._rendered}>
        <div id="heading" part="heading"><slot name="heading"></slot></div>
        <div class="chart">
          <canvas
            content="drawable"
            width="320"
            height="320"
            aria-labelledby="heading"
            style=${styleMap({ height: `${this._height}px` })}
          >
            <div
              class="drawing"
              drawable=""
              style=${styleMap({ width: `${this._width}px`, height: `${this._height}px` })}
              @pointerover=${this._requestPaint}
              @pointerout=${this._requestPaint}
              @focusin=${this._requestPaint}
              @focusout=${this._requestPaint}
            >
              ${
                state === 'zero'
                  ? html`<div
                      class="neutral"
                      aria-hidden="true"
                      style=${styleMap({
                        left: `${this._width / 2 - radius}px`,
                        top: `${this._ringHeight / 2 - radius}px`,
                        width: `${2 * radius}px`,
                        height: `${2 * radius}px`,
                        borderWidth: `${radius * 0.25}px`,
                      })}
                    ></div>`
                  : nothing
              }
              ${repeat(
                slices,
                slice => slice.category.id,
                ({ category, start, end }) => {
                  const style = styleMap({
                    color: category.color,
                    width: `${this._width}px`,
                    height: `${this._ringHeight}px`,
                    clipPath: `path('${slicePath(start, end, this._width, this._ringHeight)}')`,
                  });
                  const label = `${category.label}: ${category.amount}; ${this.context}`;
                  const annotation = annotations.find(item => item.id === category.id);
                  const icon =
                    category.icon && annotation?.showIcon
                      ? html`<img
                          alt=""
                          src=${category.icon}
                          style=${styleMap({
                            left: `${annotation.iconX - 8}px`,
                            top: `${annotation.iconY - 8}px`,
                          })}
                        />`
                      : nothing;
                  return category.actionable
                    ? html`<button
                        type="button"
                        class="slice"
                        data-category-id=${category.id}
                        style=${style}
                        aria-label=${label}
                        @click=${() => this._activate(category)}
                      >
                        ${icon}
                      </button>`
                    : html`<div class="slice" style=${style} role="img" aria-label=${label}>
                        ${icon}
                      </div>`;
                },
              )}
              <svg
                class="leaders"
                part="leader-lines"
                aria-hidden="true"
                style=${styleMap({ visibility: this._showLabels ? 'visible' : 'hidden' })}
              >
                ${annotations.map(item => svg`<polyline points=${item.points}></polyline>`)}
              </svg>
              ${slices.map(({ category }) => {
                const label = annotations.find(item => item.id === category.id);
                return html`<span
                  class="amount-label"
                  part="amount"
                  data-category-id=${category.id}
                  aria-hidden="true"
                  style=${styleMap({
                    left: `${label?.left ?? 0}px`,
                    top: `${label?.top ?? 0}px`,
                    visibility: this._showLabels ? 'visible' : 'hidden',
                  })}
                  >${category.amount}</span
                >`;
              })}
              <div
                class="summary"
                part="center"
                style=${styleMap({
                  left: this._summaryBelow ? '8px' : `${(this._width - inside) / 2}px`,
                  top: this._summaryBelow
                    ? `${this._ringHeight + 12}px`
                    : `${this._ringHeight / 2}px`,
                  width: this._summaryBelow ? `${this._width - 16}px` : `${inside}px`,
                  transform: this._summaryBelow ? 'none' : 'translateY(-50%)',
                })}
              >
                <slot @slotchange=${this._scheduleLayout}></slot>
              </div>
            </div>
          </canvas>
        </div>
        <div part="caption"><slot name="caption"></slot></div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      position: relative;
      min-inline-size: 0;
      color: var(--wa-color-text-normal, #222);
      font-family: inherit;
    }
    .pending {
      /* Inert guards pending controls without changing the pointer style captured by the polyfill. */
      position: absolute;
      inset: 0 auto auto 0;
      inline-size: 100%;
      opacity: 0;
    }
    .chart {
      position: relative;
    }
    canvas {
      display: block;
      inline-size: 100%;
      block-size: auto;
      aspect-ratio: 1;
    }
    .drawing {
      position: relative;
      width: 320px;
      height: 320px;
      font-family: inherit;
      color: inherit;
    }
    .slice {
      position: absolute;
      inset: 0;
      width: 320px;
      height: 320px;
      padding: 0;
      border: 0;
      background: transparent;
      font: inherit;
      appearance: none;
    }
    button.slice {
      cursor: pointer;
    }
    .slice:hover,
    .slice:focus-visible {
      filter: brightness(0.9);
    }
    .slice img {
      position: absolute;
      width: 16px;
      height: 16px;
    }
    .neutral {
      position: absolute;
      border: 36px solid var(--owc-doughnut-chart-neutral-color, #d9d9d9);
      border-radius: 50%;
      box-sizing: border-box;
    }
    .leaders {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      fill: none;
      stroke: currentColor;
      stroke-width: 1px;
      pointer-events: none;
    }
    .amount-label {
      position: absolute;
      white-space: nowrap;
      font-size: var(--wa-font-size-s, 14px);
      line-height: 1.2;
      cursor: text;
      -webkit-user-select: text;
      user-select: text;
    }
    .summary {
      position: absolute;
      /* This square fits inside the circular hole, leaving every ring pixel hit-testable. */
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 6px;
      text-align: center;
      overflow-wrap: anywhere;
      -webkit-user-select: text;
      user-select: text;
    }
    ::slotted(*) {
      max-inline-size: 100%;
    }
  `;
}
