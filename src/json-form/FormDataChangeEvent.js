export class FormDataChangeEvent extends Event {
  /**
   * @param {string} name
   * @param {string} path
   * @param {unknown} value
   * @param {Record<string, unknown>} [values] Values for an atomic multi-field update.
   */

  constructor(name, path, value, values) {
    super(name, { composed: true, bubbles: true });
    this.path = path;
    this.value = value;
    this.values = values;
  }
}
