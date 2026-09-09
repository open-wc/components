/** @typedef {'top-center' | 'top-start' | 'top-end' | 'bottom-center' | 'bottom-start' | 'bottom-end'} ToastPosition */

/**
 * Builds the inline style for a toast container at the given position.
 *
 * Top containers stack new toasts downwards, bottom containers upwards
 * (column-reverse), and the horizontal alignment follows the `-start`,
 * `-center`, or `-end` suffix.
 *
 * @param {ToastPosition} position
 * @returns {string}
 */
export function containerStyleFor(position) {
  const [block, inline] = position.split('-');
  return `
    position: fixed;
    ${block}: 0;
    z-index: 99999;
    display: flex;
    width: 100%;
    align-items: ${inline};
    flex-direction: ${block === 'bottom' ? 'column-reverse' : 'column'};
    pointer-events: none;
    `;
}

/**
 * The default icon name for a toast variant.
 *
 * @param {string} variant
 * @returns {string}
 */
export function defaultIconForVariant(variant) {
  switch (variant) {
    case 'brand':
      return 'info-circle';
    case 'neutral':
      return 'gear';
    case 'success':
      return 'check-circle';
    case 'warning':
      return 'exclamation-triangle';
    case 'danger':
      return 'exclamation-circle';
  }
  return '';
}
