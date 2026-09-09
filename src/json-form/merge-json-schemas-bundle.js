/* Bundle of https://github.com/fastify/merge-json-schemas

MIT License

Copyright (c) 2024 Fastify

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

// @ts-nocheck
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var dist = {};

var hasRequiredDist;

function requireDist() {
  if (hasRequiredDist) {
    return dist;
  }
  hasRequiredDist = 1;
  var has = Object.prototype.hasOwnProperty;

  function find(iter, tar, key) {
    for (key of iter.keys()) {
      if (dequal(key, tar)) {
        return key;
      }
    }
  }

  function dequal(foo, bar) {
    var ctor, len, tmp;
    if (foo === bar) {
      return true;
    }

    if (foo && bar && (ctor = foo.constructor) === bar.constructor) {
      if (ctor === Date) {
        return foo.getTime() === bar.getTime();
      }
      if (ctor === RegExp) {
        return foo.toString() === bar.toString();
      }

      if (ctor === Array) {
        if ((len = foo.length) === bar.length) {
          while (len-- && dequal(foo[len], bar[len])) {
            null;
          }
        }
        return len === -1;
      }

      if (ctor === Set) {
        if (foo.size !== bar.size) {
          return false;
        }
        for (len of foo) {
          tmp = len;
          if (tmp && typeof tmp === 'object') {
            tmp = find(bar, tmp);
            if (!tmp) {
              return false;
            }
          }
          if (!bar.has(tmp)) {
            return false;
          }
        }
        return true;
      }

      if (ctor === Map) {
        if (foo.size !== bar.size) {
          return false;
        }
        for (len of foo) {
          tmp = len[0];
          if (tmp && typeof tmp === 'object') {
            tmp = find(bar, tmp);
            if (!tmp) {
              return false;
            }
          }
          if (!dequal(len[1], bar.get(tmp))) {
            return false;
          }
        }
        return true;
      }

      if (ctor === ArrayBuffer) {
        foo = new Uint8Array(foo);
        bar = new Uint8Array(bar);
      } else if (ctor === DataView) {
        if ((len = foo.byteLength) === bar.byteLength) {
          while (len-- && foo.getInt8(len) === bar.getInt8(len)) {
            null;
          }
        }
        return len === -1;
      }

      if (ArrayBuffer.isView(foo)) {
        if ((len = foo.byteLength) === bar.byteLength) {
          while (len-- && foo[len] === bar[len]) {
            null;
          }
        }
        return len === -1;
      }

      if (!ctor || typeof foo === 'object') {
        len = 0;
        for (ctor in foo) {
          if (has.call(foo, ctor) && ++len && !has.call(bar, ctor)) {
            return false;
          }
          if (!(ctor in bar) || !dequal(foo[ctor], bar[ctor])) {
            return false;
          }
        }
        return Object.keys(bar).length === len;
      }
    }

    return foo !== foo && bar !== bar;
  }

  dist.dequal = dequal;
  return dist;
}

var errors;
var hasRequiredErrors;

function requireErrors() {
  if (hasRequiredErrors) {
    return errors;
  }
  hasRequiredErrors = 1;

  class MergeError extends Error {
    constructor(keyword, schemas) {
      super();
      this.name = 'JsonSchemaMergeError';
      this.code = 'JSON_SCHEMA_MERGE_ERROR';
      this.message = `Failed to merge "${keyword}" keyword schemas.`;
      this.schemas = schemas;
    }
  }

  class ResolverNotFoundError extends Error {
    constructor(keyword, schemas) {
      super();
      this.name = 'JsonSchemaMergeError';
      this.code = 'JSON_SCHEMA_MERGE_ERROR';
      this.message = `Resolver for "${keyword}" keyword not found.`;
      this.schemas = schemas;
    }
  }

  class InvalidOnConflictOptionError extends Error {
    constructor(onConflict) {
      super();
      this.name = 'JsonSchemaMergeError';
      this.code = 'JSON_SCHEMA_MERGE_ERROR';
      this.message = `Invalid "onConflict" option: "${onConflict}".`;
    }
  }

  errors = {
    MergeError,
    ResolverNotFoundError,
    InvalidOnConflictOptionError,
  };
  return errors;
}

var resolvers;
var hasRequiredResolvers;

function requireResolvers() {
  if (hasRequiredResolvers) {
    return resolvers;
  }
  hasRequiredResolvers = 1;

  const { dequal: deepEqual } = requireDist();
  const { MergeError } = requireErrors();

  function _arraysIntersection(arrays) {
    let intersection = arrays[0];
    for (let i = 1; i < arrays.length; i++) {
      intersection = intersection.filter(value => arrays[i].includes(value));
    }
    return intersection;
  }

  function arraysIntersection(keyword, values, mergedSchema) {
    const intersection = _arraysIntersection(values);
    if (intersection.length === 0) {
      throw new MergeError(keyword, values);
    }
    mergedSchema[keyword] = intersection;
  }

  function hybridArraysIntersection(keyword, values, mergedSchema) {
    for (let i = 0; i < values.length; i++) {
      if (!Array.isArray(values[i])) {
        values[i] = [values[i]];
      }
    }

    const intersection = _arraysIntersection(values);
    if (intersection.length === 0) {
      throw new MergeError(keyword, values);
    }

    if (intersection.length === 1) {
      mergedSchema[keyword] = intersection[0];
    } else {
      mergedSchema[keyword] = intersection;
    }
  }

  function arraysUnion(keyword, values, mergedSchema) {
    const union = [];

    for (const array of values) {
      for (const value of array) {
        if (!union.includes(value)) {
          union.push(value);
        }
      }
    }

    mergedSchema[keyword] = union;
  }

  function minNumber(keyword, values, mergedSchema) {
    mergedSchema[keyword] = Math.min(...values);
  }

  function maxNumber(keyword, values, mergedSchema) {
    mergedSchema[keyword] = Math.max(...values);
  }

  function commonMultiple(keyword, values, mergedSchema) {
    const gcd = (a, b) => (!b ? a : gcd(b, a % b));
    const lcm = (a, b) => (a * b) / gcd(a, b);

    let scale = 1;
    for (const value of values) {
      while ((value * scale) % 1 !== 0) {
        scale *= 10;
      }
    }

    let multiple = values[0] * scale;
    for (const value of values) {
      multiple = lcm(multiple, value * scale);
    }

    mergedSchema[keyword] = multiple / scale;
  }

  function allEqual(keyword, values, mergedSchema) {
    const firstValue = values[0];
    for (let i = 1; i < values.length; i++) {
      if (!deepEqual(values[i], firstValue)) {
        throw new MergeError(keyword, values);
      }
    }
    mergedSchema[keyword] = firstValue;
  }

  function skip() {}

  function booleanAnd(keyword, values, mergedSchema) {
    for (const value of values) {
      if (value === false) {
        mergedSchema[keyword] = false;
        return;
      }
    }
    mergedSchema[keyword] = true;
  }

  function booleanOr(keyword, values, mergedSchema) {
    for (const value of values) {
      if (value === true) {
        mergedSchema[keyword] = true;
        return;
      }
    }
    mergedSchema[keyword] = false;
  }

  resolvers = {
    arraysIntersection,
    hybridArraysIntersection,
    arraysUnion,
    minNumber,
    maxNumber,
    commonMultiple,
    allEqual,
    booleanAnd,
    booleanOr,
    skip,
  };
  return resolvers;
}

var mergeJsonSchemas;
var hasRequiredMergeJsonSchemas;

function requireMergeJsonSchemas() {
  if (hasRequiredMergeJsonSchemas) {
    return mergeJsonSchemas;
  }
  hasRequiredMergeJsonSchemas = 1;

  const { dequal: deepEqual } = requireDist();
  const resolvers = requireResolvers();
  const errors = requireErrors();

  const keywordsResolvers = {
    $id: resolvers.skip,
    type: resolvers.hybridArraysIntersection,
    enum: resolvers.arraysIntersection,
    minLength: resolvers.maxNumber,
    maxLength: resolvers.minNumber,
    minimum: resolvers.maxNumber,
    maximum: resolvers.minNumber,
    multipleOf: resolvers.commonMultiple,
    exclusiveMinimum: resolvers.maxNumber,
    exclusiveMaximum: resolvers.minNumber,
    minItems: resolvers.maxNumber,
    maxItems: resolvers.minNumber,
    maxProperties: resolvers.minNumber,
    minProperties: resolvers.maxNumber,
    const: resolvers.allEqual,
    default: resolvers.allEqual,
    format: resolvers.allEqual,
    required: resolvers.arraysUnion,
    properties: mergeProperties,
    patternProperties: mergeObjects,
    additionalProperties: mergeSchemasResolver,
    items: mergeItems,
    additionalItems: mergeAdditionalItems,
    definitions: mergeObjects,
    $defs: mergeObjects,
    nullable: resolvers.booleanAnd,
    oneOf: mergeOneOf,
    anyOf: mergeOneOf,
    allOf: resolvers.arraysUnion,
    not: mergeSchemasResolver,
    if: mergeIfThenElseSchemas,
    then: resolvers.skip,
    else: resolvers.skip,
    dependencies: mergeDependencies,
    dependentRequired: mergeDependencies,
    dependentSchemas: mergeObjects,
    propertyNames: mergeSchemasResolver,
    uniqueItems: resolvers.booleanOr,
    contains: mergeSchemasResolver,
  };

  function mergeSchemasResolver(keyword, values, mergedSchema, _schemas, options) {
    mergedSchema[keyword] = _mergeSchemas(values, options);
  }

  function cartesianProduct(arrays) {
    let result = [[]];

    for (const array of arrays) {
      const temp = [];
      for (const x of result) {
        for (const y of array) {
          temp.push([...x, y]);
        }
      }
      result = temp;
    }

    return result;
  }

  function mergeOneOf(keyword, values, mergedSchema, _schemas, options) {
    if (values.length === 1) {
      mergedSchema[keyword] = values[0];
      return;
    }

    const product = cartesianProduct(values);
    const mergedOneOf = [];
    for (const combination of product) {
      try {
        const mergedSchema = _mergeSchemas(combination, options);
        if (mergedSchema !== undefined) {
          mergedOneOf.push(mergedSchema);
        }
      } catch (error) {
        // If this combination is not valid, we can ignore it.
        if (error instanceof errors.MergeError) {
          continue;
        }
        throw error;
      }
    }
    mergedSchema[keyword] = mergedOneOf;
  }

  function getSchemaForItem(schema, index) {
    const { items, additionalItems } = schema;

    if (Array.isArray(items)) {
      if (index < items.length) {
        return items[index];
      }
      return additionalItems;
    }

    if (items !== undefined) {
      return items;
    }

    return additionalItems;
  }

  function mergeItems(keyword, values, mergedSchema, schemas, options) {
    let maxArrayItemsLength = 0;
    for (const itemsSchema of values) {
      if (Array.isArray(itemsSchema)) {
        maxArrayItemsLength = Math.max(maxArrayItemsLength, itemsSchema.length);
      }
    }

    if (maxArrayItemsLength === 0) {
      mergedSchema[keyword] = _mergeSchemas(values, options);
      return;
    }

    const mergedItemsSchemas = [];
    for (let i = 0; i < maxArrayItemsLength; i++) {
      const indexItemSchemas = [];
      for (const schema of schemas) {
        const itemSchema = getSchemaForItem(schema, i);
        if (itemSchema !== undefined) {
          indexItemSchemas.push(itemSchema);
        }
      }
      mergedItemsSchemas[i] = _mergeSchemas(indexItemSchemas, options);
    }
    mergedSchema[keyword] = mergedItemsSchemas;
  }

  function mergeAdditionalItems(keyword, values, mergedSchema, schemas, options) {
    let hasArrayItems = false;
    for (const schema of schemas) {
      if (Array.isArray(schema.items)) {
        hasArrayItems = true;
        break;
      }
    }

    if (!hasArrayItems) {
      mergedSchema[keyword] = _mergeSchemas(values, options);
      return;
    }

    const mergedAdditionalItemsSchemas = [];
    for (const schema of schemas) {
      let additionalItemsSchema = schema.additionalItems;
      if (additionalItemsSchema === undefined && !Array.isArray(schema.items)) {
        additionalItemsSchema = schema.items;
      }
      if (additionalItemsSchema !== undefined) {
        mergedAdditionalItemsSchemas.push(additionalItemsSchema);
      }
    }

    mergedSchema[keyword] = _mergeSchemas(mergedAdditionalItemsSchemas, options);
  }

  function getSchemaForProperty(schema, propertyName) {
    const { properties, patternProperties, additionalProperties } = schema;

    if (properties?.[propertyName] !== undefined) {
      return properties[propertyName];
    }

    for (const pattern of Object.keys(patternProperties ?? {})) {
      const regexp = new RegExp(pattern);
      if (regexp.test(propertyName)) {
        return patternProperties[pattern];
      }
    }

    return additionalProperties;
  }

  function mergeProperties(keyword, _values, mergedSchema, schemas, options) {
    const foundProperties = {};
    for (const currentSchema of schemas) {
      const properties = currentSchema.properties ?? {};
      for (const propertyName of Object.keys(properties)) {
        if (foundProperties[propertyName] !== undefined) {
          continue;
        }

        const propertySchema = properties[propertyName];
        foundProperties[propertyName] = [propertySchema];

        for (const anotherSchema of schemas) {
          if (currentSchema === anotherSchema) {
            continue;
          }

          const propertySchema = getSchemaForProperty(anotherSchema, propertyName);
          if (propertySchema !== undefined) {
            foundProperties[propertyName].push(propertySchema);
          }
        }
      }
    }

    const mergedProperties = {};
    for (const property of Object.keys(foundProperties)) {
      const propertySchemas = foundProperties[property];
      mergedProperties[property] = _mergeSchemas(propertySchemas, options);
    }
    mergedSchema[keyword] = mergedProperties;
  }

  function mergeObjects(keyword, values, mergedSchema, _schemas, options) {
    const objectsProperties = {};

    for (const properties of values) {
      for (const propertyName of Object.keys(properties)) {
        if (objectsProperties[propertyName] === undefined) {
          objectsProperties[propertyName] = [];
        }
        objectsProperties[propertyName].push(properties[propertyName]);
      }
    }

    const mergedProperties = {};
    for (const propertyName of Object.keys(objectsProperties)) {
      const propertySchemas = objectsProperties[propertyName];
      const mergedPropertySchema = _mergeSchemas(propertySchemas, options);
      mergedProperties[propertyName] = mergedPropertySchema;
    }

    mergedSchema[keyword] = mergedProperties;
  }

  function mergeIfThenElseSchemas(_keyword, _values, mergedSchema, schemas, options) {
    for (let i = 0; i < schemas.length; i++) {
      const subSchema = {
        if: schemas[i].if,
        then: schemas[i].then,
        else: schemas[i].else,
      };

      if (subSchema.if === undefined) {
        continue;
      }

      if (mergedSchema.if === undefined) {
        mergedSchema.if = subSchema.if;
        if (subSchema.then !== undefined) {
          mergedSchema.then = subSchema.then;
        }
        if (subSchema.else !== undefined) {
          mergedSchema.else = subSchema.else;
        }
        continue;
      }

      if (mergedSchema.then !== undefined) {
        mergedSchema.then = _mergeSchemas([mergedSchema.then, subSchema], options);
      }
      if (mergedSchema.else !== undefined) {
        mergedSchema.else = _mergeSchemas([mergedSchema.else, subSchema], options);
      }
    }
  }

  function mergeDependencies(keyword, values, mergedSchema) {
    const mergedDependencies = {};
    for (const dependencies of values) {
      for (const propertyName of Object.keys(dependencies)) {
        if (mergedDependencies[propertyName] === undefined) {
          mergedDependencies[propertyName] = [];
        }
        const mergedPropertyDependencies = mergedDependencies[propertyName];
        for (const propertyDependency of dependencies[propertyName]) {
          if (!mergedPropertyDependencies.includes(propertyDependency)) {
            mergedPropertyDependencies.push(propertyDependency);
          }
        }
      }
    }
    mergedSchema[keyword] = mergedDependencies;
  }

  function _mergeSchemas(schemas, options) {
    if (schemas.length === 0) {
      return {};
    }
    if (schemas.length === 1) {
      return schemas[0];
    }

    const mergedSchema = {};
    const keywords = {};

    let allSchemasAreTrue = true;

    for (const schema of schemas) {
      if (schema === false) {
        return false;
      }
      if (schema === true) {
        continue;
      }
      allSchemasAreTrue = false;

      for (const keyword of Object.keys(schema)) {
        if (keywords[keyword] === undefined) {
          keywords[keyword] = [];
        }
        keywords[keyword].push(schema[keyword]);
      }
    }

    if (allSchemasAreTrue) {
      return true;
    }

    for (const keyword of Object.keys(keywords)) {
      const keywordValues = keywords[keyword];
      const resolver = options.resolvers[keyword] ?? options.defaultResolver;
      resolver(keyword, keywordValues, mergedSchema, schemas, options);
    }

    return mergedSchema;
  }

  function defaultResolver(keyword, values, mergedSchema, _schemas, options) {
    const onConflict = options.onConflict ?? 'throw';

    if (values.length === 1 || onConflict === 'first') {
      mergedSchema[keyword] = values[0];
      return;
    }

    let allValuesEqual = true;
    for (let i = 1; i < values.length; i++) {
      if (!deepEqual(values[i], values[0])) {
        allValuesEqual = false;
        break;
      }
    }

    if (allValuesEqual) {
      mergedSchema[keyword] = values[0];
      return;
    }

    if (onConflict === 'throw') {
      throw new errors.ResolverNotFoundError(keyword, values);
    }
    if (onConflict === 'skip') {
      return;
    }
    throw new errors.InvalidOnConflictOptionError(onConflict);
  }

  function mergeSchemas(schemas, options = {}) {
    if (options.defaultResolver === undefined) {
      options.defaultResolver = defaultResolver;
    }

    options.resolvers = { ...keywordsResolvers, ...options.resolvers };

    const mergedSchema = _mergeSchemas(schemas, options);
    return mergedSchema;
  }

  mergeJsonSchemas = { mergeSchemas, keywordsResolvers, defaultResolver, ...errors };
  return mergeJsonSchemas;
}

var mergeJsonSchemasExports = requireMergeJsonSchemas();
var index = /*@__PURE__*/ getDefaultExportFromCjs(mergeJsonSchemasExports);

export { index as default };
