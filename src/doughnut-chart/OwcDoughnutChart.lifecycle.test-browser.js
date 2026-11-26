import { expect, fixture, html, waitUntil } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
import { category, chartFixture } from './doughnut.test-browser.helpers.js';

describe('independent public chart lifecycles', () => {
  it('keeps activation and failure isolated when category IDs are reused', async () => {
    const categories = [category('shared', 100, '#ff0000', { actionable: true })];
    const first = await chartFixture(categories);
    const second = await chartFixture(categories);
    const activations = [];
    first.addEventListener('category-activate', () => activations.push('first'));
    second.addEventListener('category-activate', () => activations.push('second'));
    second.shadowRoot.querySelector('button').focus();
    await sendKeys({ press: 'Enter' });
    expect(activations).to.deep.equal(['second']);
    const context = first.shadowRoot.querySelector('canvas').getContext('2d');
    context.drawElementImage = () => {
      throw new Error('Instance drawing failure');
    };
    first.shadowRoot.querySelector('canvas').requestPaint();
    await waitUntil(() => first.getBoundingClientRect().height === 0);
    expect(first.shadowRoot.querySelector('button, canvas, slot')).to.equal(null);
    expect(second.getBoundingClientRect().height).to.be.greaterThan(100);
    expect(second.shadowRoot.activeElement).to.equal(second.shadowRoot.querySelector('button'));
    await sendKeys({ press: 'Space' });
    expect(activations).to.deep.equal(['second', 'second']);
  });

  it('does not initialize removed charts and can reconnect without stealing outside focus', async () => {
    const host = await fixture(html`<div><button>Outside</button></div>`);
    const chart = document.createElement('owc-doughnut-chart');
    chart.categories = [category('one', 100, '#ff0000', { actionable: true })];
    chart.innerHTML = '<h2 slot="heading">Reconnect</h2><strong>100 units</strong>';
    host.append(chart);
    chart.remove();
    await chart.updateComplete;
    await new Promise(resolve => requestAnimationFrame(resolve));
    expect(chart.shadowRoot.querySelector('button, canvas')).to.equal(null);
    host.append(chart);
    host.querySelector('button').focus();
    await waitUntil(() => chart.getBoundingClientRect().height > 100);
    expect(document.activeElement).to.equal(host.querySelector('button'));
    expect(chart.shadowRoot.querySelectorAll('button')).to.have.length(1);
  });
});
