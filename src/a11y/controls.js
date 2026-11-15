/**
 * The controls inside a container of a composite widget with a roving focus,
 * like a cell of the table's grid: which ones there are, how they stay out of
 * the Tab order, and which element gets the focus.
 *
 * A **control** is a natively focusable element, or a custom element that is
 * focusable itself or has a focusable element in its open shadow tree, at any
 * depth, including content assigned to slots. Closed shadow roots can't be
 * looked into.
 */

import { keyName } from './keys.js';

/** What takes focus natively, before looking at whether it is disabled or hidden. */
const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable]';

const NOT_FOCUSABLE = ':disabled, input[type="hidden"], [contenteditable="false"]';

/**
 * Controls that only use Enter and Space, so arrow keys can move the roving
 * focus on while they have the focus: links, buttons and checkboxes.
 */
const SIMPLE =
  'a[href], button, input[type="checkbox"], input[type="button"], input[type="submit"],' +
  ' input[type="reset"], wa-button, wa-checkbox, owc-icon-button';

/**
 * The tabindex before this helper removed an element from the Tab order.
 * Interaction mode still reaches those elements, but respects a control's
 * own negative tabindex inside a custom widget.
 *
 * @type {WeakMap<Element, string | null>}
 */
const managedTabindexes = new WeakMap();

/** @param {Element} element */
function ownTabindex(element) {
  const value = element.getAttribute('tabindex');
  return value === '-1' && managedTabindexes.has(element) ? managedTabindexes.get(element) : value;
}

/**
 * Walks children in composed order, visiting each element once. Light
 * children not reached through a slot come last: they may need their Tab
 * stops suppressed before the host's first render. Focus discovery ignores
 * them while they aren't rendered. Returning false from `visit` keeps a
 * control's implementation together.
 *
 * @param {Element | ShadowRoot} root
 * @param {(element: Element) => boolean | void} visit
 * @param {Set<Element>} [seen]
 */
function visitComposed(root, visit, seen = new Set()) {
  /** @param {Element | ShadowRoot} parent */
  const walk = parent => {
    const children =
      parent instanceof HTMLSlotElement
        ? parent.assignedElements({ flatten: true })
        : parent instanceof Element && parent.shadowRoot
          ? [...parent.shadowRoot.children, ...parent.children]
          : parent.children;
    for (const element of children) {
      if (seen.has(element)) {
        continue;
      }
      seen.add(element);
      if (visit(element) !== false) {
        walk(element);
      }
    }
  };
  walk(root);
}

/** @param {Element} element */
function isCustomElement(element) {
  return element.localName.includes('-');
}

/** @param {Element} element a native element */
function takesFocus(element) {
  return (
    element.matches(FOCUSABLE) &&
    !element.matches(NOT_FOCUSABLE) &&
    /** @type {HTMLElement} */ (element).checkVisibility?.() !== false
  );
}

/**
 * Whether a custom element has a control among its composed descendants.
 *
 * @param {Element} root
 * @returns {boolean}
 */
function hasFocusable(root) {
  const outside = root.getRootNode();
  let found = false;
  visitComposed(root, element => {
    if (found) {
      return false;
    }
    // A slot-only wrapper doesn't own its assigned controls. Leaving it
    // transparent preserves direct focus on a single slotted button.
    if (element.getRootNode() === outside) {
      return false;
    }
    if (isCustomElement(element)) {
      found = ownTabindex(element) != null && takesFocus(element);
    } else {
      found = takesFocus(element);
    }
    return !found;
  });
  return found;
}

/**
 * @param {Element} element
 * @param {string | undefined} transparent
 */
function isControl(element, transparent) {
  if (!isCustomElement(element)) {
    return takesFocus(element);
  }
  if (transparent && element.matches(transparent)) {
    return false;
  }
  const focusableItself = ownTabindex(element) != null && takesFocus(element);
  return focusableItself || hasFocusable(element);
}

/**
 * The controls in a container, in composed order. A custom widget counts
 * once; `tabStopsOf` expands its internal and slotted interaction targets.
 *
 * @param {Element} container
 * @param {{ transparent?: string }} [options] `transparent`: a selector for custom elements that never
 *   count as controls themselves, like the table's header cell with its sort button
 * @returns {HTMLElement[]}
 */
export function controlsIn(container, { transparent } = {}) {
  /** @type {HTMLElement[]} */
  const controls = [];
  visitComposed(container, element => {
    // A transparent header exposes its slotted label's controls, not its
    // implementation's sort button.
    const root = element.getRootNode();
    if (transparent && root instanceof ShadowRoot && root.host.matches(transparent)) {
      return !takesFocus(element);
    }
    if (isControl(element, transparent)) {
      controls.push(/** @type {HTMLElement} */ (element));
      return false;
    }
  });
  return controls;
}

