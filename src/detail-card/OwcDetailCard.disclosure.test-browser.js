import { expect, fixture, html, waitUntil } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
import '@open-wc/components/define/owc-detail-card.js';

describe('detail card public disclosure contract', () => {
  it('01: focuses the summary and forwards Web Awesome transitions', async () => {
    const transitions = [];
    const card = await fixture(
      html`<owc-detail-card
        heading-level="3"
        @card-toggle=${event => transitions.push(event.detail.open)}
        ><span slot="heading">Accident insurance</span><input aria-label="Draft"
      /></owc-detail-card>`,
    );
    expect(transitions).to.deep.equal([]);
    card.focus();
    await sendKeys({ press: 'Enter' });
    await waitUntil(() => card.open);
    expect(transitions).to.deep.equal([true]);
    await sendKeys({ press: 'Space' });
    await waitUntil(() => !card.open);
    expect(transitions).to.deep.equal([true, false]);
    await expect(card).to.be.accessible();
  });

  it('02: retains drafts and nested state and recovers focus before programmatic collapse', async () => {
    const card = await fixture(
      html`<owc-detail-card open>
        <span slot="heading">Contract</span><input aria-label="Draft" value="Unfinished" />
        <owc-detail-card
          ><span slot="heading">Coverage</span><button>Nested action</button></owc-detail-card
        >
      </owc-detail-card>`,
    );
    const changes = [];
    card.addEventListener('card-toggle', event => {
      if (event.target === card) {
        changes.push(event.detail.open);
      }
    });
    const nested = card.querySelector('owc-detail-card');
    nested.focus();
    await sendKeys({ press: 'Enter' });
    await waitUntil(() => nested.open);
    expect(card.open).to.equal(true);
    expect(changes).to.deep.equal([]);
    card.querySelector('input').focus();
    card.open = false;
    await card.updateComplete;
    await sendKeys({ press: 'Enter' });
    await waitUntil(() => card.open);
    expect(card.querySelector('input').value).to.equal('Unfinished');
    expect(nested.open).to.equal(true);
    expect(changes).to.deep.equal([false, true]);
  });

  it('03: renders static rows and updates disclosure availability as content changes', async () => {
    const host = await fixture(
      html`<div>
        <owc-detail-card> <span slot="heading">Static contract</span> </owc-detail-card
        ><button id="after">After</button>
      </div>`,
    );
    const card = host.querySelector('owc-detail-card');
    card.focus();
    await sendKeys({ press: 'Enter' });
    expect(card.open).to.equal(false);
    await sendKeys({ press: 'Tab' });
    expect(document.activeElement).to.equal(host.querySelector('#after'));
    const input = document.createElement('input');
    input.setAttribute('aria-label', 'Draft');
    card.append(input);
    await waitUntil(() => card.withBody);
    card.open = true;
    await card.updateComplete;
    input.remove();
    await waitUntil(() => !card.withBody);
    await card.updateComplete;
    expect(card.shadowRoot.querySelector('wa-details')).to.equal(null);
  });

  it('04: delegates expansion completion and exposes named panel groups', async () => {
    const card = await fixture(
      html`<owc-detail-card style="--wa-transition-normal: 60ms">
        <span slot="heading">Contract</span><label>Draft<input value="Unfinished" /></label>
      </owc-detail-card>`,
    );
    const notifications = [];
    card.addEventListener('card-toggle', () => notifications.push('state'));
    card.addEventListener('wa-after-show', () => notifications.push('expanded'));
    await card.show();
    expect(card.shadowRoot.querySelector('wa-details').open).to.equal(true);
    expect(notifications).to.deep.equal(['state', 'expanded']);
    const details = card.shadowRoot.querySelector('wa-details');
    expect(details.body.getAttribute('role')).to.equal('group');
    expect(details.body.getAttribute('aria-labelledby')).to.equal(details.header.id);
    expect(details.header.getAttribute('aria-controls')).to.equal(
      details.shadowRoot.querySelector('slot:not([name])').id,
    );
    await card.show();
    expect(notifications).to.deep.equal(['state', 'expanded']);
    await expect(card).to.be.accessible();
    card.querySelector('input').focus();
    card.open = false;
    await card.updateComplete;
    await sendKeys({ press: 'Tab' });
    expect(document.activeElement).not.to.equal(card.querySelector('input'));
  });
});
