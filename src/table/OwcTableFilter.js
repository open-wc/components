import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { LitElement, css, html } from 'lit';
import { OwcAutocomplete } from '@open-wc/components/OwcAutocomplete.js';
import { map } from 'lit/directives/map.js';
import { choose } from 'lit/directives/choose.js';
import {
  DATE_OPERATORS,
  TEXT_OPERATORS,
  NUMBER_OPERATORS,
  OTHER_OPERATORS,
  ARRAY_OPERATORS,
} from './operators.js';
import { OwcMultiCheckbox } from '@open-wc/components/OwcMultiCheckbox.js';

import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/option/option.js';
import '@awesome.me/webawesome/dist/components/select/select.js';
import { spreadProps } from '@open-wc/lit-helpers';
import { when } from 'lit/directives/when.js';
import { OwcIconButton } from '@open-wc/components/OwcIconButton.js';
import { OwcSeparator } from '@open-wc/components/OwcSeparator.js';
import { classMap } from 'lit/directives/class-map.js';

import {
  toLocalDateTimeInputValue,
  fromLocalDateTimeInputValue,
  toLocalDateInputValue,
  fromLocalDateInputValue,
} from './localTime.js';

/** @typedef {{ from: Date; to: Date }} DateRange */

/**
 * @template {Record<string, unknown>} T
 */
