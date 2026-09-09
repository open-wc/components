/**
 * Filters the visible tabs and sorts them by their `order`.
 *
 * A tab is visible when its `visible` field is `undefined`, truthy, or a
 * function that returns truthy for the given options. Tabs without an
 * `order` sort as `0`; ties keep their insertion order.
 *
 * @template T
 * @param {Record<string, import('./OwcTabs.types.js').Tab<T>>} tabs
 * @param {T} options
 * @returns {Array<[string, import('./OwcTabs.types.js').Tab<T>]>}
 */
export function getTabList(tabs, options) {
  return Object.entries(tabs || {})
    .filter(([, tab]) =>
      typeof tab.visible === 'function'
        ? tab.visible(options)
        : tab.visible || tab.visible === undefined,
    )
    .sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
}
