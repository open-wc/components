import { fixture, html, expect } from '@open-wc/testing';
import { OwcSeparator } from './OwcSeparator.js';

customElements.define('owc-separator', OwcSeparator);

describe('owc-separator', () => {
  it('renders as a horizontal separator by default', async () => {
    const el = await fixture(html`<owc-separator></owc-separator>`);
    expect(el.getAttribute('role')).to.equal('separator');
    expect(el.getAttribute('aria-orientation')).to.equal('horizontal');
    expect(el.hasAttribute('vertical')).to.equal(false);
    expect(el.shadowRoot.querySelectorAll('hr').length).to.equal(2);
  });

  it('renders the in-between note via the default slot', async () => {
    const el = await fixture(html`<owc-separator>or</owc-separator>`);
    const slot = el.shadowRoot.querySelector('slot');
    expect(slot.assignedNodes()[0].textContent).to.equal('or');
  });

  it('switches to vertical orientation', async () => {
    const el = await fixture(html`<owc-separator vertical></owc-separator>`);
    expect(el.getAttribute('aria-orientation')).to.equal('vertical');

    el.vertical = false;
    await el.updateComplete;
    expect(el.getAttribute('aria-orientation')).to.equal('horizontal');
    expect(el.hasAttribute('vertical')).to.equal(false);
  });
});
