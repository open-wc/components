import { LitElement, html, css } from 'lit';
import { OwcDoughnutChart } from '@open-wc/components/OwcDoughnutChart.js';
import '@open-wc/components/define/owc-doughnut-chart.js';

const categories = [
  { id: 'books', label: 'Books', value: 25, amount: '25 items', color: '#3488a0', actionable: true },
  { id: 'travel', label: 'Travel', value: 50, amount: '50 items', color: '#d88b44', actionable: true },
  { id: 'home', label: 'Home', value: 25, amount: '25 items', color: '#9772b5', actionable: true },
];

class ChartConsumer extends LitElement {
  static styles = css`
    :host { font-family: Outfit, sans-serif; color: #4b4c4f; }
    main { max-width: 70rem; margin: auto; padding: 16px; }
    .examples { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr)); gap: 24px; }
    h1 { font-size: 24px; }
  `;
  render() {
    return html`<main>
      <h1>Installed package under an external theme</h1>
      <button id="outside">Outside focus</button>
      <div class="examples">
        ${[1, 2, 3].map(index => html`
          <owc-doughnut-chart
            .categories=${categories}
            context="items"
            @category-activate=${event => {
              this.renderRoot.querySelector('[role="status"]').textContent =
                `Activated: ${event.detail.categoryId}`;
            }}
          >
            <h2 slot="heading">Categories ${index}</h2>
            <strong>100 items</strong>
            <span>Consumer-owned summary</span>
          </owc-doughnut-chart>
        `)}
      </div>
      <p role="status">Activate a category.</p>
    </main>`;
  }
}
customElements.define('chart-consumer', ChartConsumer);
globalThis.installedChartClass = OwcDoughnutChart;