/**
 * Whether a control only uses Enter and Space. Text inputs, selects and any
 * other custom element with a control inside may use arrow keys themselves.
 *
 * @param {Element} control
 */
export function isSimpleControl(control) {
  return control.matches(SIMPLE) || control.localName.startsWith('owc-click-editable-');
}

/**
 * The element that gets the focus when the roving focus moves to a container:
 * its control if it has exactly one simple control, else the container itself.
 * It is decided from what the container renders right now.
 *
 * @param {HTMLElement} container
 * @param {{ transparent?: string }} [options] see `controlsIn`
 * @returns {HTMLElement}
 */
export function focusTargetOf(container, options) {
  const controls = controlsIn(container, options);
  return controls.length === 1 && isSimpleControl(controls[0]) ? controls[0] : container;
}

/**
 * Keeps the controls in the content of a widget's containers out of the Tab
 * order, so the widget is one Tab stop. Call it after every render: it only
 * touches elements that came since the last call, or that made themselves a
 * Tab stop again.
 *
 * Every custom element in the content gets `tabindex="-1"`, a control or not,
 * since the shadow tree that would tell may not be rendered yet: Chromium
 * then skips its whole shadow tree, with or without delegated focus. A
 * pointer or a script can still focus what's inside.
 *
 * @param {ParentNode} root what the widget rendered
 * @param {string} content a selector for the elements that hold the containers' content
 */
export function keepOutOfTabOrder(root, content) {
  /** @param {Element} element */
  const suppress = element => {
    if (
      (isCustomElement(element) || element.matches(FOCUSABLE)) &&
      element.getAttribute('tabindex') !== '-1'
    ) {
      managedTabindexes.set(element, element.getAttribute('tabindex'));
      element.setAttribute('tabindex', '-1');
    }
  };
  const seen = new Set();
  for (const container of root.querySelectorAll(content)) {
    visitComposed(container, suppress, seen);
  }
}

/**
 * The interaction targets inside a custom widget, in composed order.
 *
 * @param {Element} root
 * @returns {HTMLElement[]}
 */
function tabStopsInside(root) {
  /** @type {HTMLElement[]} */
  const stops = [];
  visitComposed(root, element => {
    const typed = /** @type {HTMLElement} */ (element);
    if (Number(ownTabindex(typed)) < 0) {
      // not a Tab stop, and neither is the shadow tree of such a host
      return !isCustomElement(typed);
    }
    if (!isCustomElement(typed)) {
      if (takesFocus(typed)) {
        stops.push(typed);
        return false;
      }
    } else if (ownTabindex(typed) != null && takesFocus(typed)) {
      stops.push(typed);
      return false;
    }
  });
  return stops;
}

/**
 * The elements Tab would stop at in a control: the control itself, or the Tab
 * stops in the open shadow tree of a custom element.
 *
 * @param {HTMLElement} control one of `controlsIn`
 * @returns {HTMLElement[]}
 */
export function tabStopsOf(control) {
  const inner = isCustomElement(control) ? tabStopsInside(control) : [];
  return inner.length > 0 ? inner : [control];
}

/**
 * Focuses a control: its first Tab stop.
 *
 * @param {HTMLElement} control one of `controlsIn`
 * @param {FocusOptions} [options]
 */
export function focusControl(control, options) {
  tabStopsOf(control)[0].focus(options);
}

/**
 * The keys of interaction mode, while the focus is on a control in a
 * container (a cell of a grid, a card of a board): Tab and Shift+Tab cycle
 * through the Tab stops of the container's controls, also from the last to
 * the first one and back, and Escape returns the focus to the container.
 * Every other key is left to the controls.
 *
 * @param {KeyboardEvent} event a keydown from inside the container
 * @param {HTMLElement} container
 * @param {{ transparent?: string }} [options] see `controlsIn`
 * @returns {boolean} whether it was one of these keys, which it kept from the browser
 */
export function handleInteractionKey(event, container, options) {
  const key = keyName(event);
  if (key === 'Escape') {
    event.preventDefault();
    container.focus();
    return true;
  }
  if (key !== 'Tab' && key !== 'Shift+Tab') {
    return false;
  }
  event.preventDefault();
  const path = event.composedPath();
  const stops = controlsIn(container, options).flatMap(tabStopsOf);
  const current = stops.findIndex(stop => path.includes(stop));
  const next =
    key === 'Tab'
      ? (current + 1) % stops.length
      : (Math.max(current, 0) - 1 + stops.length) % stops.length;
  (stops[next] ?? container).focus();
  return true;
}

/** The element that has the focus, however deep in shadow trees it is. */
export function deepActiveElement() {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement;
  }
  return active;
}
