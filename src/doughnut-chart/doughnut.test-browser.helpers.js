import { fixture, html, waitUntil } from '@open-wc/testing';
import '@open-wc/components/define/owc-doughnut-chart.js';

/**
 * @param {string} id
 * @param {number} value
 * @param {string} [color]
 * @param {Partial<import('@open-wc/components/OwcDoughnutChart.types.js').OwcDoughnutChartCategory>} [extra]
 */
export const category = (id, value, color = '#ff0000', extra = {}) => ({
  id,
  label: id,
  value,
  amount: `${value} units`,
  color,
  actionable: true,
  ...extra,
});

/**
 * @param {readonly import('@open-wc/components/OwcDoughnutChart.types.js').OwcDoughnutChartCategory[]} categories
 * @param {string} [center]
 */
export async function chartFixture(
  categories,
  center = `${categories.reduce((sum, category) => sum + category.value, 0)} units`,
) {
  const chart = await fixture(
    html`<owc-doughnut-chart
      style="width: 320px"
      context="units per month"
      .categories=${categories}
    >
      <h2 slot="heading">Distribution</h2>
      <strong>${center}</strong>
    </owc-doughnut-chart>`,
  );
  await waitUntil(() => chart.getBoundingClientRect().height > 50, 'Chart did not render', {
    timeout: 5000,
  });
  return chart;
}

/** @param {HTMLElement} chart @param {number} x @param {number} y */
export function pixel(chart, x, y) {
  const canvas = /** @type {HTMLCanvasElement} */ (chart.shadowRoot?.querySelector('canvas'));
  const context = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  return [...context.getImageData(x * canvas.width, y * canvas.height, 1, 1).data];
}
