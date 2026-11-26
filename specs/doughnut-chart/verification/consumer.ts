import { OwcDoughnutChart } from '@open-wc/components/OwcDoughnutChart.js';
import type { OwcDoughnutChartCategory, OwcDoughnutChartActivation } from '@open-wc/components/OwcDoughnutChart.types.js';
import '@open-wc/components/define/owc-doughnut-chart.js';
const category: OwcDoughnutChartCategory = { id: 'one', label: 'One', value: 1, amount: '€ 0,01', color: 'blue', actionable: true };
const chart = new OwcDoughnutChart();
chart.categories = [category];
const activation: OwcDoughnutChartActivation = { categoryId: category.id };
export { chart, activation };
