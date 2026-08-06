/** Public configuration shared by consumers that construct an `owc-pinboard`. */
export interface OwcPinboardOptions {
  /**
   * Exact element that owns vertical scrolling for virtualized card lists.
   * Defaults to window scrolling; no ancestor is discovered automatically.
   */
  scrollTarget?: Element;
}
