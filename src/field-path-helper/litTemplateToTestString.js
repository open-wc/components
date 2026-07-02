/**
 * Converts a lit template to a test string.
 *
 * @param {unknown} _data - The _data containing strings and values.
 * @returns {string} The resulting test string.
 */
export function litTemplateToTestString(_data) {
  if (!_data) {
    return '';
  }
  const data = /** @type {{ strings: string[], values: any[] }} */ (_data);
  const { strings, values } = data;
  if (values && strings) {
    const v = [...values, ''].map(value => {
      let valueResult = value;
      if (typeof value === 'function') {
        valueResult = `${value.name}()`;
      }
      if (typeof valueResult === 'object') {
        valueResult = litTemplateToTestString(value);
      }
      if (typeof valueResult === 'symbol') {
        valueResult = null;
      }
      return valueResult;
    });
    const merged = strings.reduce(
      (acc, s, i) =>
        acc + (v[i] !== null ? s.replace(/$\n/gm, '').replace(/ {2,}/g, ' ') + v[i] : ''),
      '',
    );
    return merged.trim();
  }
  return '';
}
