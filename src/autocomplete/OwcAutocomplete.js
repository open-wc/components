import { css, html, LitElement, nothing } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { ref } from 'lit/directives/ref.js';
import { repeat } from 'lit/directives/repeat.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { HasSlotController } from './HasSlotController.js';
import { LocalizeController } from '@awesome.me/webawesome/dist/utilities/localize.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { OwcIconButton } from '../icon-button/OwcIconButton.js';
import {
  VirtualizerController,
  spacerStyles,
  virtualizes,
} from '../virtualizer/VirtualizerController.js';
import { OwcLocalizeController } from '@open-wc/components/localization.js';

import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/popup/popup.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/tag/tag.js';

import { formControlStyles } from './form-control.styles.js';
import { selectStyles } from './select.styles.js';
import { sizeStyles } from './size.styles.js';
import { optionStyles } from './option.style.js';
import { filterOptionsByLabel } from './filterOptionsByLabel.js';
import { matchFillInput } from './fillInput.js';
import { widestLabelWidth } from './widestLabelWidth.js';

/**
 * The part of a list that shows its content, in viewport coordinates.
 *
 * @param {Element} list
 */
function visiblePart(list) {
  const top = list.getBoundingClientRect().top + list.clientTop;
  return { top, bottom: top + list.clientHeight };
}

/**
 * Scrolls `list` as little as possible to show all of `option`, without
 * scrolling anything around the list.
 *
 * @param {Element} list
 * @param {Element} option
 */
function scrollIntoList(list, option) {
  const { top, bottom } = visiblePart(list);
  const rect = option.getBoundingClientRect();
  if (rect.top < top) {
    list.scrollTop -= top - rect.top;
  } else if (rect.bottom > bottom) {
    list.scrollTop += rect.bottom - bottom;
  }
}

/**
 * Whether all of `option` shows in `list`. An option taller than the list
 * counts as shown while it fills the list, since nothing shows more of it.
 *
 * @param {Element} list
 * @param {Element} option
 */
function isShownInList(list, option) {
  const { top, bottom } = visiblePart(list);
  const rect = option.getBoundingClientRect();
  const inside = rect.top >= top - 1 && rect.bottom <= bottom + 1;
  const fills = rect.top <= top + 1 && rect.bottom >= bottom - 1;
  return inside || fills;
}

/**
 * @template {Record<string, unknown>} T
 */
export class OwcAutocomplete extends ScopedElementsMixin(LitElement) {
  #localize = new OwcLocalizeController(this);
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
    virtualizerMode: { type: String, attribute: 'virtualizer-mode' },
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
    /**
     * Whether the dropdown renders only the options in and around its visible part:
     * `auto` from 300 options on, `always`, or `never`.
     * @type {'always' | 'never' | 'auto'}
     */
    this.virtualizerMode = 'auto';
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
          size=${{ small: 's', medium: 'm', large: 'l' }[this.size] || 'm'}
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
  hasSlotController = new HasSlotController(this, 'help-text', 'label');
  localize = new LocalizeController(this);

  /**
   * Renders the options from the `virtualizer-mode` threshold on. Its scroll
   * container is the option list, so nothing around the dropdown is detected.
   */
  #virtualizer = new VirtualizerController(this, { estimateSize: 36 });

