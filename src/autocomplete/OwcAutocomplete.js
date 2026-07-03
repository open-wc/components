import { css, html, isServer, LitElement, nothing } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { HasSlotController } from './HasSlotController.js';
import { LocalizeController } from '@shoelace-style/shoelace/dist/utilities/localize.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { OwcIconButton } from '../icon-button/OwcIconButton.js';
import { virtualize, virtualizerRef } from '@lit-labs/virtualizer/virtualize.js';

import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/popup/popup.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/tag/tag.js';

import { formControlStyles } from './form-control.styles.js';
import { selectStyles } from './select.styles.js';
import { sizeStyles } from './size.styles.js';
import { optionStyles } from './option.style.js';

/**
 * @template {Record<string, unknown>} T
 */
export class OwcAutocomplete extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'owc-icon-button': OwcIconButton,
  };

  /** @type {Record<string, {type: any, attribute?: any, converter?: any, reflect?: any}>} */
  static properties = {
    data: { type: Array },
    processedData: { type: Array },
    open: { type: Boolean, reflect: true },
    multiple: { type: Boolean, attribute: 'multiple', reflect: true },
    disabled: { type: Boolean },
    placement: { type: String },
    withClear: { attribute: 'with-clear', type: Boolean },
    withLabel: { attribute: 'with-label', type: Boolean },
    withHint: { attribute: 'with-hint', type: Boolean },
    required: { type: Boolean, reflect: true },
    label: { type: String },
    hint: { type: String },
    placeholder: { type: String },
    accentBar: { attribute: 'accent-bar', type: Boolean },
    maxOptionsVisible: { type: Number, attribute: 'max-options-visible' },
    syncWidth: { type: Boolean },
    size: { type: String },
    hideSelectAll: { type: Boolean, attribute: 'hide-select-all' },
    maxDropdownOptionsVisible: { type: Number },
    currentValue: { type: String },
    fillMode: { type: Boolean, attribute: 'fill-mode' },
    fixedTrigger: { type: Boolean, attribute: 'fixed-trigger' },
    value: {
      type: Array,
      converter: {
        /**
         * @param {string} value
         * @returns {string[]}
         */
        fromAttribute: value => value.split(' '),
        /**
         * @param {string[]} value
         * @returns {string}
         */
        toAttribute: value => value.join(' '),
      },
    },
  };

  constructor() {
    super();
    /** @type {Array<T>} */
    this.data = /** @type {Array<T>} */ ([]);
    /** @type {Array<T>} */
    this.processedData = [];
    /** @type {unknown} */
    this.currentValue = '';
    this.open = false;
    this.multiple = false;
    this.disabled = false;
    /**@type {'top' | 'bottom'} */
    this.placement = 'bottom';
    this.required = false;
    this.withLabel = false;
    this.withHint = false;
    this.hasFocus = false;
    this.label = '';
    this.placeholder = '';
    this.accentBar = false;
    /**@param {T} row @returns {string | undefined} */
    this.getAccentBarColor = row => /** @type {any} */ (row)?.accentBarColor;
    this.withClear = false;
    this.hint = '';

    this.maxOptionsVisible = 3;
    this.maxDropdownOptionsVisible = 200;
    /**@type {"small" | "medium" | "large"}*/
    this.size = 'medium';
    this.pill = false;
    this.fillMode = false;
    this.syncWidth = true;
    /** @type {() => import('lit').TemplateResult} */
    this.footer = () => html``;
    this.hideSelectAll = false;
    this.fixedTrigger = false;

    /** @param {T} row */
    this.getOptionValue = row => {
      return row && (row.value || row.value === 0 || row.value === '')
        ? /** @type {string} */ (row.value)
        : undefined;
    };

    /**
     * A function that customizes the tags to be rendered when multiple=true. The first argument is the option, the second
     * is the current tag's index.  The function should return either a Lit TemplateResult or a string containing trusted HTML of the symbol to render at
     * the specified value.
     *
     * @param {T} option
     * @returns {import('lit').TemplateResult}
     */
    this.getTag = option => {
      return html`
        <wa-tag
          part="tag"
          exportparts="
            base:tag__base,
            content:tag__content,
            remove-button:tag__remove-button,
            remove-button__base:tag__remove-button__base
          "
          ?pill=${this.pill}
          size=${this.size}
          with-remove
          .tagId=${this.getOptionValue(option)}
          @wa-remove=${this.handleTagRemove}
        >
          ${option.label}
        </wa-tag>
      `;
    };
  }

  #selectedSet = new Set();
  /**@type {null | string | string[]} */
  defaultValue = null;
  hasSlotController = new HasSlotController(this, 'help-text', 'label');
  localize = new LocalizeController(this);

  get popup() {
    return /**@type {import('@awesome.me/webawesome/dist/components/popup/popup.js').default} */ (
      this.shadowRoot?.querySelector('.select')
    );
  }

  get combobox() {
    return /**@type {HTMLSlotElement} */ (this.shadowRoot?.querySelector('.combobox'));
  }

  get displayInput() {
    return /**@type {HTMLInputElement} */ (this.shadowRoot?.querySelector('.display-input'));
  }

  get valueInput() {
    return /**@type {HTMLInputElement} */ (this.shadowRoot?.querySelector('.value-input'));
  }

  get listbox() {
    return /**@type {HTMLSlotElement} */ (this.shadowRoot?.querySelector('.listbox'));
  }

  /**
   * Selected option (only relevant for single select)
   * @returns {T | undefined}
   */
  get selectedOption() {
    if (this.multiple) {
      return undefined;
    }
    return /** @type {T | undefined} */ (
      this.data.find(opt => this.getOptionValue(opt) === this.value)
    );
  }

  /**
   * Measures the max label width in the current option list
   */
  #updatePopoverWidth() {
    if (!this.shadowRoot) {
      return;
    }
    const anchorWidth = this.combobox?.getBoundingClientRect().width || 0;

    const items = Array.isArray(this.limitedProcessedData)
      ? this.limitedProcessedData
      : this.processedData;

    const optionLabelEl = /** @type {HTMLElement | null} */ (
      this.shadowRoot.querySelector('.option-label')
    );
    const computed = optionLabelEl ? window.getComputedStyle(optionLabelEl) : null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Fallback
    ctx.font =
      computed?.font || `${computed?.fontSize || '16px'} ${computed?.fontFamily || 'sans-serif'}`;

    // Compute max label width in px.
    let maxLabelWidth = 0;
    for (const row of items || []) {
      if (!row) {
        continue;
      }
      const label = typeof row.label === 'string' ? row.label : String(row.label || '');
      const metrics = ctx.measureText(label);
      if (metrics.width > maxLabelWidth) {
        maxLabelWidth = metrics.width;
      }
    }

    const contentWidth = Math.ceil(maxLabelWidth + 100); // + padding and such

    const minWidth = Math.ceil(anchorWidth);
    const maxWidth = 720;

    const finalWidth = Math.min(Math.max(contentWidth, minWidth), maxWidth);

    this.style.setProperty('--owc-autocomplete-popover-width', `${finalWidth}px`);
  }

  connectedCallback() {
    super.connectedCallback();

    // Because this is a form control, it shouldn't be opened initially
    this.open = false;
  }

  addOpenListeners() {
    //
    // Listen on the root node instead of the document in case the elements are inside a shadow root
    //
    // https://github.com/shoelace-style/shoelace/issues/1763
    //
    document.addEventListener('focusin', this.handleDocumentFocusIn);
    document.addEventListener('keydown', this.handleDocumentKeyDown);
    document.addEventListener('mousedown', this.handleDocumentMouseDown);

    // If the component is rendered in a shadow root, we need to attach the focusin listener there too
    if (this.getRootNode() !== document) {
      // @ts-ignore
      this.getRootNode().addEventListener('focusin', this.handleDocumentFocusIn);
    }
  }

  removeOpenListeners() {
    document.removeEventListener('focusin', this.handleDocumentFocusIn);
    document.removeEventListener('keydown', this.handleDocumentKeyDown);
    document.removeEventListener('mousedown', this.handleDocumentMouseDown);

    if (this.getRootNode() !== document) {
      // @ts-ignore
      this.getRootNode().removeEventListener('focusin', this.handleDocumentFocusIn);
    }
  }

  handleDocumentFocusIn = (/** @type {FocusEvent} */ event) => {
    // Close when focusing out of the select
    const path = event.composedPath();
    if (this && !path.includes(this)) {
      this.hide();
    }
  };

  handleDocumentKeyDown = (/** @type {KeyboardEvent} */ ev) => {
    if (this.open === true) {
      if (ev.key === 'Escape' || ev.key === 'Tab') {
        ev.stopPropagation();
        this.hide();
      } else if (
        ev.key === 'ArrowDown' ||
        ev.key === 'ArrowUp' ||
        ev.key === 'Home' ||
        ev.key === 'End'
      ) {
        const index = this.processedData.findIndex(option => option.value === this.currentValue);
        let newIndex = index;
        if (ev.key === 'ArrowDown') {
          newIndex = index < this.processedData.length - 1 ? index + 1 : 0;
        }
        if (ev.key === 'ArrowUp') {
          newIndex = index > 0 ? index - 1 : this.processedData.length - 1;
        }
        if (ev.key === 'Home') {
          ev.preventDefault();
          newIndex = 0;
        }
        if (ev.key === 'End') {
          ev.preventDefault();
          newIndex = this.processedData.length - 1;
        }
        this.currentValue = this.processedData[newIndex].value;
      } else if (ev.key === 'Enter') {
        ev.stopPropagation();
        if (this.processedData.length === 1) {
          this.currentValue = this.processedData[0].value;
        }
        if (this.currentValue && this.processedData.find(opt => opt.value === this.currentValue)) {
          this.handleOptionAction(this.currentValue);
        }
      }
    }

    if (this.open === false) {
      if (ev.key !== 'Tab') {
        if (ev.key === ' ') {
          ev.preventDefault();
        }
        this.focus();
      }
    }
  };

  /**
   * @param {InputEvent} ev
   */
  #handleSearch(ev) {
    const typedTarget = /** @type {HTMLInputElement} */ (ev.target);
    const value = typedTarget?.value ?? '';

    if (this.fillMode === false) {
      if (value === '' && this.processedData.length === this.data.length) {
        return;
      }

      const data =
        value === ''
          ? this.data
          : this.data.filter(row => {
              const label = /** @type {string} */ (row.label);
              return label.toLocaleLowerCase().includes(value.toLocaleLowerCase());
            });
      this.processedData = data;

      this.#updatePopoverWidth();
    } else {
      this.#selectedSet.clear();
      const possibilities = [
        (() => {
          try {
            return JSON.parse(value);
          } catch (error) {
            return [];
          }
        })(),
        value.split(','),
        value.split(';'),
        value.split('\t'),
        value.split('\n'),
        value.split(' '),
      ];
      const valueList =
        possibilities[0].length > 0
          ? possibilities[0]
          : possibilities.reduce((longest, current) => {
              return current.length > longest.length ? current : longest;
            }, []);
      for (const valueItem of valueList) {
        for (const entry of this.data) {
          if (valueItem === entry.label || valueItem === entry.value) {
            this.#selectedSet.add(entry.value);
          }
        }
      }
      this.dispatchEvent(new Event('change'));
      this.requestUpdate();
    }
  }

  /**
   * Id (typically the value) of the option to handle a change action
   *
   * @param {unknown} id
   */
  handleOptionAction(id) {
    if (!this.multiple) {
      this.hide();
      this.#selectedSet.clear();
    }
    if (this.#selectedSet.has(id)) {
      this.#selectedSet.delete(id);
      this.requestUpdate();
    } else {
      this.#selectedSet.add(id);
      this.requestUpdate();
    }
    this.dispatchEvent(new Event('change'));

    //Custom Event InputAutofill
    const selectedOption = this.processedData.find(opt => this.getOptionValue(opt) === id);
    if (selectedOption) {
      this.dispatchEvent(
        new CustomEvent('autocomplete-selection', {
          detail: selectedOption,
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  /**
   *
   * @param {MouseEvent} event
   */
  handleDocumentMouseDown = event => {
    // Close when clicking outside of the select
    const path = event.composedPath();
    if (this && !path.includes(this)) {
      this.hide();
    }
  };

  handleLabelClick() {
    this.focus();
  }

  /**
   *
   * @param {MouseEvent} event
   * @returns
   */
  handleComboboxMouseDown(event) {
    const path = event.composedPath();
    const isButton = path.some(
      el => el instanceof Element && el.tagName.toLowerCase() === 'wa-button',
    );

    // Ignore disabled controls and clicks on tags (remove buttons)
    if (this.disabled || isButton) {
      return;
    }

    event.preventDefault();
    // this.displayInput.focus({ preventScroll: true });
    this.toggle();
  }

  /**
   *
   * @param {KeyboardEvent} event
   */
  handleComboboxKeyDown(event) {
    event.stopPropagation();
    this.handleDocumentKeyDown(event);
  }

  /**
   *
   * @param {MouseEvent} event
   */
  handleClearClick(event) {
    event.stopPropagation();
    this.#selectedSet.clear();
    this.requestUpdate();
    this.dispatchEvent(new Event('change'));
    this.dispatchEvent(new InputEvent('input'));
  }

  /**
   *
   * @param {MouseEvent} event
   */
  handleClearMouseDown(event) {
    // Don't lose focus or propagate events when clicking the clear button
    event.stopPropagation();
    event.preventDefault();
  }

  /**
   *
   * @param {MouseEvent} ev
   */
  handleOptionClick(ev) {
    let index;
    for (const el of ev.composedPath()) {
      const typedEl = /** @type {HTMLElement} */ (el);
      if (typedEl.dataset?.index) {
        index = parseInt(typedEl.dataset.index);
        break;
      }
    }

    if (index !== undefined) {
      const id = this.getOptionValue(this.processedData[index]);
      this.handleOptionAction(id);
    }
  }

  /**
   *
   * @param {Event} event
   * @returns
   */
  handleTagRemove(event) {
    event.stopPropagation();
    const typedTarget = /** @type {HTMLElement & { tagId: unknown }} */ (event.target);
    const id = typedTarget.tagId;

    if (!this.disabled && id) {
      if (this.#selectedSet.has(id)) {
        this.#selectedSet.delete(id);
        this.requestUpdate();
      } else {
        this.#selectedSet.add(id);
        this.requestUpdate();
      }

      // Dispatch after updating
      this.updateComplete.then(() => {
        this.dispatchEvent(new Event('change'));
        this.dispatchEvent(new InputEvent('input'));
      });
    }
  }

  // Gets the first `<wa-option>` element
  getFirstOption() {
    return this.querySelector('wa-option');
  }

  get tags() {
    if (Array.isArray(this.value)) {
      return this.value.map((value, index) => {
        if (index < this.maxOptionsVisible || this.maxOptionsVisible <= 0) {
          const option = /** @type {T} */ (
            this.processedData.find(opt => this.getOptionValue(opt) === value)
          );
          if (option) {
            const tag = this.getTag(option);
            // Wrap so we can handle the remove
            return html` ${typeof tag === 'string' ? unsafeHTML(tag) : tag} `;
          } else {
            return nothing;
          }
        } else if (index === this.maxOptionsVisible) {
          // Hit tag limit
          // @ts-ignore
          return html`<wa-tag>+${this.value.length - index}</wa-tag>`;
        }
        return html``;
      });
    }
    return nothing;
  }

  /**
   * @returns {unknown[] | unknown}
   */
  get value() {
    /** @type {unknown[]} */
    const value = [];
    this.#selectedSet.forEach(id => {
      value.push(id);
    });
    return this.multiple ? value : value[0];
  }

  get limitedProcessedData() {
    return this.processedData.slice(0, this.maxDropdownOptionsVisible);
  }

  /**
   * @param {unknown[] | unknown} newValue
   */
  set value(newValue) {
    const arrayValue = Array.isArray(newValue) ? newValue : [newValue];
    this.#selectedSet.clear();
    arrayValue.forEach(id => {
      this.#selectedSet.add(id);
    });
    this.requestUpdate();
  }

  get valueLabel() {
    const option = /** @type {T} */ (
      this.data.find(opt => this.getOptionValue(opt) === this.value)
    );
    return option ? option.label : '';
  }

  /**
   * @param {import('lit').PropertyValues} changedProperties
   */
  update(changedProperties) {
    if (changedProperties.has('data')) {
      this.processedData = this.data ? [...this.data] : [];
    }
    super.update(changedProperties);
  }

  /**
   * @param {import('lit').PropertyValues} changedProperties
   */
  updated(changedProperties) {
    super.updated(changedProperties);
    if (changedProperties.has('open')) {
      this.handleOpenChange();
    }
    if (changedProperties.has('currentValue')) {
      const el = this.shadowRoot?.querySelector('.option--current');
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  #handleSelectAll() {
    if (!this.multiple) {
      return;
    }
    // De-select all if all are selected
    if (this.#selectedSet.size === this.processedData.length) {
      this.clear();
      this.dispatchEvent(new Event('change'));
      return;
    }

    for (const entry of this.processedData) {
      if (!this.#selectedSet.has(entry.value)) {
        this.#selectedSet.add(entry.value);
      }
    }
    this.requestUpdate();
    this.dispatchEvent(new Event('change'));
  }

  handleDisabledChange() {
    // Close the listbox when the control is open and disabled
    if (this.disabled && this.open) {
      this.open = false;
    }
  }

  clear() {
    this.#selectedSet.clear();
    this.requestUpdate();
  }

  async handleOpenChange() {
    if (this.open && !this.disabled) {
      this.addOpenListeners();

      this.popup.active = true;
      await this.updateComplete;

      // @ts-ignore
      this.#handleSearch({ target: this.search });
      this.#updatePopoverWidth();

      setTimeout(() => this.search.focus(), 100);
    } else {
      this.removeOpenListeners();
      this.popup.active = false;
    }
  }

  get search() {
    if (!this.__search) {
      this.__search =
        /** @type {HTMLInputElement} */
        (this.shadowRoot?.querySelector('#search'));
    }
    return this.__search;
  }

  /** Shows the listbox. */
  async show() {
    if (this.open || this.disabled) {
      this.open = false;
      return undefined;
    }

    this.open = true;
    await this.updateComplete;
    this.dispatchEvent(new Event('wa-show'));
  }

  /** Hides the listbox. */
  async hide() {
    if (!this.open || this.disabled) {
      this.open = false;
      return undefined;
    }

    this.open = false;
    await this.updateComplete;
    this.dispatchEvent(new Event('wa-hide'));
  }

  toggle() {
    if (this.open) {
      this.hide();
    } else {
      this.show();
    }
  }

  focus() {
    this.open = true;
    this.search.focus();
  }

  toggleFillMode() {
    this.fillMode = !this.fillMode;
    this.focus();
  }

  render() {
    const hasLabelSlot = this.hasUpdated ? this.hasSlotController.test('label') : this.withLabel;
    const hasHintSlot = this.hasUpdated ? this.hasSlotController.test('hint') : this.withHint;
    const hasLabel = this.label ? true : !!hasLabelSlot;
    const hasHint = this.hint ? true : !!hasHintSlot;
    const hasClearIcon =
      (this.hasUpdated || isServer) &&
      this.withClear &&
      !this.disabled &&
      this.value &&
      (!Array.isArray(this.value) || this.value.length > 0);
    const isPlaceholderVisible = Boolean(
      this.placeholder && (!this.value || (Array.isArray(this.value) && this.value.length === 0)),
    );

    return html`
      <div
        part="form-control"
        class=${classMap({
          'form-control': true,
          'form-control-has-label': hasLabel,
        })}
      >
        <label
          id="label"
          part="form-control-label label"
          class="label"
          aria-hidden=${hasLabel ? 'false' : 'true'}
          @click=${this.handleLabelClick}
        >
          <slot name="label">${this.label}</slot>
        </label>

        <div part="form-control-input" class="form-control-input">
          <wa-popup
            class=${classMap({
              select: true,
              open: this.open,
              disabled: this.disabled,
              enabled: !this.disabled,
              multiple: this.multiple,
              'placeholder-visible': isPlaceholderVisible,
            })}
            placement=${this.placement}
            flip
            shift
            sync=${this.fixedTrigger ? '' : 'width'}
            auto-size="vertical"
            auto-size-padding="10"
          >
            ${
              this.fixedTrigger
                ? html`<div
                    part="fixedTrigger"
                    class="fixedTrigger"
                    slot="anchor"
                    @keydown=${this.handleComboboxKeyDown}
                    @mousedown=${this.handleComboboxMouseDown}
                  >
                    <slot></slot>
                    <wa-icon library="system" name="chevron-down" variant="solid"></wa-icon>
                  </div>`
                : html`<div
                    part="combobox"
                    class="combobox"
                    slot="anchor"
                    @keydown=${this.handleComboboxKeyDown}
                    @mousedown=${this.handleComboboxMouseDown}
                  >
                    <slot part="start" name="start" class="start"></slot>
                    <div id="placeholder">${this.placeholder}</div>
                    ${
                      this.multiple
                        ? html`<div part="tags" class="tags">${this.tags}</div>`
                        : (() => {
                            const selected = this.selectedOption;
                            const accentBarColor =
                              this.accentBar && selected
                                ? this.getAccentBarColor(selected)
                                : undefined;

                            return html`
                              <div class="display">
                                ${
                                  this.accentBar
                                    ? html`
                                        <div
                                          class="accent-bar"
                                          style="--accent-bar-color: ${accentBarColor || 'transparent'}"
                                        ></div>
                                      `
                                    : nothing
                                }
                                <div class="display-input">${this.valueLabel}</div>
                              </div>
                            `;
                          })()
                    }

                    <input
                      class="value-input"
                      type="text"
                      ?disabled=${this.disabled}
                      ?required=${this.required}
                      .value=${Array.isArray(this.value) ? this.value.join(', ') : this.value}
                      tabindex="-1"
                      aria-hidden="true"
                      @focus=${() => this.focus()}
                    />

                    ${
                      hasClearIcon
                        ? html`
                            <button
                              part="clear-button"
                              type="button"
                              aria-label=${this.localize.term('clearEntry')}
                              @mousedown=${this.handleClearMouseDown}
                              @click=${this.handleClearClick}
                              tabindex="-1"
                            >
                              <slot name="clear-icon">
                                <wa-icon
                                  name="x-circle"
                                  library="system"
                                  variant="regular"
                                ></wa-icon>
                              </slot>
                            </button>
                          `
                        : ''
                    }

                    <slot name="end" part="end" class="end"></slot>

                    <slot name="expand-icon" part="expand-icon" class="expand-icon">
                      <wa-icon library="system" name="chevron-down" variant="solid"></wa-icon>
                    </slot>
                  </div>`
            }

            <div
              id="listbox"
              role="listbox"
              aria-expanded=${this.open ? 'true' : 'false'}
              aria-multiselectable=${this.multiple ? 'true' : 'false'}
              aria-labelledby="label"
              part="listbox"
              class="listbox"
              tabindex="-1"
            >
              <wa-input
                id="search"
                @input=${this.#handleSearch}
                @change=${(/** @type {Event} */ ev) => ev.stopPropagation()}
              >
                ${
                  this.fillMode === false
                    ? html`<owc-icon-button
                        slot="start"
                        name="search"
                        @click=${this.toggleFillMode}
                      ></owc-icon-button>`
                    : html` <owc-icon-button
                        slot="start"
                        library="bootstrap"
                        name="box-arrow-in-right"
                        @click=${this.toggleFillMode}
                      ></owc-icon-button>`
                }
              </wa-input>
              <div
                no-clipping
                @click=${this.handleOptionClick}
                style="min-height: 300px;"
                id="rows"
              >
                ${virtualize({
                  scroller: true,
                  items: this.limitedProcessedData,
                  renderItem: this.renderItem,
                })}
              </div>
              ${
                this.hideSelectAll === false
                  ? html`<wa-button
                      id="select-all-button"
                      variant="brand"
                      @click=${this.#handleSelectAll}
                      >${
                        this.#selectedSet.size === this.processedData.length
                          ? 'Alle abwählen'
                          : 'Alle auswählen'
                      }</wa-button
                    >`
                  : ''
              }
              ${this.footer()}
            </div>
          </wa-popup>
        </div>

        <slot
          id="hint"
          name="hint"
          part="hint"
          class=${classMap({
            'has-slotted': hasHint,
          })}
          aria-hidden=${hasHint ? 'false' : 'true'}
          >${this.hint}</slot
        >
      </div>
    `;
  }

  get virtualizer() {
    const el = this.shadowRoot?.querySelector('#rows');
    // @ts-ignore
    return el ? el[virtualizerRef] : undefined;
  }

  get virtualizerHost() {
    const el = this.shadowRoot?.querySelector('#rows');
    return el || undefined;
  }

  /**
   * @param {T} row
   * @param {number} index
   * @returns {import('lit').TemplateResult}
   */
  renderItem = (row, index) => {
    if (!row) {
      return html``;
    }

    const id = this.getOptionValue(row);
    const accentBarColor = this.accentBar ? this.getAccentBarColor(row) : undefined;

    return html`
      <div
        class="row option ${id === this.currentValue ? 'option--current' : ''}"
        data-index=${index}
      >
        <div class="row-selected">
          ${this.#selectedSet.has(id) ? html`<wa-icon name="check"></wa-icon>` : nothing}
        </div>

        ${
          this.accentBar
            ? html`
                <div
                  class="accent-bar"
                  style="--accent-bar-color: ${accentBarColor || 'transparent'}"
                ></div>
              `
            : nothing
        }

        <div class="option-label">${row.label}</div>
      </div>
    `;
  };

  static styles = [
    selectStyles,
    formControlStyles,
    sizeStyles,
    optionStyles,
    css`
      /* overrides */
      .select--standard:not(.select--disabled).select--open .select__combobox,
      .select--standard:not(.select--disabled).select--focused .select__combobox {
        background-color: var(--wa-input-background-color);
        border-color: var(--wa-input-border-color);
        box-shadow: none;
      }

      .option {
        display: flex;
        align-items: center;
        width: 100%;
      }

      .display {
        display: flex;
        align-items: center;
        width: 100%;
      }

      .accent-bar {
        width: 4px;
        height: 18px;
        border-radius: 999px;
        margin-right: 10px;
        background: var(--accent-bar-color, transparent);
        flex: 0 0 auto;
      }

      .option-label {
        flex: 1 1 auto;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .row-selected {
        width: 2em;
        display: flex;
        padding-left: 0.7rem;
      }

      .listbox {
        width: var(--owc-autocomplete-popover-width);
        padding-top: 0;
        padding-bottom: 0;
        margin-top: 5px;
        overflow: hidden;
      }

      #placeholder {
        width: 100%;
      }

      .select:not(.placeholder-visible) #placeholder {
        display: none;
      }

      .select.placeholder-visible .select__display-input {
        display: none;
      }

      #select-all-button {
        width: 100%;
      }

      :host(:not([multiple])) #select-all-button {
        display: none;
      }
    `,
  ];
}
