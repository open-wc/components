/** How many of the widest estimated labels are measured as a whole. */
const CANDIDATES = 20;

/**
 * The width of the widest label, as `measure` reports it.
 *
 * Measuring each of 50,000 labels takes longer than opening a dropdown may,
 * so every label is first estimated from the widths of its characters, which
 * are measured once each, and only the widest candidates are measured as a
 * whole. Kerning and ligatures make an estimate differ from the exact width
 * by a few px, which measuring several candidates absorbs.
 *
 * @param {readonly string[]} labels
 * @param {(text: string) => number} measure the width of a text in px
 * @returns {number}
 */
export function widestLabelWidth(labels, measure) {
  // widths by UTF-16 code unit, -1 until measured
  const charWidths = new Float64Array(65_536).fill(-1);
  /** @type {{ label: string, estimate: number }[]} the widest estimates, widest first */
  const candidates = [];
  for (const label of labels) {
    let estimate = 0;
    for (let index = 0; index < label.length; index++) {
      const code = label.charCodeAt(index);
      let width = charWidths[code];
      if (width < 0) {
        width = charWidths[code] = measure(label[index]);
      }
      estimate += width;
    }
    if (candidates.length === CANDIDATES && estimate <= candidates[CANDIDATES - 1].estimate) {
      continue;
    }
    let position = candidates.length;
    while (position > 0 && candidates[position - 1].estimate < estimate) {
      position--;
    }
    candidates.splice(position, 0, { label, estimate });
    candidates.length = Math.min(candidates.length, CANDIDATES);
  }
  let widest = 0;
  for (const { label } of candidates) {
    widest = Math.max(widest, measure(label));
  }
  return widest;
}
