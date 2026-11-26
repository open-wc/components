import { expect, nextFrame, waitUntil } from '@open-wc/testing';
import { setViewport } from '@web/test-runner-commands';
import { category, chartFixture } from './doughnut.test-browser.helpers.js';

describe('doughnut annotations and available space', () => {
  it('moves a bottom amount clear of the ring when there is room beside it', async () => {
    const chart = await chartFixture([category('a', 1, '#3488a0', { amount: '€ 1.000,00' })]);
    await document.fonts.ready;
    await nextFrame();
    await nextFrame();
    const amount = chart.shadowRoot.querySelector('[part="amount"]');
    expect(getComputedStyle(amount).visibility).to.equal('visible');
    const canvas = chart.shadowRoot.querySelector('canvas').getBoundingClientRect();
    const box = amount.getBoundingClientRect();
    const nearestX = Math.max(box.left, Math.min(canvas.left + canvas.width / 2, box.right));
    const nearestY = Math.max(box.top, Math.min(canvas.top + canvas.height / 2, box.bottom));
    expect(
      Math.hypot(
        nearestX - canvas.left - canvas.width / 2,
        nearestY - canvas.top - canvas.height / 2,
      ),
    ).to.be.greaterThan(148);
    expect(
      getComputedStyle(chart.shadowRoot.querySelector('[part="leader-lines"]')).visibility,
    ).to.equal('visible');
    expect(chart.shadowRoot.querySelectorAll('button').length).to.equal(1);
    expect(chart.querySelector('strong').textContent).to.equal('1 units');
  });

  it('keeps exact amounts and their leaders attached throughout changing slice proportions', async () => {
    const prepare = values =>
      values.map((value, index) =>
        category(['books', 'travel', 'home'][index], value, '#3488a0', {
          amount: `€ ${(value / 100).toFixed(2)}`,
        }),
      );
    const chart = await chartFixture(prepare([2500, 2500, 5000]));
    chart.style.width = '480px';
    await waitUntil(() => chart.shadowRoot.querySelector('canvas').clientWidth === 480);
    await nextFrame();
    await nextFrame();
    const initial = chart.shadowRoot.querySelector('[part="amount"]').style.left;
    for (let step = 1; step <= 30; step += 1) {
      const values = [2500 + Math.round((3500 * step) / 30), 2500 + Math.round((500 * step) / 30)];
      values.push(10000 - values[0] - values[1]);
      chart.categories = prepare(values);
      await chart.updateComplete;
      await nextFrame();
      await chart.updateComplete;
      const labels = [...chart.shadowRoot.querySelectorAll('[part="amount"]')];
      expect(labels.every(label => getComputedStyle(label).visibility === 'visible')).to.equal(
        true,
      );
      expect(labels.map(label => label.textContent)).to.deep.equal(
        chart.categories.map(item => item.amount),
      );
      expect(
        getComputedStyle(chart.shadowRoot.querySelector('[part="leader-lines"]')).visibility,
      ).to.equal('visible');
    }
    expect(chart.shadowRoot.querySelector('[part="amount"]').style.left).not.to.equal(initial);
    const label = chart.shadowRoot.querySelector('[data-category-id="home"][part="amount"]');
    const points = chart.shadowRoot.querySelectorAll('polyline')[2].points;
    const elbow = points.getItem(1);
    const end = points.getItem(2);
    const x = (elbow.x + end.x) / 2;
    const y = (elbow.y + end.y) / 2;
    expect(
      x > label.offsetLeft &&
        x < label.offsetLeft + label.offsetWidth &&
        y > label.offsetTop &&
        y < label.offsetTop + label.offsetHeight,
      'the leader must not strike through the top amount',
    ).to.equal(false);
  });

  it('relocates large exact center content below the ring without truncation', async () => {
    const chart = await chartFixture([category('a', 1), category('b', 3, '#0000ff')]);
    const center = chart.querySelector('strong');
    center.style.fontSize = '32px';
    center.textContent = '€ 123.456.789.012.345,67';
    await waitUntil(
      () =>
        center.getBoundingClientRect().top >=
        chart.shadowRoot.querySelector('canvas').getBoundingClientRect().top + 300,
    );
    expect(chart.scrollWidth).to.be.at.most(chart.clientWidth);
    expect(center.scrollWidth).to.be.at.most(center.clientWidth);
    expect(center.textContent).to.equal('€ 123.456.789.012.345,67');
  });

  it('shows exact outer amounts and leader lines when they fit and omits the set on collision', async () => {
    const chart = await chartFixture([category('a', 1), category('b', 3, '#0000ff')]);
    chart.style.width = '390px';
    await waitUntil(() =>
      [...chart.shadowRoot.querySelectorAll('[part="amount"]')].some(
        label => getComputedStyle(label).visibility === 'visible',
      ),
    );
    expect(
      chart.shadowRoot.querySelector('[part="leader-lines"]').querySelectorAll('polyline').length,
    ).to.equal(2);
    chart.categories = Array.from({ length: 20 }, (_, i) => category(`id-${i}`, 1));
    chart.style.width = '320px';
    await waitUntil(() =>
      [...chart.shadowRoot.querySelectorAll('[part="amount"]')].every(
        label => getComputedStyle(label).visibility === 'hidden',
      ),
    );
    expect(chart.shadowRoot.querySelector('ul, ol, table')).to.equal(null);
  });

  it('keeps a supplied icon only when its full square fits its true slice', async () => {
    const icon =
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="16" height="16"%3E%3Ccircle cx="8" cy="8" r="5" fill="white"/%3E%3C/svg%3E';
    const chart = await chartFixture([
      category('tiny', 1, '#800000', { icon }),
      category('large', 999999, '#000080', { icon }),
    ]);
    expect(chart.shadowRoot.querySelectorAll('img').length).to.equal(1);
    expect(chart.shadowRoot.querySelector('img').alt).to.equal('');
    expect(chart.shadowRoot.querySelectorAll('button').length).to.equal(2);
  });

  for (const width of [320, 390, 1280]) {
    it(`fits long German text and an exact large amount at ${width}px`, async () => {
      await setViewport({ width: width + 32, height: 800 });
      const chart = await chartFixture([category('a', 1), category('b', 3, '#0000ff')]);
      chart.style.width = `${width}px`;
      const heading = chart.querySelector('h2');
      heading.textContent = 'Versicherungsprämien und langfristige Vermögensverteilung';
      const center = chart.querySelector('strong');
      center.style.fontSize = '32px';
      center.textContent = '€ 123.456.789.012.345,67';
      await waitUntil(
        () =>
          center.getBoundingClientRect().top >
          chart.shadowRoot.querySelector('canvas').getBoundingClientRect().top + 300,
      );
      expect(chart.scrollWidth).to.be.at.most(width);
      expect(center.scrollWidth).to.be.at.most(center.clientWidth);
      expect(heading.scrollWidth).to.be.at.most(width);
      await setViewport({ width: 800, height: 600 });
    });
  }
});
