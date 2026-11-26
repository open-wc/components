import { expect, fixture, html, nextFrame, waitUntil } from '@open-wc/testing';
import { sendKeys, sendMouse } from '@web/test-runner-commands';
import { OwcDoughnutChart } from '@open-wc/components/OwcDoughnutChart.js';
import '@open-wc/components/define/owc-doughnut-chart.js';

const categories = [
  { id: 'books', label: 'Books', value: 100, amount: '€ 1,00', color: '#ff0000', actionable: true },
  {
    id: 'travel',
    label: 'Travel',
    value: 300,
    amount: '€ 3,00',
    color: '#0000ff',
    actionable: true,
  },
];

async function chartFixture() {
  const chart = await fixture(
    html`<owc-doughnut-chart style="width: 320px" context="EUR per month" .categories=${categories}>
      <h2 slot="heading">Monthly budget</h2>
      <strong style="font-size: 24px">€ 4,00</strong>
      <span>Planned spending</span>
      <span>EUR per month</span>
      <p slot="caption">Prepared monthly amounts</p>
    </owc-doughnut-chart>`,
  );
  await waitUntil(() => chart.getBoundingClientRect().height > 100, 'Chart did not render', {
    timeout: 5000,
  });
  return chart;
}

describe('public doughnut chart', () => {
  it('renders the supplied quarter and three-quarter ring clockwise with an exact center total', async () => {
    const chart = await chartFixture();
    expect(chart).to.be.instanceOf(OwcDoughnutChart);
    const canvas = chart.shadowRoot.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    // Independent pixel samples: first quarter is the upper right; the hole is 75% of the radius.
    const pixel = (x, y) => [...ctx.getImageData(x * canvas.width, y * canvas.height, 1, 1).data];
    expect(pixel(0.78, 0.22)).to.deep.equal([255, 0, 0, 255]);
    expect(pixel(0.78, 0.78)).to.deep.equal([0, 0, 255, 255]);
    expect(pixel(0.22, 0.22)).to.deep.equal([0, 0, 255, 255]);
    expect(pixel(0.5, 0.17)[3]).to.equal(0);
    expect(pixel(0.51, 0.15)).to.deep.equal([255, 0, 0, 255]);
    expect(chart.textContent).to.include('Monthly budget');
    expect(chart.textContent).to.include('€ 4,00');
    expect(chart.textContent).to.include('Planned spending');
    expect(chart.textContent).to.include('EUR per month');
    expect(chart.querySelector('[slot="caption"]').getBoundingClientRect().top).to.be.at.least(
      canvas.getBoundingClientRect().bottom,
    );
  });

  it('activates the drawn category by pointer, Enter and Space without changing the total', async () => {
    const chart = await chartFixture();
    const activations = [];
    chart.addEventListener('category-activate', event => activations.push(event.detail.categoryId));
    const canvas = chart.shadowRoot.querySelector('canvas');
    const rect = canvas.getBoundingClientRect();
    await sendMouse({
      type: 'click',
      position: [
        Math.round(rect.left + rect.width * 0.75),
        Math.round(rect.top + rect.height * 0.25),
      ],
    });
    expect(activations).to.deep.equal(['books']);

    const before = document.createElement('button');
    before.textContent = 'Before chart';
    chart.before(before);
    before.focus();
    await sendKeys({ press: 'Tab' });
    expect(chart.shadowRoot.activeElement?.getAttribute('aria-label')).to.equal(
      'Books: € 1,00; EUR per month',
    );
    await sendKeys({ press: 'Enter' });
    await sendKeys({ press: 'Space' });
    await sendKeys({ press: 'Tab' });
    expect(chart.shadowRoot.activeElement?.getAttribute('aria-label')).to.equal(
      'Travel: € 3,00; EUR per month',
    );
    await sendKeys({ press: 'Enter' });
    await sendKeys({ press: 'Space' });
    expect(activations).to.deep.equal(['books', 'books', 'books', 'travel', 'travel']);
    expect(chart.categories).to.deep.equal(categories);
    expect(chart.querySelector('strong').textContent).to.equal('€ 4,00');
    before.remove();
  });

  it('exposes category amounts and context through native chart semantics without a substitute list', async () => {
    const chart = await chartFixture();
    const canvas = chart.shadowRoot.querySelector('canvas');
    expect(canvas.getAttribute('aria-hidden')).not.to.equal('true');
    const buttons = [...canvas.querySelectorAll('button')];
    expect(buttons.map(button => button.getAttribute('aria-label'))).to.deep.equal([
      'Books: € 1,00; EUR per month',
      'Travel: € 3,00; EUR per month',
    ]);
    expect(buttons.every(button => !button.closest('[aria-hidden="true"]'))).to.equal(true);
    expect(chart.shadowRoot.querySelector('ul, ol, table')).to.equal(null);
    expect(canvas.getAttribute('aria-labelledby')).to.equal(
      chart.shadowRoot.querySelector('slot[name="heading"]').parentElement.id,
    );
  });

  it('removes all output and layout space when drawing throws', async () => {
    const chart = await chartFixture();
    const ctx = chart.shadowRoot.querySelector('canvas').getContext('2d');
    const draw = ctx.drawElementImage;
    ctx.drawElementImage = () => {
      throw new Error('Unavailable renderer');
    };
    try {
      chart.categories = [...categories];
      await chart.updateComplete;
      chart.shadowRoot.querySelector('canvas').requestPaint();
      await waitUntil(() => !chart.shadowRoot.querySelector('canvas'));
      expect(chart.getBoundingClientRect().height).to.equal(0);
      expect(chart.shadowRoot.querySelector('button, h2, [drawable]')).to.equal(null);
      expect(chart.shadowRoot.textContent).not.to.include('€ 4,00');
    } finally {
      ctx.drawElementImage = draw;
    }
  });

  it('lets users select the center amount with a pointer', async () => {
    const chart = await chartFixture();
    const rect = chart.querySelector('strong').getBoundingClientRect();
    const x = Math.round(rect.left + rect.width / 2);
    const y = Math.round(rect.top + rect.height / 2);
    await sendMouse({ type: 'move', position: [x - 45, y] });
    await sendMouse({ type: 'down' });
    await sendMouse({ type: 'move', position: [x + 45, y] });
    await sendMouse({ type: 'up' });
    expect(window.getSelection().toString()).to.include('4,00');
    window.getSelection().removeAllRanges();
  });

  it('lets users select outer amounts without activating a slice or blocking ring clicks', async () => {
    const chart = await chartFixture();
    chart.style.width = '480px';
    await waitUntil(
      () =>
        chart.shadowRoot.querySelector('[drawable]').clientWidth === 480 &&
        [...chart.shadowRoot.querySelectorAll('[part="amount"]')].every(
          label => getComputedStyle(label).visibility === 'visible',
        ),
    );
    await nextFrame();
    const activations = [];
    chart.addEventListener('category-activate', event => activations.push(event.detail.categoryId));
    try {
      for (const label of chart.shadowRoot.querySelectorAll('[part="amount"]')) {
        window.getSelection().removeAllRanges();
        const rect = label.getBoundingClientRect();
        const y = Math.round(rect.top + rect.height / 2);
        await sendMouse({ type: 'move', position: [Math.round(rect.left + 1), y] });
        await sendMouse({ type: 'down' });
        await sendMouse({ type: 'move', position: [Math.round(rect.right - 1), y] });
        await sendMouse({ type: 'up' });
        expect(window.getSelection().toString()).to.equal(label.textContent);
        expect(activations).to.deep.equal([]);
      }
      window.getSelection().removeAllRanges();
      const canvas = chart.shadowRoot.querySelector('canvas').getBoundingClientRect();
      await sendMouse({
        type: 'click',
        position: [Math.round(canvas.left + canvas.width / 2 + 89), Math.round(canvas.top + 70)],
      });
      expect(activations).to.deep.equal(['books']);
    } finally {
      window.getSelection().removeAllRanges();
    }
  });
});
