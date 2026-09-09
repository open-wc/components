/**
 * @template T
 * @typedef {import('./OwcDataDetail.types.js').OwcDataDetailItem<T>} OwcDataDetailItem
 */

/**
 * Filters each column down to its visible items.
 *
 * An item is visible when its `visible` field is `undefined`, `true`, or a
 * function that returns truthy for the given data.
 *
 * @template T
 * @param {Array<Array<OwcDataDetailItem<T>>>} columns
 * @param {T} data
 * @returns {Array<Array<OwcDataDetailItem<T>>>}
 */
export function getVisibleColumns(columns, data) {
  return (columns || []).map(column =>
    column.filter(item => {
      const visible = item.visible;
      return typeof visible === 'function' ? visible(data) : (visible ?? true);
    }),
  );
}

/**
 * The number of grid rows needed to render the columns - the length of the
 * longest column, or 0 when there are no columns.
 *
 * @param {Array<Array<unknown>>} columns
 * @returns {number}
 */
export function getRowCount(columns) {
  return Math.max(0, ...columns.map(column => column.length));
}

/**
 * The fields of all items marked required in their editable options.
 *
 * @template T
 * @param {Array<Array<OwcDataDetailItem<T>>>} columns
 * @returns {Array<import('../field-path-helper/getFieldPathContent.types.js').Field<T>>}
 */
export function getRequiredFields(columns) {
  return columns
    .flatMap(column => column)
    .filter(item => item.editableOptions?.required)
    .map(item => item.field);
}
