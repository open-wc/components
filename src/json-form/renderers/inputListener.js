import { FormDataChangeEvent } from '../FormDataChangeEvent.js';

/**
 * Returns the input Listener
 * @param {import("../types/schema.js").ControlElement} [uiSchema]
 * @param {string} [dataField]
 * @param {(arg0: any) => any} postProcessing
 * @returns {(event: {target: {value: unknown; } }) => void}
 */
export function inputListener(uiSchema, dataField = 'value', postProcessing = x => x) {
  return function (/** @type {{ target: Record<string, any>; }} */ event) {
    // @ts-ignore
    this.dispatchEvent(
      new FormDataChangeEvent(
        'formDataChange',
        uiSchema?.scope || '',
        postProcessing(event.target?.[dataField]),
      ),
    );
  };
}
