import { html, css } from 'lit';
import { getFieldPath } from './getFieldPath.js';
// import { filterFieldValue } from './filterFieldValue.js';
import { spreadProps } from '@open-wc/lit-helpers';
import { setFieldPath } from './setFieldPath.js';
import { ifDefined } from 'lit/directives/if-defined.js';

const dateFormatterDefault = new Intl.DateTimeFormat('de', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const dateTimeFormatterDefault = new Intl.DateTimeFormat('de', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
});

const currencyFormatterDefault = new Intl.NumberFormat('de', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
});

const numberFormatterDefault = new Intl.NumberFormat('de', { maximumFractionDigits: 2 });

const percentFormatterDefault = new Intl.NumberFormat('de', {
  style: 'percent',
  maximumFractionDigits: 2,
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @template {Record<string, unknown>} T
 *
 * @param {T} row
 * @param {import('./getFieldPathContent.types.js').FieldPathConfig<T>} column
 * @param {import('./getFieldPathContent.types.js').getFieldPathContentOptions<T>} [options]
 */
export function getFieldPathContent(row, column, options = {}) {
  if (!row) {
    return;
  }

  const {
    renderType = 'html',
    render = ({ content }) => content,
    handleUpdate: handleUpdateUserFunction,
    renderInitiallyAsEditableCondition = () => false,
    isInsert = () => false,
    compareOverrides = {},
  } = options;
  const field = column.field;

  const content = getContent(row, column, options);
  // output wrapper
  if (renderType === 'html' && (column.type === undefined || column.type === 'html')) {
    return render({ content, config: column });
    //  html`
    //   <div class="cell ${column.cellClass}">
    //     <div class="cell-content ${'align-' + (column.align || 'start')}">
    //       ${column.align === 'full' ? content : html`<span class="cell-text"> ${content} </span>`}
    //     </div>
    //   </div>
    // `;
  }

  if (renderType === 'html' && column.type === 'editable') {
    // const inputOptions = column.editableOptions?.inputOptions || {};
    const insertInputOptions = {
      editable: true,
      ...column.editableOptions?.insertInputOptions,
    };
    const inputOptions = renderInitiallyAsEditableCondition({ data: row, config: column })
      ? {
          ...column.editableOptions?.inputOptions,
          ...insertInputOptions,
        }
      : {
          fallbackValue:
            column.editableOptions?.inputOptions?.fallbackValue || options.fallbackValue,
          ...column.editableOptions?.inputOptions,
        };
    // column.editableOptions && row.id
    //   ? column.editableOptions.inputOptions
    //   : {
    //       ...column.editableOptions?.inputOptions,
    //       ...column.editableOptions?.insertInputOptions,
    // };
    const editableType = column.editableOptions?.type || 'input';

    const handleUpdate = (/** @type {MouseEvent} */ ev) => {
      const inputEl = /** @type {HTMLInputElement} */ (ev.target);
      const value = editableType === 'checkbox' ? inputEl.checked : inputEl.value;
      // const isInsert = options.table.isInsert(row);
      // if (isInsert) {
      //   deepInsertField(row, ev.target.value, field);
      // }
      // deepInsertField(row, ev.target.value, field);
      const allRequiredFieldsAreFilled = (data = row) =>
        !!options.requiredFields &&
        options.requiredFields.every(required => getFieldPath(data, required));
      const autoSetData = (data = row) => setFieldPath(data, field, value);
      if (handleUpdateUserFunction) {
        handleUpdateUserFunction({
          field,
          data: row,
          config: column,
          event: ev,
          value,
          allRequiredFieldsAreFilled,
          isNewInsert: isInsert({ data: row, config: column }),
          autoSetData,
        });
      } else {
        setFieldPath(row, field, value);
      }
      // if (options.table) {
      //   options.table.removeInsertData(row);
      // }
    };

    const editableFormatter = column.formatter ? () => content : undefined;
    let clickEditableContent;
    // input
    if (editableType === 'input') {
      clickEditableContent = html`
        <owc-click-editable-input
          .value=${getFieldPath(row, field) || ''}
          ${spreadProps(/** @type {{[key: string]: unknown}}*/ (inputOptions))}
          .formatter=${ifDefined(editableFormatter)}
          @submit=${handleUpdate}
        >
        </owc-click-editable-input>
      `;
    } else if (editableType === 'textarea') {
      clickEditableContent = html`
        <owc-click-editable-textarea
          .value=${getFieldPath(row, field) || ''}
          ${spreadProps(/** @type {{[key: string]: unknown}}*/ (inputOptions))}
          .formatter=${ifDefined(editableFormatter)}
          @submit=${handleUpdate}
        >
        </owc-click-editable-textarea>
      `;
    } else if (editableType === 'autocomplete') {
      clickEditableContent = html`
        <owc-click-editable-autocomplete
          .value=${getFieldPath(row, field) || ''}
          .data=${column.editableOptions?.dataFn?.(row) || column.editableOptions?.data}
          ${spreadProps(/** @type {{[key: string]: unknown}}*/ (inputOptions))}
          .formatter=${ifDefined(editableFormatter)}
          @submit=${handleUpdate}
        >
        </owc-click-editable-autocomplete>
      `;
    } else if (editableType === 'checkbox') {
      clickEditableContent = html`
        <wa-checkbox ?checked=${!!getFieldPath(row, field)} @change=${handleUpdate}> </wa-checkbox>
      `;
    }

    return render({ content: clickEditableContent, config: column });
    // html`<div class="cell ${column.cellClass}">
    //   <div class="cell-content ${'align-' + (column.align || 'start')}">
    //     <span class="cell-text"> ${clickEditableContent}</span>
    //   </div>
    // </div>`;
  }
  if (renderType === 'string') {
    return content;
  }

  if (renderType === 'compare') {
    if (
      field?.startsWith('_') ||
      typeof row.id !== 'string' ||
      !compareOverrides?.[row.id] ||
      compareOverrides[row.id][field] === undefined ||
      row[field] === compareOverrides[row.id][field]
    ) {
      return render({ content, config: column });
    }
    return render({
      content: html`<span class="content-replaced">${content}</span>
        <span class="content-replacement"
          >${getContent(row, column, options, compareOverrides[row.id])}</span
        >`,
      config: column,
    });
  }
  return render({ content, config: column });
}

/**
 * @template {Record<string, unknown>} T
 *
 * @param {T} row
 * @param {import('./getFieldPathContent.types.js').FieldPathConfig<T>} column
 * @param {import('./getFieldPathContent.types.js').getFieldPathContentOptions<T>} [options]
 * @param {Partial<T>} [override]
 */
function getContent(row, column, options = {}, override) {
  if (!row) {
    return;
  }
  const {
    renderType = 'html',
    additionalFormatterOptions,
    additionalFormatter,
    dateFormatter = dateFormatterDefault,
    dateTimeFormatter = dateTimeFormatterDefault,
    numberFormatter = numberFormatterDefault,
    currencyFormatter = currencyFormatterDefault,
    percentFormatter = percentFormatterDefault,
  } = options;
  const field = column.field;
  let content = override?.[field] !== undefined ? override[field] : getFieldPath(row, field);
  if (column.formatter === 'datetime') {
    if (typeof content === 'string' && content) {
      try {
        content = new Date(content);
      } catch {
        // ignore
      }
    }
    if (content instanceof Date && content.getTime() === content.getTime()) {
      content = dateTimeFormatter.format(content);
    }
  }
  if (column.formatter === 'date') {
    if (typeof content === 'string' && content) {
      try {
        content = new Date(content);
      } catch {
        // ignore
      }
    }
    if (content instanceof Date && content.getTime() === content.getTime()) {
      content = dateFormatter.format(content);
    }
  }
  if (column.formatter === 'email') {
    if (typeof content === 'string' && EMAIL_REGEX.test(content)) {
      if (renderType === 'html' || renderType === 'compare') {
        content = html`<a href="mailto:${content}" target="_blank">${content}</a>`;
      }
    }
  }
  if (column.formatter === 'tickCross') {
    content = content ? '✅' : '❌';
  }
  if (column.formatter === 'checkbox') {
    content = html`<wa-checkbox
      class="checkbox-non-editable"
      ?checked=${!!content}
      @click=${(/** @type {{ preventDefault: () => any; }} */ ev) => ev.preventDefault()}
    ></wa-checkbox>`;
  }
  // if (column.formatter === 'rownum') {
  //   content = index + 1;
  // }
  if (
    (column.formatter === 'currency' ||
      column.formatter === 'number' ||
      column.formatter === 'percent') &&
    (typeof content === 'number' || typeof content === 'string')
  ) {
    const number = typeof content === 'string' ? parseFloat(content) : content;
    if (!isNaN(number)) {
      if (renderType === 'html' || renderType === 'compare') {
        if (column.formatter === 'currency') {
          content = currencyFormatter.format(number);
        } else if (column.formatter === 'percent') {
          content = percentFormatter.format(number);
        } else {
          content = numberFormatter.format(number);
        }
      }
      if (renderType === 'string') {
        content = numberFormatter.format(number);
      }
    }
  }

  // const fieldValueFiltered = field ? filterFieldValue(row, field, jsonFilters, jsonSorters) : [];

  const addFormatterOptions = additionalFormatterOptions
    ? additionalFormatterOptions({ data: row, config: column })
    : {};

  // custom formatter
  const formatterOptions = {
    // index,
    field,
    currencyFormatter,
    dateFormatter,
    dateTimeFormatter,
    numberFormatter,
    percentFormatter,
    // fieldValueFiltered,
    ...addFormatterOptions,
    custom: options.custom,
    override,
  };
  if (additionalFormatter) {
    content = additionalFormatter(row, { config: column, content, ...formatterOptions });
  }
  if (renderType === 'html' || renderType === 'compare') {
    if (override && typeof column.formatterCompare === 'function') {
      content = column.formatterCompare(row, formatterOptions);
    } else if (override && typeof column.formatter === 'function') {
      // @ts-expect-error
      content = column.formatter(override, formatterOptions);
    } else if (typeof column.formatter === 'function') {
      content = column.formatter(row, formatterOptions);
    }
  }
  if (renderType === 'string') {
    if (typeof column.formatterString === 'function') {
      content = column.formatterString(row, formatterOptions);
    } else if (typeof column.formatter === 'function') {
      content = column.formatter(row, formatterOptions);
    }
  }

  return content;
}

export const contentFormatterStyles = css`
  .checkbox-non-editable::part(base) {
    cursor: default;
  }
  .checkbox-non-editable::part(control):hover {
    background-color: var(--wa-input-background-color);
    border-color: var(--wa-input-border-color);
  }

  .checkbox-non-editable::part(control--checked):hover {
    background-color: var(--wa-color-primary-50);
    border-color: var(--wa-color-primary-50);
  }

  .content-replaced {
    background-color: var(--wa-color-warning-60);
    text-decoration: line-through;
  }
  .content-replacement {
    background-color: var(--wa-color-success-60);
  }
`;
