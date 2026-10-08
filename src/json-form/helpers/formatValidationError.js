/**
 * Format a field error without changing the validator output used for matching.
 * `schema` is the root validation schema, so conditional limits come from the
 * exact failed keyword rather than a merged field schema.
 * @param {import('@cfworker/json-schema').OutputUnit | undefined} error
 * @param {{schema: import('../types/schema.js').JsonSchema7,
 * localize: Pick<import('../../localization/localization.js').OwcLocalizeController, 'term' | 'number'>}} options
 * @returns {string | undefined}
 */
export function formatValidationError(error, { schema, localize }) {
  if (!error) {
    return undefined;
  }
  const fallback = () => localize.term('jsonFormErrorInvalid');
  if (error.keyword === 'required') {
    return localize.term('jsonFormErrorRequired');
  }

  const constraint = resolveKeyword(schema, error.keywordLocation);
  switch (error.keyword) {
    case 'type':
      if (constraint === 'number' || constraint === 'integer') {
        return localize.term(
          constraint === 'number' ? 'jsonFormErrorNumber' : 'jsonFormErrorInteger',
        );
      }
      return fallback();
    case 'minimum':
    case 'maximum':
    case 'exclusiveMinimum':
    case 'exclusiveMaximum':
    case 'minLength':
    case 'maxLength':
    case 'minItems':
    case 'maxItems': {
      if (typeof constraint !== 'number' || !Number.isFinite(constraint)) {
        return fallback();
      }
      const key = `jsonFormError${error.keyword[0].toUpperCase()}${error.keyword.slice(1)}`;
      return localize.term(
        key,
        constraint,
        localize.number(constraint, { maximumSignificantDigits: 21 }),
      );
    }
    case 'enum':
      return localize.term('jsonFormErrorSelection');
    case 'oneOf':
      // Only choice lists are selections; arbitrary schema alternatives are not.
      if (
        Array.isArray(constraint) &&
        constraint.length > 0 &&
        constraint.every(
          option => option && typeof option === 'object' && Object.hasOwn(option, 'const'),
        )
      ) {
        return localize.term('jsonFormErrorSelection');
      }
      return fallback();
    case 'format':
      switch (constraint) {
        case 'email':
          return localize.term('jsonFormErrorEmail');
        case 'date':
          return localize.term('jsonFormErrorDate');
        case 'time':
          return localize.term('jsonFormErrorTime');
        case 'date-time':
          return localize.term('jsonFormErrorDateTime');
        default:
          return fallback();
      }
    default:
      return fallback();
  }
}

/**
 * Resolve literal JSON Pointer segments, including array indices and escaped
 * property names. Unresolved references deliberately use the generic message.
 * @param {import('../types/schema.js').JsonSchema7} schema
 * @param {string} location
 * @returns {unknown}
 */
function resolveKeyword(schema, location) {
  if (!location.startsWith('#/')) {
    return undefined;
  }
  /** @type {any} */
  let current = schema;
  for (const segment of location.slice(2).split('/')) {
    const key = segment.replace(/~1/g, '/').replace(/~0/g, '~');
    if (!current || typeof current !== 'object' || !Object.hasOwn(current, key)) {
      return undefined;
    }
    current = current[key];
  }
  return current;
}
