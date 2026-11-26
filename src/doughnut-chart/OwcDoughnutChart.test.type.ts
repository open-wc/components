import { OwcDoughnutChart } from '@open-wc/components/OwcDoughnutChart.js';
import type {
  OwcDoughnutChartActivation,
  OwcDoughnutChartCategory,
} from '@open-wc/components/OwcDoughnutChart.types.js';

const category: OwcDoughnutChartCategory = {
  id: 'books',
  label: 'Books',
  value: 100,
  amount: '€ 1,00',
  color: '#3488a0',
  actionable: true,
};

const chart = new OwcDoughnutChart();
chart.categories = [category];
// @ts-expect-error The denominator is derived from categories; total is not a public property.
chart.total = 100;

const activation: OwcDoughnutChartActivation = { categoryId: category.id };
void activation;
