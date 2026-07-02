// Adapted from https://github.com/jsantell/event-target
export class SmallEventTarget {
  constructor() {
    /**@type {Map<string, Function[]>} */
    this.listeners = new Map();
  }

  /**
   * @param {string} type
   * @param {EventListenerOrEventListenerObject} listener
   */
  addEventListener(type, listener) {
    if (typeof type !== 'string') {
      throw new Error('`type` must be a string');
    }
    if (typeof listener !== 'function') {
      throw new Error('`listener` must be a function');
    }

    const typedListeners = this.listeners.get(type) || [];
    typedListeners.push(listener);
    this.listeners.set(type, typedListeners);
  }

  /**
   * @param {string} type
   * @param {EventListenerOrEventListenerObject} listener
   */
  removeEventListener(type, listener) {
    if (typeof type !== 'string') {
      throw new Error('`type` must be a string');
    }
    if (typeof listener !== 'function') {
      throw new Error('`listener` must be a function');
    }

    const typedListeners = this.listeners.get(type) || [];

    for (let i = typedListeners.length; i >= 0; i--) {
      if (typedListeners[i] === listener) {
        typedListeners.splice(i, 1);
      }
    }
  }

  /**
   * @param {Event} event
   */
  dispatchEvent(event) {
    const typedListeners = this.listeners.get(event.type) || [];

    // Copy over all the listeners because a callback could remove
    // an event listener, preventing all listeners from firing when
    // the event was first dispatched.
    const queue = [];
    for (let i = 0; i < typedListeners.length; i++) {
      queue[i] = typedListeners[i];
    }

    for (let listener of queue) {
      listener(event);
    }
  }
}
