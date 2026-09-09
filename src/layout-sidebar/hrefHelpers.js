/**
 * Combines a menu item's href with its GET parameters into the full link
 * target. Params may be given as an object or a query string; without params
 * the href passes through unchanged.
 *
 * @param {string} href
 * @param {Record<string, string> | string | undefined} hrefGetParams
 * @returns {string}
 */
export function getFullHref(href, hrefGetParams) {
  const searchParams =
    hrefGetParams && typeof hrefGetParams === 'string'
      ? new URLSearchParams(hrefGetParams)
      : new URLSearchParams();
  if (hrefGetParams && typeof hrefGetParams === 'object') {
    for (const [key, value] of Object.entries(hrefGetParams)) {
      searchParams.set(key, value);
    }
  }
  return searchParams.size > 0 ? `${href}?${searchParams}` : href;
}
