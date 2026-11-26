/** One prepared category, in the consumer's display order. */
export type OwcDoughnutChartCategory = {
  id: string;
  label: string;
  /** Nonnegative finite weight; slice size is this value divided by the sum of all values. */
  value: number;
  /** Exact, consumer-formatted amount. */
  amount: string;
  color: string;
  /** Optional consumer-owned decorative image URL. */
  icon?: string;
  /** True only when the consumer can handle this category's details action. */
  actionable?: boolean;
};

/** Detail of the bubbling, composed category-activate event. */
export type OwcDoughnutChartActivation = { categoryId: string };
