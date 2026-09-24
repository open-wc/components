/**
 * Fit automatic columns to the available width without changing their measurements.
 * Fixed widths are preserved, even when they and the minimums require overflow.
 * All widths must be finite; natural widths must be at least the positive minimumWidth.
 *
 * @param {ReadonlyArray<{ naturalWidth: number, fixedWidth?: number }>} columns
 * @param {number} availableWidth
 * @param {number} minimumWidth
 * @returns {number[]}
 */
export function fitColumnWidths(columns, availableWidth, minimumWidth) {
  const widths = columns.map(column => column.fixedWidth ?? column.naturalWidth);
  let automaticColumns = columns
    .map((column, index) => ({ ...column, index }))
    .filter(column => column.fixedWidth == null);
  const fixedWidth = columns.reduce((sum, column) => sum + (column.fixedWidth ?? 0), 0);
  let remainingWidth = Math.max(
    availableWidth - fixedWidth,
    automaticColumns.length * minimumWidth,
  );

  while (automaticColumns.length > 0) {
    const naturalTotal = automaticColumns.reduce((sum, column) => sum + column.naturalWidth, 0);
    const minimumColumns = automaticColumns.filter(
      column => (remainingWidth * column.naturalWidth) / naturalTotal < minimumWidth,
    );
    if (minimumColumns.length > 0) {
      for (const column of minimumColumns) {
        widths[column.index] = minimumWidth;
        remainingWidth -= minimumWidth;
      }
      automaticColumns = automaticColumns.filter(column => !minimumColumns.includes(column));
      continue;
    }

    // Round cumulative boundaries so the individual widths add up to the target.
    let naturalSum = 0;
    let allocatedWidth = 0;
    for (const column of automaticColumns) {
      naturalSum += column.naturalWidth;
      const nextWidth = Math.round((remainingWidth * naturalSum) / naturalTotal);
      widths[column.index] = nextWidth - allocatedWidth;
      allocatedWidth = nextWidth;
    }
    break;
  }

  return widths;
}
