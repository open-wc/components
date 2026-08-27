import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import { OwcDetailCard } from './OwcDetailCard.js';

customElements.define('owc-detail-card', OwcDetailCard);

describe('owc-detail-card', () => {
  it('renders the summary slots and detects which are filled', async () => {
    const el = await fixture(
      html`<owc-detail-card>
        <wa-icon slot="icon" name="house"></wa-icon>
        <div slot="text">Main text</div>
        <div slot="detail">€ 42</div>
        Body content
      </owc-detail-card>`,
    );
    await el.updateComplete;
    expect(el.hasAttribute('with-icon')).to.equal(true);
    expect(el.hasAttribute('with-detail')).to.equal(true);
    expect(el.hasAttribute('with-body')).to.equal(true);
  });

  it('hides icon, detail, and body when their slots are empty', async () => {
    const el = await fixture(
      html`<owc-detail-card><div slot="text">only text</div></owc-detail-card>`,
    );
    await el.updateComplete;
    expect(el.hasAttribute('with-icon')).to.equal(false);
    expect(el.hasAttribute('with-detail')).to.equal(false);
    expect(el.hasAttribute('with-body')).to.equal(false);
  });

  it('opens via property and syncs back when the inner details closes (regression)', async () => {
    const el = await fixture(
      html`<owc-detail-card>
        <div slot="text">text</div>
        body
      </owc-detail-card>`,
    );
    const details = el.shadowRoot.querySelector('wa-details');
    expect(el.open).to.equal(false);

    el.open = true;
    await el.updateComplete;
    expect(details.hasAttribute('open')).to.equal(true);

    // user closes the inner details; the host used to listen for a toggle
    // event that wa-details never fires
    setTimeout(() => {
      details.open = false;
    });
    await oneEvent(details, 'wa-hide');
    await el.updateComplete;
    expect(el.open).to.equal(false);
  });

  it('applies the accent color as a custom property', async () => {
    const el = await fixture(
      html`<owc-detail-card accent-color="rgb(200, 0, 0)">
        <div slot="text">text</div>
      </owc-detail-card>`,
    );
    const details = el.shadowRoot.querySelector('wa-details');
    expect(details.style.getPropertyValue('--owc-detail-card-accent-color')).to.equal(
      'rgb(200, 0, 0)',
    );
  });

  it('supports semantic border, background, radius, and shadow custom properties', async () => {
    const el = await fixture(
      html`<owc-detail-card
        style="
          --owc-detail-card-background: rgb(241, 247, 250);
          --owc-detail-card-border-style: dashed;
          --owc-detail-card-border-color: rgb(86, 135, 168);
          --owc-detail-card-shadow: none;
        "
      >
        <div slot="text">Recommendation</div>
      </owc-detail-card>`,
    );
    const content = el.shadowRoot.querySelector('.content');
    const styles = getComputedStyle(content);

    expect(styles.backgroundColor).to.equal('rgb(241, 247, 250)');
    expect(styles.borderTopStyle).to.equal('dashed');
    expect(styles.borderTopWidth).to.equal('1.5px');
    expect(styles.borderTopColor).to.equal('rgb(86, 135, 168)');
    expect(styles.borderTopRightRadius).to.equal('8px');
    expect(styles.boxShadow).to.equal('none');
  });
});
