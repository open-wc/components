import { expect, waitUntil } from '@open-wc/testing';
import { sendKeys, sendMouse } from '@web/test-runner-commands';
import { category, chartFixture, pixel } from './doughnut.test-browser.helpers.js';

describe('doughnut focus and activation', () => {
  it('preserves focus by ID on reorder and moves it to the supplied heading on removal', async () => {
    const a = category('a', 1, '#800000', { label: 'Same' });
    const b = category('b', 3, '#000080', { label: 'Same' });
    const chart = await chartFixture([a, b]);
    const buttons = chart.shadowRoot.querySelectorAll('button');
    buttons[1].focus();
    chart.categories = [{ ...b, label: 'Renamed', amount: 'Three' }, a];
    await chart.updateComplete;
    expect(chart.shadowRoot.activeElement?.getAttribute('aria-label')).to.include('Renamed: Three');
    chart.categories = [a];
    await chart.updateComplete;
    await waitUntil(() => chart.getRootNode().activeElement === chart.querySelector('h2'));
    expect(chart.querySelector('h2').matches(':focus')).to.equal(true);
  });

  it('visits each available positive category once in either tab direction and activates a tiny share', async () => {
    const chart = await chartFixture([
      category('zero', 0),
      category('unavailable', 3, '#008000', { actionable: false }),
      category('tiny', 1, '#800000', { label: 'Same' }),
      category('large', 999996, '#000080', { label: 'Same' }),
    ]);
    const before = document.createElement('button');
    chart.before(before);
    before.focus();
    const ids = [];
    chart.addEventListener('category-activate', event => ids.push(event.detail.categoryId));
    await sendKeys({ press: 'Tab' });
    expect(chart.shadowRoot.activeElement?.getAttribute('aria-label')).to.include('1 units');
    await sendKeys({ press: 'Enter' });
    await sendKeys({ press: 'Space' });
    await sendKeys({ press: 'Tab' });
    expect(chart.shadowRoot.activeElement?.getAttribute('aria-label')).to.include('999996 units');
    await sendKeys({ press: 'Shift+Tab' });
    expect(chart.shadowRoot.activeElement?.getAttribute('aria-label')).to.include('1 units');
    await sendKeys({ press: 'Shift+Tab' });
    expect(document.activeElement).to.equal(before);
    expect(ids).to.deep.equal(['tiny', 'tiny']);
    before.remove();
  });

  it('highlights the drawn slice for hover and keyboard focus without changing the center', async () => {
    const chart = await chartFixture([category('a', 1, '#800000'), category('b', 3, '#000080')]);
    const original = pixel(chart, 0.78, 0.22);
    const rect = chart.shadowRoot.querySelector('canvas').getBoundingClientRect();
    await sendMouse({
      type: 'move',
      position: [
        Math.round(rect.left + rect.width * 0.78),
        Math.round(rect.top + rect.height * 0.22),
      ],
    });
    await waitUntil(() => pixel(chart, 0.78, 0.22)[0] !== original[0]);
    await sendMouse({ type: 'move', position: [0, 0] });
    await waitUntil(() => pixel(chart, 0.78, 0.22)[0] === original[0]);
    const before = document.createElement('button');
    chart.before(before);
    before.focus();
    await sendKeys({ press: 'Tab' });
    await waitUntil(() => pixel(chart, 0.78, 0.22)[0] !== original[0]);
    expect(pixel(chart, 0.22, 0.78)).to.deep.equal([0, 0, 128, 255]);
    expect(chart.querySelector('strong').textContent).to.equal('4 units');
    expect(chart.categories.map(category => category.value)).to.deep.equal([1, 3]);
    before.remove();
  });

  it('does not reclaim focus or activate a category when data updates elsewhere', async () => {
    const chart = await chartFixture([category('a', 1)]);
    const outside = document.createElement('button');
    chart.after(outside);
    let actions = 0;
    chart.addEventListener('category-activate', () => {
      actions += 1;
    });
    outside.focus();
    chart.categories = [category('b', 2)];
    await chart.updateComplete;
    expect(document.activeElement).to.equal(outside);
    expect(actions).to.equal(0);
    outside.remove();
  });
});
