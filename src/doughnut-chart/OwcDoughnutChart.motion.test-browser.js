import { expect, nextFrame, waitUntil } from '@open-wc/testing';
import { category, chartFixture, pixel } from './doughnut.test-browser.helpers.js';

const data = share => [category('a', share), category('b', 100 - share, '#0000ff')];
const path = chart => chart.shadowRoot.querySelector('button').style.clipPath;
const motion = matchMedia('(prefers-reduced-motion: no-preference)').matches;
const withMotion = motion ? it : it.skip;

describe('automatic doughnut value transitions', () => {
  withMotion('eases through intermediate geometry to the exact destination', async () => {
    const chart = await chartFixture(data(25));
    const destination = await chartFixture(data(75));
    const initial = path(chart);
    const target = path(destination);
    chart.categories = data(75);
    await chart.updateComplete;
    expect(path(chart)).to.equal(initial);
    expect(chart.shadowRoot.querySelector('[part="amount"]').textContent).to.equal('75 units');
    await waitUntil(() => path(chart) !== initial);
    expect(path(chart)).not.to.equal(target);
    await waitUntil(() => path(chart) === target);
    await nextFrame();
    expect(pixel(chart, 0.78, 0.78)).to.deep.equal([255, 0, 0, 255]);
    expect(chart.querySelector('strong').textContent).to.equal('100 units');
  });

  withMotion('retargets from the current position and preserves focus', async () => {
    const chart = await chartFixture(data(25));
    const destination = await chartFixture(data(10));
    const button = chart.shadowRoot.querySelector('button');
    button.focus();
    const initial = path(chart);
    chart.categories = data(75);
    await waitUntil(() => path(chart) !== initial);
    const intermediate = path(chart);
    chart.categories = data(10);
    await chart.updateComplete;
    expect(path(chart)).to.equal(intermediate);
    expect(chart.shadowRoot.activeElement).to.equal(button);
    await waitUntil(() => path(chart) === path(destination));
  });

  withMotion('shrinks a share to zero and grows it back with the same category IDs', async () => {
    const chart = await chartFixture(data(25));
    const initial = path(chart);
    chart.categories = data(0);
    await chart.updateComplete;
    expect(path(chart)).to.equal(initial);
    await waitUntil(() => chart.shadowRoot.querySelectorAll('button').length === 1);
    chart.categories = data(25);
    await chart.updateComplete;
    expect(chart.shadowRoot.querySelectorAll('button')).to.have.length(2);
    expect(path(chart)).not.to.equal(initial);
    await waitUntil(() => path(chart) === initial);
  });

  withMotion('cancels motion on disconnect and reconnects at the latest values', async () => {
    const chart = await chartFixture(data(25));
    const destination = await chartFixture(data(75));
    const parent = chart.parentElement;
    chart.categories = data(75);
    await nextFrame();
    chart.remove();
    await chart.updateComplete;
    parent.append(chart);
    await waitUntil(() => chart.shadowRoot.querySelector('button'));
    await waitUntil(() => chart.getBoundingClientRect().height > 50);
    expect(path(chart)).to.equal(path(destination));
  });

  it('applies structural changes and known-zero states immediately', async () => {
    const chart = await chartFixture(data(25));
    chart.categories = [category('replacement', 100)];
    await chart.updateComplete;
    expect(chart.shadowRoot.querySelectorAll('button')).to.have.length(1);
    expect(chart.shadowRoot.querySelector('button').dataset.categoryId).to.equal('replacement');
    chart.categories = [category('replacement', 0)];
    await chart.updateComplete;
    expect(chart.shadowRoot.querySelector('button')).to.equal(null);
    expect(chart.shadowRoot.querySelector('.neutral')).not.to.equal(null);
  });

  (motion ? it.skip : it)('uses destination geometry immediately with reduced motion', async () => {
    const chart = await chartFixture(data(25));
    const destination = await chartFixture(data(75));
    chart.categories = data(75);
    await chart.updateComplete;
    expect(path(chart)).to.equal(path(destination));
  });
});
