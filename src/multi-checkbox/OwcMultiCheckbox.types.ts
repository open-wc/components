export interface Checkbox {
  value: string | number | boolean;
  label?: string; // default to value with first letter capitalized
  color?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral'; // default to 'brand'
}

export type OwcMultiCheckboxOptions = Array<Checkbox | Checkbox[]>;
