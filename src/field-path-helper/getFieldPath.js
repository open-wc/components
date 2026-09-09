/**
 * @template {Record<string, unknown>} T
 * @param {T} row
 * @param {import('./getFieldPathContent.types.js').Field<T>} [field]
 * @returns {string | number | boolean | Date | undefined | import('lit').TemplateResult | unknown | unknown[]}
 */
export function getFieldPath(row, field) {
  if (!field) {
    return;
  }
  const fieldParts = field.toString().split('.');
  let resolvedPath = row;
  for (const fieldPart of fieldParts) {
    const isArrayField = fieldPart.indexOf('[]');
    if (isArrayField > 0) {
      const arrayField = fieldPart.substring(0, isArrayField);
      // @ts-ignore
      resolvedPath = resolvedPath[arrayField];
    } else if (Array.isArray(resolvedPath)) {
      // @ts-ignore
      resolvedPath = resolvedPath.map(element => (element ? element[fieldPart] : ''));
    } else {
      // @ts-ignore
      resolvedPath =
        resolvedPath[fieldPart] || resolvedPath[fieldPart] === 0 ? resolvedPath[fieldPart] : '';
    }
  }
  // @ts-ignore
  return resolvedPath;
}
