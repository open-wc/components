import { LitElement, css, html } from 'lit';
import { fixture, expect, nextFrame } from '@open-wc/testing';
import { OwcLayoutSidebar } from '@open-wc/components/OwcLayoutSidebar.js';
import { VirtualizerController, spacerStyles } from './VirtualizerController.js';
import {
  expectItemsCover,
  scrollInSameFrame,
  scrollTo,
  untilStable,
  visibleArea,
} from './virtualList.test-browser.helpers.js';

customElements.define('owc-layout-sidebar', OwcLayoutSidebar);

/**
 * @param {number} count
 * @param {(index: number) => number} [heightOf]
 */
function items(count, heightOf = () => 30) {
  return Array.from({ length: count }, (_, index) => ({ id: index, height: heightOf(index) }));
}

/** Heights between 20 and 59px that the estimate can't predict. */
const irregular = (/** @type {number} */ index) => 20 + ((index * 7919) % 40);

/** A minimal host: spacer, the items in range, spacer, in normal flow. */
class VirtualListHost extends LitElement {
  static properties = { items: { attribute: false } };

  static styles = [
    spacerStyles,
    css`
      :host {
        display: block;
      }
    `,
  ];

  /** @type {import('./VirtualizerController.js').VirtualizerOptions} */
  static virtualizerOptions = { estimateSize: 30 };

  constructor() {
    super();
    /** @type {{ id: number, height: number }[]} */
    this.items = [];
    this.virtualizer = new VirtualizerController(
      this,
      /** @type {typeof VirtualListHost} */ (this.constructor).virtualizerOptions,
    );
    /** @type {number[]} */
    this.firstRenderIndexes = [];
  }

  render() {
    return this.virtualizer.renderSlice(
      this.virtualizer.slice(this.items),
      (item, index) =>
        html`<div class="item" data-index=${index} style="height: ${item.height}px">
          ${item.id}
        </div>`,
    );
  }

  firstUpdated() {
    this.firstRenderIndexes = this.renderedIndexes();
  }

  renderedItems() {
    return /** @type {HTMLElement[]} */ ([...this.renderRoot.querySelectorAll('.item')]);
  }

  renderedIndexes() {
    return this.renderedItems().map(item => Number(item.dataset.index));
  }

  /** @param {number} index */
  itemAt(index) {
    return /** @type {HTMLElement | null} */ (
      this.renderRoot.querySelector(`.item[data-index="${index}"]`)
    );
  }
}

customElements.define('virtual-list-host', VirtualListHost);

