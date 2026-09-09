/**
 * This is a JS version of https://github.com/shoelace-style/shoelace/blob/next/src/internal/slot.ts
 */

/** @typedef {import('lit').ReactiveControllerHost} ReactiveControllerHost */

/** A reactive controller that determines when slots exist. */
export class HasSlotController {
  /** @type {ReactiveControllerHost & Element} */
  host;
  /** @type {string[]} */
  slotNames = [];

  /**
   *
   * @param {ReactiveControllerHost & Element} host
   * @param  {string[]} slotNames
   */
  constructor(host, ...slotNames) {
    (this.host = host).addController(this);
    this.slotNames = slotNames;
  }

  hasDefaultSlot() {
    const children = /** @type {Array<HTMLElement>} */ (
      /** @type {unknown} **/ (this.host.childNodes)
    );
    return [...children].some(node => {
      if (node.nodeType === node.TEXT_NODE && node.textContent?.trim() !== '') {
        return true;
      }

      if (node.nodeType === node.ELEMENT_NODE) {
        const el = /** @type {HTMLElement} */ (node);
        const tagName = el.tagName.toLowerCase();

        // Ignore visually hidden elements since they aren't rendered
        if (tagName === 'wa-visually-hidden') {
          return false;
        }

        // If it doesn't have a slot attribute, it's part of the default slot
        if (!el.hasAttribute('slot')) {
          return true;
        }
      }

      return false;
    });
  }

  /**
   * @param {string} name
   */
  hasNamedSlot(name) {
    return this.host.querySelector(`:scope > [slot="${name}"]`) !== null;
  }

  /**
   * @param {string} slotName
   */
  test(slotName) {
    return slotName === '[default]' ? this.hasDefaultSlot() : this.hasNamedSlot(slotName);
  }

  hostConnected() {
    this.host.shadowRoot?.addEventListener('slotchange', this.handleSlotChange);
  }

  hostDisconnected() {
    this.host.shadowRoot?.removeEventListener('slotchange', this.handleSlotChange);
  }

  /**
   *
   * @param {Event} event
   */
  handleSlotChange = event => {
    const slot = /** @type {HTMLSlotElement} */ (event.target);

    if (
      (this.slotNames.includes('[default]') && !slot.name) ||
      (slot.name && this.slotNames.includes(slot.name))
    ) {
      this.host.requestUpdate();
    }
  };
}

/**
 * Given a slot, this function iterates over all of its assigned element and text nodes and returns the concatenated
 * HTML as a string. This is useful because we can't use slot.innerHTML as an alternative.
 * @param {HTMLSlotElement} slot
 * @returns {string}
 */
export function getInnerHTML(slot) {
  const nodes = slot.assignedNodes({ flatten: true });
  let html = '';

  [...nodes].forEach(node => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const typedNode = /** @type {HTMLElement} */ (node);
      html += typedNode.outerHTML;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      html += node.textContent;
    }
  });

  return html;
}

/**
 * Given a slot, this function iterates over all of its assigned text nodes and returns the concatenated text as a
 * string. This is useful because we can't use slot.textContent as an alternative.
 * @param {HTMLSlotElement | undefined | null} slot
 * @returns {string}
 */
export function getTextContent(slot) {
  if (!slot) {
    return '';
  }
  const nodes = slot.assignedNodes({ flatten: true });
  let text = '';

  [...nodes].forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent;
    }
  });

  return text;
}
