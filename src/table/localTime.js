/** @param {Date | null | undefined} date @returns {string} */
export function toLocalDateTimeInputValue(date) {
  // No date no string
  if (!(date instanceof Date)) {
    return '';
  }

  /**
   * @param {number} value
   * @returns {string}
   */
  const pad2 = value => String(value).padStart(2, '0');

  const year = date.getFullYear();
  // Months are 0 based (eg. 0 = Jan) so + 1
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/** @param {string} value @returns {Date | null} */
export function fromLocalDateTimeInputValue(value) {
  // No string no Return
  if (!value) {
    return null;
  }

  // Expects strict ISO format from the input.
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hours = Number(match[4]);
  const minutes = Number(match[5]);

  const local = new Date(year, month - 1, day, hours, minutes, 0, 0);
  local.setFullYear(year, (month || 1) - 1, day || 1);
  local.setHours(hours || 0, minutes || 0, 0, 0);

  return Number.isNaN(local.getTime()) ? null : local;
}

/** @param {Date | null | undefined} date @returns {string} */
export function toLocalDateInputValue(date) {
  if (!(date instanceof Date)) {
    return '';
  }
  const tz = date.getTimezoneOffset();
  const local = new Date(date.getTime() - tz * 60000);
  return local.toISOString().slice(0, 10);
}

/** @param {string} value @returns {Date | null} */
export function fromLocalDateInputValue(value) {
  if (!value) {
    return null;
  }
  const raw = value;
  let year;
  let month;
  let day;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    // Case ISO: yyyy-MM-dd
    const [y, m, d] = raw.split('-').map(Number);
    year = y;
    month = m;
    day = d;
  } else {
    const fallback = new Date(raw);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }

  const local = new Date(0);
  local.setFullYear(year, (month || 1) - 1, day || 1);
  local.setHours(0, 0, 0, 0);

  return Number.isNaN(local.getTime()) ? null : local;
}
