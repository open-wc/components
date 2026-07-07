# Field Path Helper

Shared field-path logic used by `owc-table`, `owc-data-detail`, and the mass
edit: resolve, render, and write values addressed by dotted paths like
`"contract.holder.name"` (with `[]` array segments, e.g. `"items[].price"`).

Not a component and not its own package entry point - the `Field` types flow
into the public table types (`@open-wc/components/OwcTable.types.js` /
`@open-wc/components/table/types.js`), and the functions are consumed
internally by the table family.

## Modules

| Module                                                                                   | Purpose                                                                                                                                               |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [getFieldPath.js](./getFieldPath.js)                                                     | Reads the value at a dotted path; missing segments resolve to `''` (a `0` value is preserved). Arrays map over their elements.                        |
| [setFieldPath.js](./setFieldPath.js)                                                     | Writes a value at a dotted path, creating intermediate objects as needed.                                                                             |
| [getFieldPathContent.js](./getFieldPathContent.js)                                       | Renders a field for the table: applies column config, formatters (date/currency/number/percent, German locale defaults), links, and editing wrappers. |
| [getFieldPathContent.types.ts](./getFieldPathContent.types.ts), [leaves.ts](./leaves.ts) | The `Field<T>` path types (typed dotted paths via leaf inference).                                                                                    |
| [litTemplateToTestString.js](./litTemplateToTestString.js)                               | Flattens a lit template into a plain string - used by tests to assert rendered content.                                                               |

## Tests

- [getFieldPath.test.js](./getFieldPath.test.js), [setFieldPath.test.js](./setFieldPath.test.js), [getFieldPathContent.test.js](./getFieldPathContent.test.js) - logic tests (`node --test src/field-path-helper/getFieldPath.test.js` etc.)
