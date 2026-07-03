import { html } from 'lit';
import '@open-wc/components/define/owc-multi-checkbox.js';

export function demo() {
  /** @type {import('./OwcMultiCheckbox.types.js').OwcMultiCheckboxOptions} */
  const options = [
    [
      { value: 200, label: 'Aktiv', color: 'danger' },
      { value: 210, label: 'Premium' },
    ],
    { value: 300, label: 'Passiv' },
    { value: 400, label: 'Archive' },
  ];

  return html` <owc-multi-checkbox .options=${options}></owc-multi-checkbox> `;
}
