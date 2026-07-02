export class RowClickEvent extends Event {
  /**
   * @param {string} name
   * @param {Record<string, unknown>} row
   */
  constructor(name, row) {
    super(name);
    this.row = row;
  }
}
