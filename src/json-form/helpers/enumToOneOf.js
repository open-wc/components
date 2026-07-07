/**
 * Transforms enums (["1", "2"]) to oneOf format ([{const: "1", title: "1"}, ...]) so there is just one format
 * @param {string[] | undefined} _enum
 * @returns {{const: string; title: string}[]}
 */
export function enumToOneOf(_enum) {
  if (_enum === undefined) {
    return [];
  }
  return _enum.map((/** @type {any} */ entry) => ({ const: entry, title: entry }));
}
