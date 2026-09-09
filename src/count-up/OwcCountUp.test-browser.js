import { fixture, html, expect } from '@open-wc/testing';
import { OwcCountUp } from './OwcCountUp.js';

customElements.define('owc-count-up', OwcCountUp);

/**
 * @param {OwcCountUp} el
 */
function target(el) {
  return el.shadowRoot.querySelector('#target');
}

// All tests run with duration="0": countup.js then prints the end value
// synchronously on start() instead of animating via requestAnimationFrame,
// which is throttled to a standstill when the whole suite runs in parallel.
// The scroll-spy default is countup.js behavior; the component's job is only
// to pass the flag, which is asserted directly.
describe('owc-count-up', () => {
  it('enables scroll spy by default and counts to the end value', async () => {
    const el = await fixture(html`<owc-count-up end="42" duration="0"></owc-count-up>`);
    expect(el.countUp.error).to.equal('');
    expect(el.countUp.options.enableScrollSpy).to.equal(true);
    expect(el.countUp.options.scrollSpyOnce).to.equal(true);

    el.countUp.start();
    expect(target(el).textContent.trim()).to.equal('42');
  });

  it('uses the separator for grouping', async () => {
    const el = await fixture(
      html`<owc-count-up end="1234567" duration="0" separator="_"></owc-count-up>`,
    );
    el.countUp.start();
    expect(target(el).textContent.trim()).to.equal('1_234_567');
  });

  it('applies property changes after the first render (regression)', async () => {
    // The merged countup.js options used to be written back into the options
    // property, so the stale first merge shadowed every later change.
    const el = await fixture(html`<owc-count-up end="1234567" duration="0"></owc-count-up>`);
    el.separator = ',';
    await el.updateComplete;

    el.countUp.start();
    expect(target(el).textContent.trim()).to.equal('1,234,567');
  });

  it('lets explicit options win over the convenience properties', async () => {
    const el = await fixture(
      html`<owc-count-up
        end="5"
        duration="0"
        .options=${{ enableScrollSpy: false, prefix: '€ ' }}
      ></owc-count-up>`,
    );
    expect(el.countUp.options.enableScrollSpy).to.equal(false);

    el.countUp.start();
    expect(target(el).textContent.trim()).to.equal('€ 5');
  });
});
