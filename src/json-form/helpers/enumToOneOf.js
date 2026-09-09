/**
 * Transforms enums (["1", "2"]) to oneOf format ([{const: "1", title: "1"}, ...]) so there is just one format
 * @param {(string | number | boolean | null)[] | undefined} _enum
 * @returns {{const: string | number | boolean | null; title: string}[]}
 */
export function enumToOneOf(_enum) {
  if (_enum === undefined) {
    return [];
  }
  return _enum.map(entry => ({ const: entry, title: String(entry) }));
}
