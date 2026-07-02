/**@type {Record<import("./filter.type.js").operator,  undefined | ((field: string, value: import("./filter.type.js").SqlPrimitive , params: import("./filter.type.js").SqlPrimitive[]) => string)>} */
const OPERATOR_SQL_MAP = {
  equal: (field, value, params) => {
    params.push(value);
    return `"${field}" = ?`;
  },

  notEqual: (field, value, params) => {
    params.push(value);
    return `"${field}" <> ?`;
  },

  greaterThan: (field, value, params) => {
    params.push(value);
    return `"${field}" > ?`;
  },

  greaterThanOrEqual: (field, value, params) => {
    params.push(value);
    return `"${field}" >= ?`;
  },

  lessThan: (field, value, params) => {
    params.push(value);
    return `"${field}" < ?`;
  },

  lessThanOrEqual: (field, value, params) => {
    params.push(value);
    return `"${field}" <= ?`;
  },

  includes: (field, value, params) => {
    params.push(`%${value}%`);
    return `"${field}" LIKE ?`;
  },

  startsWith: (field, value, params) => {
    params.push(`${value}%`);
    return `"${field}" LIKE ?`;
  },

  endsWith: (field, value, params) => {
    params.push(`%${value}`);
    return `"${field}" LIKE ?`;
  },

  isEmpty: field => {
    return `("${field}" IS NULL)`;
  },

  between: (field, value, params) => {
    if (!(typeof value === 'object' && 'from' in value && 'to' in value)) {
      throw new Error(`Invalid between filter on field "${field}" with value ${value}`);
    }
    params.push(value.from, value.to);
    return `"${field}" BETWEEN ? AND ?`;
  },

  some: (field, value, params) => {
    params.push(value);
    return `"${field}" && ?`; // PostgreSQL array overlap
  },

  every: (field, value, params) => {
    params.push(value);
    return `"${field}" @> ?`; // PostgreSQL contains
  },
  notIncludes: undefined,
  equalNoYear: undefined,
  notEqualNoYear: undefined,
  greaterEqualNoYear: undefined,
  lessEqualNoYear: undefined,
  betweenNoYear: undefined,
};

/**
 * Entry point
 *
 * @param {import("./filter.type.js").NestedJsonFilters} filters
 * @param {Set<string>} allowedFields
 * @returns {{ clause: string, params: import("./filter.type.js").SqlPrimitive[] }}
 */
export function jsonToSqlFilter(filters, allowedFields) {
  /**@type {import("./filter.type.js").SqlPrimitive[]} */
  const params = [];
  const clause = buildNode(filters, 0, params, allowedFields);

  return {
    clause: clause || '1=1',
    params,
  };
}

/**
 * Recursively builds SQL from filter tree.
 *
 * @param {import("./filter.type.js").NestedJsonFilters | import("./filter.type.js").JsonFilter} node
 * @param {number} depth
 * @param {import("./filter.type.js").SqlPrimitive[]} params
 * @param {Set<string>} allowedFields
 * @returns {string}
 */
function buildNode(node, depth, params, allowedFields) {
  // Leaf
  if (!Array.isArray(node)) {
    return buildLeaf(node, params, allowedFields);
  }

  const joiner = depth % 2 === 0 ? 'AND' : 'OR';

  const clauses = node
    .map(child => buildNode(child, depth + 1, params, allowedFields))
    .filter(Boolean);

  if (!clauses.length) {
    return '';
  }

  return clauses.length === 1 ? clauses[0] : `(${clauses.join(` ${joiner} `)})`;
}

/**
 * Builds a single filter
 *
 * @param {import("./filter.type.js").JsonFilter} filter
 * @param {import("./filter.type.js").SqlPrimitive[]} params
 * @param {Set<string>} allowedFields
 * @returns {string}
 */
function buildLeaf(filter, params, allowedFields) {
  if (filter.enabled === false || filter.field === '::globalField::') {
    return '';
  }
  if (!allowedFields.has(filter.field)) {
    throw new Error(`Disallowed field ${filter.field}`);
  }

  const handler = OPERATOR_SQL_MAP[filter.operator];

  if (!handler) {
    throw new Error(`Unsupported operator: ${filter.operator}`);
  }

  const value = normalizeValue(filter.value);

  let clause = handler(filter.field, value, params);

  if (filter.negated) {
    clause = `NOT (${clause})`;
  }

  return clause;
}

/**
 * Normalizes values (Dates → ISO, ranges, etc.)
 *
 * @param {import("./filter.type.js").JsonFilter['value']} value
 * @returns {import("./filter.type.js").SqlPrimitive}
 */
function normalizeValue(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value && typeof value === 'object') {
    if ('from' in value && 'to' in value) {
      return {
        // @ts-ignore
        from: normalizeValue(value.from),
        // @ts-ignore
        to: normalizeValue(value.to),
      };
    }
  }

  // @ts-ignore
  return value;
}
