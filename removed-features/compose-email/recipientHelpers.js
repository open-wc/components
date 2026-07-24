/**
 * Whether the recipient list should collapse to the short summary formatter:
 * either explicitly (`'short'`) or because an `'<n>auto'` mode's threshold is
 * reached (e.g. `'500auto'` collapses at 500 recipients).
 *
 * @param {'short' | 'long' | `${number}auto`} formatterMode
 * @param {number} recipientCount
 * @returns {boolean}
 */
export function useShortFormatter(formatterMode, recipientCount) {
  return (
    formatterMode === 'short' ||
    (formatterMode.includes('auto') && recipientCount >= Number.parseInt(formatterMode, 10))
  );
}

/**
 * Combines the external recipient check with the current template's tag:
 * a bad external status always wins; with a tag filter active, recipients
 * without that tag are excluded as "not interested".
 *
 * @template {{good: boolean, reason?: string}} S
 * @param {S} externalStatus
 * @param {boolean} hasTag - whether the recipient carries the template's tag
 * @param {boolean} tagFilterActive - whether the current template has a tag
 * @returns {S | {good: false, reason: string}}
 */
export function resolveRecipientStatus(externalStatus, hasTag, tagFilterActive) {
  if (!tagFilterActive) {
    return externalStatus;
  }
  if (hasTag || !externalStatus.good) {
    return externalStatus;
  }
  return { good: false, reason: 'Hat kein Interesse an dieser E-Mail' };
}
