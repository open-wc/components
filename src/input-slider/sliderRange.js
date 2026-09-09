/**
 * @typedef {{
 *   value: number,
 *   min: number,
 *   max: number,
 *   absoluteMin?: number | undefined,
 *   absoluteMax?: number | undefined,
 * }} SliderRangeState
 */

/**
 * Adjusts the slider range to a (possibly out-of-range) value.
 *
 * The value is clamped to the absolute bounds. Within those, the visible
 * `min`/`max` range grows to contain the value - this is what lets the
 * number input "break out" of the current slider range.
 *
 * @param {SliderRangeState} state
 * @returns {SliderRangeState}
 */
export function adjustRangeForValue(state) {
  const { absoluteMin, absoluteMax } = state;
  let { value, min, max } = state;

  if (absoluteMax != null && value > absoluteMax) {
    value = absoluteMax;
  }
  if (absoluteMin != null && value < absoluteMin) {
    value = absoluteMin;
  }
  if (value > max) {
    max = Math.min(value, absoluteMax ?? Number.MAX_SAFE_INTEGER);
  }
  if (value < min) {
    min = Math.max(value, absoluteMin ?? Number.MIN_SAFE_INTEGER);
  }
  return { value, min, max, absoluteMin, absoluteMax };
}

/**
 * Clamps the visible `min`/`max` range to the absolute bounds. The value is
 * only clamped when a bound was actually tightened - a value merely outside
 * the visible range is left alone (adjustRangeForValue grows the range for it).
 *
 * @param {SliderRangeState} state
 * @returns {SliderRangeState}
 */
export function clampRangeToAbsolute(state) {
  const { absoluteMin, absoluteMax } = state;
  let { value, min, max } = state;

  if (absoluteMin != null && min < absoluteMin) {
    min = absoluteMin;
    if (value < min) {
      value = min;
    }
  }
  if (absoluteMax != null && max > absoluteMax) {
    max = absoluteMax;
    if (value > max) {
      value = max;
    }
  }
  return { value, min, max, absoluteMin, absoluteMax };
}
