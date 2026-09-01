export const NUMBER_OPERATORS = {
  greaterThan: 'größer als',
  greaterThanOrEqual: 'größer gleich',
  lessThan: 'kleiner als',
  lessThanOrEqual: 'kleiner gleich',
  isEmpty: 'leer',
};

export const TEXT_OPERATORS = {
  includes: 'enthält',
  notIncludes: 'enthält nicht',
  startsWith: 'beginnt mit',
  endsWith: 'endet mit',
  isEmpty: 'leer',
};

export const OTHER_OPERATORS = {
  equal: 'gleich',
  notEqual: 'nicht gleich',
};

export const DATE_OPERATORS = {
  lessThanOrEqual: 'vor',
  greaterThanOrEqual: 'nach',
  equalNoYear: 'gleich (Jahr ignorieren)',
  notEqualNoYear: 'nicht gleich (Jahr ignorieren)',
  greaterEqualNoYear: 'nach (Jahr ignorieren)',
  lessEqualNoYear: 'vor (Jahr ignorieren)',
  between: 'zwischen',
  betweenNoYear: 'zwischen (Jahr ignorieren)',
  isEmpty: 'leer',
};

export const ARRAY_OPERATORS = {
  some: 'mindestens 1',
  every: 'jeder',
};

/**
 * @type {typeof DATE_OPERATORS &
 *   typeof NUMBER_OPERATORS &
 *   typeof TEXT_OPERATORS &
 *   typeof OTHER_OPERATORS &
 *   typeof ARRAY_OPERATORS}
 */
export const OPERATORS = {
  ...DATE_OPERATORS,
  ...NUMBER_OPERATORS,
  ...TEXT_OPERATORS,
  ...OTHER_OPERATORS,
  ...ARRAY_OPERATORS,
};
