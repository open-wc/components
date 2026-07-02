export class FormDataChangeEvent extends Event {
  /**
   * @param {string} name
   * @param {string} path
   * @param {unknown} value
   */

  constructor(name, path, value) {
    super(name, { composed: true, bubbles: true });
    this.path = path;
    this.value = value;
  }
}
