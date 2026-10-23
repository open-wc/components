/**
 * Helpers for browser tests of virtualized lists: the controller's test host,
 * and the table. The name keeps the module out of the package (`files`
 * excludes `*.test-browser.*`), and out of the test runs: web-test-runner runs
 * `*.test-browser.js` files, and `node --test` files such as `*.test.js`.
 */
import { expect, nextFrame } from '@open-wc/testing';

/**
 * The element whose events tell about scrolling the container: the window for
 * the document.
 *
 * @param {Element} scroller
 * @returns {EventTarget}
 */
function scrollEventTarget(scroller) {
  return scroller === document.scrollingElement ? window : scroller;
}

/**
 * Scrolls and waits for the scroll to end.
 *
 * @param {Element} scroller the scroll container; `document.scrollingElement` for the document
 * @param {number} top
 */
export async function scrollTo(scroller, top) {
  const before = scroller.scrollTop;
  const ended = new Promise(resolve =>
    scrollEventTarget(scroller).addEventListener('scrollend', resolve, { once: true }),
  );
  scroller.scrollTop = top;
  if (scroller.scrollTop !== before) {
    await ended;
  }
}

/**
 * Scrolls without waiting for a frame, and resolves once the host has handled
 * the scroll event. No frame passes, so nothing but the scroll event can have
 * updated the list.
 *
 * @param {import('lit').ReactiveElement} host the element that renders the list
 * @param {Element} scroller the scroll container; `document.scrollingElement` for the document
 * @param {number} top
 */
export async function scrollInSameFrame(host, scroller, top) {
  // Scroll from a task of its own: scrolling inside an animation frame callback
  // lets that frame paint, and the browser report visible spacers, before the
  // scroll event arrives.
  await new Promise(resolve => setTimeout(resolve));
  const scrolled = new Promise(resolve =>
    scrollEventTarget(scroller).addEventListener('scroll', resolve, { once: true }),
  );
  scroller.scrollTop = top;
  await scrolled;
  await host.updateComplete;
}

/**
 * Waits until what `snapshot` returns stays the same for a few frames, each
 * after the host's update.
 *
 * @param {import('lit').ReactiveElement} host
 * @param {() => string} snapshot what has to settle, e.g. the rendered items
 * @param {{ maxFrames?: number, animations?: boolean }} [options] how many frames to wait at most, and whether every frame waits for running animations too
 */
export async function untilStable(host, snapshot, { maxFrames = 60, animations = false } = {}) {
  let previous = '';
  let stableFrames = 0;
  for (let frame = 0; frame < maxFrames && stableFrames < 3; frame++) {
    await nextFrame();
    await host.updateComplete;
    if (animations) {
      await Promise.all(document.getAnimations().map(animation => animation.finished));
    }
    const current = snapshot();
    stableFrames = current === previous ? stableFrames + 1 : 0;
    previous = current;
  }
}

/**
 * The visible part of a scroll container, clipped to the viewport.
 *
 * @param {Element} scroller the scroll container; `document.scrollingElement` for the document
 */
export function visibleArea(scroller) {
  if (scroller === document.scrollingElement) {
    return { top: 0, bottom: window.innerHeight };
  }
  const rect = scroller.getBoundingClientRect();
  return { top: Math.max(rect.top, 0), bottom: Math.min(rect.bottom, window.innerHeight) };
}

/**
 * Asserts that rendered items cover the part of a list that is visible in its
 * scroll container.
 *
 * @param {Element} scroller the scroll container; `document.scrollingElement` for the document
 * @param {Element} list the element that holds the list, spacers included
 * @param {Element[]} items the rendered items, in order
 */
export function expectItemsCover(scroller, list, items) {
  const area = visibleArea(scroller);
  const bounds = list.getBoundingClientRect();
  const top = Math.max(area.top, bounds.top);
  const bottom = Math.min(area.bottom, bounds.bottom);
  if (bottom <= top) {
    // the list is scrolled out of view, there is nothing to cover
    return;
  }
  const rendered = items.map(item => item.getBoundingClientRect());
  expect(rendered, 'rendered items').to.not.be.empty;
  expect(rendered[0].top, 'top of the first rendered item').to.be.at.most(top + 0.5);
  expect(rendered.at(-1)?.bottom, 'bottom of the last rendered item').to.be.at.least(bottom - 0.5);
}
