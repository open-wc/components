export const requestUpdateEventName = 'requestUpdate';

/**
 * Tracks the listener registered per (source, target) pair so
 * removeRequestUpdateReDispatcher can remove exactly what
 * addRequestUpdateReDispatcher added.
 *
 * @type {WeakMap<EventTarget, Map<EventTarget, EventListener>>}
 */
const reDispatchers = new WeakMap();

/**
 * Forwards `requestUpdate` events from `source` to `target`.
 * Adding the same pair twice keeps a single forwarder.
 *
 * @param {EventTarget} source
 * @param {EventTarget} target
 */
export function addRequestUpdateReDispatcher(source, target) {
  const targets = reDispatchers.get(source) || new Map();
  if (targets.has(target)) {
    return;
  }
  const listener = () => dispatchRequestUpdateEvent(target);
  source.addEventListener(requestUpdateEventName, listener);
  targets.set(target, listener);
  reDispatchers.set(source, targets);
}

/**
 * Stops forwarding `requestUpdate` events from `source` to `target`.
 *
 * @param {EventTarget} source
 * @param {EventTarget} target
 */
export function removeRequestUpdateReDispatcher(source, target) {
  const targets = reDispatchers.get(source);
  const listener = targets?.get(target);
  if (targets && listener) {
    source.removeEventListener(requestUpdateEventName, listener);
    targets.delete(target);
  }
}

/**
 * Dispatches a `requestUpdate` event on the target.
 *
 * @param {EventTarget} target
 */
export function dispatchRequestUpdateEvent(target) {
  target.dispatchEvent(new Event(requestUpdateEventName));
}

/**
 * Calls `element.requestUpdate()` whenever `source` fires `requestUpdate`.
 * Returns an AbortController; call `.abort()` to remove the listener.
 *
 * @param {EventTarget} source
 * @param {{requestUpdate: () => void;}} element
 */
export function addRequestUpdateListener(source, element) {
  const controller = new AbortController();
  source.addEventListener(
    requestUpdateEventName,
    () => {
      element.requestUpdate();
    },
    { signal: controller.signal },
  );
  return controller;
}
