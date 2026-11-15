import { fixture, html, expect } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
import { composedControlTemplates } from './controls.test-browser.helpers.js';
import {
  controlsIn,
  deepActiveElement,
  focusControl,
  focusTargetOf,
  handleInteractionKey,
  isSimpleControl,
  keepOutOfTabOrder,
  tabStopsOf,
} from './controls.js';

/**
 * @param {string} name
 * @param {string} shadowHtml
 * @param {ShadowRootInit} [init]
 */
function defineShadowElement(name, shadowHtml, init = { mode: 'open' }) {
  customElements.define(
    name,
    class extends HTMLElement {
      constructor() {
        super();
        this.attachShadow(init).innerHTML = shadowHtml;
      }
    },
  );
}

defineShadowElement('test-shadow-button', '<button>inner</button>');
defineShadowElement('test-delegating-input', '<input />', { mode: 'open', delegatesFocus: true });
defineShadowElement('test-nested-button', '<div><test-shadow-button></test-shadow-button></div>');
defineShadowElement('test-two-buttons', '<button id="one">1</button><button id="two">2</button>');
defineShadowElement('test-badge', '<span><slot></slot></span>');
defineShadowElement('test-header-cell', '<slot></slot><button>sort</button>');
defineShadowElement('test-closed-button', '<button>inner</button>', { mode: 'closed' });
defineShadowElement('test-slot-fallback', '<slot><button id="fallback">Fallback</button></slot>');
defineShadowElement(
  'test-inner-tabindex',
  '<button id="reachable">a</button><button id="skipped" tabindex="-1">b</button>',
);

/** @param {import('lit').TemplateResult} content */
async function cellFixture(content) {
  const wrapper = await fixture(html`
    <div>
      <button id="before">before</button>
      <div class="cell" tabindex="-1"><span class="content">${content}</span></div>
      <button id="after">after</button>
    </div>
  `);
  return /** @type {HTMLElement} */ (wrapper.querySelector('.cell'));
}

/** @param {Element[]} elements */
function names(elements) {
  return elements.map(element => element.id || element.localName);
}

/**
 * Compared here, since a failing chai equality between elements hangs the runner.
 *
 * @param {Element[]} actual
 * @param {Element[]} expected
 */
function sameElements(actual, expected) {
  return (
    actual.length === expected.length && actual.every((item, index) => item === expected[index])
  );
}

/** Presses Tab from the button before the cell until focus is on the button after it. */
async function tabStopsBetween() {
  /** @type {HTMLElement} */ (document.querySelector('#before')).focus();
  const stops = [];
  for (let presses = 0; presses < 20; presses++) {
    await sendKeys({ press: 'Tab' });
    const active = deepActiveElement();
    if (active?.id === 'after') {
      return stops;
    }
    stops.push(active);
  }
  throw new Error('Tab never reached the button after the cell');
}

