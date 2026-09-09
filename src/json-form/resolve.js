import { validateSchemaSystem } from './helpers/validateSchema.js';
import MergeSchemas from './merge-json-schemas-bundle.js';
const { mergeSchemas } = MergeSchemas;

/**
 * Resolve the given schema path in order to obtain a subschema.
 * @param {import("./types/schema.js").JsonSchema7} schema the root schema from which to start
 * @param {string} schemaPath the schema path to be resolved
 * @param {object} [value] Value of schema needed to resolve schema combinations (allOf, anyOf, oneOf)
 */
export const resolveSchema = (schema, schemaPath, value) => {
  const segments = schemaPath?.split('/');
  let currentBlock = schema;
  let currentValue = value;
  for (const index in segments) {
    const segment = segments[index];

    currentBlock = resolveComposition(currentBlock, currentValue);

    if (segment === '#' && index === '0') {
      continue;
    }

    // @ts-ignore
    if (currentBlock[segment] !== undefined) {
      // @ts-ignore
      currentBlock = currentBlock[segment];
      // @ts-ignore
      if (currentValue?.[segment]) {
        // @ts-ignore
        currentValue = currentValue?.[segment];
      }
    } else if (Number.isInteger(Number.parseInt(segment)) && currentBlock.items) {
      // @ts-ignore
      currentBlock = currentBlock.items;
      // @ts-ignore
      currentValue = currentValue?.[Number.parseInt(segment)];
    } else {
      return null;
    }
  }
  return currentBlock;
};

/**
 * Resolve the given schema path in order to find out if the paths element is required.
 * @param {import("./types/schema.js").JsonSchema7} schema the root schema from which to start
 * @param {string} schemaPath the schema path to be resolved
 * @param {object} [value]
 */
export const isRequired = (schema, schemaPath, value) => {
  const segments = schemaPath?.split('/');
  let currentBlock = schema;
  let currentValue = value;
  for (const index in segments.slice(0, -2)) {
    const segment = segments[index];

    currentBlock = resolveComposition(currentBlock, currentValue);

    if (segment === '#' && index === '0') {
      continue;
    }
    // @ts-ignore
    if (currentBlock[segment] !== undefined) {
      // @ts-ignore
      currentBlock = currentBlock?.[segment];
      // @ts-ignore
      currentValue = currentValue?.[segment];
    } else if (Number.isInteger(Number.parseInt(segment)) && currentBlock.items) {
      // @ts-ignore
      currentBlock = currentBlock.items;
      // @ts-ignore
      currentValue = currentValue?.[Number.parseInt(segment)];
    } else {
      return null;
    }
  }
  currentBlock = resolveComposition(currentBlock, currentValue);
  return currentBlock.required?.includes(segments.at(-1) || '');
};

/**
 * Resolve the given schema path in order to obtain the data.
 * @param {Object} data
 * @param {string} schemaPath
 */
export const resolveDataSchema = (data, schemaPath) => {
  const segments = dataPathSegments(schemaPath);
  let currentBlock = data;
  for (const index in segments) {
    const segment = segments[index];
    if (segment === '#' && index === '0') {
      continue;
    }
    // @ts-ignore
    if (currentBlock[segment] !== undefined) {
      // @ts-ignore
      currentBlock = currentBlock[segment];
    } else {
      return null;
    }
  }
  return currentBlock;
};

/**
 * @param {string} schemaPath
 * @returns {string[]}
 */
export function dataPathSegments(schemaPath) {
  return schemaPath
    .split('/')
    .filter((value, index) => !((value === '#' && index === 0) || value === 'properties'));
}

/**
 *
 * @param {import("./types/schema.js").JsonSchema7} schema
 * @param {object} [value]
 * @returns {import("./types/schema.js").JsonSchema7}
 */
function resolveComposition(schema, value) {
  const schemaClone = { ...schema };
  const applicableSubSchemas = [];
  if (schema.allOf) {
    for (const subSchema of schema.allOf) {
      applicableSubSchemas.push(resolveComposition(subSchema, value));
    }
    delete schemaClone.allOf;
  }

  if (schema.oneOf) {
    for (const subSchema of schema.oneOf) {
      const valid = validateSchemaSystem(subSchema, value);
      if (valid.valid) {
        applicableSubSchemas.push(resolveComposition(subSchema, value));
        break;
      }
    }
    delete schemaClone.oneOf;
  }

  if (schema.anyOf) {
    let found = false;
    for (const subSchema of schema.anyOf) {
      const valid = validateSchemaSystem(subSchema, value);
      if (valid.valid) {
        found = true;
        applicableSubSchemas.push(resolveComposition(subSchema, value));
      }
    }
    if (!found) {
      for (const subSchema of schema.anyOf) {
        applicableSubSchemas.push(resolveComposition(subSchema, value));
      }
    }
    delete schemaClone.anyOf;
  }

  if (schema.if) {
    delete schemaClone.if;
    const valid = validateSchemaSystem(schema.if, value);
    if (valid.valid && schema.then) {
      delete schemaClone.then;
      applicableSubSchemas.push(resolveComposition(schema.then, value));
    } else if (schema.else) {
      delete schemaClone.else;
      applicableSubSchemas.push(resolveComposition(schema.else, value));
    }
  }

  delete schemaClone.allOf;
  delete schemaClone.if;
  delete schemaClone.else;
  delete schemaClone.anyOf;
  delete schemaClone.oneOf;
  return mergeSchemas([schemaClone, ...applicableSubSchemas]);
}

/**
 * Inserts the given paths of data into a new object
 * @param {Object} data
 * @param {string[]} pathArr
 */
export function resolveSubObject(data, pathArr) {
  const newData = {};
  for (const path of pathArr) {
    const segments = dataPathSegments(path);
    let currentBlock = data;
    let currentNewBlock = newData;

    for (let index = 0; index < segments.length; index++) {
      const segment = segments[index];
      if (segment === '#' && index === 0) {
        continue;
      }

      // Traverse data
      // @ts-ignore
      if (currentBlock[segment] !== undefined) {
        // @ts-ignore
        currentBlock = currentBlock[segment];
      } else {
        return null;
      }

      if (index === segments.length - 1) {
        // If is leaf node insert here and break
        // @ts-ignore
        currentNewBlock[segment] = currentBlock;
        if (Array.isArray(currentNewBlock)) {
          // Densify possible sparse array
          densifySparseArray(currentNewBlock);
        }
        break;
      }

      // Traverse newData
      // @ts-ignore
      if (!currentNewBlock[segment]) {
        if (Array.isArray(currentBlock)) {
          // @ts-ignore
          currentNewBlock[segment] = [];
        } else {
          // @ts-ignore
          currentNewBlock[segment] = {};
        }
      }

      if (Array.isArray(currentNewBlock)) {
        // Densify possible sparse array
        densifySparseArray(currentNewBlock);
      }

      // @ts-ignore
      currentNewBlock = currentNewBlock[segment];
    }
  }
  return newData;
}

/**
 *
 * @param {any[]} arr
 */
function densifySparseArray(arr) {
  for (let i = 0; i < arr.length; i++) {
    if (!(i in arr)) {
      // is hole
      arr[i] = null;
    }
  }
}
