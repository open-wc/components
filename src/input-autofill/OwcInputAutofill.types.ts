// A type alias (not an interface) so it satisfies OwcAutocomplete's
// Record<string, unknown> constraint via its implicit index signature.
export type OwcInputAutofillOption = {
  value: string; // written into the input when the option is picked
  label: string; // shown in the dropdown list
  fill?: Record<string, unknown>; // optional atomic JSON Form update
};

export type OwcInputAutofillData = OwcInputAutofillOption[];
