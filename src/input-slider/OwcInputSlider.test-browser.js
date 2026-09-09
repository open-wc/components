import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import { OwcInputSlider } from './OwcInputSlider.js';

customElements.define('owc-input-slider', OwcInputSlider);

/**
 * @param {OwcInputSlider} el
 */
function innerInput(el) {
  return el.shadowRoot.querySelector('wa-input');
}

/**
 * @param {OwcInputSlider} el
 */
function innerSlider(el) {
  return el.shadowRoot.querySelector('wa-slider');
}

/**
 * @param {OwcInputSlider} el
 * @param {string} text
 * @param {string} [eventType]
 */
async function typeIntoInput(el, text, eventType = 'input') {
  const input = innerInput(el);
  input.value = text;
  input.dispatchEvent(new Event(eventType));
  await el.updateComplete;
}

describe('owc-input-slider', () => {
  it('renders a label, a number input, and a slider', async () => {
    const el = await fixture(html`<owc-input-slider label="Amount"></owc-input-slider>`);
    expect(el.shadowRoot.querySelector('.label').textContent).to.equal('Amount');
    expect(innerInput(el)).to.exist;
    expect(innerSlider(el)).to.exist;
    expect(el.value).to.equal(0);
  });

  it('syncs the value attribute into input and slider', async () => {
    const el = await fixture(html`<owc-input-slider value="50"></owc-input-slider>`);
    expect(innerInput(el).value).to.equal('50');
    expect(innerSlider(el).value).to.equal(50);
  });

  it('renders the input before the slider by default and after with input-position="end"', async () => {
    const start = await fixture(html`<owc-input-slider></owc-input-slider>`);
    const startChildren = [...start.shadowRoot.querySelectorAll('wa-input, wa-slider')];
    expect(startChildren.map(node => node.tagName.toLowerCase())).to.deep.equal([
      'wa-input',
      'wa-slider',
    ]);

    const end = await fixture(html`<owc-input-slider input-position="end"></owc-input-slider>`);
    const endChildren = [...end.shadowRoot.querySelectorAll('wa-input, wa-slider')];
    expect(endChildren.map(node => node.tagName.toLowerCase())).to.deep.equal([
      'wa-slider',
      'wa-input',
    ]);
  });

  it('updates the value when typing into the input and fires input on the host', async () => {
    const el = await fixture(html`<owc-input-slider></owc-input-slider>`);
    setTimeout(() => typeIntoInput(el, '42'));
    await oneEvent(el, 'input');
    expect(el.value).to.equal(42);
    expect(innerSlider(el).value).to.equal(42);
  });

  it('fires change on the host when the inner input fires change', async () => {
    const el = await fixture(html`<owc-input-slider></owc-input-slider>`);
    setTimeout(() => typeIntoInput(el, '7', 'change'));
    await oneEvent(el, 'change');
    expect(el.value).to.equal(7);
  });

  it('updates the value when the slider moves and fires input on the host', async () => {
    const el = await fixture(html`<owc-input-slider></owc-input-slider>`);
    setTimeout(() => {
      const slider = innerSlider(el);
      slider.value = 60;
      slider.dispatchEvent(new Event('input'));
    });
    await oneEvent(el, 'input');
    expect(el.value).to.equal(60);
  });

  it('ignores input that is not a number', async () => {
    const el = await fixture(html`<owc-input-slider value="10"></owc-input-slider>`);
    await typeIntoInput(el, 'abc');
    expect(el.value).to.equal(10);
  });

  it('grows max when the input value exceeds it', async () => {
    const el = await fixture(html`<owc-input-slider max="100"></owc-input-slider>`);
    await typeIntoInput(el, '250');
    expect(el.value).to.equal(250);
    expect(el.max).to.equal(250);
    expect(innerSlider(el).max).to.equal(250);
  });

  it('shrinks min when the input value falls below it', async () => {
    const el = await fixture(html`<owc-input-slider min="0"></owc-input-slider>`);
    await typeIntoInput(el, '-30');
    expect(el.value).to.equal(-30);
    expect(el.min).to.equal(-30);
  });

  it('clamps to absolute-max', async () => {
    const el = await fixture(
      html`<owc-input-slider max="100" absolute-max="200"></owc-input-slider>`,
    );
    await typeIntoInput(el, '999');
    expect(el.value).to.equal(200);
    expect(el.max).to.equal(200);
  });

  it('treats absolute-min="0" as a real bound', async () => {
    const el = await fixture(html`<owc-input-slider absolute-min="0"></owc-input-slider>`);
    await typeIntoInput(el, '-10');
    expect(el.value).to.equal(0);
    expect(el.min).to.equal(0);
  });

  it('clamps an initial value to the absolute bounds', async () => {
    const el = await fixture(
      html`<owc-input-slider value="500" absolute-max="200"></owc-input-slider>`,
    );
    expect(el.value).to.equal(200);
  });

  it('propagates disabled to the inner controls', async () => {
    const el = await fixture(html`<owc-input-slider disabled></owc-input-slider>`);
    expect(innerInput(el).disabled).to.equal(true);
    expect(innerSlider(el).disabled).to.equal(true);
  });
});
