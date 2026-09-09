import { css } from 'lit';

export const invalidStyles = [
  css`
    /* User invalid styles */
    wa-input.invalid::part(input),
    wa-select.invalid::part(combobox),
    wa-checkbox.invalid::part(control) {
      border-color: var(--wa-color-danger-50);
    }

    .invalid::part(form-control-label),
    .invalid::part(label),
    .error,
    wa-checkbox.invalid::part(label) {
      color: var(--wa-color-danger-40);
    }

    wa-checkbox.invalid::part(control) {
      outline: none;
    }

    wa-input:focus-within.invalid::part(input),
    wa-select:focus-within.invalid::part(combobox),
    wa-checkbox:focus-within.invalid::part(control) {
      border-color: var(--wa-color-danger-50);
      box-shadow: 0 0 0 var(--wa-focus-ring-width) var(--wa-color-danger-80);
    }
  `,
];
