/**
 * Finds the element whose scrolling moves `start`: the first ancestor in the
 * flat tree (through assigned slots and shadow hosts) that scrolls vertically,
 * meaning its `overflow-y` lets it scroll and its content overflows it.
 * Wrappers that only clip horizontally compute `overflow-y: auto` as well, but
 * they grow with their content and never scroll, so they are skipped. So are
 * boxless elements (`display: contents`). The search stops at
 * `position: fixed` and top-layer elements (open popovers, modal dialogs,
 * fullscreen elements), because scrolling outside them doesn't move them.
 *
 * Returns the document when nothing else scrolls, and `undefined` while
 * `start` isn't rendered, e.g. inside `display: none`, or when an ancestor
 * component hasn't rendered the slot it will be assigned to yet.
 *
 * @param {Element} start
 * @returns {Element | Document | undefined}
 */
export function findScrollContainer(start) {
  if (start.getClientRects().length === 0) {
    return undefined;
  }
  for (let node = flatParent(start); node; node = flatParent(node)) {
    if (!(node instanceof Element)) {
      continue;
    }
    if (isDocumentScroller(node)) {
      return document;
    }
    const style = getComputedStyle(node);
    if (style.display === '') {
      // No computed style: the element isn't in the flat tree (yet).
      return undefined;
    }
    if (style.display === 'contents') {
      continue;
    }
    if (/^(auto|scroll|overlay)$/.test(style.overflowY) && node.scrollHeight > node.clientHeight) {
      return node;
    }
    if (style.position === 'fixed' || isInTopLayer(node)) {
      return document;
    }
  }
  return document;
}

/**
 * The root element and the body propagate their overflow to the viewport, so
 * they stand for the document.
 *
 * @param {Element} element
 */
export function isDocumentScroller(element) {
  return (
    element === document.documentElement ||
    element === document.body ||
    element === document.scrollingElement
  );
}

/** @param {Node} node */
function flatParent(node) {
  if (node instanceof Element && node.assignedSlot) {
    return node.assignedSlot;
  }
  const parent = node.parentNode;
  return parent instanceof ShadowRoot ? parent.host : parent;
}

const topLayerSelectors = [':popover-open', ':modal', ':fullscreen'];

/** @param {Element} element */
function isInTopLayer(element) {
  return topLayerSelectors.some(selector => {
    try {
      return element.matches(selector);
    } catch {
      // the browser doesn't know this pseudo-class, so it has no such top layer
      return false;
    }
  });
}
