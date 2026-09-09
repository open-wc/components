import { fixture, html, expect } from '@open-wc/testing';
import { OwcTooltip } from './OwcTooltip.js';

customElements.define('owc-tooltip', OwcTooltip);

/**
 * @param {OwcTooltip} el
 */
function waTooltip(el) {
  return el.shadowRoot.querySelector('wa-tooltip');
}

describe('owc-tooltip', () => {
  it('renders the tooltip attached to the anchor slot', async () => {
    const el = await fixture(
      html`<owc-tooltip>
        Tooltip text
        <button slot="anchor">Hover me</button>
      </owc-tooltip>`,
    );
    expect(waTooltip(el)).to.exist;
    expect(waTooltip(el).getAttribute('for')).to.equal('anchor');
    const anchorSlot = el.shadowRoot.querySelector('slot[name="anchor"]');
    expect(anchorSlot.assignedElements()[0].textContent).to.equal('Hover me');
  });

  it('forwards placement, distance, skidding, and trigger', async () => {
    const el = await fixture(
      html`<owc-tooltip placement="bottom" distance="12" skidding="4" trigger="click">
        text
        <span slot="anchor">anchor</span>
      </owc-tooltip>`,
    );
    const inner = waTooltip(el);
    expect(inner.getAttribute('placement')).to.equal('bottom');
    expect(inner.getAttribute('distance')).to.equal('12');
    expect(inner.getAttribute('skidding')).to.equal('4');
    expect(inner.getAttribute('trigger')).to.equal('click');
  });

  it('forwards the show/hide delays (regression)', async () => {
    const el = await fixture(
      html`<owc-tooltip show-delay="500" hide-delay="200">
        text
        <span slot="anchor">anchor</span>
      </owc-tooltip>`,
    );
    // they were bound as showDelay/hideDelay, which wa-tooltip ignores
    expect(waTooltip(el).showDelay).to.equal(500);
    expect(waTooltip(el).hideDelay).to.equal(200);
  });

  it('forwards open, disabled, and without-arrow', async () => {
    const el = await fixture(
      html`<owc-tooltip open disabled without-arrow>
        text
        <span slot="anchor">anchor</span>
      </owc-tooltip>`,
    );
    const inner = waTooltip(el);
    expect(inner.hasAttribute('open')).to.equal(true);
    expect(inner.hasAttribute('disabled')).to.equal(true);
    expect(inner.hasAttribute('without-arrow')).to.equal(true);

    el.open = false;
    await el.updateComplete;
    expect(inner.hasAttribute('open')).to.equal(false);
  });
});