describe('controlsIn', () => {
  it('finds no controls in text', async () => {
    const cell = await cellFixture(html`<b>Robert</b> <span>34</span>`);
    expect(names(controlsIn(cell))).to.deep.equal([]);
  });

  it('finds natively focusable elements', async () => {
    const cell = await cellFixture(html`
      <a id="link" href="#x">link</a>
      <a id="anchor-without-href">no link</a>
      <button id="button">button</button>
      <input id="input" />
      <select id="select"></select>
      <textarea id="textarea"></textarea>
      <span id="tabindex" tabindex="0">focusable</span>
      <span id="contenteditable" contenteditable="true">editable</span>
    `);
    expect(names(controlsIn(cell))).to.deep.equal([
      'link',
      'button',
      'input',
      'select',
      'textarea',
      'tabindex',
      'contenteditable',
    ]);
  });

  it("leaves out controls that can't take focus", async () => {
    const cell = await cellFixture(html`
      <button id="disabled" disabled>disabled</button>
      <input id="hidden-input" type="hidden" />
      <button id="not-rendered" style="display: none">hidden</button>
      <button id="button">button</button>
    `);
    expect(names(controlsIn(cell))).to.deep.equal(['button']);
  });

  it('finds a custom element with a focusable element in its open shadow tree', async () => {
    const cell = await cellFixture(html`<test-shadow-button></test-shadow-button>`);
    expect(names(controlsIn(cell))).to.deep.equal(['test-shadow-button']);
  });

  it('finds a custom element whose focusable element is nested in further shadow trees', async () => {
    const cell = await cellFixture(html`<test-nested-button></test-nested-button>`);
    expect(names(controlsIn(cell))).to.deep.equal(['test-nested-button']);
  });

  it('finds a custom element that is focusable itself', async () => {
    const cell = await cellFixture(html`<test-badge tabindex="0">3</test-badge>`);
    expect(names(controlsIn(cell))).to.deep.equal(['test-badge']);
  });

  it("doesn't take a custom element without anything focusable for a control", async () => {
    const cell = await cellFixture(html`<test-badge>3</test-badge>`);
    expect(names(controlsIn(cell))).to.deep.equal([]);
  });

  it('finds the controls among the children of a custom element that is no control', async () => {
    const cell = await cellFixture(html`<test-badge><button id="slotted">x</button></test-badge>`);
    expect(names(controlsIn(cell))).to.deep.equal(['slotted']);
  });

  it("can't see into a closed shadow root", async () => {
    const cell = await cellFixture(html`<test-closed-button></test-closed-button>`);
    expect(names(controlsIn(cell))).to.deep.equal([]);
  });

  it('counts a control once, whatever is inside it', async () => {
    const cell = await cellFixture(
      html`<a id="link" href="#x"><span tabindex="0">text</span></a>
        <test-shadow-button><button>slotted nowhere</button></test-shadow-button>`,
    );
    expect(names(controlsIn(cell))).to.deep.equal(['link', 'test-shadow-button']);
  });

  it('skips elements named as transparent, but not their children', async () => {
    const cell = await cellFixture(html`<test-header-cell><input id="child" /></test-header-cell>`);
    expect(names(controlsIn(cell))).to.deep.equal(['test-header-cell']);
    expect(names(controlsIn(cell, { transparent: 'test-header-cell' }))).to.deep.equal(['child']);
  });
});

describe('isSimpleControl', () => {
  it('takes links, buttons and checkboxes for simple', async () => {
    const cell = await cellFixture(html`
      <a href="#x">link</a>
      <button>button</button>
      <input type="checkbox" />
      <input type="button" value="button" />
      <wa-button>button</wa-button>
      <wa-checkbox></wa-checkbox>
      <owc-icon-button></owc-icon-button>
      <owc-click-editable-input></owc-click-editable-input>
      <owc-click-editable-autocomplete></owc-click-editable-autocomplete>
    `);
    const controls = [...cell.querySelectorAll('.content > *')];
    expect(controls).to.have.length(9);
    expect(names(controls.filter(control => !isSimpleControl(control)))).to.deep.equal([]);
  });

  it('takes everything that may use arrow keys itself for not simple', async () => {
    const cell = await cellFixture(html`
      <input />
      <input type="radio" />
      <select></select>
      <textarea></textarea>
      <span tabindex="0">focusable</span>
      <span contenteditable="true">editable</span>
      <wa-input></wa-input>
      <wa-select></wa-select>
      <test-shadow-button></test-shadow-button>
    `);
    const controls = [...cell.querySelectorAll('.content > *')];
    expect(controls).to.have.length(9);
    expect(names(controls.filter(control => isSimpleControl(control)))).to.deep.equal([]);
  });
});

describe('focusTargetOf', () => {
  it('is the cell itself when it has no controls', async () => {
    const cell = await cellFixture(html`Robert`);
    expect(focusTargetOf(cell) === cell).to.be.true;
  });

  it('is the control of a cell with exactly one simple control', async () => {
    const cell = await cellFixture(html`<button id="only">x</button>`);
    expect(focusTargetOf(cell).id).to.equal('only');
  });

  it("is the cell when its one control isn't simple", async () => {
    const cell = await cellFixture(html`<input />`);
    expect(focusTargetOf(cell) === cell).to.be.true;
    const custom = await cellFixture(html`<test-shadow-button></test-shadow-button>`);
    expect(focusTargetOf(custom) === custom).to.be.true;
  });

  it('is the cell when it has several controls', async () => {
    const cell = await cellFixture(html`<button>a</button><button>b</button>`);
    expect(focusTargetOf(cell) === cell).to.be.true;
  });
});

