/** @typedef {import('countup.js').CountUpOptions} CountUpOptions */

/**
 * Merges the convenience properties (start, duration, separator) with the
 * options object into the options passed to countup.js. Keys set explicitly
 * in options win over the convenience properties. Returns a new object -
 * neither input is mutated.
 *
 * @param {{ start: number, duration: number, separator: string }} props
 * @param {CountUpOptions | undefined | null} options
 * @returns {CountUpOptions}
 */
export function mergeCountUpOptions({ start, duration, separator }, options) {
  return {
    startVal: start,
    duration,
    separator,
    ...(options ?? {}),
  };
}
