import { fixture, html, expect, aTimeout } from '@open-wc/testing';
import { OwcCard } from './OwcCard.js';

customElements.define('owc-card', OwcCard);

describe('owc-card', () => {
  it('renders body content in the default slot', async () => {
    const el = await fixture(html`<owc-card>body text</owc-card>`);
    const bodySlot = el.shadowRoot.querySelector('slot:not([name])');
    expect(bodySlot.assignedNodes()[0].textContent).to.equal('body text');
    expect(el.hasAttribute('with-header')).to.equal(false);
    expect(el.hasAttribute('with-footer')).to.equal(false);
  });

  it('detects header, footer, and media slots and reflects them', async () => {
    const el = await fixture(
      html`<owc-card>
        <img slot="media" alt="" />
        <div slot="header">Header</div>
        body
        <div slot="footer">Footer</div>
      </owc-card>`,
    );
    await el.updateComplete;
    expect(el.hasAttribute('with-header')).to.equal(true);
    expect(el.hasAttribute('with-footer')).to.equal(true);
    expect(el.hasAttribute('with-media')).to.equal(true);
  });

  it('detects a media element added later via slotchange (regression)', async () => {
    // the slot controller was registered for a non-existent 'image' slot,
    // so a late media element never re-rendered the card
    const el = await fixture(html`<owc-card>body</owc-card>`);
    expect(el.hasAttribute('with-media')).to.equal(false);

    const img = document.createElement('img');
    img.slot = 'media';
    el.appendChild(img);
    await aTimeout(30); // slotchange delivery
    await el.updateComplete;
    expect(el.hasAttribute('with-media')).to.equal(true);
  });

  it('renders overlay link anchors when href is set', async () => {
    const el = await fixture(html`<owc-card href="/details">body</owc-card>`);
    const links = [...el.shadowRoot.querySelectorAll('a')];
    expect(links.length).to.equal(2);
    expect(links.every(a => a.getAttribute('href') === '/details')).to.equal(true);

    const plain = await fixture(html`<owc-card>body</owc-card>`);
    expect(plain.shadowRoot.querySelector('a')).to.equal(null);
  });
});
