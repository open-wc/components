import { expect, fixture, html, waitUntil } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
import '@open-wc/components/define/owc-detail-card.js';

describe('owc-detail-card structured summary', () => {
  it('01: owns two stacked text columns and retains native disclosure keyboard operation', async () => {
    const card = await fixture(html`
      <owc-detail-card accent-color="var(--wa-color-warning-fill-loud)">
        <span slot="icon" aria-hidden="true">▤</span>
        <span slot="heading">Savings plan</span>
        <span slot="description">Example provider</span>
        <span slot="value">€ 5.000</span>
        <span slot="value-description">monthly: € 150</span>
        <p>Contract details supplied by the application.</p>
      </owc-detail-card>
    `);
    const detail = card.shadowRoot.querySelector('wa-details');
    await detail.updateComplete;
    const heading = card.querySelector('[slot="heading"]').getBoundingClientRect();
    const description = card.querySelector('[slot="description"]').getBoundingClientRect();
    const value = card.querySelector('[slot="value"]').getBoundingClientRect();
    const valueDescription = card
      .querySelector('[slot="value-description"]')
      .getBoundingClientRect();
    expect(description.top).to.be.greaterThan(heading.top);
    expect(valueDescription.top).to.be.greaterThan(value.top);
    expect(value.left).to.be.greaterThan(heading.left);
    expect(card.withDetail).to.equal(true);
    const header = detail.shadowRoot.querySelector('[part="header"]');
    header.focus();
    await sendKeys({ press: 'Enter' });
    await waitUntil(() => card.open);
    await sendKeys({ press: 'Space' });
    await waitUntil(() => !card.open);
    await expect(card).to.be.accessible();
  });

  it('02: retains precedence of existing text/detail slots over the new default stacks', async () => {
    const card = await fixture(html`
      <owc-detail-card>
        <span slot="heading">Fallback heading</span>
        <span slot="value">Fallback value</span>
        <div slot="text">Custom summary markup</div>
        <div slot="detail">Custom value markup</div>
        Detail content
      </owc-detail-card>
    `);
    expect(card.querySelector('[slot="text"]').getBoundingClientRect().height).to.be.greaterThan(0);
    expect(card.querySelector('[slot="detail"]').getBoundingClientRect().height).to.be.greaterThan(
      0,
    );
    expect(card.querySelector('[slot="heading"]').getBoundingClientRect().height).to.equal(0);
    expect(card.querySelector('[slot="value"]').getBoundingClientRect().height).to.equal(0);
    card.querySelector('[slot="text"]').remove();
    card.querySelector('[slot="detail"]').remove();
    await waitUntil(
      () => card.querySelector('[slot="heading"]').getBoundingClientRect().height > 0,
    );
    expect(card.querySelector('[slot="value"]').getBoundingClientRect().height).to.be.greaterThan(
      0,
    );
  });

  it('03: updates value-column presence when values are added or removed', async () => {
    const card = await fixture(
      html`<owc-detail-card><span slot="heading">Summary</span>Body</owc-detail-card>`,
    );
    expect(card.withDetail).to.equal(false);
    const value = document.createElement('span');
    value.slot = 'value';
    value.textContent = '€ 5.000';
    card.append(value);
    await waitUntil(() => card.withDetail);
    value.remove();
    await waitUntil(() => !card.withDetail);
  });

  it('04: wraps long descriptions and values inside a narrow summary', async () => {
    const card = await fixture(html`
      <owc-detail-card style="width:240px">
        <span slot="heading">AnAccountTitleWithoutSpaces12345678901234567890</span>
        <span slot="description">AnAccountProviderWithoutSpaces12345678901234567890</span>
        <span slot="value">€ 5.000</span>
        <span slot="value-description">monthly: € 150</span>
        Detail content
      </owc-detail-card>
    `);
    expect(card.scrollWidth).to.be.at.most(card.clientWidth);
    expect(card.querySelector('[slot="heading"]').getBoundingClientRect().width).to.be.lessThan(
      240,
    );
  });
});