export class OwcTableFilter extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'owc-icon-button': OwcIconButton,
    'owc-autocomplete': OwcAutocomplete,
    'owc-multi-checkbox': OwcMultiCheckbox,
    'owc-separator': OwcSeparator,
  };

  static properties = {
    type: { type: String, reflect: true },
    selectedIndex: { type: Number },
    value: { type: Object },
    columns: { attribute: false },
    onlyButton: { type: Boolean, attribute: 'only-button', reflect: true },
  };

  constructor() {
    super();
    this.type = 'and';
    /** @type {import('./OwcTable.types.js').Column<T>[]} */
    this.columns = [];
    /** @type {import('./filter.type.js').JsonFilter} */
    // @ts-ignore
    this.value = { field: 'OwcTableFilterButton' };
    this.selectedIndex = -1;
    this.onlyButton = false;
  }

  get enabled() {
    return this.value.enabled === undefined || this.value.enabled;
  }

  get negated() {
    return !!this.value.negated;
  }

  reset() {
    // @ts-ignore
    this.value = { field: 'OwcTableFilterButton' };
  }

  /**
   * @param {import('lit').PropertyValues} changedProperties
   */
  update(changedProperties) {
    if (changedProperties.has('value')) {
      this.selectedIndex = this.columns.findIndex(column => column.field === this.value.field);
      this.onlyButton = this.value.field === 'OwcTableFilterButton';
    }
    super.update(changedProperties);
  }

  get column() {
    return this.columns[this.selectedIndex];
  }

  focus() {
    const fieldFilter = /** @type {HTMLInputElement} */ (
      this.shadowRoot?.querySelector('.field-filter')
    );

    if (fieldFilter) {
      fieldFilter.focus();
      return;
    }

    const fieldSelector = /** @type {OwcAutocomplete<T>} */ (
      this.shadowRoot?.querySelector('.field-selector')
    );
    if (fieldSelector) {
      fieldSelector.focus();
      return;
    }
  }

  addClickHandler() {
    this.value = { ...this.value, field: 'OwcTableFilterFieldSelector' };
    setTimeout(() => {
      const fieldSelector = /** @type {OwcAutocomplete<T>} */ (
        this.shadowRoot?.querySelector('.field-selector')
      );
      fieldSelector?.focus();
    }, 50);
  }

  #fireChangeEvent() {
    this.dispatchEvent(new Event('change'));
  }

  renderFieldSelector() {
    const data = this.columns
      .filter(column => column.field)
      .map(column => ({
        label: column.labelString || column.label,
        value: column.field,
      }))
      .sort((a, b) =>
        String(a.label || '').localeCompare(String(b.label || ''), 'de', { sensitivity: 'base' }),
      );
    return html`
      <owc-autocomplete
        class="field-selector"
        .value=${this.value.field}
        .data=${data}
        @change=${(/** @type {Event} */ ev) => {
          ev.stopPropagation();
          const target = /** @type {OwcAutocomplete<T>} */ (ev?.target);
          const column = this.columns.find(column => column.field === target.value);
          if (column && column.field) {
            const filterType = column.filterType || 'text';
            this.value = {
              field: column.field,
              operator:
                filterType === 'number' || filterType === 'date' || filterType === 'datetime'
                  ? 'greaterThanOrEqual'
                  : filterType === 'autocomplete' || filterType === 'boolean'
                    ? 'equal'
                    : filterType === 'array'
                      ? 'some'
                      : 'includes',
              value:
                filterType === 'date' || filterType === 'datetime'
                  ? new Date()
                  : filterType === 'number'
                    ? 0
                    : filterType === 'boolean'
                      ? true
                      : filterType === 'checkbox' ||
                          filterType === 'autocomplete' ||
                          filterType === 'array'
                        ? []
                        : '',
            };

            // Target is array type
            if (target.value?.toString()?.includes('[].')) {
              const fieldSplit = target.value?.toString()?.split('[]');
              const columnBase = this.columns.find(column => column.field === fieldSplit[0]);
              this.value = {
                field: columnBase?.field || '',
                operator: 'some',
                value: [
                  { ...this.value, field: this.value.field.replace(fieldSplit[0] + '[].', '') },
                ],
              };
            }

            if (filterType === 'boolean') {
              this.#fireChangeEvent();
              return;
            }

            setTimeout(() => {
              const nextInput = /** @type {HTMLInputElement} */ (
                this.shadowRoot?.querySelector('.field-filter')
              );
              if (!nextInput) {
                return;
              }
              nextInput.focus();
              const originalValue =
                filterType === 'datetime'
                  ? toLocalDateTimeInputValue(/** @type {Date} */ (this.value.value))
                  : filterType === 'date'
                    ? toLocalDateInputValue(/** @type {Date} */ (this.value.value))
                    : String(this.value.value);
              switch (filterType) {
                case 'datetime':
                case 'date':
                  nextInput.showPicker();
                  nextInput?.addEventListener(
                    'blur',
                    ev => {
                      const target = /** @type {HTMLInputElement} */ (ev?.target);
                      if (target.value !== originalValue) {
                        this.#fireChangeEvent();
                      }
                    },
                    { once: true },
                  );
                  break;
                case 'autocomplete':
                  // do nothing
                  break;
                default:
                  this.#fireChangeEvent();
              }
            }, 50);
          }
        }}
      ></owc-autocomplete>
    `;
  }

  renderAddButton() {
    return html`
      <button @click=${this.addClickHandler}>
        <div class="button-content">
          <wa-icon name="plus-circle"></wa-icon>
          <span>Filter</span><span>hinzufügen</span>
        </div>
      </button>
    `;
  }

  renderDeleteButton() {
    return html`<owc-icon-button
      class="delete-button"
      name="x-circle"
      variant="regular"
      @click=${() => {
        // @ts-ignore
        this.value = { field: 'OwcTableFilterButton' };
        this.dispatchEvent(new Event('delete'));
      }}
    ></owc-icon-button>`;
  }

  renderToggleButton() {
    return html`<owc-icon-button
      class="toggle-button"
      variant="regular"
      name=${this.enabled ? 'pause-circle' : 'play-circle'}
      @click=${() => {
        this.value = { ...this.value, enabled: !this.enabled };
        this.#fireChangeEvent();
      }}
    ></owc-icon-button>`;
  }

  renderNegatedButton() {
    return html`<owc-icon-button
      class="toggle-button"
      variant="regular"
      name="exclamation-circle"
      @click=${() => {
        this.value = { ...this.value, negated: !this.negated };
        this.#fireChangeEvent();
      }}
    ></owc-icon-button>`;
  }

  renderControls() {
    return html`
      <div id="controls">
        ${this.renderDeleteButton()}${this.renderToggleButton()}${this.renderNegatedButton()}
      </div>
    `;
  }

  render() {
    if (this.value.field === 'OwcTableFilterButton') {
      return this.renderAddButton();
    }
    if (this.value.operator === undefined) {
      return html`
        ${this.renderControls()}
        <div id="main" class=${this.enabled ? '' : 'disabled'}>${this.renderFieldSelector()}</div>
      `;
    }
    return html`
      ${this.renderControls()}
      <div id="not-bar" class=${classMap({ disabled: !this.enabled, visible: this.negated })}>
        <owc-separator vertical>NICHT</owc-separator>
      </div>
      <div id="main" class=${this.enabled ? '' : 'disabled'}>
        ${this.renderFieldSelector()} ${this.renderFieldFilter()}
      </div>
    `;
  }

  /**
   * @returns {import('lit').TemplateResult | undefined}
   */
  renderFieldFilter() {
    return choose(this.column?.filterType || 'text', [
      [
        'custom',
        () => {
          const renderer = this.column.filterRenderer;
          if (renderer) {
            const value = /** @type {import('./filter.type.js').JsonFilter} */ (this.value);
            return html`<div class="field-filter">
              ${renderer(value, (/** @type {import('./filter.type.js').JsonFilter} */ filter) => {
                this.value = filter;
              })}
            </div>`;
          }
          return html`<p>Kein Filter für ${this.value.field} gefunden</p>`;
        },
      ],
      [
        'checkbox',
        () =>
          html`<owc-multi-checkbox
            class="field-filter"
            .options=${this.column.filterOptions}
            .value=${this.value}
            @change=${(/** @type {Event} */ ev) => {
              ev.stopPropagation();
              const target = /** @type {OwcMultiCheckbox} */ (ev?.target);
              this.value = target.value;
              this.#fireChangeEvent();
            }}
          ></owc-multi-checkbox>`,
      ],
      ['boolean', () => html``],
      [
        'autocomplete',
        () => {
          return html`<owc-autocomplete
            class="field-filter"
            .data=${this.column.filterOptions}
            .value=${this.value.value}
            .maxOptionsVisible=${1}
            multiple
            @change=${(/** @type {Event} */ ev) => {
              ev.stopPropagation();
              const target = /** @type {OwcAutocomplete<T>} */ (ev?.target);
              if (
                target.value &&
                JSON.stringify(target.value) !== JSON.stringify(this.value.value)
              ) {
                this.value = {
                  ...this.value,
                  operator: 'equal',
                  // @ts-ignore
                  value: target.value,
                };
                this.#fireChangeEvent();
              }
            }}
          ></owc-autocomplete>`;
        },
      ],
      [
        'array',
        () => {
          return html`<wa-select
              class="operator"
              value=${this.value.operator}
              @change=${(/** @type {InputEvent} */ ev) => {
                ev.stopPropagation();
                this.requestUpdate();
                const target = /** @type {HTMLSelectElement} */ (ev?.target);
                const operator = /** @type {import('./filter.type.js').operator} */ (target.value);
                this.value = { ...this.value, operator };
                this.#fireChangeEvent();
              }}
            >
              ${Object.entries(ARRAY_OPERATORS).map(
                ([key, val]) => html`<wa-option .value=${key}>${val}</wa-option>`,
              )}
            </wa-select>
            <owc-table-filter-builder
              class="field-filter"
              ?global-search=${false}
              hide-info-detail
              .columns=${this.columns
                .filter(col => col.field.startsWith(this.value.field))
                .map(col => ({ ...col, field: col.field.split(this.value.field + '[].')[1] }))}
              .value=${this.value.value}
              @change=${(/** @type {Event} */ ev) => {
                ev.stopPropagation();
                const target =
                  /** @type {import('./OwcTableFilterBuilder.js').OwcTableFilterBuilder<T>} */ (
                    ev?.target
                  );
                if (
                  target.value &&
                  JSON.stringify(target.value) !== JSON.stringify(this.value.value)
                ) {
                  this.value = {
                    ...this.value,
                    value: target.value,
                  };
                  this.#fireChangeEvent();
                }
              }}
            ></owc-table-filter-builder>`;
        },
      ],
      ['text', () => this.renderDefaultFilter('text')],
      ['number', () => this.renderDefaultFilter('number')],
      ['date', () => this.renderDefaultFilter('date')],
      ['datetime', () => this.renderDefaultFilter('datetime-local')],
      // there is intentionally no 'multiselect' filter type - use 'autocomplete' instead
    ]);
  }

  /**
   *
   * @param {'text' | 'number' | 'date' | 'datetime-local'} type
   * @returns
   */
  renderDefaultFilter(type) {
    /** @type {Partial<Record<import("./filter.type.js").operator, string>>} */
    const operators = {
      ...OTHER_OPERATORS,
      ...(this.column?.filterType === 'number'
        ? NUMBER_OPERATORS
        : this.column?.filterType === 'date' || this.column?.filterType === 'datetime'
          ? DATE_OPERATORS
          : TEXT_OPERATORS),
    };
    const year = new Date().getFullYear();
    const isDT = this.column?.filterType === 'datetime';
    const isD = this.column?.filterType === 'date';

    const isBetween =
      typeof this.value?.operator === 'string' && this.value.operator.startsWith('between');
    /** @type {DateRange | undefined} */
    const range = (() => {
      if (!isBetween) {
        return undefined;
      }
      const v = /** @type {unknown} */ (this.value?.value);
      if (
        v &&
        typeof v === 'object' &&
        'from' in /** @type {any} */ (v) &&
        'to' in /** @type {any} */ (v)
      ) {
        const r = /** @type {{from: unknown; to: unknown}} */ (v);
        if (r.from instanceof Date && r.to instanceof Date) {
          return /** @type {DateRange} */ (r);
        }
      }
      return undefined;
    })();

    const toMin = range
      ? isDT
        ? toLocalDateTimeInputValue(range.from)
        : isD
          ? toLocalDateInputValue(range.from)
          : undefined
      : undefined;

    const fromMax = range
      ? isDT
        ? toLocalDateTimeInputValue(range.to)
        : isD
          ? toLocalDateInputValue(range.to)
          : undefined
      : undefined;

    return html`<wa-select
        class="operator"
        value=${this.value.operator}
        @change=${(/** @type {InputEvent} */ ev) => {
          ev.stopPropagation();
          this.requestUpdate();
          const target = /** @type {HTMLSelectElement} */ (ev?.target);
          const operator = /** @type {import('./filter.type.js').operator} */ (target.value);
          this.value = { ...this.value, operator };
          if (this.value.operator.startsWith('between')) {
            this.value = {
              ...this.value,
              value: {
                from: new Date(),
                to: new Date(),
              },
            };
          } else if (this.column.filterType === 'date' || this.column.filterType === 'datetime') {
            this.value = { ...this.value, value: new Date() };
          }
          this.#fireChangeEvent();
        }}
      >
        ${map(
          Object.keys(operators),
          operator =>
            html`<wa-option .value=${operator}
              >${
                operators[/** @type {import('./filter.type.js').operator} */ (operator)]
              }</wa-option
            >`,
        )}
      </wa-select>
      ${
        this.value.operator === 'isEmpty'
          ? ''
          : html` <wa-input
                class="field-filter"
                .value=${(() => {
                  const v = this.value;
                  const isDT = this.column?.filterType === 'datetime';
                  const isD = this.column?.filterType === 'date';

                  if (typeof v.operator === 'string' && v.operator.startsWith('between')) {
                    const rv = /** @type {unknown} */ (v.value);
                    const r =
                      rv && typeof rv === 'object' && 'from' in /** @type {any} */ (rv)
                        ? /** @type {{from: unknown}} */ (rv)
                        : undefined;
                    const from = r?.from instanceof Date ? r.from : new Date();
                    return isDT
                      ? toLocalDateTimeInputValue(from)
                      : isD
                        ? toLocalDateInputValue(from)
                        : String(v.value);
                  }

                  const single = v.value;
                  return isDT && single instanceof Date
                    ? toLocalDateTimeInputValue(single)
                    : isD && single instanceof Date
                      ? toLocalDateInputValue(single)
                      : String(single);
                })()}
                .type=${type}
                @change=${(/** @type {Event} */ ev) => {
                  ev.stopPropagation();
                  const target = /** @type {HTMLInputElement} */ (ev?.target);

                  if (isDT || isD) {
                    return;
                  }

                  // Type Coercion Problem: Normalize value types so we don't end up with "1" (string) for number filters.
                  if (this.column?.filterType === 'number') {
                    const n = Number.parseFloat(target.value);
                    this.value = { ...this.value, value: Number.isFinite(n) ? n : 0 };
                  } else {
                    this.value = { ...this.value, value: target.value };
                  }

                  this.requestUpdate();
                  this.#fireChangeEvent();
                }}
                @blur=${(/** @type {FocusEvent} */ ev) => {
                  // Only blur for date/datetime filters.
                  if (!isDT && !isD) {
                    return;
                  }

                  ev.stopPropagation();
                  const target = /** @type {HTMLInputElement} */ (ev?.target);

                  /** @type {Date | null} */
                  let committedValue = null;

                  if (isDT) {
                    const parsed = fromLocalDateTimeInputValue(target.value);
                    if (!parsed) {
                      // -> Invalid or empty datetime string -> restore previous value in UI.
                      const previous =
                        isBetween && range
                          ? range.from
                          : this.value.value instanceof Date
                            ? this.value.value
                            : new Date();

                      target.value = toLocalDateTimeInputValue(previous);
                      return;
                    }
                    committedValue = parsed;
                  } else if (isD) {
                    const parsed = fromLocalDateInputValue(target.value);
                    if (!parsed) {
                      // -> Invalid or empty date string -> restore previous value in UI.
                      const previous =
                        isBetween && range
                          ? range.from
                          : this.value.value instanceof Date
                            ? this.value.value
                            : new Date();

                      target.value = toLocalDateInputValue(previous);
                      return;
                    }
                    committedValue = parsed;
                  }

                  if (!committedValue) {
                    return;
                  }

                  if (isBetween) {
                    this.value = {
                      ...this.value,
                      value: {
                        .../** @type {{from: Date; to: Date}} */ (this.value.value),
                        from: committedValue,
                      },
                    };
                  } else {
                    this.value = { ...this.value, value: committedValue };
                  }

                  this.requestUpdate();
                  this.#fireChangeEvent();
                }}
                @keydown=${(/** @type {KeyboardEvent} */ ev) => {
                  // "Enter" key -> commit by blurring
                  if (ev.key === 'Enter') {
                    ev.stopPropagation();
                    const target = /** @type {HTMLInputElement} */ (ev.currentTarget);
                    target.blur();
                  }
                }}
                @input=${(/** @type {InputEvent} */ ev) => {
                  const target = /** @type {HTMLInputElement} */ (ev?.target);

                  if (
                    this.column?.filterType === 'date' ||
                    this.column?.filterType === 'datetime'
                  ) {
                    return;
                  }

                  if (this.column?.filterType === 'number') {
                    const n = Number.parseFloat(target.value);
                    // guard against NaN while typing / clearing the input
                    const parsedNumber = Number.isFinite(n) ? n : 0;

                    if (this.value.operator.startsWith('between')) {
                      const prev =
                        typeof this.value.value === 'object'
                          ? /** @type {{from: number; to: number}} */ (this.value.value)
                          : /** @type {{from: number; to?: number}} */ ({});

                      this.value = {
                        ...this.value,
                        value: /** @type {{from: number; to: number}} */ {
                          from: parsedNumber,
                          to: prev.to ?? 0,
                        },
                      };
                    } else {
                      this.value = { ...this.value, value: parsedNumber };
                    }
                  } else {
                    this.value = { ...this.value, value: target.value };
                  }

                  this.requestUpdate();
                  this.#fireChangeEvent();
                }}
                ${spreadProps(
                  this.value.operator.includes('NoYear')
                    ? { min: `${year}-01-01`, max: `${year}-12-31` }
                    : { max: fromMax },
                )}
              ></wa-input>
              ${when(this.value.operator.startsWith('between'), () => {
                return html`<wa-input
                  class="field-filter"
                  .value=${(() => {
                    const isDT = this.column?.filterType === 'datetime';
                    const isD = this.column?.filterType === 'date';
                    const to = /** @type {{to: Date}} */ (this.value.value).to;
                    return isDT
                      ? toLocalDateTimeInputValue(to)
                      : isD
                        ? toLocalDateInputValue(to)
                        : String(to);
                  })()}
                  .type=${type}
                  @change=${(/** @type {Event} */ ev) => {
                    ev.stopPropagation();
                    // numbers: handled via @input
                    // dates/datetimes: handled via @blur
                  }}
                  @blur=${(/** @type {FocusEvent} */ ev) => {
                    // Only blur for date/datetime filters.
                    if (!isDT && !isD) {
                      return;
                    }

                    ev.stopPropagation();
                    const target = /** @type {HTMLInputElement} */ (ev?.target);

                    /** @type {Date | null} */
                    let toDate = null;

                    if (isDT) {
                      const parsed = fromLocalDateTimeInputValue(target.value);
                      if (!parsed) {
                        // invalid/empty -> restore previous "to" value in the UI
                        const previous =
                          range && range.to instanceof Date
                            ? range.to
                            : this.value.value instanceof Date
                              ? this.value.value
                              : new Date();

                        target.value = toLocalDateTimeInputValue(previous);
                        return;
                      }
                      toDate = parsed;
                    } else if (isD) {
                      const parsed = fromLocalDateInputValue(target.value);
                      if (!parsed) {
                        const previous =
                          range && range.to instanceof Date
                            ? range.to
                            : this.value.value instanceof Date
                              ? this.value.value
                              : new Date();

                        target.value = toLocalDateInputValue(previous);
                        return;
                      }
                      toDate = parsed;
                    }

                    if (!toDate) {
                      return;
                    }

                    this.value = {
                      ...this.value,
                      value: {
                        .../** @type {{from: Date; to: Date}} */ (this.value.value),
                        to: toDate,
                      },
                    };

                    this.requestUpdate();
                    this.#fireChangeEvent();
                  }}
                  @keydown=${(/** @type {KeyboardEvent} */ ev) => {
                    // "Enter" key -> commit by blurring
                    if (ev.key === 'Enter') {
                      ev.stopPropagation();
                      const target = /** @type {HTMLInputElement} */ (ev.currentTarget);
                      target.blur();
                    }
                  }}
                  @input=${(/** @type {InputEvent} */ ev) => {
                    if (
                      this.column?.filterType === 'date' ||
                      this.column?.filterType === 'datetime'
                    ) {
                      return;
                    }

                    const target = /** @type {HTMLInputElement} */ (ev?.target);
                    const n = Number.parseFloat(target.value);
                    // guard against NaN while typing / clearing the input
                    const parsedNumber = Number.isFinite(n) ? n : 0;

                    const prev =
                      typeof this.value.value === 'object'
                        ? /** @type {{from: number; to: number}} */ (this.value.value)
                        : /** @type {{from: number; to?: number}} */ ({});

                    this.value = {
                      ...this.value,
                      value: /** @type {{from: number; to: number}} */ {
                        from: prev.from,
                        to: parsedNumber,
                      },
                    };

                    this.#fireChangeEvent();
                  }}
                  ${spreadProps(
                    this.value.operator.includes('NoYear')
                      ? { min: `${year}-01-01`, max: `${year}-12-31` }
                      : { min: toMin },
                  )}
                >
                </wa-input>`;
              })}`
      }`;
  }

  static styles = [
    css`
      :host {
        display: flex;
        min-width: 270px;
        position: relative;
        flex-flow: column;
        --owc-tableFilter-gray: #ccc;
        --owc-tableFilter-button-border: var(--owc-tableFilter-gray, #ccc);
        --owc-tableFilter-background-secondary-color: var(--owc-tableFilter-gray, #ccc);
        --owc-tableFilter-border-radius: var(--wa-border-radius-m, 6px);
      }
      :host([only-button][type='or']) {
        min-width: 100px;
      }
      :host([only-button][type='or']) .button-content {
        flex-direction: column;
        align-items: center;
      }

      button {
        border: 1px dashed var(--owc-tableFilter-button-border);
        border-radius: 10px;
        padding: 15px;
        display: grid;
        place-items: center;
        background: none;
        cursor: pointer;
        width: 100%;
      }
      .button-content {
        display: flex;
        gap: 5px;
        opacity: 0;
        transition: opacity 0.3s;
      }
      button:hover .button-content {
        opacity: 1;
      }

      :host(:hover) #controls {
        opacity: 1;
      }

      #controls {
        display: flex;
        flex-direction: column;
        position: absolute;
        right: -35px;
        gap: 5px;
        padding: 0 0 5px 0;
        z-index: 100;
        opacity: 0;
        transition: opacity 0.3s;
        background: var(--owc-tableFilter-background-primary-color, #fff);
      }

      #controls owc-icon-button {
        padding: 0;
      }

      #main {
        display: flex;
        min-width: 270px;
        gap: 5px;
        flex-direction: column;
        position: relative;
      }

      #main.disabled::after {
        opacity: 0.5;
        pointer-events: all;
        border-radius: var(--owc-tableFilter-border-radius);
      }

      #main::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--owc-tableFilter-background-secondary-color);
        opacity: 0;
        transition: opacity 0.3s;
        pointer-events: none;
      }

      #not-bar {
        position: absolute;
        left: -20px;
        height: 100%;
        opacity: 0;
        transition: opacity 0.3s;
      }

      #not-bar.visible {
        opacity: 1;
      }

      #not-bar owc-separator {
        color: var(--wa-color-red-40);
        --color: var(--wa-color-red-60);
        height: 100%;
        margin: 0;
      }

      #not-bar.disabled::after {
        opacity: 0.5;
        pointer-events: all;
      }

      #not-bar::after {
        content: '';
        position: absolute;
        top: 0;
        width: 20px;
        height: 100%;
        background: var(--owc-tableFilter-background-secondary-color);
        opacity: 0;
        transition: opacity 0.3s;
      }

      owc-table-filter-builder.field-filter {
        border-color: var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-m);
        border-style: var(--wa-border-style);
        border-width: var(--wa-border-width-s);
        padding: 10px;
      }
    `,
  ];
}
