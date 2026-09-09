export interface Checkbox {
  value: string | number | boolean;
  label?: string; // defaults to the value
  color?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral'; // default to 'brand'
}

export type OwcMultiCheckboxOptions = Array<Checkbox | Checkbox[]>;
