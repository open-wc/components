export const requestUpdateEventName = 'requestUpdate';

/**
 * @param {EventTarget} source
 * @param {EventTarget} target
 */
export function addRequestUpdateReDispatcher(source, target) {
  source.addEventListener(requestUpdateEventName, () => dispatchRequestUpdateEvent(target));
}

/**
 * @param {EventTarget} source
 * @param {EventTarget} target
 */
export function removeRequestUpdateReDispatcher(source, target) {
  source.removeEventListener(requestUpdateEventName, () => dispatchRequestUpdateEvent(target));
}

/**
 *
 * @param {EventTarget} target
 */
export function dispatchRequestUpdateEvent(target) {
  return () => target.dispatchEvent(new Event(requestUpdateEventName));
}

/**
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
