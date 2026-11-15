/**
 * A visually hidden, polite live region in a host's shadow root, for status
 * messages such as "Press Escape to return to the table" (WCAG 4.1.3).
 *
 * The region is there from the host's first update on, since screen readers
 * only watch live regions they already know. A message empties the region
 * and sets its text a moment later: a repeated message is read again that
 * way, and of several messages in a row only the last one is read.
 */
export class LiveRegionController {
  /** @type {import('lit').ReactiveElement} */
  #host;

  /** @type {HTMLElement | undefined} */
  #element;

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  #timer;

  #delay;

  /**
   * @param {import('lit').ReactiveElement} host
   * @param {{ delay?: number }} [options] `delay`: how long the region stays empty before it shows a message, in ms
   */
  constructor(host, { delay = 50 } = {}) {
    this.#host = host;
    this.#delay = delay;
    host.addController(this);
  }

  hostUpdated() {
    this.#ensureElement();
  }

  hostDisconnected() {
    clearTimeout(this.#timer);
  }

  /**
   * Has screen readers read a message, once they are done with what they are
   * reading. A message that still waits is dropped for the new one.
   *
   * @param {string} message
   */
  announce(message) {
    clearTimeout(this.#timer);
    const element = this.#ensureElement();
    if (!element) {
      return;
    }
    element.textContent = '';
    this.#timer = setTimeout(() => {
      element.textContent = message;
    }, this.#delay);
  }

  /**
   * The region, a child of the host's shadow root next to what the host
   * renders. A host whose render replaces everything in its shadow root
   * removes it; the next update or message brings it back.
   */
  #ensureElement() {
    if (this.#element?.isConnected) {
      return this.#element;
    }
    const root = this.#host.renderRoot;
    if (!root || !this.#host.isConnected) {
      return undefined;
    }
    const element = document.createElement('div');
    element.setAttribute('role', 'status');
    element.setAttribute('aria-live', 'polite');
    element.setAttribute('aria-atomic', 'true');
    // Inline, so hosts don't need to include styles for it. In the top left
    // corner of its containing block: left where the host's content ends, it
    // would not scroll with that content inside a scroll box that isn't
    // positioned, but make the page as tall as the content. `position: fixed`
    // avoids that too, but cost a 100k-row table 10ms of its first paint.
    element.style.cssText =
      'position: absolute; top: 0; left: 0; width: 1px; height: 1px; padding: 0; border: 0;' +
      ' overflow: hidden; clip-path: inset(50%); white-space: nowrap; pointer-events: none;';
    root.appendChild(element);
    this.#element = element;
    return element;
  }
}
