/**
 * @template {Record<string, unknown>} T
 * @param {T} row
 * @param {import('./getFieldPathContent.types.js').Field<T>} field
 * @param {any} value
 * @returns {void}
 */
export function setFieldPath(row, field, value) {
  if (!field) {
    return;
  }
  const fieldParts = field.toString().split('.');
  let resolvedPath = row;
  for (let i = 0; i < fieldParts.length; i++) {
    let fieldPart = fieldParts[i];
    if (i === fieldParts.length - 1) {
      // If is leaf node insert at fieldPart
      // @ts-ignore
      resolvedPath[fieldPart] = value;
      return;
    }
    if (!resolvedPath[fieldPart]) {
      // @ts-ignore
      resolvedPath[fieldPart] = {};
    }
    // @ts-ignore
    resolvedPath = resolvedPath[fieldPart] ? resolvedPath[fieldPart] : '';
  }
}
