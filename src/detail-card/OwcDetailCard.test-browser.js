import { fixture, html, expect, waitUntil } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
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

  it('derives slot state without scheduling a follow-up update', async () => {
    const el = document.createElement('owc-detail-card');
    el.innerHTML = '<div slot="text">Text</div>Body';
    document.body.append(el);

    expect(await el.updateComplete).to.equal(true);
    expect(el.hasAttribute('with-body')).to.equal(true);
    el.remove();
  });

  it('opens via property and closes via the public trigger', async () => {
    const el = await fixture(
      html`<owc-detail-card>
        <div slot="text">text</div>
        body
      </owc-detail-card>`,
    );
    expect(el.open).to.equal(false);

    el.open = true;
    await el.updateComplete;
    expect(el.hasAttribute('open')).to.equal(true);
    el.focus();
    await sendKeys({ press: 'Enter' });
    await el.updateComplete;
    expect(el.open).to.equal(false);
  });

  it('applies the accent color as a custom property', async () => {
    const el = await fixture(
      html`<owc-detail-card accent-color="rgb(200, 0, 0)">
        <div slot="text">text</div>
      </owc-detail-card>`,
    );
    const details = el.shadowRoot.querySelector('.card');
    expect(details.style.getPropertyValue('--owc-detail-card-accent-color')).to.equal(
      'rgb(200, 0, 0)',
    );
  });

  it('supports semantic border, background, radius, and shadow custom properties', async () => {
    const el = await fixture(
      html`<owc-detail-card
        style="
          --owc-detail-card-background: rgb(241, 247, 250);
          --owc-detail-card-border-width: 2px;
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
    expect(styles.borderTopWidth).to.equal('2px');
    expect(styles.borderTopColor).to.equal('rgb(86, 135, 168)');
    expect(styles.borderTopRightRadius).to.equal('8px');
    expect(styles.boxShadow).to.equal('none');
  });
  it('removes the rail spacing and rounds the full card when the accent is cleared', async () => {
    const el = await fixture(
      html`<owc-detail-card
        accent-color="red"
        style="--owc-detail-card-border-color: black; --owc-detail-card-border-width: 2px;"
        ><span slot="text">Summary</span></owc-detail-card
      >`,
    );
    const content = el.shadowRoot.querySelector('.content');
    expect(getComputedStyle(content).marginInlineStart).to.equal('9px');
    el.accentColor = '';
    await el.updateComplete;
    const styles = getComputedStyle(content);
    expect(styles.marginInlineStart).to.equal('0px');
    expect(styles.borderInlineStartWidth).to.equal('2px');
    expect(styles.borderStartStartRadius).to.equal('8px');
    expect(styles.borderEndStartRadius).to.equal('8px');
  });

  it('keeps an open summary border until body content is added', async () => {
    const el = await fixture(
      html`<owc-detail-card
        open
        style="--owc-detail-card-border-color: black; --owc-detail-card-border-width: 2px;"
        ><span slot="text">Summary</span></owc-detail-card
      >`,
    );
    const content = el.shadowRoot.querySelector('.content');
    expect(getComputedStyle(content).borderBottomWidth).to.equal('2px');
    expect(getComputedStyle(content).borderEndStartRadius).to.equal('8px');
    el.append(document.createTextNode('Body'));
    await waitUntil(() => el.withBody);
    await el.updateComplete;
    const expandedContent = el.shadowRoot.querySelector('.content');
    expect(getComputedStyle(expandedContent).borderBottomWidth).to.equal('0px');
    expect(getComputedStyle(expandedContent).borderEndStartRadius).to.equal('0px');
  });
  it('inherits Web Awesome tokens through the summary slot and uses them for layout', async () => {
    const host = await fixture(
      html`<div
        style="--wa-space-3xs: 3px; --wa-space-xs: 10px; --wa-space-s: 15px; --wa-space-m: 20px; --wa-border-radius-l: 9px; --wa-border-width-s: 2px; --wa-color-surface-border: gray; --wa-color-text-normal: black; --wa-font-size-s: 18px;"
      >
        <owc-detail-card>
          <div slot="text" style="display:flex; gap:var(--wa-space-3xs)">
            <span style="font-size:var(--wa-font-size-s)">Header</span>
          </div>
          Body
        </owc-detail-card>
      </div>`,
    );
    const card = host.querySelector('owc-detail-card');
    await card.updateComplete;
    const header = card.querySelector('[slot=text]');
    expect(getComputedStyle(header).getPropertyValue('--wa-space-3xs').trim()).to.equal('3px');
    expect(
      getComputedStyle(header.firstElementChild).getPropertyValue('--wa-space-3xs').trim(),
    ).to.equal('3px');
    expect(getComputedStyle(header).gap).to.equal('3px');
    expect(getComputedStyle(header.firstElementChild).fontSize).to.equal('18px');
    const content = getComputedStyle(card.shadowRoot.querySelector('.content'));
    expect(content.gap).to.equal('10px');
    expect(content.paddingBlockStart).to.equal('15px');
    expect(content.paddingInlineStart).to.equal('20px');
    expect(content.borderTopWidth).to.equal('2px');
    expect(content.borderTopRightRadius).to.equal('9px');
  });
});
