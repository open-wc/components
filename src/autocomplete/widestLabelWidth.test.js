import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { widestLabelWidth } from './widestLabelWidth.js';

const charWidths = /** @type {Record<string, number>} */ ({ i: 3, W: 15, A: 10 });

/**
 * A fake text measurement: 8px per character unless listed above, and 2px
 * less for every "WA" pair, like kerning.
 *
 * @param {string} text
 */
function measure(text) {
  let width = 0;
  for (const char of text) {
    width += charWidths[char] ?? 8;
  }
  return width - 2 * (text.split('WA').length - 1);
}

describe('widestLabelWidth', () => {
  it('01: returns the exact width of the widest label', () => {
    assert.equal(widestLabelWidth(['Hello', 'WWW', 'Hi'], measure), 45);
  });

  it('02: is not fooled by labels with more but narrower characters', () => {
    assert.equal(widestLabelWidth(['iiiiiiiiiiii', 'WWW'], measure), 45);
  });

  it('03: lets the exact width decide between labels of similar width', () => {
    // estimated alike (75px), but kerning makes "WAWAWA" 69px wide
    assert.equal(widestLabelWidth(['WAWAWA', 'WWWWW'], measure), 75);
  });

  it('04: returns 0 without labels', () => {
    assert.equal(widestLabelWidth([], measure), 0);
  });

  it('05: measures only a few whole labels in big lists', () => {
    const labels = Array.from({ length: 10_000 }, (_, index) => `Option ${index + 1}`);
    let wholeLabels = 0;
    const width = widestLabelWidth(labels, text => {
      if (text.length > 1) {
        wholeLabels++;
      }
      return measure(text);
    });
    assert.equal(width, measure('Option 10000'));
    assert.ok(wholeLabels <= 20, `${wholeLabels} labels measured`);
  });
});
