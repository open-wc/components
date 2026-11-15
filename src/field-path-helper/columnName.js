/**
 * The name of a column for the controls that edit or filter its values, like
 * the checkbox in a cell or the value field of a filter: `labelString`, else
 * a string `label`. A column whose label is a template has no name without
 * `labelString`.
 *
 * @param {{ labelString?: string, label?: unknown } | undefined} column
 * @returns {string | undefined}
 */
export function columnName(column) {
  return column?.labelString ?? (typeof column?.label === 'string' ? column.label : undefined);
}
