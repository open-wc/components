/** @typedef {import('./OwcClickEditable.types.js').valueType} valueType */

/**
 * Parses a raw (input) value according to the click-editable `type`.
 *
 * Numbers parse via parseFloat (`0` stays `0`, unparsable input becomes
 * undefined), date types become `Date` instances, everything else passes
 * through unchanged.
 *
 * @param {any} value
 * @param {valueType} type
 * @returns {any}
 */
export function parseValueForType(value, type) {
  switch (type) {
    case 'number': {
      if (value === '' || value === null || value === undefined) {
        return undefined;
      }
      const parsed = Number.parseFloat(value);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    case 'date':
    case 'datetime-local':
      return value ? new Date(value) : undefined;
    default:
      return value;
  }
}

/**
 * Formats a date-ish value into the string a native date/datetime-local
 * input expects (`2024-01-15` / `2024-01-15T10:30`, in local time).
 *
 * Returns undefined for non-date types, empty values, and invalid dates.
 *
 * @param {any} value
 * @param {valueType} type
 * @returns {string | undefined}
 */
export function toInputDateString(value, type) {
  if (!value || (type !== 'date' && type !== 'datetime-local')) {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return undefined;
  }
  // Shift into local time so the ISO string reflects the local wall clock
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, type === 'date' ? -14 : -8);
}

/**
 * Whether a value is a valid date within the editable range (1900-3000) -
 * the same limits the date inputs enforce via min/max.
 *
 * @param {any} value
 * @returns {boolean}
 */
export function isReasonableDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  return !Number.isNaN(date.valueOf()) && year >= 1900 && year <= 3000;
}