class TestScrollBox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host { display: block; }
        #scroller { height: 300px; overflow: auto; }
        slot { display: contents; overflow: hidden; }
      </style>
      <div id="scroller"><slot></slot></div>
    `;
  }

  get scroller() {
    return /** @type {HTMLElement} */ (this.shadowRoot?.querySelector('#scroller'));
  }
}

customElements.define('test-display-contents-scroll-box', TestScrollBox);

/**
 * Renders a list host in a scroll container.
 *
 * @typedef {(list: import('lit').TemplateResult) => Promise<{ el: VirtualListHost, scroller: Element }>} ContainerFixture
 * @type {Record<string, ContainerFixture>}
 */
const containers = {
  'the document': async list => {
    const el = /** @type {VirtualListHost} */ (await fixture(list));
    return { el, scroller: /** @type {Element} */ (document.scrollingElement) };
  },
  'a consumer scroll box': async list => {
    const wrapper = await fixture(html`<div style="height: 300px; overflow: auto">${list}</div>`);
    const el = /** @type {VirtualListHost} */ (wrapper.querySelector('virtual-list-host'));
    await el.updateComplete;
    return { el, scroller: wrapper };
  },
  'a scroll box with a display: contents slot': async list => {
    const box = /** @type {TestScrollBox} */ (
      await fixture(
        html`<test-display-contents-scroll-box>${list}</test-display-contents-scroll-box>`,
      )
    );
    const el = /** @type {VirtualListHost} */ (box.querySelector('virtual-list-host'));
    await el.updateComplete;
    return { el, scroller: box.scroller };
  },
  'the owc-layout-sidebar content area': async list => {
    const sidebar = /** @type {OwcLayoutSidebar} */ (
      await fixture(html`<owc-layout-sidebar>${list}</owc-layout-sidebar>`)
    );
    const el = /** @type {VirtualListHost} */ (sidebar.querySelector('virtual-list-host'));
    await el.updateComplete;
    return {
      el,
      scroller: /** @type {Element} */ (sidebar.shadowRoot?.querySelector('#content')),
    };
  },
};

/**
 * Waits until the rendered range stays the same for a few frames.
 *
 * @param {VirtualListHost} el
 */
function settle(el) {
  return untilStable(el, () => el.renderedIndexes().join());
}

/**
 * Asserts that the rendered items cover the visible part of the list.
 *
 * @param {VirtualListHost} el
 * @param {Element} scroller
 */
function expectCovered(el, scroller) {
  expectItemsCover(scroller, el, el.renderedItems());
}

/** Deterministic indexes spread over the list, so failures reproduce. */
function jumpTargets(count, jumps = 6) {
  let seed = 42;
  return Array.from({ length: jumps }, () => {
    seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648;
    return seed % count;
  });
}

beforeEach(() => {
  window.scrollTo(0, 0);
});

describe('VirtualizerController', () => {
  it('renders a leading slice of items in the first render', async () => {
    /** @type {VirtualListHost} */
    const el = await fixture(html`<virtual-list-host .items=${items(1_000)}></virtual-list-host>`);

    expect(el.firstRenderIndexes[0]).to.equal(0);
    expect(el.firstRenderIndexes.length).to.be.within(10, 200);
  });

  for (const [name, render] of Object.entries(containers)) {
    describe(`in ${name}`, () => {
      it('detects the scroll container', async () => {
        const { el, scroller } = await render(
          html`<virtual-list-host .items=${items(1_000)}></virtual-list-host>`,
        );
        await settle(el);

        // compare identities: a failing chai equality on DOM elements hangs the test runner
        expect(el.virtualizer.scrollContainer === scroller, 'detected container').to.equal(true);
      });

      it('covers the visible area once scrolling stops at the top, in the middle and at the end', async () => {
        const { el, scroller } = await render(
          html`<virtual-list-host .items=${items(10_000, irregular)}></virtual-list-host>`,
        );
        await settle(el);
        expectCovered(el, scroller);

        for (const position of ['middle', 'end', 'top']) {
          const max = scroller.scrollHeight - scroller.clientHeight;
          await scrollTo(scroller, position === 'top' ? 0 : position === 'end' ? max : max / 2);
          await settle(el);
          expectCovered(el, scroller);
        }
      });

      it('renders newly visible items in the same frame as the scroll event', async () => {
        const { el, scroller } = await render(
          html`<virtual-list-host .items=${items(10_000)}></virtual-list-host>`,
        );
        await settle(el);

        for (const top of [40_000, 40_500, 120_000]) {
          await scrollInSameFrame(el, scroller, top);
          expectCovered(el, scroller);
        }
      });

      it('covers the visible area after jumps to random indexes', async () => {
        const { el, scroller } = await render(
          html`<virtual-list-host .items=${items(10_000, irregular)}></virtual-list-host>`,
        );
        await settle(el);

        for (const index of jumpTargets(10_000)) {
          await el.virtualizer.scrollToIndex(index);
          const item = el.itemAt(index);
          expect(item, `item ${index}`).to.exist;
          const rect = /** @type {HTMLElement} */ (item).getBoundingClientRect();
          const area = visibleArea(scroller);
          expect(rect.top, `top of item ${index}`).to.be.within(area.top - 1, area.bottom);
          expectCovered(el, scroller);
        }
      });
    });
  }

  it('skips wrappers that clip horizontally but never scroll vertically', async () => {
    // `overflow-x: auto` makes `overflow-y` compute to `auto` too, but the wrapper grows with its content
    const box = await fixture(html`
      <div style="height: 300px; overflow: auto">
        <div style="overflow-x: auto">
          <virtual-list-host .items=${items(1_000)}></virtual-list-host>
        </div>
      </div>
    `);
    const el = /** @type {VirtualListHost} */ (box.querySelector('virtual-list-host'));
    await settle(el);

    expect(el.virtualizer.scrollContainer === box, 'detected container').to.equal(true);
    await scrollTo(box, 12_000);
    await settle(el);
    expectCovered(el, box);
  });

  it('stops the detection at a position: fixed ancestor, which a scroll box around it does not move', async () => {
    const box = await fixture(html`
      <div style="height: 300px; overflow: auto">
        <div style="height: 1000px"></div>
        <div style="position: fixed; top: 0; left: 0; width: 300px">
          <virtual-list-host .items=${items(1_000)}></virtual-list-host>
        </div>
      </div>
    `);
    const el = /** @type {VirtualListHost} */ (box.querySelector('virtual-list-host'));
    await settle(el);

    const page = /** @type {Element} */ (document.scrollingElement);
    expect(el.virtualizer.scrollContainer === page, 'detected container').to.equal(true);
    expectCovered(el, page);
  });

  it('stops the detection at an element in the top layer, such as an open popover', async () => {
    // absolutely positioned, so only being in the top layer stops the detection
    const box = await fixture(html`
      <div style="height: 300px; overflow: auto">
        <div style="height: 1000px"></div>
        <div popover="manual" style="position: absolute; inset: 0 auto auto 0; margin: 0">
          <virtual-list-host .items=${items(1_000)}></virtual-list-host>
        </div>
      </div>
    `);
    const popover = /** @type {HTMLElement} */ (box.querySelector('[popover]'));
    popover.showPopover();
    const el = /** @type {VirtualListHost} */ (popover.querySelector('virtual-list-host'));
    try {
      await settle(el);

      const page = /** @type {Element} */ (document.scrollingElement);
      expect(el.virtualizer.scrollContainer === page, 'detected container').to.equal(true);
      expectCovered(el, page);
    } finally {
      popover.hidePopover();
    }
  });

  it('covers the visible area of a list in a modal dialog, which scrolls it', async () => {
    const dialog = /** @type {HTMLDialogElement} */ (
      await fixture(html`
        <dialog style="height: 300px">
          <virtual-list-host .items=${items(10_000, irregular)}></virtual-list-host>
        </dialog>
      `)
    );
    dialog.showModal();
    const el = /** @type {VirtualListHost} */ (dialog.querySelector('virtual-list-host'));
    try {
      await settle(el);
      expect(el.virtualizer.scrollContainer === dialog, 'detected container').to.equal(true);

      for (const top of [100_000, 250_000, 0]) {
        await scrollTo(dialog, top);
        await settle(el);
        expectCovered(el, dialog);
      }
    } finally {
      dialog.close();
    }
  });

  it('detects the scroll container again when more items make it scroll', async () => {
    const box = await fixture(html`
      <div style="height: 300px; overflow: auto">
        <virtual-list-host .items=${items(5)}></virtual-list-host>
      </div>
    `);
    const el = /** @type {VirtualListHost} */ (box.querySelector('virtual-list-host'));
    await settle(el);

    el.items = items(10_000);
    await settle(el);
    await scrollInSameFrame(el, box, 60_000);
    expectCovered(el, box);
  });

  it('uses a scroll container the host passes explicitly', async () => {
    const box = await fixture(html`
      <div style="height: 300px; overflow: auto">
        <virtual-list-host .items=${items(1_000)}></virtual-list-host>
      </div>
    `);
    const el = /** @type {VirtualListHost} */ (box.querySelector('virtual-list-host'));
    el.virtualizer.scrollContainer = box;
    await settle(el);

    expect(el.virtualizer.scrollContainer === box, 'explicit container').to.equal(true);
    await scrollTo(box, 15_000);
    await settle(el);
    expectCovered(el, box);
  });

  it('covers the visible area even when the scroll container is wrong', async () => {
    const box = await fixture(html`
      <div style="height: 300px; overflow: auto">
        <virtual-list-host .items=${items(1_000)}></virtual-list-host>
      </div>
    `);
    const el = /** @type {VirtualListHost} */ (box.querySelector('virtual-list-host'));
    const unrelated = document.createElement('div');
    unrelated.style.cssText = 'height: 10px; overflow: auto';
    box.before(unrelated);
    el.virtualizer.scrollContainer = unrelated;

    // the browser reports the visible spacer, which corrects the range
    await scrollTo(box, 9_000);
    await settle(el);
    expectCovered(el, box);
    unrelated.remove();
  });

  it('reaches the last of 100k items and keeps the rendered items bounded', async () => {
    const box = await fixture(html`
      <div style="height: 300px; overflow: auto">
        <virtual-list-host .items=${items(100_000)}></virtual-list-host>
      </div>
    `);
    const el = /** @type {VirtualListHost} */ (box.querySelector('virtual-list-host'));
    await settle(el);

    await scrollTo(box, box.scrollHeight);
    await settle(el);
    expect(el.renderedIndexes().at(-1)).to.equal(99_999);
    const last = /** @type {HTMLElement} */ (el.itemAt(99_999)).getBoundingClientRect();
    expect(last.bottom).to.be.closeTo(box.getBoundingClientRect().bottom, 1);
    // visible 300px plus the 300px buffer on each side, in 30px items, plus partial items
    expect(el.renderedItems().length).to.be.at.most(32);

    for (const index of [50_000, 12_345, 0]) {
      await el.virtualizer.scrollToIndex(index);
      expect(el.renderedItems().length).to.be.at.most(32);
    }
  });

  it('covers the visible area once a hidden list is shown', async () => {
    const box = await fixture(html`
      <div style="height: 300px; overflow: auto; display: none">
        <virtual-list-host .items=${items(10_000, irregular)}></virtual-list-host>
      </div>
    `);
    const el = /** @type {VirtualListHost} */ (box.querySelector('virtual-list-host'));
    await settle(el);
    expect(el.renderedItems(), 'leading slice while hidden').to.not.be.empty;

    /** @type {HTMLElement} */ (box).style.display = 'block';
    await settle(el);
    expectCovered(el, box);
    await scrollTo(box, 100_000);
    await settle(el);
    expectCovered(el, box);
  });

  it('covers the visible area after being reconnected while scrolled down', async () => {
    const box = await fixture(html`
      <div style="height: 300px; overflow: auto">
        <virtual-list-host .items=${items(10_000, irregular)}></virtual-list-host>
      </div>
    `);
    const el = /** @type {VirtualListHost} */ (box.querySelector('virtual-list-host'));
    await settle(el);
    await scrollTo(box, 150_000);
    await settle(el);

    // without the list the box has nothing to scroll, so it comes back scrolled to the top
    el.remove();
    await nextFrame();
    box.append(el);
    await settle(el);
    expect(box.scrollTop).to.equal(0);
    expectCovered(el, box);

    // and it follows the scroll container it is moved to
    const other = await fixture(html`<div style="height: 200px; overflow: auto"></div>`);
    other.append(el);
    await settle(el);
    expect(el.virtualizer.scrollContainer === other, 'new container').to.equal(true);
    await scrollTo(other, 50_000);
    await settle(el);
    expectCovered(el, other);
  });

  it('covers the visible area when the items change while scrolled down', async () => {
    const box = await fixture(html`
      <div style="height: 300px; overflow: auto">
        <virtual-list-host .items=${items(10_000)}></virtual-list-host>
      </div>
    `);
    const el = /** @type {VirtualListHost} */ (box.querySelector('virtual-list-host'));
    await settle(el);
    await scrollTo(box, 150_000);
    await settle(el);

    for (const count of [20, 10_000, 3_000]) {
      el.items = items(count, irregular);
      await settle(el);
      expectCovered(el, box);
      // no stale height: the list is as tall as its rendered items and spacers say
      const spacers = el.renderRoot.querySelectorAll('.virtualizer-spacer');
      const spacerHeight = [...spacers].reduce(
        (sum, spacer) => sum + spacer.getBoundingClientRect().height,
        0,
      );
      const itemHeight = el
        .renderedItems()
        .reduce((sum, item) => sum + item.getBoundingClientRect().height, 0);
      expect(el.getBoundingClientRect().height).to.be.closeTo(spacerHeight + itemHeight, 1);
    }
  });

  it('estimates unmeasured expanded items at the typical size plus the typical expansion', async () => {
    // collapsed items are 30px and expanded ones 130px; items 0-2 are rendered, 900-909 are not
    const list = items(1_000).map(item => {
      const expanded = item.id < 3 || (item.id >= 900 && item.id < 910);
      return { ...item, expanded, height: expanded ? 130 : 30 };
    });
    const box = await fixture(html`
      <div style="height: 300px; overflow: auto">
        <virtual-list-host .items=${list}></virtual-list-host>
      </div>
    `);
    const el = /** @type {VirtualListHost} */ (box.querySelector('virtual-list-host'));
    el.virtualizer.expanded = item => /** @type {{ expanded: boolean }} */ (item).expanded;
    await settle(el);

    // 987 collapsed items of 30px, 3 measured expanded items of 130px, and 10 unmeasured
    // expanded items at 30px plus the typical expansion of 100px
    expect(el.getBoundingClientRect().height).to.equal(31_300);

    // a new predicate tells which items changed
    for (const item of list.slice(900, 910)) {
      Object.assign(item, { expanded: false, height: 30 });
    }
    Object.assign(list[500], { expanded: true, height: 130 });
    el.virtualizer.expanded = item => /** @type {{ expanded: boolean }} */ (item).expanded;
    await settle(el);

    expect(el.getBoundingClientRect().height).to.equal(30_400);
  });

  describe('keeps the visible items in place', () => {
    /**
     * The first item that is fully visible in a scroll box.
     *
     * @param {VirtualListHost} el
     * @param {Element} box
     */
    function firstVisibleItem(el, box) {
      const { top } = visibleArea(box);
      return /** @type {HTMLElement} */ (
        el.renderedItems().find(item => item.getBoundingClientRect().top >= top)
      );
    }

    /** @param {(index: number) => number} heightOf */
    async function listInBox(heightOf) {
      const box = /** @type {HTMLElement} */ (
        await fixture(html`
          <div style="height: 300px; overflow: auto">
            <virtual-list-host .items=${items(10_000, heightOf)}></virtual-list-host>
          </div>
        `)
      );
      const el = /** @type {VirtualListHost} */ (box.querySelector('virtual-list-host'));
      await settle(el);
      return { box, el };
    }

    it('when scrolling up into items that are taller than estimated', async () => {
      // items 4000-4999 are three times as tall as the others, which set the estimate
      const { box, el } = await listInBox(index => (index >= 4_000 && index < 5_000 ? 90 : 30));
      await el.virtualizer.scrollToIndex(5_010);
      await settle(el);

      for (let step = 0; step < 6; step++) {
        const item = firstVisibleItem(el, box);
        const top = item.getBoundingClientRect().top;
        await scrollTo(box, box.scrollTop - 200);
        await settle(el);
        expect(item.getBoundingClientRect().top, `item ${item.dataset.index}`).to.be.closeTo(
          top + 200,
          1,
        );
      }
      expect(Math.min(...el.renderedIndexes()), 'reached the taller items').to.be.below(4_990);
    });

    for (const [name, render] of Object.entries(containers)) {
      it(`when measurements change the estimate of the items above them, in ${name}`, async () => {
        // Items 50-4999 measure 60px, all others 30px. Jumping up into the taller items
        // measures more and more of them, until they change the estimate from 30px to 60px.
        const { el, scroller } = await render(
          html`<virtual-list-host
            .items=${items(10_000, index => (index >= 50 && index < 5_000 ? 60 : 30))}
          ></virtual-list-host>`,
        );
        await settle(el);

        for (const top of [200_000, 120_000, 90_000, 60_000, 30_000]) {
          await scrollInSameFrame(el, scroller, top);
          const item = firstVisibleItem(el, scroller);
          const itemTop = item.getBoundingClientRect().top;
          await settle(el);
          expect(item.getBoundingClientRect().top, `item ${item.dataset.index}`).to.be.closeTo(
            itemTop,
            1,
          );
        }
        // with an estimate of 30px, the list would be about 10,000 × 30px tall
        expect(el.getBoundingClientRect().height, 'height with the new estimate').to.be.above(
          450_000,
        );
      });
    }

    it('when an item above them changes height', async () => {
      const { box, el } = await listInBox(() => 30);
      await scrollTo(box, 60_000);
      await settle(el);
      const item = firstVisibleItem(el, box);
      const top = item.getBoundingClientRect().top;
      const index = Number(item.dataset.index);
      const above = el.items[index - 3];
      expect(el.itemAt(index - 3), 'item above is rendered').to.exist;

      above.height = 230;
      el.requestUpdate();
      await settle(el);
      expect(item.getBoundingClientRect().top, 'after growing').to.be.closeTo(top, 1);

      above.height = 30;
      el.requestUpdate();
      await settle(el);
      expect(item.getBoundingClientRect().top, 'after shrinking').to.be.closeTo(top, 1);
    });
  });

  it('leaves size changes above the list to the browser', async () => {
    const box = /** @type {HTMLElement} */ (
      await fixture(html`
        <div style="height: 300px; overflow: auto">
          <div class="header" style="height: 50px"></div>
          <virtual-list-host .items=${items(1_000)}></virtual-list-host>
        </div>
      `)
    );
    const el = /** @type {VirtualListHost} */ (box.querySelector('virtual-list-host'));
    await settle(el);

    // The browser doesn't anchor at the top of a scroll container, so the content above grows
    // into view. An item resizing at the same time makes the controller look at the layout.
    /** @type {HTMLElement} */ (box.querySelector('.header')).style.height = '150px';
    el.items[5].height = 60;
    el.requestUpdate();
    await settle(el);

    expect(box.scrollTop).to.equal(0);
  });

  it('keeps several lists in one scroll container independent', async () => {
    const box = await fixture(html`
      <div style="height: 300px; overflow: auto">
        <virtual-list-host .items=${items(500)}></virtual-list-host>
        <virtual-list-host .items=${items(500, irregular)}></virtual-list-host>
      </div>
    `);
    const [first, second] = /** @type {VirtualListHost[]} */ ([
      ...box.querySelectorAll('virtual-list-host'),
    ]);
    await settle(first);

    for (const top of [10_000, 16_000, 30_000, 0]) {
      await scrollTo(box, top);
      await settle(first);
      await settle(second);
      expectCovered(first, box);
      expectCovered(second, box);
    }
  });
});
