import { expect, waitUntil } from '@open-wc/testing';
import { category, chartFixture, pixel } from './doughnut.test-browser.helpers.js';

describe('doughnut prepared data states', function () {
  this.timeout(10000);

  it('shows an explicit empty state and hides the supplied center when no categories exist', async () => {
    const chart = await chartFixture([], 'Stale total');
    expect(chart.shadowRoot.textContent).to.include('Keine Daten');
    expect(chart.shadowRoot.querySelector('canvas, button')).to.equal(null);
    expect(chart.querySelector('strong').getBoundingClientRect().height).to.equal(0);
  });

  it('distinguishes genuine zero with a neutral ring, supplied zero total and no actions', async () => {
    const chart = await chartFixture([category('a', 0), category('b', 0)]);
    expect(pixel(chart, 0.8, 0.2)).to.deep.equal([217, 217, 217, 255]);
    expect(pixel(chart, 0.5, 0.17)[3]).to.equal(0);
    expect(chart.querySelector('strong').textContent).to.equal('0 units');
    expect(chart.shadowRoot.querySelectorAll('button').length).to.equal(0);
  });

  for (const [name, categories] of [
    ['negative', [category('a', -1)]],
    ['NaN', [category('a', NaN)]],
    ['infinite value', [category('a', Infinity)]],
    ['overflowing sum', [category('a', Number.MAX_VALUE), category('b', Number.MAX_VALUE)]],
    ['duplicate IDs', [category('a', 1), category('a', 1)]],
    ['missing ID', [category('', 1)]],
    ['missing label', [category('a', 1, 'red', { label: '' })]],
    ['missing amount', [category('a', 1, 'red', { amount: '' })]],
    ['invalid color', [category('a', 1, 'not-a-color')]],
  ]) {
    it(`makes ${name} unavailable instead of drawing a misleading breakdown`, async () => {
      const chart = await chartFixture(categories, 'Stale total');
      expect(chart.shadowRoot.textContent).to.include('Nicht verfügbar');
      expect(chart.shadowRoot.querySelector('canvas, button')).to.equal(null);
      expect(chart.querySelector('strong').getBoundingClientRect().height).to.equal(0);
    });
  }

  for (const values of [
    [100, 300],
    [0.25, 0.75],
    [0.1, 0.3],
  ]) {
    it(`derives the same quarter-ring proportions from ${values.join(' and ')}`, async () => {
      const chart = await chartFixture(
        [category('a', values[0]), category('b', values[1], '#0000ff')],
        'Custom summary',
      );
      expect(pixel(chart, 0.78, 0.22)).to.deep.equal([255, 0, 0, 255]);
      expect(pixel(chart, 0.78, 0.78)).to.deep.equal([0, 0, 255, 255]);
      expect(pixel(chart, 0.22, 0.22)).to.deep.equal([0, 0, 255, 255]);
      expect(chart.querySelector('strong').textContent).to.equal('Custom summary');
    });
  }

  it('recalculates proportions when the category sum changes without altering center content', async () => {
    const chart = await chartFixture([category('a', 1), category('b', 3, '#0000ff')], 'Summary');
    expect(pixel(chart, 0.78, 0.78)).to.deep.equal([0, 0, 255, 255]);
    chart.categories = [category('a', 1), category('b', 1, '#0000ff')];
    await waitUntil(() => pixel(chart, 0.78, 0.78)[0] === 255);
    expect(pixel(chart, 0.22, 0.78)).to.deep.equal([0, 0, 255, 255]);
    expect(chart.querySelector('strong').textContent).to.equal('Summary');
  });

  it('fills the ring with one positive category while keeping genuine zero categories out of tab order', async () => {
    const chart = await chartFixture([category('zero', 0), category('full', 7)]);
    for (const [x, y] of [
      [0.8, 0.2],
      [0.8, 0.8],
      [0.2, 0.2],
      [0.2, 0.8],
    ]) {
      expect(pixel(chart, x, y)).to.deep.equal([255, 0, 0, 255]);
    }
    expect(chart.shadowRoot.querySelectorAll('button').length).to.equal(1);
    expect(chart.shadowRoot.querySelector('button').getAttribute('aria-label')).to.include('full:');
  });

  it('preserves twenty equal slices in supplied order, independently of duplicate labels', async () => {
    const colors = ['#ff0000', '#0000ff'];
    const data = Array.from({ length: 20 }, (_, i) =>
      category(`id-${i}`, 1, colors[i % 2], { label: 'Same label' }),
    );
    const chart = await chartFixture(data);
    expect(chart.shadowRoot.querySelectorAll('button').length).to.equal(20);
    for (let i = 0; i < 20; i++) {
      // Twenty equal shares have midpoints at 9°, 27°, … clockwise from twelve o'clock.
      const angle = ((9 + i * 18) * Math.PI) / 180;
      expect(
        pixel(chart, 0.5 + 0.39 * Math.sin(angle), 0.5 - 0.39 * Math.cos(angle)),
      ).to.deep.equal(i % 2 ? [0, 0, 255, 255] : [255, 0, 0, 255]);
    }
  });

  it('keeps a one-cent slice keyboard reachable without inflating its angle', async () => {
    const chart = await chartFixture([category('cent', 1), category('large', 999999, '#0000ff')]);
    expect(chart.shadowRoot.querySelectorAll('button').length).to.equal(2);
    // A point 0.1° clockwise from the top is already in the large category.
    const angle = (0.1 * Math.PI) / 180;
    expect(pixel(chart, 0.5 + 0.4 * Math.sin(angle), 0.5 - 0.4 * Math.cos(angle))).to.deep.equal([
      0, 0, 255, 255,
    ]);
  });

  it('can render again when an empty dataset becomes valid without recreating the component', async () => {
    const chart = await chartFixture([]);
    chart.categories = [category('a', 1)];
    await waitUntil(
      () => chart.shadowRoot.querySelector('canvas')?.getBoundingClientRect().height > 0,
    );
    await waitUntil(() => pixel(chart, 0.8, 0.2)[0] === 255);
  });

  it('keeps positive shares keyboard reachable even below floating-point angle precision', async () => {
    const chart = await chartFixture([category('large', 1e100), category('tiny', 1e-100)]);
    const buttons = [...chart.shadowRoot.querySelectorAll('button')];
    expect(buttons.map(button => button.dataset.categoryId)).to.deep.equal(['large', 'tiny']);
    buttons[1].focus();
    expect(chart.shadowRoot.activeElement).to.equal(buttons[1]);
  });
});