describe('keepOutOfTabOrder', () => {
  it('takes native controls out of the Tab order', async () => {
    const cell = await cellFixture(html`
      <a href="#x">link</a>
      <button>button</button>
      <input />
      <span tabindex="0">focusable</span>
    `);
    expect(await tabStopsBetween()).to.have.length(4);
    keepOutOfTabOrder(cell, '.content');
    expect(names(await tabStopsBetween())).to.deep.equal([]);
  });

  it('takes the shadow trees of custom elements out of the Tab order', async () => {
    const cell = await cellFixture(html`
      <test-shadow-button></test-shadow-button>
      <test-delegating-input></test-delegating-input>
      <test-nested-button></test-nested-button>
      <test-two-buttons></test-two-buttons>
    `);
    expect(await tabStopsBetween()).to.have.length(5);
    keepOutOfTabOrder(cell, '.content');
    expect(names(await tabStopsBetween())).to.deep.equal([]);
  });

  it('takes out controls that were rendered after an earlier pass', async () => {
    const cell = await cellFixture(html`<button>a</button>`);
    keepOutOfTabOrder(cell, '.content');
    cell.querySelector('.content').append(document.createElement('test-shadow-button'));
    cell.querySelector('.content').append(document.createElement('button'));
    expect(await tabStopsBetween()).to.have.length(2);
    keepOutOfTabOrder(cell, '.content');
    expect(names(await tabStopsBetween())).to.deep.equal([]);
  });

  it('takes a control out again that made itself a Tab stop', async () => {
    const cell = await cellFixture(html`<test-badge>3</test-badge>`);
    keepOutOfTabOrder(cell, '.content');
    const badge = cell.querySelector('test-badge');
    badge.setAttribute('tabindex', '0');
    expect(await tabStopsBetween()).to.have.length(1);
    keepOutOfTabOrder(cell, '.content');
    expect(names(await tabStopsBetween())).to.deep.equal([]);
    // it is focusable by its own doing, so it is a control
    expect(names(controlsIn(cell))).to.deep.equal(['test-badge']);
  });

  it("doesn't turn a custom element without anything focusable into a control", async () => {
    const cell = await cellFixture(html`<test-badge>3</test-badge>`);
    keepOutOfTabOrder(cell, '.content');
    expect(names(controlsIn(cell))).to.deep.equal([]);
    expect(focusTargetOf(cell) === cell).to.be.true;
  });

  it('only looks at the content it is pointed to', async () => {
    const cell = await cellFixture(html`<button>a</button>`);
    keepOutOfTabOrder(/** @type {HTMLElement} */ (cell.parentElement), '.content');
    expect(names(await tabStopsBetween())).to.deep.equal([]);
    expect(document.querySelector('#before').hasAttribute('tabindex')).to.be.false;
    expect(cell.getAttribute('tabindex')).to.equal('-1');
  });

  it('still lets a pointer or a script focus the controls', async () => {
    const cell = await cellFixture(html`<test-shadow-button></test-shadow-button>`);
    keepOutOfTabOrder(cell, '.content');
    const inner = cell.querySelector('test-shadow-button').shadowRoot.querySelector('button');
    inner.focus();
    expect(deepActiveElement() === inner).to.be.true;
  });
});

