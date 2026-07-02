/**
 *
 * @param {import("lit").TemplateResult<any>} _data
 * @returns
 */
export function litHtmlToString(_data) {
  if (!_data) {
    return '';
  }
  // @ts-ignore
  const data = /** @type {{ strings: string[], values: any[] }} */ (_data);
  const { strings, values } = data;
  if (values) {
    const v = [...values, ''].map(value => {
      let valueResult = value;
      if (typeof value === 'function') {
        valueResult = `${value.name}()`;
      }

      if (Array.isArray(valueResult)) {
        valueResult = value.map(litHtmlToString).join('');
      } else if (typeof valueResult === 'object') {
        valueResult = litHtmlToString(value);
      }
      return valueResult;
    });
    const merged = (strings || ['', ''])?.reduce(
      (acc, s, i) => acc + s.replace(/$\n/gm, '').replace(/ {2,}/g, ' ') + v[i],
      '',
    );
    return merged.trim();
  }
  return '';
}
