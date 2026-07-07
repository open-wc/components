/**
 * Fired by `OwcTable` as `rowClick` when the user clicks a row.
 * The clicked row's data is available on the `row` property.
 */
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