describe('tabStopsOf and focusControl', () => {
  it('ignores unassigned content and replaces slot fallback with assigned controls', async () => {
    const cell = await cellFixture(html`
      <test-composed-control><input id="unassigned" slot="missing" /></test-composed-control>
      <test-slot-fallback></test-slot-fallback>
      <test-slot-fallback><input id="assigned" /></test-slot-fallback>
    `);
    keepOutOfTabOrder(cell, '.content');
    expect(names(controlsIn(cell).flatMap(tabStopsOf))).to.deep.equal([
      'shadow-first',
      'shadow-last',
      'fallback',
      'assigned',
    ]);
  });

  for (const [name, content] of Object.entries(composedControlTemplates)) {
    it(`keeps shadow controls and ${name} reachable in composed order after suppressing Tab`, async () => {
      const cell = await cellFixture(content);
      expect(await tabStopsBetween()).to.have.length(3);
      keepOutOfTabOrder(cell, '.content');
      // A second pass must not forget which negative tabindex values we set.
      keepOutOfTabOrder(cell, '.content');
      expect(await tabStopsBetween()).to.have.length(0);
      const stops = controlsIn(cell).flatMap(tabStopsOf);
      expect(names(stops)).to.deep.equal(['shadow-first', 'slotted-input', 'shadow-last']);
      expect(new Set(stops).size).to.equal(3);
      expect(stops.map(stop => stop.getAttribute('tabindex'))).to.deep.equal(['-1', '-1', '-1']);
      for (const stop of stops) {
        focusControl(stop);
        expect(deepActiveElement() === stop).to.be.true;
      }
    });
  }

  it('is a native control itself', async () => {
    const cell = await cellFixture(html`<button id="only">x</button>`);
    keepOutOfTabOrder(cell, '.content');
    const [button] = controlsIn(cell);
    expect(sameElements(tabStopsOf(button), [button])).to.be.true;
    focusControl(button);
    expect(deepActiveElement() === button).to.be.true;
  });

  it('is the focusable element in the shadow tree of a custom element', async () => {
    const cell = await cellFixture(html`<test-nested-button></test-nested-button>`);
    keepOutOfTabOrder(cell, '.content');
    const [control] = controlsIn(cell);
    const inner = control.shadowRoot
      .querySelector('test-shadow-button')
      .shadowRoot.querySelector('button');
    expect(sameElements(tabStopsOf(control), [inner])).to.be.true;
    focusControl(control);
    expect(deepActiveElement() === inner).to.be.true;
  });

  it('lists every Tab stop of a custom element, in order', async () => {
    const cell = await cellFixture(html`<test-two-buttons></test-two-buttons>`);
    keepOutOfTabOrder(cell, '.content');
    expect(names(tabStopsOf(controlsIn(cell)[0]))).to.deep.equal(['one', 'two']);
  });

  it('leaves out what the custom element keeps out of its own Tab order', async () => {
    const cell = await cellFixture(html`<test-inner-tabindex></test-inner-tabindex>`);
    keepOutOfTabOrder(cell, '.content');
    expect(names(tabStopsOf(controlsIn(cell)[0]))).to.deep.equal(['reachable']);
  });

  it('is a custom element that is focusable itself', async () => {
    const cell = await cellFixture(html`<test-badge tabindex="0">3</test-badge>`);
    keepOutOfTabOrder(cell, '.content');
    const [badge] = controlsIn(cell);
    expect(sameElements(tabStopsOf(badge), [badge])).to.be.true;
    focusControl(badge);
    expect(deepActiveElement() === badge).to.be.true;
  });
});

describe('interaction mode keys', () => {
  /** @param {import('lit').TemplateResult} content */
  async function interactiveCell(content) {
    const cell = await cellFixture(content);
    keepOutOfTabOrder(cell, '.content');
    /** @type {boolean[]} */
    const handled = [];
    cell.addEventListener('keydown', event => {
      handled.push(handleInteractionKey(event, cell));
    });
    return { cell, handled };
  }

  it('cycles through the Tab stops of the controls with Tab and Shift+Tab, at both ends too', async () => {
    const { cell, handled } = await interactiveCell(
      html`<button id="first">1</button><test-two-buttons></test-two-buttons><input id="last" />`,
    );
    focusControl(controlsIn(cell)[0]);
    const stops = [];
    for (const key of ['Tab', 'Tab', 'Tab', 'Tab', 'Shift+Tab', 'Shift+Tab']) {
      await sendKeys({ press: key });
      stops.push(deepActiveElement().id);
    }
    expect(stops).to.deep.equal(['one', 'two', 'last', 'first', 'last', 'two']);
    // the Shift key's own keydowns aren't interaction keys
    expect(handled.filter(Boolean)).to.have.length(6);
  });

  it('returns the focus to the container with Escape, and leaves every other key to the controls', async () => {
    const { cell, handled } = await interactiveCell(html`<input id="field" />`);
    focusControl(controlsIn(cell)[0]);
    await sendKeys({ type: 'ab' });
    await sendKeys({ press: 'ArrowLeft' });
    expect(handled).to.deep.equal([false, false, false]);
    expect(/** @type {HTMLInputElement} */ (deepActiveElement()).value).to.equal('ab');
    await sendKeys({ press: 'Escape' });
    expect(handled.at(-1)).to.be.true;
    expect(document.activeElement === cell).to.be.true;
  });
});
