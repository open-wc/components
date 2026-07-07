export interface OwcInputAutofillOption {
  value: string; // written into the input when the option is picked
  label: string; // shown in the dropdown list
}

export type OwcInputAutofillData = OwcInputAutofillOption[];
