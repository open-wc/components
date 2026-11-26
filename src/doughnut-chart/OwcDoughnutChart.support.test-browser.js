import { expect, fixture, html, waitUntil } from '@open-wc/testing';
import '@open-wc/components/define/owc-doughnut-chart.js';

const scenario = globalThis.chartSupportScenario;

(scenario ? describe : describe.skip)('automatic chart support through the browser loader', () => {
  it('shares support for concurrent charts or completely hides refused/rejected output', async () => {
    const categories = [
      { id: 'one', label: 'One', value: 100, amount: '100 EUR', color: 'red', actionable: true },
    ];
    const host = await fixture(
      html`<div>
        ${[1, 2, 3].map(
          index =>
            html`<owc-doughnut-chart .categories=${categories}>
              <h2 slot="heading">Chart ${index}</h2>
              <strong>100 EUR</strong>
            </owc-doughnut-chart>`,
        )}
      </div>`,
    );
    const charts = [...host.querySelectorAll('owc-doughnut-chart')];
    charts[0].remove();
    if (scenario === 'refused' || scenario === 'rejected') {
      await waitUntil(() =>
        performance
          .getEntriesByType('resource')
          .some(entry => entry.name.includes('html-in-canvas-polyfill/dist/esm/loader.js')),
      );
      // Allow the module rejection/refusal and Lit update to settle before checking the absence.
      await new Promise(resolve => setTimeout(resolve, 100));
      for (const chart of charts) {
        expect(chart.getBoundingClientRect().height).to.equal(0);
        expect(chart.shadowRoot.querySelector('canvas, button, slot, [drawable]')).to.equal(null);
      }
    } else {
      await waitUntil(
        () => charts.slice(1).every(chart => chart.getBoundingClientRect().height > 100),
        'Both charts render',
        { timeout: 10000 },
      );
      expect(charts[0].shadowRoot.querySelector('canvas, button')).to.equal(null);
      const requests = performance
        .getEntriesByType('resource')
        .filter(entry => entry.name.includes('loader-core-'));
      if (scenario === 'polyfill') {
        expect(requests).to.have.length(1);
      }
    }
  });
});