  /** @param {Element | undefined} list */
  #setOptionList = list => {
    if (list) {
      this.#virtualizer.scrollContainer = list;
    }
  };

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
    // read once: the getter builds a new array, and there may be 50,000 options
    const value = this.value;
    return /** @type {T | undefined} */ (this.data.find(opt => this.getOptionValue(opt) === value));
  }

  /** The width of the widest label, kept until the data or the font changes. */
  #labelWidth = { data: /** @type {T[] | undefined} */ (undefined), count: 0, font: '', width: 0 };

  /**
   * Measures the max label width in the full option list, independent of the search.
   */
  #updatePopoverWidth() {
    if (!this.shadowRoot) {
      return;
    }
    const anchorWidth = this.combobox?.getBoundingClientRect().width || 0;

    const items = this.data || [];

    const optionLabelEl = /** @type {HTMLElement | null} */ (
      this.shadowRoot.querySelector('.option-label')
    );
    const computed = optionLabelEl ? window.getComputedStyle(optionLabelEl) : null;

    // Fallback
    const font =
      computed?.font || `${computed?.fontSize || '16px'} ${computed?.fontFamily || 'sans-serif'}`;

    const cached = this.#labelWidth;
    if (cached.data !== items || cached.count !== items.length || cached.font !== font) {
      const ctx = document.createElement('canvas').getContext('2d');
      if (!ctx) {
        return;
      }
      ctx.font = font;
      const labels = items
        .filter(Boolean)
        .map(row => (typeof row.label === 'string' ? row.label : String(row.label || '')));
      const width = widestLabelWidth(labels, text => ctx.measureText(text).width);
      this.#labelWidth = { data: items, count: items.length, font, width };
    }

    const contentWidth = Math.ceil(this.#labelWidth.width + 100); // + padding and such

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
        if (ev.key === 'Home' || ev.key === 'End') {
          ev.preventDefault();
        }
        if (this.processedData.length === 0) {
          return;
        }
        const index = this.#activeIndex();
        let newIndex = index;
        if (ev.key === 'ArrowDown') {
          newIndex = index < this.processedData.length - 1 ? index + 1 : 0;
        }
        if (ev.key === 'ArrowUp') {
          newIndex = index > 0 ? index - 1 : this.processedData.length - 1;
        }
        if (ev.key === 'Home') {
          newIndex = 0;
        }
        if (ev.key === 'End') {
          newIndex = this.processedData.length - 1;
        }
        this.currentValue = this.getOptionValue(this.processedData[newIndex]);
      } else if (ev.key === 'Enter') {
        ev.stopPropagation();
        if (this.processedData.length === 1) {
          this.currentValue = this.getOptionValue(this.processedData[0]);
        }
        const index = this.#activeIndex();
        if (!this.currentValue || index < 0) {
          return;
        }
        // Enter only selects an option the user sees. One scrolled out of view,
        // e.g. with the mouse wheel, is shown first.
        const list = this.#optionList();
        const option = this.#optionElement(index);
        if (list && option && isShownInList(list, option)) {
          this.handleOptionAction(this.currentValue);
        } else {
          this.#revealOption(index);
        }
      }
      return;
    }

    // Closed: only reached via keydown on the combobox itself - open on any typing key
    if (ev.key !== 'Tab' && ev.key !== 'Escape') {
      if (ev.key === ' ') {
        ev.preventDefault();
      }
      this.focus();
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

      this.processedData = filterOptionsByLabel(this.data, value);
    } else {
      this.#selectedSet.clear();
      for (const id of matchFillInput(value, this.data, this.getOptionValue)) {
        this.#selectedSet.add(id);
      }
      this.dispatchEvent(new Event('change'));
      this.requestUpdate();
    }
  }

  /**
   * Filters while the user types, and shows the first match, or the active
   * option if it still matches.
   *
   * @param {InputEvent} ev
   */
  #handleSearchInput(ev) {
    this.#handleSearch(ev);
    if (this.fillMode === false) {
      this.updateComplete.then(() => this.#revealActiveOption(true));
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

    if (!this.disabled && id && this.#selectedSet.has(id)) {
      this.#selectedSet.delete(id);
      this.requestUpdate();

      // Dispatch after updating
      this.updateComplete.then(() => {
        this.dispatchEvent(new Event('change'));
        this.dispatchEvent(new InputEvent('input'));
      });
    }
  }

  get tags() {
    if (Array.isArray(this.value)) {
      return this.value.map((value, index) => {
        if (index < this.maxOptionsVisible || this.maxOptionsVisible <= 0) {
          const option = /** @type {T} */ (
            this.data.find(opt => this.getOptionValue(opt) === value)
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
    // read once: the getter builds a new array, and there may be 50,000 options
    const value = this.value;
    const option = /** @type {T} */ (this.data.find(opt => this.getOptionValue(opt) === value));
    return option ? option.label : '';
  }

  /**
   * @param {import('lit').PropertyValues} changedProperties
   */
  update(changedProperties) {
    if (changedProperties.has('data')) {
      this.processedData = this.data ? [...this.data] : [];
      // measured again on the next opening; don't hold on to the old options until then
      this.#labelWidth = { data: undefined, count: 0, font: '', width: 0 };
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
      // Once this update is done: rendering the option is an update of its own.
      this.updateComplete.then(() => this.#revealActiveOption());
    }
  }

  /**
   * Scrolls the option list just enough to show the active option, so Enter
   * selects an option the user can see.
   *
   * @param {boolean} [orFirst] shows the first option when no option is active
   */
  #revealActiveOption(orFirst = false) {
    const index = this.#activeIndex();
    if (index >= 0 || orFirst) {
      this.#revealOption(Math.max(index, 0));
    }
  }

  /** The index of the active option in `processedData`, or -1. */
  #activeIndex() {
    return this.processedData.findIndex(
      option => this.getOptionValue(option) === this.currentValue,
    );
  }

  /** The element that lists, and scrolls, the options. */
  #optionList() {
    return this.shadowRoot?.querySelector('#rows') ?? undefined;
  }

  /**
   * The rendered element of an option, if it is rendered.
   *
   * @param {number} index the option's index in `processedData`
   */
  #optionElement(index) {
    return this.#optionList()?.querySelector(`:scope > [data-index="${index}"]`) ?? undefined;
  }

  /**
   * Scrolls the option list just enough to show an option, after rendering it
   * if the list is virtualized.
   *
   * @param {number} index
   */
  #revealOption(index) {
    // Until the popup has sized itself, the option list is as tall as all of
    // its options, so showing one would scroll the page instead. Opening shows
    // the active option once the popup has sized itself.
    if (!this.open || !this.popup?.style.getPropertyValue('--auto-size-available-height')) {
      return;
    }
    if (this.#virtualizes()) {
      void this.#virtualizer.scrollToIndex(index, { block: 'nearest' });
      return;
    }
    const list = this.#optionList();
    const option = this.#optionElement(index);
    if (list && option) {
      scrollIntoList(list, option);
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
      const id = this.getOptionValue(entry);
      if (!this.#selectedSet.has(id)) {
        this.#selectedSet.add(id);
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
      // The popup positions and sizes itself in microtasks, so the option list
      // fits the available height from the next animation frame on, which is
      // still before the dropdown is painted.
      requestAnimationFrame(() => this.#revealActiveOption(true));

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
    if (this.disabled) {
      this.open = false;
      return undefined;
    }
    if (this.open) {
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
            sync=${this.fixedTrigger || !this.syncWidth ? '' : 'width'}
            auto-size="vertical"
            auto-size-padding="10"
          >
            ${
              this.fixedTrigger
                ? html`<div
                    part="fixedTrigger"
                    class="fixedTrigger"
                    slot="anchor"
                    tabindex=${this.disabled ? '-1' : '0'}
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
                    tabindex=${this.disabled ? '-1' : '0'}
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
                      .value=${
                        Array.isArray(this.value) ? this.value.join(', ') : String(this.value ?? '')
                      }
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
                @input=${this.#handleSearchInput}
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
              <div id="rows" ${ref(this.#setOptionList)} @click=${this.handleOptionClick}>
                ${this.open ? this.#renderOptions() : nothing}
              </div>
              ${
                this.hideSelectAll === false
                  ? html`<wa-button
                      id="select-all-button"
                      variant="brand"
                      @click=${this.#handleSelectAll}
                      >${
                        this.#selectedSet.size === this.processedData.length
                          ? this.#localize.term('autoCompleteRemoveAll')
                          : this.#localize.term('autoCompleteSelectAll')
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

  /** Whether the dropdown renders only the options in and around its visible part. */
  #virtualizes() {
    return virtualizes(this.virtualizerMode, this.processedData.length);
  }

  /**
   * Every option, or the options in range between two spacers, in normal flow.
   * Options are keyed by their object, so a new range or a new search only
   * adds and removes options at the edges.
   */
  #renderOptions() {
    const options = this.processedData;
    if (!this.#virtualizes()) {
      return repeat(
        options,
        option => option,
        (option, index) => this.renderItem(option, index),
      );
    }
    return this.#virtualizer.renderSlice(this.#virtualizer.slice(options), this.renderItem);
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
    spacerStyles,
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
        /* the option list takes what the search field and the footer leave of the available height */
        display: flex;
        flex-direction: column;
      }

      .listbox > * {
        flex: none;
      }

      /* The option list sizes to its options and scrolls once they don't fit. */
      .listbox > #rows {
        flex: 0 1 auto;
        min-height: 0;
        overflow-y: auto;
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
