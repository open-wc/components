/**
 * Rounds value to the next "nice" value (25, 50, 100...)
 * A nice number is a number with either some number in the front followed by 0, 25, 5 or 75 followed by only zeroes
 * Adapted from https://stackoverflow.com/questions/7725278/round-to-nearest-nice-number
 * @param {Number} val
 * @returns
 */
export function roundPretty(val) {
  const fraction = 4;
  const log = Math.floor(Math.log10(val));

  return (
    Math.ceil(val * fraction * Math.pow(10, -log) - Number.EPSILON) / fraction / Math.pow(10, -log)
  );
}
