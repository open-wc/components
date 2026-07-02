/**
 * @template {Record<string, unknown>} T
 * @param {T} row
 * @param {string} [field]
 * @returns {string | number | boolean | Date | undefined | import('lit').TemplateResult | unknown[]}
 */
export function resolveFieldPath(row, field) {
  if (!field) {
    return;
  }
  const fieldParts = field.split('.');
  let resolvedPath = row;
  for (const fieldPart of fieldParts) {
    // @ts-ignore
    resolvedPath =
      resolvedPath[fieldPart] || resolvedPath[fieldPart] === 0 ? resolvedPath[fieldPart] : '';
  }
  // @ts-ignore
  return resolvedPath;
}

/**
 * @template {Record<string, unknown>} T
 * @param {T} row
 * @param {any} value
 * FIXME: Remove "id" after we removed hardcoded "id" field in csv.js
 * @param {import('./field-path-helper/getFieldPathContent.types.js').Field<T>} [field]
 * @returns {string | number | boolean | Date | undefined | import('lit').TemplateResult | unknown[]}
 */
export function deepInsertField(row, value, field) {
  if (!field) {
    return;
  }
  const fieldParts = field.split('.');
  let resolvedPath = row;
  for (let i = 0; i < fieldParts.length; i++) {
    let fieldPart = fieldParts[i];
    if (i === fieldParts.length - 1) {
      // If is leaf node insert at fieldPart
      // @ts-ignore
      resolvedPath[fieldPart] = value;
      continue;
    }
    if (!resolvedPath[fieldPart]) {
      // @ts-ignore
      resolvedPath[fieldPart] = {};
    }
    // @ts-ignore
    resolvedPath = resolvedPath[fieldPart] ? resolvedPath[fieldPart] : '';
  }
}
